// app/api/orchestrate/route.ts
// Runs the four v0.2 agents and the Orchestrator, streaming progress as server-sent events.
// If the agent pass fails for any reason, it falls back to the single-call Career Alpha so the
// person is never blocked: they just get the report without the Deep analysis detail.
import { NextRequest } from 'next/server'
import { runAgents, orchestratorAgent, toCareerAlpha, buildDeepAnalysis, betsFrom } from '@/lib/orchestrator'
import { computeCareerAlpha } from '@/lib/career-alpha'
import { growthAgent, fallbackGrowth } from '@/lib/growth-agent'
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
  growth: 'Planning how you close the gaps…',
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
          // The Orchestrator and the Growth Planner both work from the agents' outputs, so they run together.
          const bets = betsFrom(run.careerMap, run.marketGraph)
          send('agent', { id: 'orchestrator', status: 'start', label: LABELS.orchestrator })
          send('agent', { id: 'growth', status: 'start', label: LABELS.growth })
          const t0 = Date.now()
          const [outR, growthR] = await Promise.allSettled([
            orchestratorAgent(run, data, interests).then((o) => { send('agent', { id: 'orchestrator', status: 'done', label: LABELS.orchestrator, note: 'Weighed the agents and formed the recommendation' }); return { o, ms: Date.now() - t0 } }),
            growthAgent(run, bets, data, interests).then((g) => { send('agent', { id: 'growth', status: 'done', label: LABELS.growth, note: `${g.gaps.length} capability gaps and ${g.resources.length} resources across your three directions` }); return { g, ms: Date.now() - t0 } }),
          ])
          if (outR.status === 'rejected') throw outR.reason
          const out = outR.value.o
          const growth = growthR.status === 'fulfilled'
            ? { plan: growthR.value.g, ms: growthR.value.ms }
            : (console.error('Growth Planner failed, using catalog fallback:', growthR.reason), send('agent', { id: 'growth', status: 'error', label: LABELS.growth, note: 'Fell back to topic-matched resources' }), { plan: fallbackGrowth(bets), ms: null })

          const careerAlpha = toCareerAlpha(out, run, data, interests)
          const deepAnalysis = buildDeepAnalysis(run, out, outR.value.ms, growth)

          if (session) {
            // Best effort: a storage problem must never cost the person their result.
            await saveWorkingRun(
              session.userId,
              { evidenceGraph: run.evidenceGraph, careerDNA: run.careerDNA, marketGraph: run.marketGraph, careerMap: run.careerMap },
              { durationMs: Date.now() - startedAt },
            ).catch((e) => console.error('Could not store analysis run:', e))
          }
          send('complete', { careerAlpha, observations: careerAlpha.observations, deepAnalysis, bets, growth: { gaps: growth.plan.gaps, resources: growth.plan.resources } })
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
