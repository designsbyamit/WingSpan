'use client'
import { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWingspan } from '@/context/WingspanContext'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { DiscoveryStep, ExtractedCareerData } from '@/types/wingspan'
import { UniverseCanvas } from '@/components/ui/UniverseCanvas'

// Generate hyper-personalised Stage 1 messages from extracted data
function buildStage1Messages(data: ExtractedCareerData | null): string[] {
  if (!data) return [
    'Reading your career footprint…',
    'Mapping your professional timeline…',
    'Identifying skills and evidence patterns…',
    'Analysing your digital presence…',
  ]
  const years = (() => {
    const now = new Date().getFullYear()
    let total = 0
    for (const e of data.timeline) {
      const s = parseInt(e.startDate.slice(0, 4), 10)
      const en = e.endDate.toLowerCase() === 'present' ? now : parseInt(e.endDate.slice(0, 4), 10)
      if (!isNaN(s) && !isNaN(en)) total += en - s
    }
    return total
  })()
  const latestRole = data.timeline[0]
  const companies = [...new Set(data.timeline.map(e => e.company))].slice(0, 3)
  const projectCount = data.projects.length
  const topSkills = data.skills.slice(0, 3)
  const industries = [...new Set(data.projects.map(p => p.industry).filter(Boolean))].slice(0, 3)

  const msgs: string[] = [
    `Reading your career footprint…`,
    years > 0 ? `${years} years of professional work detected…` : 'Mapping your career timeline…',
    latestRole ? `Most recent role: ${latestRole.role} at ${latestRole.company}…` : 'Tracing your career arc…',
    projectCount > 0 ? `Found ${projectCount} project${projectCount > 1 ? 's' : ''} in your portfolio…` : 'Looking for portfolio depth…',
    companies.length > 1 ? `Companies: ${companies.join(', ')}…` : 'Mapping your company history…',
    topSkills.length > 0 ? `Skills detected: ${topSkills.join(', ')}…` : 'Extracting your skill profile…',
    industries.length > 0 ? `Industries you've shaped: ${industries.join(', ')}…` : 'Identifying your industry footprint…',
    'Cataloguing your evidence quality…',
    'Noting your geographic signals…',
    'Reading between the lines of your story…',
  ].filter(Boolean) as string[]
  return msgs
}

// Generate hyper-personalised Stage 2 messages from Career Alpha output
function buildStage2Messages(data: ExtractedCareerData | null): string[] {
  const base = [
    'Scanning design industry signals across 40+ markets…',
    'Cross-referencing WEF Future of Jobs research…',
    'Modelling AI automation risk for your archetype…',
    'Computing human advantage index…',
    'Estimating Career ROI across transition paths…',
    'Mapping skill adjacency networks…',
    'Factoring geopolitical signals into market intelligence…',
    'Analysing supply vs demand for your domain…',
    'Building your Career Alpha intelligence…',
    'Calibrating confidence levels across dimensions…',
  ]
  if (!data) return base
  const domain = data.skills.some(s => /ux|user experience/i.test(s)) ? 'UX design'
    : data.skills.some(s => /product design/i.test(s)) ? 'product design'
    : data.skills.some(s => /design system/i.test(s)) ? 'design systems'
    : 'design'
  const geo = data.geographySignals?.[0] ?? 'your region'
  return [
    `Scanning ${domain} hiring signals across 40+ markets…`,
    `Modelling demand for your profile in ${geo}…`,
    'Cross-referencing WEF Future of Jobs 2025 research…',
    `Computing AI automation risk for ${domain} archetypes…`,
    'Mapping your human advantage index…',
    `Estimating Career ROI for ${domain} transitions…`,
    `Analysing supply vs demand in the ${domain} market…`,
    'Identifying emerging role categories forming around your strengths…',
    'Factoring geopolitical and economic signals…',
    'Building your Career Alpha intelligence…',
    'Calibrating confidence levels across five dimensions…',
    'Matching your footprint against future-proof archetypes…',
  ]
}

