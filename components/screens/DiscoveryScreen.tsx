'use client'
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWingspan } from '@/context/WingspanContext'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { DiscoveryStep } from '@/types/wingspan'

const STEPS: { id: DiscoveryStep; label: string }[] = [
  { id: 'parsing', label: 'Parsing your resume' },
  { id: 'structuring', label: 'Structuring career data' },
  { id: 'timeline', label: 'Reconstructing career timeline' },
  { id: 'strengths', label: 'Detecting strength patterns' },
  { id: 'paths', label: 'Mapping future opportunities' },
  { id: 'gaps', label: 'Analyzing gaps' },
  { id: 'actions', label: 'Generating your Blueprint' },
]

export function DiscoveryScreen() {
  const { state, dispatch } = useWingspan()
  const { discoveryProgress, extractedData } = state
  const sseStarted = useRef(false)

  useEffect(() => {
    if (!extractedData || sseStarted.current) return
    sseStarted.current = true

    dispatch({ type: 'SET_DISCOVERY_STEP', step: 'parsing', percentage: 10 })
    dispatch({ type: 'COMPLETE_STEP', step: 'parsing' })
    dispatch({ type: 'SET_DISCOVERY_STEP', step: 'structuring', percentage: 20 })
    dispatch({ type: 'COMPLETE_STEP', step: 'structuring' })

    const validatedData = {
      ...extractedData,
      interests: state.interests,
    }

    fetch('/api/blueprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validatedData }),
    }).then(async (res) => {
      if (!res.body) return
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let currentStep: DiscoveryStep | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const chunks = buffer.split('\n\n')
        buffer = chunks.pop() ?? ''

        for (const chunk of chunks) {
          const eventMatch = chunk.match(/^event: (\w+)\ndata: ([\s\S]+)$/)
          if (!eventMatch) continue
          const [, eventType, dataStr] = eventMatch
          const data = JSON.parse(dataStr)

          if (eventType === 'step') {
            if (currentStep) {
              dispatch({ type: 'COMPLETE_STEP', step: currentStep })
            }
            currentStep = data.step as DiscoveryStep
            dispatch({ type: 'SET_DISCOVERY_STEP', step: currentStep, percentage: data.percentage })
          } else if (eventType === 'observation') {
            dispatch({ type: 'ADD_OBSERVATION', text: data.text })
          } else if (eventType === 'complete') {
            if (currentStep) {
              dispatch({ type: 'COMPLETE_STEP', step: currentStep })
            }
            dispatch({ type: 'SET_BLUEPRINT', blueprint: data.blueprint })
            dispatch({ type: 'SET_VALIDATED_DATA', data: validatedData })
            setTimeout(() => dispatch({ type: 'SET_SCREEN', screen: 'validating' }), 800)
          } else if (eventType === 'error') {
            dispatch({ type: 'SET_ERROR', error: data.error })
            dispatch({ type: 'SET_SCREEN', screen: 'footprint' })
          }
        }
      }
    }).catch((err) => {
      dispatch({ type: 'SET_ERROR', error: String(err) })
      dispatch({ type: 'SET_SCREEN', screen: 'footprint' })
    })
  }, [extractedData])

  const stepStatus = (stepId: DiscoveryStep) => {
    if (discoveryProgress.completedSteps.includes(stepId)) return 'done'
    if (discoveryProgress.currentStep === stepId) return 'active'
    return 'idle'
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full flex flex-col gap-6">
        <div>
          <span className="text-xs font-normal tracking-[0.2em] text-[var(--neon)]">
            Wingspan
          </span>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mt-2">
            Building your Blueprint…
          </h2>
        </div>

        {/* Step list */}
        <div className="flex flex-col gap-3">
          {STEPS.map(({ id, label }) => {
            const status = stepStatus(id)
            return (
              <div key={id} className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  {status === 'done' && (
                    <div className="w-2 h-2 rounded-full bg-[var(--neon)]" />
                  )}
                  {status === 'active' && (
                    <motion.div
                      className="w-2 h-2 rounded-full bg-[var(--neon)]"
                      animate={{ opacity: [1, 0.4, 1] as const }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  )}
                  {status === 'idle' && (
                    <div className="w-2 h-2 rounded-full bg-[var(--border-ws)]" />
                  )}
                </div>
                <span className={`text-sm ${
                  status === 'done' ? 'text-[#606050]' :
                  status === 'active' ? 'text-[var(--neon)] font-semibold' :
                  'text-[#505050]'
                }`}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Observation cards */}
        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {discoveryProgress.observations.map((obs, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' as const }}
                className="rounded-[8px] bg-[#1e1e18] px-3 py-2"
                style={{ borderLeft: '2px solid var(--neon)', border: '1px solid #3a3e20' }}
              >
                <p className="text-xs italic text-[#7a8840] leading-relaxed">"{obs}"</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <ProgressBar value={discoveryProgress.percentage} showLabel label="Analysis progress" />
      </div>
    </div>
  )
}
