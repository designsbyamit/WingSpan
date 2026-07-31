// app/api/blueprint/route.ts
import { NextRequest } from 'next/server'
import { streamBlueprint } from '@/lib/claude'
import { ValidatedCareerData, CareerAlphaIntelligence } from '@/types/wingspan'
import { mockBlueprint } from '@/lib/mock-data'

// Extend Next.js route timeout to 5 minutes for long AI generation
export const maxDuration = 300

const MOCK_STEPS = [
  { step: 'timeline',  label: 'Reconstructing career timeline…',    percentage: 35, delay: 1500 },
  { step: 'strengths', label: 'Detecting strength patterns…',        percentage: 50, delay: 1800 },
  { step: 'paths',     label: 'Mapping future opportunities…',       percentage: 65, delay: 1500 },
  { step: 'gaps',      label: 'Analyzing gaps…',                     percentage: 78, delay: 1500 },
  { step: 'actions',   label: 'Generating your Blueprint…',          percentage: 90, delay: 2000 },
]

const MOCK_OBSERVATIONS = [
  { text: 'A recurring theme is emerging — you keep gravitating toward complexity that others avoid.', afterStep: 'strengths' },
  { text: 'Your AI work at Accenture positions you in the top 5% of enterprise designers globally.', afterStep: 'paths' },
]

export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const send = (type: string, data: object) => {
          controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`))
        }
        for (const s of MOCK_STEPS) {
          await new Promise((r) => setTimeout(r, s.delay))
          send('step', { step: s.step, label: s.label, percentage: s.percentage })
          const obs = MOCK_OBSERVATIONS.find((o) => o.afterStep === s.step)
          if (obs) {
            await new Promise((r) => setTimeout(r, 600))
            send('observation', { text: obs.text })
          }
        }
        await new Promise((r) => setTimeout(r, 1000))
        send('complete', { blueprint: mockBlueprint, percentage: 100 })
        controller.close()
      },
    })
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    })
  }

  const body = await req.json()
  const validatedData: ValidatedCareerData = body.validatedData
  const careerAlpha: CareerAlphaIntelligence = body.careerAlpha
  if (!careerAlpha) {
    return new Response('careerAlpha is required', { status: 400 })
  }
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of streamBlueprint(validatedData, careerAlpha)) {
          // 'ping' events are keepalives — still send them so the connection stays open
          // but update percentage so the client's progress bar moves
          const line = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
          controller.enqueue(encoder.encode(line))
        }
      } catch (err) {
        console.error('Blueprint error:', err)
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
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering if behind proxy
    },
  })
}
