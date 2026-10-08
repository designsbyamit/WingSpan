import { NextRequest, NextResponse } from 'next/server'
import { aggregatorAgent, careerAlphaAgent, marketIntelligenceAgent, careerDirectionGenerator } from '@/lib/v02-agents'
import { saveWorkingRun, type StageTiming } from '@/lib/analysis-store'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import type { AgentName } from '@/lib/generated/prisma/enums'
import type { ExtractedCareerData } from '@/types/wingspan'

export const maxDuration = 300

async function timed<T>(timings: Partial<Record<AgentName, StageTiming>>, stage: AgentName, run: () => Promise<T>) {
  const started = Date.now()
  try {
    return await run()
  } finally {
    timings[stage] = { durationMs: Date.now() - started }
  }
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now()
  const stageTimings: Partial<Record<AgentName, StageTiming>> = {}
  let stage: AgentName = 'AGGREGATOR'
  const session = await getSession().catch(() => null)

  try {
    const body = await req.json() as { extractedData?: ExtractedCareerData; interests?: string[] }
    if (!body.extractedData) return NextResponse.json({ error: 'extractedData is required' }, { status: 400 })
    const data = body.extractedData
    const interests = body.interests ?? []

    stage = 'AGGREGATOR'
    const evidenceGraph = await timed(stageTimings, stage, () => aggregatorAgent(data, interests))
    stage = 'CAREER_ALPHA'
    const careerDNA = await timed(stageTimings, stage, () => careerAlphaAgent(evidenceGraph, data, interests))
    stage = 'MARKET_INTELLIGENCE'
    const marketGraph = await timed(stageTimings, stage, () =>
      marketIntelligenceAgent([...(data.geographySignals ?? []), ...(data.footprintSignals ?? [])]),
    )
    stage = 'DIRECTION_GENERATOR'
    const careerMap = await timed(stageTimings, stage, () => careerDirectionGenerator(careerDNA, marketGraph))

    // Signed-in users get the result stored as their working run (replacing the previous one).
    // A storage problem must not cost the user the result they just waited for.
    let runId: string | null = null
    if (session) {
      try {
        const saved = await saveWorkingRun(
          session.userId,
          { evidenceGraph, careerDNA, marketGraph, careerMap },
          { durationMs: Date.now() - startedAt, stageTimings },
        )
        runId = saved.runId
      } catch (err) {
        console.error('Could not store analysis run:', err)
      }
    }

    return NextResponse.json({
      version: '0.2',
      runId,
      persisted: runId !== null,
      evidenceGraph,
      careerDNA,
      marketGraph,
      careerMap,
    })
  } catch (error) {
    console.error(`v0.2 agent pipeline failed at ${stage}:`, error)
    if (session) {
      // The previous run is left untouched; only record that and where this attempt failed.
      await db.auditEvent
        .create({
          data: {
            userId: session.userId,
            action: 'analysis.failed',
            entityType: 'AnalysisRun',
            metadata: { stage, durationMs: Date.now() - startedAt },
          },
        })
        .catch(() => undefined)
    }
    return NextResponse.json(
      { error: 'We could not complete the career intelligence pass. Please try again.' },
      { status: 500 }
    )
  }
}
