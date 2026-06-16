// app/api/blueprint/route.ts
import { NextRequest } from 'next/server'
import { streamBlueprint } from '@/lib/openai'
import { ValidatedCareerData } from '@/types/wingspan'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const validatedData: ValidatedCareerData = body.validatedData

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of streamBlueprint(validatedData)) {
          const line = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
          controller.enqueue(encoder.encode(line))
        }
      } catch (err) {
        const errLine = `event: error\ndata: ${JSON.stringify({ error: String(err) })}\n\n`
        controller.enqueue(encoder.encode(errLine))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
