// lib/mentor.ts
import Groq from 'groq-sdk'
import type { MentorMessage } from '@/types/design-evolution'

const MODEL = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'
function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' }) }

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
        const stream = await getGroq().chat.completions.create({
          model: MODEL,
          max_tokens: 512,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          ],
        })

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) {
            accumulated += text
            controller.enqueue(encoder.encode(text))
          }
        }

        onComplete?.(accumulated)
      } catch (err) {
        console.error('streamMentorResponse error:', err)
        controller.enqueue(encoder.encode('\n[Mentor unavailable. Try again.]'))
      } finally {
        controller.close()
      }
    },
  })
}
