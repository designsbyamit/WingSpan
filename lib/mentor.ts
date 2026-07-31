// lib/mentor.ts
import Anthropic from '@anthropic-ai/sdk'
import type { MentorMessage } from '@/types/design-evolution'

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
})

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-latest'

interface StreamMentorParams {
  messages: MentorMessage[]
  experienceTitle: string
  conceptNames: string[]
  weaknesses: string[]
  onComplete?: (fullText: string) => void
}

export function streamMentorResponse({
  messages,
  experienceTitle,
  conceptNames,
  weaknesses,
  onComplete,
}: StreamMentorParams): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  const systemPrompt = `You are an expert design mentor. Your role is to guide designers to think more deeply — never give direct answers.
Always ask questions that develop the learner's reasoning. Reference the specific experience they are working on.
Current experience: ${experienceTitle}
Concepts being explored: ${conceptNames.join(', ')}
Learner's weak areas: ${weaknesses.length > 0 ? weaknesses.join(', ') : 'none identified yet'}

Guidelines:
- Ask one focused question at a time
- Reference the scenario or concepts by name when relevant
- Keep responses concise — 2-4 sentences maximum
- Never explain the answer; instead, prompt the learner to discover it`

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let accumulated = ''
      try {
        const stream = claude.messages.stream({
          model: MODEL,
          max_tokens: 512,
          system: systemPrompt,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        })

        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            const text = chunk.delta.text
            accumulated += text
            controller.enqueue(encoder.encode(text))
          }
        }

        onComplete?.(accumulated)
      } catch (err) {
        console.error('streamMentorResponse error:', err)
        controller.enqueue(
          encoder.encode('\n[Mentor unavailable. Try again.]')
        )
      } finally {
        controller.close()
      }
    },
  })
}
