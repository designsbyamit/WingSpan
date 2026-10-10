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

interface Checkpoint { key: string; careerAlpha: CareerAlphaIntelligence; deepAnalysis: DeepAnalysis | null; bets: unknown[] | null; growth: unknown }
let checkpoint: Checkpoint | null = null
const STORE = 'wingspan.analysis.checkpoint'

// The expensive agent stage is saved as soon as it succeeds, so "Try again" resumes at the Blueprint
// instead of repeating minutes of work. Kept in memory and sessionStorage (survives a page refresh).
const keyOf = (d: ExtractedCareerData, interests: string[]) => {
  const str = JSON.stringify([d.timeline, d.projects, d.skills, d.education, interests])
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return String(h)
}
function loadCheckpoint(key: string): Checkpoint | null {
  if (checkpoint?.key === key) return checkpoint
  try {
    const raw = sessionStorage.getItem(STORE)
    const cp = raw ? (JSON.parse(raw) as Checkpoint) : null
    if (cp?.key === key && cp.careerAlpha) return (checkpoint = cp)
  } catch { /* storage unavailable */ }
  return null
}
function saveCheckpoint(cp: Checkpoint) {
  checkpoint = cp
  try { sessionStorage.setItem(STORE, JSON.stringify(cp)) } catch { /* too large or unavailable */ }
}

/** True when the agent stage already finished, so a retry only has to rewrite the Blueprint. */
export function canResume(): boolean {
  if (checkpoint) return true
  try { return !!sessionStorage.getItem(STORE) } catch { return false }
}

let controller: AbortController | null = null

/** Stop any analysis in flight and forget saved results (used by Cancel / start over). */
export function cancelCareerPipeline() {
  controller?.abort()
  controller = null
  checkpoint = null
  try { sessionStorage.removeItem(STORE) } catch { /* ignore */ }
}

export async function runCareerPipeline(
  extractedData: ExtractedCareerData,
  interests: string[],
  dispatch: Dispatch<WingspanAction>
): Promise<void> {
  const activity = (event: Omit<ActivityEvent, 'id' | 'at'>) => dispatch({ type: 'ADD_ACTIVITY', event })
  controller?.abort()
  const ctl = (controller = new AbortController())
  dispatch({ type: 'CLEAR_ERROR' })
  dispatch({ type: 'SET_BLUEPRINT_LOADING', loading: true })
  try {
    // Stage 1: the agent team (evidence, career DNA, market, directions, growth) and the Orchestrator
    const key = keyOf(extractedData, interests)
    const saved = loadCheckpoint(key)
    let careerAlpha: CareerAlphaIntelligence | null = saved?.careerAlpha ?? null
    let deepAnalysis: DeepAnalysis | null = saved?.deepAnalysis ?? null
    let bets: unknown[] | null = saved?.bets ?? null
    let growth: unknown = saved?.growth ?? null
    if (saved) {
      activity({ source: 'system', status: 'info', label: 'Resuming from your saved analysis', detail: 'The agent steps already finished, so only the Blueprint is being written again.' })
      dispatch({ type: 'SET_CAREER_ALPHA', data: saved.careerAlpha })
    } else {
      dispatch({ type: 'SET_PIPELINE_STAGE', stage: 'career-alpha' })
      activity({ source: 'system', status: 'info', label: 'Analysis team started', detail: `${interests.length} interests: ${interests.join(', ')}` })
      const caRes = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractedData, interests }),
        signal: ctl.signal,
      })
      if (!caRes.ok) {
        const failure = await readJson(caRes)
        throw new Error(failure?.error ?? 'Career analysis failed')
      }
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
    saveCheckpoint({ key, careerAlpha, deepAnalysis, bets, growth })
    }
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
      signal: ctl.signal,
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
        checkpoint = null
        try { sessionStorage.removeItem(STORE) } catch { /* ignore */ }
      } else if (event.type === 'error') {
        throw new Error(event.error as string)
      }
    })
    if (!completed) throw new Error('Blueprint generation ended before a complete result was received. Please try again.')
  } catch (err) {
    if (ctl.signal.aborted) return // cancelled on purpose
    console.error('Background pipeline error:', err)
    const message = err instanceof Error ? err.message : 'Something went wrong while building your Blueprint.'
    activity({ source: 'system', status: 'error', label: 'The analysis stopped', detail: message })
    dispatch({ type: 'SET_BLUEPRINT_LOADING', loading: false })
    dispatch({ type: 'SET_PIPELINE_STAGE', stage: null })
    dispatch({ type: 'SET_ERROR', error: message })
  }
}
