// app/api/student-plan/route.ts
// Student flow: builds the verified Student Plan (Edge Card, lanes, bridge job, openings, 14-day plan) and streams progress.
import { NextRequest } from 'next/server'
import { buildStudentPlan } from '@/lib/student/plan'
import { friendlyProviderError } from '@/lib/router'
import type { ExtractedCareerData } from '@/types/wingspan'

export const maxDuration = 300

const LABELS = {
  edge: 'Finding your edge…',
  scout: 'Reading the fresher market…',
  planner: 'Choosing your lanes and your first 14 days…',
  verifier: 'Checking every claim against its source…',
} as const

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { extractedData?: ExtractedCareerData; interests?: string[] }
  if (!body.extractedData) {
    return new Response(JSON.stringify({ error: 'extractedData is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
  const interests = Array.isArray(body.interests) ? body.interests : []
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, payload: object = {}) => controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify({ type, ...payload })}\n\n`))
      try {
        const plan = await buildStudentPlan(body.extractedData!, interests, (id, status, note) => send('agent', { id, status, label: LABELS[id], note }))
        send('complete', { plan })
      } catch (err) {
        console.error('Student plan error:', err)
        send('error', { error: friendlyProviderError(err) })
      } finally {
        controller.close()
      }
    },
  })
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' } })
}