// Generate hyper-personalised Stage 3 messages
function buildStage3Messages(data: ExtractedCareerData | null): string[] {
  const base = [
    'Mapping your Career Bets…',
    'Grounding recommendations in evidence…',
    'Calibrating gap analysis to your stage…',
    'Sequencing your growth roadmap…',
    'Assembling your Future Self Blueprint…',
  ]
  if (!data) return base
  const latestRole = data.timeline[0]
  const interests = data.skills.slice(0, 2)
  return [
    latestRole ? `Building paths forward from ${latestRole.role}…` : 'Mapping your Career Bets…',
    'Grounding every recommendation in your evidence…',
    'Designing your Safe, Growth and Bold career bets…',
    interests.length > 0 ? `Weaving your ${interests[0]} strengths into future paths…` : 'Weaving your strengths into future paths…',
    'Calculating transition effort for each path…',
    'Identifying the capabilities that will unlock your next chapter…',
    'Calibrating gap analysis to your career stage…',
    'Sequencing your growth roadmap milestone by milestone…',
    'Writing the reasoning behind every recommendation…',
    'Assembling your Future Self Blueprint…',
    'Final checks before revealing your Blueprint…',
  ]
}

type PipelineStage = 'extract' | 'career-alpha' | 'blueprint'

const STEP_ORDER: DiscoveryStep[] = [
  'parsing', 'structuring', 'timeline', 'strengths', 'paths', 'gaps', 'actions', 'complete',
]

