// lib/mentor.ts
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { MentorMessage } from '@/types/design-evolution'

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'

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

  const systemInstruction = `You are an expert design mentor. Your role is to guide designers to think more deeply — never give direct answers.
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
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL, systemInstruction })

        // Convert message history to Gemini format
        const history = messages.slice(0, -1).map(m => ({
          role: m.role === 'assistant' ? 'model' as const : 'user' as const,
          parts: [{ text: m.content }],
        }))
        const lastMessage = messages[messages.length - 1]?.content ?? ''

        const chat = model.startChat({ history })
        const result = await chat.sendMessageStream(lastMessage)

        for await (const chunk of result.stream) {
          const text = chunk.text()
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
