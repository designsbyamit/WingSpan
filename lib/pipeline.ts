// lib/pipeline.ts
// Background pipeline runner — no React runtime imports.
// Every step reports into the activity stream (state.activity) so the processed-data screen can show
// "View details" without leaving the page. The runner never navigates: when the Blueprint is ready the
// screen offers it; on failure the error stays on the current screen with a retry.
import type { Dispatch } from 'react'
import type { WingspanAction, ExtractedCareerData, Blueprint, DiscoveryStep, ActivityEvent } from '@/types/wingspan'
import { readJson } from '@/lib/safe-json'
import { readSse } from '@/lib/sse-client'
import type { CareerAlphaIntelligence } from '@/types/wingspan'
import type { DeepAnalysis } from '@/types/career-intelligence'

const BLUEPRINT_LABELS: Record<string, string> = {
  timeline: 'Reconstructing your career timeline',
  strengths: 'Writing up your strengths',
  paths: 'Detailing your three directions',
  gaps: 'Linking capability gaps to each direction',
  actions: 'Building your roadmap and actions',
}

export async function runCareerPipeline(
  extractedData: ExtractedCareerData,
  interests: string[],
  dispatch: Dispatch<WingspanAction>
): Promise<void> {
  const activity = (event: Omit<ActivityEvent, 'id' | 'at'>) => dispatch({ type: 'ADD_ACTIVITY', event })
  dispatch({ type: 'CLEAR_ERROR' })
  dispatch({ type: 'SET_BLUEPRINT_LOADING', loading: true })
  try {
    // Stage 1: the agent team (evidence, career DNA, market, directions, growth) and the Orchestrator
    dispatch({ type: 'SET_PIPELINE_STAGE', stage: 'career-alpha' })
    activity({ source: 'system', status: 'info', label: 'Analysis team started', detail: `${interests.length} interests: ${interests.join(', ')}` })
    const caRes = await fetch('/api/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ extractedData, interests }),
    })
    if (!caRes.ok) {
      const failure = await readJson(caRes)
      throw new Error(failure?.error ?? 'Career analysis failed')
    }
    let careerAlpha: CareerAlphaIntelligence | null = null
    let deepAnalysis: DeepAnalysis | null = null
    let bets: unknown[] | null = null
    let growth: unknown = null
    await readSse(caRes, (event) => {
      if (event.type === 'agent') {
        const status = event.status === 'done' ? 'done' : event.status === 'error' ? 'error' : 'start'
        activity({ source: String(event.id ?? 'agent'), status, label: String(event.label ?? event.id ?? 'Agent'), detail: typeof event.note === 'string' ? event.note : undefined })
        if (status === 'done' && typeof event.note === 'string') dispatch({ type: 'ADD_OBSERVATION', text: event.note })
      } else if (event.type === 'complete') {
        careerAlpha = event.careerAlpha as CareerAlphaIntelligence
        deepAnalysis = (event.deepAnalysis as DeepAnalysis | null) ?? null
        bets = Array.isArray(event.bets) ? (event.bets as unknown[]) : null
        growth = event.growth ?? null
      } else if (event.type === 'error') {
        throw new Error(String(event.error ?? 'Career analysis failed'))
      }
    })
    if (!careerAlpha) throw new Error('The analysis ended before a result was received. Please try again.')
    dispatch({ type: 'SET_CAREER_ALPHA', data: careerAlpha })
    const ca = careerAlpha as CareerAlphaIntelligence
    activity({ source: 'orchestrator', status: 'info', label: 'Recommendation formed', detail: ca.synthesis })

    // Stage 2: Blueprint SSE
    dispatch({ type: 'SET_PIPELINE_STAGE', stage: 'blueprint' })
    activity({ source: 'blueprint', status: 'start', label: 'Writing your Blueprint' })
    const validatedData = { ...extractedData, interests }
    const res = await fetch('/api/blueprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validatedData, careerAlpha, bets, growth }),
    })
    if (!res.ok) throw new Error('Blueprint failed')

    let completed = false
    await readSse(res, (event) => {
      if (completed) return
      if (event.type === 'step') {
        dispatch({ type: 'SET_DISCOVERY_STEP', step: event.step as DiscoveryStep, percentage: event.percentage as number })
        const label = BLUEPRINT_LABELS[String(event.step)]
        if (label) activity({ source: 'blueprint', status: 'info', label })
      } else if (event.type === 'observation') {
        dispatch({ type: 'ADD_OBSERVATION', text: event.text as string })
      } else if (event.type === 'complete') {
        dispatch({ type: 'SET_VALIDATED_DATA', data: validatedData })
        dispatch({ type: 'SET_BLUEPRINT_BACKGROUND', blueprint: { ...(event.blueprint as object), careerAlpha, ...(deepAnalysis ? { deepAnalysis } : {}) } as Blueprint })
        activity({ source: 'blueprint', status: 'done', label: 'Your Blueprint is ready' })
        completed = true
      } else if (event.type === 'error') {
        throw new Error(event.error as string)
      }
    })
    if (!completed) throw new Error('Blueprint generation ended before a complete result was received. Please try again.')
  } catch (err) {
    console.error('Background pipeline error:', err)
    const message = err instanceof Error ? err.message : 'Something went wrong while building your Blueprint.'
    activity({ source: 'system', status: 'error', label: 'The analysis stopped', detail: message })
    dispatch({ type: 'SET_BLUEPRINT_LOADING', loading: false })
    dispatch({ type: 'SET_PIPELINE_STAGE', stage: null })
    dispatch({ type: 'SET_ERROR', error: message })
  }
}
