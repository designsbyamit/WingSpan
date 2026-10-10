// app/api/orchestrate/route.ts
// Runs the four v0.2 agents and the Orchestrator, streaming progress as server-sent events.
// If the agent pass fails for any reason, it falls back to the single-call Career Alpha so the
// person is never blocked: they just get the report without the Deep analysis detail.
import { NextRequest } from 'next/server'
import { runAgents, orchestratorAgent, toCareerAlpha, buildDeepAnalysis, betsFrom } from '@/lib/orchestrator'
import { computeCareerAlpha } from '@/lib/career-alpha'
import { saveWorkingRun } from '@/lib/analysis-store'
import { getSession } from '@/lib/auth'
import { friendlyProviderError } from '@/lib/router'
import { normalizeExtracted } from '@/lib/extracted-shape'
import type { ExtractedCareerData } from '@/types/wingspan'

export const maxDuration = 300

const LABELS = {
  aggregator: 'Reading your evidence…',
  careerDna: 'Building your Career DNA…',
  market: 'Scanning the market…',
  directions: 'Scoring career directions…',
  orchestrator: 'Weighing everything together…',
} as const

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { extractedData?: ExtractedCareerData; interests?: string[] }
  if (!body.extractedData) {
    return new Response(JSON.stringify({ error: 'extractedData is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
  const data = normalizeExtracted(body.extractedData)
  const interests = Array.isArray(body.interests) ? body.interests : []
  const session = await getSession().catch(() => null)
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, payload: object = {}) =>
        controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify({ type, ...payload })}\n\n`))
      try {
        const startedAt = Date.now()
        try {
          const run = await runAgents(data, interests, (id, status, note) => {
            send('agent', { id, status, label: LABELS[id], note })
          })
          send('agent', { id: 'orchestrator', status: 'start', label: LABELS.orchestrator })
          const t0 = Date.now()
          const out = await orchestratorAgent(run, data, interests)
          const orchestratorMs = Date.now() - t0
          send('agent', { id: 'orchestrator', status: 'done', label: LABELS.orchestrator })

          const careerAlpha = toCareerAlpha(out, run, data, interests)
          const deepAnalysis = buildDeepAnalysis(run, out, orchestratorMs)
          const bets = betsFrom(run.careerMap, run.marketGraph)

          if (session) {
            // Best effort: a storage problem must never cost the person their result.
            await saveWorkingRun(
              session.userId,
              { evidenceGraph: run.evidenceGraph, careerDNA: run.careerDNA, marketGraph: run.marketGraph, careerMap: run.careerMap },
              { durationMs: Date.now() - startedAt },
            ).catch((e) => console.error('Could not store analysis run:', e))
          }
          send('complete', { careerAlpha, observations: careerAlpha.observations, deepAnalysis, bets })
        } catch (agentErr) {
          console.error('Agent pipeline failed, falling back to single-call Career Alpha:', agentErr)
          send('agent', { id: 'fallback', status: 'start', label: 'Taking a simpler route…' })
          const careerAlpha = await computeCareerAlpha(data, interests)
          send('complete', { careerAlpha, observations: careerAlpha.observations ?? [], deepAnalysis: null, bets: null })
        }
      } catch (err) {
        console.error('Orchestrate error:', err)
        send('error', { error: friendlyProviderError(err) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' },
  })
}
