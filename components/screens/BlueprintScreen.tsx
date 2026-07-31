// components/screens/BlueprintScreen.tsx
'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWingspan } from '@/context/WingspanContext'
import { StepNav } from '@/components/ui/StepNav'
import { ProfileMap } from '@/components/blueprint/ProfileMap'
import { CareerIntelligence } from '@/components/blueprint/CareerIntelligence'
import { PathSelection } from '@/components/blueprint/PathSelection'
import { GapAnalysis } from '@/components/blueprint/GapAnalysis'
import { GrowthRoadmap } from '@/components/blueprint/GrowthRoadmap'
import { Resources } from '@/components/blueprint/Resources'
import { Blueprint, BlueprintStep, ExtractedCareerData } from '@/types/wingspan'

const STEPS: { id: BlueprintStep; title: string; subtitle: string }[] = [
  { id: 'profile',        title: 'Profile Map',        subtitle: "Here's what we found about you." },
  { id: 'intelligence',   title: 'Career Intelligence', subtitle: "What you're good at. What draws you in." },
  { id: 'path-selection', title: 'Future Paths',        subtitle: "A few directions that seem like a natural fit." },
  { id: 'gap-analysis',   title: 'Gap Analysis',        subtitle: "What's standing between you and that future." },
  { id: 'roadmap',        title: 'Growth Roadmap',      subtitle: "How you actually get there." },
  { id: 'resources',      title: 'Resources',           subtitle: "Things worth exploring along the way." },
]

function StepContent({
  step,
  blueprint,
  extractedData,
}: {
  step: BlueprintStep
  blueprint: Blueprint
  extractedData: ExtractedCareerData | null
}) {
  switch (step) {
    case 'profile':        return <ProfileMap blueprint={blueprint} extractedData={extractedData ?? undefined} />
    case 'intelligence':   return <CareerIntelligence blueprint={blueprint} />
    case 'path-selection': return <PathSelection blueprint={blueprint} />
    case 'gap-analysis':   return <GapAnalysis blueprint={blueprint} />
    case 'roadmap':        return <GrowthRoadmap blueprint={blueprint} />
    case 'resources':      return <Resources blueprint={blueprint} />
    default:               return null
  }
}

export function BlueprintScreen() {
  const { state } = useWingspan()
  const { blueprint, selectedPath, extractedData } = state
  const [currentStep, setCurrentStep] = useState<BlueprintStep>('profile')
  const [completedSteps, setCompletedSteps] = useState<BlueprintStep[]>([])
  const [nudgeVisible, setNudgeVisible] = useState(false)

  if (!blueprint) return null

  const currentStepIdx = STEPS.findIndex(s => s.id === currentStep)
  const currentStepMeta = STEPS[currentStepIdx]
  const isLastStep = currentStepIdx === STEPS.length - 1
  const canAdvance = currentStep !== 'path-selection' || !!selectedPath

  const navigateTo = (step: BlueprintStep) => {
    // Scroll to top on every tab change, especially Future Paths
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setCurrentStep(step)
    setCompletedSteps(prev => prev.includes(currentStep) ? prev : [...prev, currentStep])
  }

  const handleStepClick = (step: BlueprintStep) => {
    const targetIdx = STEPS.findIndex(s => s.id === step)
    const isLocked = step === 'path-selection' && !selectedPath && targetIdx > currentStepIdx + 1

    if (isLocked) {
      // Show friendly nudge instead of blocking
      setNudgeVisible(true)
      setTimeout(() => setNudgeVisible(false), 3000)
      return
    }
    navigateTo(step)
  }

  const handleNext = () => {
    if (!canAdvance) return
    const next = STEPS[currentStepIdx + 1]
    if (next) navigateTo(next.id)
  }

  const handleBack = () => {
    const prev = STEPS[currentStepIdx - 1]
    if (prev) navigateTo(prev.id)
  }

  return (
    <div className="min-h-screen flex flex-col">

      {/* Sticky top nav */}
      <div className="sticky top-0 z-40 bg-[var(--bg)] border-b border-[var(--border-ws)] px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-xs font-normal tracking-[0.2em] text-[var(--neon)]"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              Future Self Blueprint™
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              {currentStepIdx + 1} / {STEPS.length}
            </span>
          </div>
          <StepNav
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />
        </div>
      </div>

      {/* Step content — wider max-w for more breathing room */}
      <div className="flex-1 px-6 py-10">
        <div className="max-w-3xl mx-auto">

          {/* Step header */}
          <motion.div
            key={currentStep + '-header'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <h2
              className="text-2xl font-bold text-[var(--text-primary)] mb-1"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              {currentStepMeta.title}
            </h2>
            <p className="text-sm text-[var(--text-muted)]">{currentStepMeta.subtitle}</p>
          </motion.div>

          {/* Friendly nudge when a locked tab is tapped */}
          <AnimatePresence>
            {nudgeVisible && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-6 rounded-[10px] px-4 py-3 bg-[var(--neon-surface)] border border-[var(--neon-border)]"
              >
                <p className="text-xs text-[var(--neon)]">
                  Pick a path first — then Gap Analysis and everything after will be tailored to it.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step body */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: 'easeOut' as const }}
            >
              <StepContent
                step={currentStep}
                blueprint={blueprint}
                extractedData={extractedData}
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation footer */}
          <div className="mt-12 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStepIdx === 0}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] disabled:opacity-0 transition-colors"
            >
              {currentStepIdx > 0 ? `← ${STEPS[currentStepIdx - 1].title}` : ''}
            </button>

            {!isLastStep && (
              <button
                onClick={handleNext}
                disabled={!canAdvance}
                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-sm font-bold transition-all
                  ${canAdvance
                    ? 'bg-[var(--neon)] text-[#0a0a0a]'
                    : 'bg-[var(--surface)] text-[var(--text-dim)] border border-[var(--border-ws)] cursor-not-allowed'
                  }
                `}
              >
                {currentStep === 'path-selection' && !selectedPath
                  ? 'Pick a direction to keep going'
                  : `Next: ${STEPS[currentStepIdx + 1]?.title} →`
                }
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