export function DiscoveryScreen() {
  const { state, dispatch } = useWingspan()
  const { discoveryProgress, extractedData } = state
  const sseStarted = useRef(false)
  const lastPercentage = useRef(0)
  const [activeStage, setActiveStage] = useState<PipelineStage>('extract')
  const [stageMsgIdx, setStageMsgIdx] = useState(0)

  // Build personalised message lists once per stage — recalculate when extractedData arrives
  const stage1Messages = useMemo(() => buildStage1Messages(extractedData), [extractedData])
  const stage2Messages = useMemo(() => buildStage2Messages(extractedData), [extractedData])
  const stage3Messages = useMemo(() => buildStage3Messages(extractedData), [extractedData])

  const activeMessages = activeStage === 'extract' ? stage1Messages
    : activeStage === 'career-alpha' ? stage2Messages
    : stage3Messages

  useEffect(() => {
    setStageMsgIdx(0)
    const id = setInterval(() => setStageMsgIdx(i => (i + 1) % activeMessages.length), 3200)
    return () => clearInterval(id)
  }, [activeStage, activeMessages.length])

  useEffect(() => {
    if (state.blueprintReady) {
      dispatch({ type: 'SET_SCREEN', screen: 'blueprint' })
    }
  }, [state.blueprintReady, dispatch])

  useEffect(() => {
    if (!extractedData || sseStarted.current) return
    // Guard: skip if background pipeline is already running (from FootprintScreen)
    if (state.blueprintLoading || state.blueprintReady) return
    sseStarted.current = true

    const run = async () => {
      try {
        // Stage 2: Career Alpha
        setActiveStage('career-alpha')
        const caRes = await fetch('/api/career-alpha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ extractedData, interests: state.interests }),
        })
        if (!caRes.ok) throw new Error('Career Alpha failed')
        const { careerAlpha, observations } = await caRes.json()
        dispatch({ type: 'SET_CAREER_ALPHA', data: careerAlpha })
        for (const obs of (observations ?? [])) {
          dispatch({ type: 'ADD_OBSERVATION', text: obs })
          await new Promise(r => setTimeout(r, 400))
        }

        // Stage 3: Blueprint (SSE stream — existing logic preserved)
        setActiveStage('blueprint')
        const validatedData = { ...extractedData, interests: state.interests }
        dispatch({ type: 'SET_DISCOVERY_STEP', step: 'timeline', percentage: 35 })

        const res = await fetch('/api/blueprint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ validatedData, careerAlpha }),
        })
        if (!res.ok) {
          const errText = await res.text().catch(() => 'Blueprint generation failed')
          dispatch({ type: 'SET_ERROR', error: errText })
          dispatch({ type: 'SET_SCREEN', screen: 'footprint' })
          return
        }
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
              if (currentStep) dispatch({ type: 'COMPLETE_STEP', step: currentStep })
              currentStep = data.step as DiscoveryStep
              lastPercentage.current = data.percentage
              dispatch({ type: 'SET_DISCOVERY_STEP', step: currentStep, percentage: data.percentage })
            } else if (eventType === 'ping') {
              if (data.percentage > lastPercentage.current) {
                lastPercentage.current = data.percentage
                dispatch({ type: 'SET_DISCOVERY_STEP', step: currentStep ?? 'strengths', percentage: data.percentage })
              }
            } else if (eventType === 'observation') {
              dispatch({ type: 'ADD_OBSERVATION', text: data.text })
            } else if (eventType === 'complete') {
              if (currentStep) dispatch({ type: 'COMPLETE_STEP', step: currentStep })
              dispatch({ type: 'SET_BLUEPRINT', blueprint: data.blueprint })
              dispatch({ type: 'SET_VALIDATED_DATA', data: validatedData })
              setTimeout(() => dispatch({ type: 'SET_SCREEN', screen: 'blueprint' }), 800)
            } else if (eventType === 'error') {
              dispatch({ type: 'SET_ERROR', error: data.error })
              dispatch({ type: 'SET_SCREEN', screen: 'footprint' })
            }
          }
        }
      } catch (err) {
        dispatch({ type: 'SET_ERROR', error: String(err) })
        dispatch({ type: 'SET_SCREEN', screen: 'footprint' })
      }
    }

    run()
  }, [extractedData, state.blueprintLoading, state.blueprintReady])

  const currentIdx = STEP_ORDER.indexOf(discoveryProgress.currentStep ?? 'parsing')
  const visibleSteps = STEP_ORDER.slice(0, currentIdx + 1)

  const [deckExpanded, setDeckExpanded] = useState(false)
  const observations = discoveryProgress.observations

  return (
    <>
      {/* Full-screen universe background */}
      <UniverseCanvas />

      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ position: 'relative', zIndex: 1 }}>

        {/* Glass panel — frosted surface keeping text primary */}
        <div
          className="max-w-md w-full flex flex-col gap-7 rounded-[24px] px-8 py-8"
          style={{
            background: 'rgba(6, 8, 18, 0.72)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          }}
        >
          <div>
            <span className="text-xs font-normal tracking-[0.2em] text-[var(--neon)]" style={{ fontFamily: 'var(--font-sora)' }}>
              Wingspan
            </span>
          </div>

          {/* Rotating headline — primary focus */}
          <AnimatePresence mode="wait">
            <motion.h2
              key={`${activeStage}-${stageMsgIdx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.5, ease: 'easeOut' as const }}
              className="text-xl font-semibold text-white leading-snug"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              {activeMessages[stageMsgIdx]}
            </motion.h2>
          </AnimatePresence>

          {/* Stage indicator dots */}
          <div className="flex items-center gap-3">
            {(['extract', 'career-alpha', 'blueprint'] as PipelineStage[]).map((stage, i) => {
              const isActive = activeStage === stage
              const isDone = (activeStage === 'career-alpha' && stage === 'extract')
                || (activeStage === 'blueprint' && (stage === 'extract' || stage === 'career-alpha'))
              const label = stage === 'extract' ? 'Footprint' : stage === 'career-alpha' ? 'Career Alpha' : 'Blueprint'
              return (
                <div key={stage} className="flex items-center gap-1.5">
                  {i > 0 && <div className="w-4 h-[1px] bg-white/10" />}
                  <div className="flex items-center gap-1.5">
                    <motion.div
                      className={`w-1.5 h-1.5 rounded-full ${isDone ? 'bg-[var(--neon)]' : isActive ? 'bg-[var(--neon)]' : 'bg-white/20'}`}
                      animate={isActive ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
                      transition={isActive ? { duration: 1.2, repeat: Infinity } : {}}
                    />
                    <span className={`text-[10px] ${isActive ? 'text-[var(--neon)]' : isDone ? 'text-white/40' : 'text-white/20'}`}>
                      {label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Stacked observation card deck */}
          {observations.length > 0 && (
            <div className="relative">
              {/* Deck toggle */}
              <button
                onClick={() => setDeckExpanded(e => !e)}
                className="text-[10px] text-white/40 hover:text-white/70 transition-colors mb-2 flex items-center gap-1.5"
              >
                <span>{observations.length} insight{observations.length > 1 ? 's' : ''} discovered</span>
                <span className="text-white/25">{deckExpanded ? '↑ collapse' : '↓ expand'}</span>
              </button>

              {deckExpanded ? (
                /* Expanded: horizontal scroll of all cards */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory"
                >
                  {observations.map((obs, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex-shrink-0 w-64 snap-start rounded-[10px] px-4 py-3"
                      style={{ background: 'rgba(163,230,53,0.06)', border: '1px solid rgba(163,230,53,0.18)', borderLeft: '2px solid var(--neon)' }}
                    >
                      <p className="text-xs text-[var(--neon)] leading-relaxed opacity-90">{obs}</p>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                /* Stacked deck — newest on top, older cards peeking below */
                <div className="relative" style={{ height: 56 }}>
                  {observations.slice(-3).reverse().map((obs, stackIdx) => {
                    const isTop = stackIdx === 0
                    return (
                      <motion.div
                        key={observations.length - 1 - stackIdx}
                        className="absolute left-0 right-0 rounded-[10px] px-4 py-3"
                        style={{
                          top: stackIdx * 4,
                          zIndex: 3 - stackIdx,
                          background: isTop ? 'rgba(163,230,53,0.08)' : 'rgba(163,230,53,0.04)',
                          border: '1px solid rgba(163,230,53,0.18)',
                          borderLeft: isTop ? '2px solid var(--neon)' : '1px solid rgba(163,230,53,0.1)',
                          opacity: 1 - stackIdx * 0.25,
                          transform: `scale(${1 - stackIdx * 0.018})`,
                        }}
                        initial={isTop ? { opacity: 0, y: -8, scale: 0.97 } : {}}
                        animate={isTop ? { opacity: 1 - stackIdx * 0.25, y: 0, scale: 1 - stackIdx * 0.018 } : {}}
                        transition={{ duration: 0.35 }}
                      >
                        {isTop && (
                          <p className="text-xs text-[var(--neon)] leading-relaxed truncate opacity-90">{obs}</p>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Completed steps trail — blueprint stage only */}
          {activeStage === 'blueprint' && visibleSteps.filter(s => discoveryProgress.completedSteps.includes(s)).length > 0 && (
            <div className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {visibleSteps
                  .filter(stepId => discoveryProgress.completedSteps.includes(stepId))
                  .slice(-3)
                  .map(stepId => (
                    <motion.div
                      key={stepId}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-2.5"
                    >
                      <div className="w-1 h-1 rounded-full bg-[var(--neon)] flex-shrink-0 opacity-60" />
                      <span className="text-xs text-white/30">{{
                        parsing: 'Reading your story',
                        structuring: 'Connecting the dots',
                        timeline: 'Career timeline rebuilt',
                        strengths: 'Strength patterns detected',
                        paths: 'Future paths mapped',
                        gaps: 'Gap analysis complete',
                        actions: 'Blueprint assembled',
                        complete: 'Done',
                      }[stepId]}</span>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          )}

          {/* Progress bar */}
          {activeStage === 'blueprint' ? (
            <ProgressBar value={discoveryProgress.percentage} showLabel label="Building your Blueprint…" />
          ) : (
            <div className="h-[1.5px] rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full bg-[var(--neon)] rounded-full"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' as const }}
                style={{ width: '40%' }}
              />
            </div>
          )}

        </div>
      </div>
    </>
  )
}
