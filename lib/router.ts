// lib/router.ts
// Unified LLM router — Gemini (primary), OpenRouter/DeepSeek (secondary), Groq (fallback)
// Data goes directly to each provider — OpenRouter only used when Gemini is quota-limited.

import Groq from 'groq-sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

export type RouterTask = 'extraction' | 'analysis' | 'blueprint' | 'mentor' | 'refine'

interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }

// ── Provider helpers ────────────────────────────────────────────────────────

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' })
}

async function callOpenRouter(messages: ChatMessage[], model = 'deepseek/deepseek-chat', maxTokens = 4096): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY ?? ''}`,
      'HTTP-Referer': 'https://wingspan.designsbyamit.com',
      'X-Title': 'Wingspan',
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
  })
  const data = await res.json() as { choices?: { message?: { content?: string } }[]; error?: { message?: string } }
  if (!res.ok) throw new Error(data.error?.message ?? `OpenRouter ${res.status}`)
  return data.choices?.[0]?.message?.content ?? ''
}

// ── Gemini model chain ──────────────────────────────────────────────────────
// The configured model (GEMINI_MODEL) is tried first, then cheaper models that
// have free-tier quota. A model that fails with quota/not-found is skipped for a
// while so every later call doesn't pay for the same failure.

const DEFAULT_GEMINI_FALLBACKS = ['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash']
const DEAD_MODEL_MS = 15 * 60 * 1000
const deadModels = new Map<string, number>()

const firstLine = (v: string | undefined) => (v ?? '').split('\n')[0].trim()

export function geminiModelChain(env: Record<string, string | undefined> = process.env): string[] {
  const configured = firstLine(env.GEMINI_MODEL)
  const fallbacks = firstLine(env.GEMINI_FALLBACK_MODELS)
    ? firstLine(env.GEMINI_FALLBACK_MODELS).split(',').map((m) => m.trim()).filter(Boolean)
    : DEFAULT_GEMINI_FALLBACKS
  return [...new Set([configured, ...fallbacks].filter(Boolean))]
}

/** Errors where trying another model or provider can help (quota, missing model, overload). */
export function isRetryableProviderError(e: unknown): boolean {
  const msg = (e instanceof Error ? e.message : String(e)).toLowerCase()
  return /\b(429|404|403|500|502|503|504)\b/.test(msg) ||
    /quota|rate.?limit|resource_exhausted|unavailable|overloaded|not found|not supported|permission|deadline|timeout|fetch failed/.test(msg)
}

/** A message that is safe to show people. Raw provider errors stay in the logs. */
export function friendlyProviderError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e)
  if (/429|quota|rate.?limit|resource_exhausted/i.test(msg)) {
    return 'Our AI service is at capacity right now. Please try again in a few minutes.'
  }
  if (isRetryableProviderError(e)) {
    return 'Our AI service is temporarily unavailable. Please try again in a few minutes.'
  }
  return msg.length > 300 ? msg.slice(0, 300) + '…' : msg
}

function liveModels(): string[] {
  const now = Date.now()
  const chain = geminiModelChain()
  const alive = chain.filter((m) => (deadModels.get(m) ?? 0) < now)
  return alive.length ? alive : chain
}

function markDead(model: string, e: unknown) {
  deadModels.set(model, Date.now() + DEAD_MODEL_MS)
  console.warn(`Gemini model ${model} unavailable (${(e instanceof Error ? e.message : String(e)).slice(0, 120)})`)
}

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } }

/** Try each Gemini model in turn. Throws the last error if every model fails. */
export async function generateWithGemini(parts: GeminiPart[], systemInstruction?: string): Promise<string> {
  const key = (process.env.GEMINI_API_KEY ?? '').trim()
  if (!key) throw new Error('No Gemini key')
  const genAI = new GoogleGenerativeAI(key)
  let lastErr: unknown = new Error('No Gemini model configured')
  for (const model of liveModels()) {
    try {
      const m = genAI.getGenerativeModel(systemInstruction ? { model, systemInstruction } : { model })
      const result = await m.generateContent(parts)
      return result.response.text()
    } catch (e) {
      lastErr = e
      if (!isRetryableProviderError(e)) throw e
      markDead(model, e)
    }
  }
  throw lastErr
}

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  return generateWithGemini([{ text: userPrompt }], systemPrompt)
}

async function callGroq(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
  const response = await getGroq().chat.completions.create({
    model: process.env.GROQ_MODEL ?? 'openai/gpt-oss-120b',
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  })
  return response.choices[0]?.message?.content ?? '{}'
}

/**
 * Text + images. Gemini (all models) sees the images; if Gemini is unavailable the
 * text-only providers still get the full text prompt.
 */
export async function routeMultimodal(
  systemPrompt: string,
  userPrompt: string,
  images: { mimeType: string; data: string }[] = [],
  maxTokens = 8192,
): Promise<string> {
  try {
    return await generateWithGemini([{ text: userPrompt }, ...images.map((inlineData) => ({ inlineData }))], systemPrompt)
  } catch (e) {
    if (!isRetryableProviderError(e) && !String(e).includes('No Gemini key')) throw e
    console.warn('Gemini unavailable for multimodal call, falling back to text-only providers')
  }
  return textFallback(systemPrompt, userPrompt, maxTokens)
}

async function textFallback(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
  if (process.env.OPENROUTER_API_KEY) {
    try {
      return await callOpenRouter(
        [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        'deepseek/deepseek-chat',
        maxTokens,
      )
    } catch (e) {
      console.warn('OpenRouter failed, falling back to Groq:', e instanceof Error ? e.message.slice(0, 80) : e)
    }
  }
  return callGroq(systemPrompt, userPrompt, maxTokens)
}

// ── Primary non-streaming call ───────────────────────────────────────────────
// Priority: Gemini → OpenRouter/DeepSeek → Groq

export async function routeCall(
  systemPrompt: string,
  userPrompt: string,
  task: RouterTask = 'analysis',
  maxTokens = 4096
): Promise<string> {
  // Extraction always uses Groq (fast, cheap)
  if (task === 'extraction') {
    const response = await getGroq().chat.completions.create({
      model: process.env.GROQ_MODEL ?? 'openai/gpt-oss-120b',
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })
    return response.choices[0]?.message?.content ?? '{}'
  }

  // Analysis/blueprint: Gemini model chain → OpenRouter/DeepSeek → Groq
  try {
    return await callGemini(systemPrompt, userPrompt)
  } catch (e) {
    if (!isRetryableProviderError(e) && !String(e).includes('No Gemini key')) throw e
    console.warn('All Gemini models unavailable, trying OpenRouter/DeepSeek')
  }
  return textFallback(systemPrompt, userPrompt, maxTokens)
}

// ── Streaming call (blueprint) ───────────────────────────────────────────────
// Priority: Gemini model chain → OpenRouter streaming → Groq streaming

export async function* routeStream(
  systemPrompt: string,
  userPrompt: string,
): AsyncGenerator<string> {
  const geminiKey = (process.env.GEMINI_API_KEY ?? '').trim()

  // Try Gemini streaming
  if (geminiKey) {
    const genAI = new GoogleGenerativeAI(geminiKey)
    for (const model of liveModels()) {
      let yielded = false
      try {
        const geminiModel = genAI.getGenerativeModel({ model, systemInstruction: systemPrompt })
        const stream = await geminiModel.generateContentStream(userPrompt)
        for await (const chunk of stream.stream) {
          const text = chunk.text()
          if (text) { yielded = true; yield text }
        }
        return
      } catch (e) {
        // Once text has gone out we can't restart on another model without duplicating it.
        if (yielded) throw e
        markDead(model, e)
      }
    }
    console.warn('All Gemini models failed to stream, trying OpenRouter')
  }

  // Try OpenRouter streaming (DeepSeek)
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://wingspan.designsbyamit.com',
          'X-Title': 'Wingspan',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          max_tokens: 8000,
          stream: true,
        }),
      })
      if (!res.ok) throw new Error(`OpenRouter ${res.status}`)
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('No stream body')
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ') || line === 'data: [DONE]') continue
          try {
            const data = JSON.parse(line.slice(6)) as { choices?: { delta?: { content?: string } }[] }
            const text = data.choices?.[0]?.delta?.content ?? ''
            if (text) yield text
          } catch { /* skip malformed */ }
        }
      }
      return
    } catch (e) {
      console.warn('OpenRouter stream failed, falling back to Groq:', e instanceof Error ? e.message.slice(0, 60) : e)
    }
  }

  // Groq fallback streaming
  const stream = await getGroq().chat.completions.create({
    model: process.env.GROQ_MODEL ?? 'openai/gpt-oss-120b',
    max_tokens: 8000,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  })
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? ''
    if (text) yield text
  }
}
