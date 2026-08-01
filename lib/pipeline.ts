// lib/pipeline.ts
// Background pipeline runner — no React runtime imports
import type { Dispatch } from 'react'
import type { WingspanAction, ExtractedCareerData } from '@/types/wingspan'

export async function runCareerPipeline(
  extractedData: ExtractedCareerData,
  interests: string[],
  dispatch: Dispatch<WingspanAction>
): Promise<void> {
  try {
    // Stage 1: Career Alpha
    dispatch({ type: 'SET_PIPELINE_STAGE', stage: 'career-alpha' })
    const caRes = await fetch('/api/career-alpha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ extractedData, interests }),
    })
    if (!caRes.ok) throw new Error('Career Alpha failed')
    const { careerAlpha, observations } = await caRes.json()
    dispatch({ type: 'SET_CAREER_ALPHA', data: careerAlpha })

    // Trickle observations with delay
    for (const obs of (observations ?? [])) {
      dispatch({ type: 'ADD_OBSERVATION', text: obs })
      await new Promise(r => setTimeout(r, 400))
    }

    // Stage 2: Blueprint SSE
    dispatch({ type: 'SET_PIPELINE_STAGE', stage: 'blueprint' })
    const validatedData = { ...extractedData, interests }
    const res = await fetch('/api/blueprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validatedData, careerAlpha }),
    })
    if (!res.ok) throw new Error('Blueprint failed')

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) throw new Error('No response body')

    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'step') {
              dispatch({ type: 'SET_DISCOVERY_STEP', step: event.step, percentage: event.percentage })
            } else if (event.type === 'observation') {
              dispatch({ type: 'ADD_OBSERVATION', text: event.text })
            } else if (event.type === 'complete') {
              dispatch({ type: 'SET_VALIDATED_DATA', data: validatedData })
              dispatch({ type: 'SET_BLUEPRINT_BACKGROUND', blueprint: { ...event.blueprint, careerAlpha } })
            } else if (event.type === 'error') {
              throw new Error(event.error)
            }
          } catch { /* skip malformed lines */ }
        }
      }
    }
  } catch (err) {
    console.error('Background pipeline error:', err)
    dispatch({ type: 'SET_BLUEPRINT_LOADING', loading: false })
    dispatch({ type: 'SET_PIPELINE_STAGE', stage: null })
  }
}
