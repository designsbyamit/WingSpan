// lib/pipeline.ts
// Background pipeline runner — no React runtime imports
import type { Dispatch } from 'react'
import type { WingspanAction, ExtractedCareerData, Blueprint, DiscoveryStep } from '@/types/wingspan'
import { readJson } from '@/lib/safe-json'
import { readSse } from '@/lib/sse-client'
import type { CareerAlphaIntelligence } from '@/types/wingspan'
import type { DeepAnalysis } from '@/types/career-intelligence'

export async function runCareerPipeline(
  extractedData: ExtractedCareerData,
  interests: string[],
  dispatch: Dispatch<WingspanAction>
): Promise<void> {
  try {
    // Stage 1: the agent team (evidence, career DNA, market, directions) and the Orchestrator
    dispatch({ type: 'SET_PIPELINE_STAGE', stage: 'career-alpha' })
    const caRes = await fetch('/api/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ extractedData, interests }),
    })
    if (!caRes.ok) {
      const failure = await readJson(caRes).catch((e: Error) => { throw e })
      throw new Error(failure?.error ?? 'Career analysis failed')
    }
    let careerAlpha: CareerAlphaIntelligence | null = null
    let deepAnalysis: DeepAnalysis | null = null
    let bets: unknown[] | null = null
    let observations: string[] = []
    await readSse(caRes, (event) => {
      if (event.type === 'agent') {
        if (event.status === 'done' && typeof event.note === 'string') {
          dispatch({ type: 'ADD_OBSERVATION', text: event.note })
        }
      } else if (event.type === 'complete') {
        careerAlpha = event.careerAlpha as CareerAlphaIntelligence
        deepAnalysis = (event.deepAnalysis as DeepAnalysis | null) ?? null
        bets = Array.isArray(event.bets) ? (event.bets as unknown[]) : null
        observations = Array.isArray(event.observations) ? (event.observations as string[]) : []
      } else if (event.type === 'error') {
        throw new Error(String(event.error ?? 'Career analysis failed'))
      }
    })
    if (!careerAlpha) throw new Error('The analysis ended before a result was received. Please try again.')
    dispatch({ type: 'SET_CAREER_ALPHA', data: careerAlpha })

    // Trickle observations with delay
    for (const obs of observations) {
      dispatch({ type: 'ADD_OBSERVATION', text: obs })
      await new Promise(r => setTimeout(r, 400))
    }

    // Stage 2: Blueprint SSE
    dispatch({ type: 'SET_PIPELINE_STAGE', stage: 'blueprint' })
    const validatedData = { ...extractedData, interests }
    const res = await fetch('/api/blueprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validatedData, careerAlpha, bets }),
    })
    if (!res.ok) throw new Error('Blueprint failed')

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) throw new Error('No response body')

    let buffer = ''
    let completed = false
    const processLine = (line: string) => {
      if (!line.startsWith('data: ')) return
      let event: { type: string; [key: string]: unknown } | null = null
      try {
        event = JSON.parse(line.slice(6))
      } catch { return }
      if (!event) return

      if (event.type === 'step') {
        dispatch({ type: 'SET_DISCOVERY_STEP', step: event.step as DiscoveryStep, percentage: event.percentage as number })
      } else if (event.type === 'observation') {
        dispatch({ type: 'ADD_OBSERVATION', text: event.text as string })
      } else if (event.type === 'complete') {
        dispatch({ type: 'SET_VALIDATED_DATA', data: validatedData })
        dispatch({ type: 'SET_BLUEPRINT_BACKGROUND', blueprint: { ...(event.blueprint as object), careerAlpha, ...(deepAnalysis ? { deepAnalysis } : {}) } as Blueprint })
        completed = true
        dispatch({ type: 'SET_SCREEN', screen: 'blueprint' })
      } else if (event.type === 'error') {
        throw new Error(event.error as string)
      }
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        processLine(line)
        if (completed) return
      }
    }

    // Some SSE responses end without a trailing newline. Process the final buffered event.
    if (buffer.trim()) {
      processLine(buffer.trim())
    }
    if (!completed) {
      throw new Error('Blueprint generation ended before a complete result was received.')
    }
  } catch (err) {
    console.error('Background pipeline error:', err)
    dispatch({ type: 'SET_BLUEPRINT_LOADING', loading: false })
    dispatch({ type: 'SET_PIPELINE_STAGE', stage: null })
    dispatch({ type: 'SET_SCREEN', screen: 'footprint' })
    dispatch({
      type: 'SET_ERROR',
      error: err instanceof Error ? err.message : 'Something went wrong while building your Blueprint.',
    })
  }
}
