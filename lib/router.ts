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

async function callGemini(systemPrompt: string, userPrompt: string, maxTokens = 8192): Promise<string> {
  const key = (process.env.GEMINI_API_KEY ?? '').trim()
  if (!key) throw new Error('No Gemini key')
  const model = (process.env.GEMINI_MODEL ?? 'gemini-2.0-flash').split('\n')[0].trim()
  const genAI = new GoogleGenerativeAI(key)
  const geminiModel = genAI.getGenerativeModel({ model, systemInstruction: systemPrompt })
  const result = await geminiModel.generateContent(userPrompt)
  return result.response.text()
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
      model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })
    return response.choices[0]?.message?.content ?? '{}'
  }

  // Analysis/blueprint: try Gemini → OpenRouter/DeepSeek → Groq
  try {
    return await callGemini(systemPrompt, userPrompt, maxTokens)
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    const isQuotaOrError = msg.includes('429') || msg.includes('quota') || msg.includes('404') || msg.includes('403')
    if (!isQuotaOrError) throw e
    console.warn(`Gemini unavailable (${msg.slice(0, 60)}), trying OpenRouter/DeepSeek`)
  }

  if (process.env.OPENROUTER_API_KEY) {
    try {
      return await callOpenRouter(
        [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        'deepseek/deepseek-chat',
        maxTokens
      )
    } catch (e) {
      console.warn('OpenRouter failed, falling back to Groq:', e instanceof Error ? e.message.slice(0, 60) : e)
    }
  }

  // Final fallback: Groq
  const response = await getGroq().chat.completions.create({
    model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  })
  return response.choices[0]?.message?.content ?? '{}'
}

// ── Streaming call (blueprint) ───────────────────────────────────────────────
// Priority: Gemini streaming → OpenRouter streaming → Groq streaming

export async function* routeStream(
  systemPrompt: string,
  userPrompt: string,
): AsyncGenerator<string> {
  const geminiKey = (process.env.GEMINI_API_KEY ?? '').trim()

  // Try Gemini streaming
  if (geminiKey) {
    try {
      const model = (process.env.GEMINI_MODEL ?? 'gemini-2.0-flash').split('\n')[0].trim()
      const genAI = new GoogleGenerativeAI(geminiKey)
      const geminiModel = genAI.getGenerativeModel({ model, systemInstruction: systemPrompt })
      const stream = await geminiModel.generateContentStream(userPrompt)
      for await (const chunk of stream.stream) {
        const text = chunk.text()
        if (text) yield text
      }
      return
    } catch (e) {
      console.warn('Gemini stream failed, trying OpenRouter:', e instanceof Error ? e.message.slice(0, 80) : e)
    }
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
    model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
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
