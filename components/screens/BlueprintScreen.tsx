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
  { id: 'profile',        title: 'Profile Map',        subtitle: 'Who you are today' },
  { id: 'intelligence',   title: 'Career Intelligence', subtitle: 'Strengths & interests' },
  { id: 'path-selection', title: 'Future Paths',        subtitle: 'Choose your direction' },
  { id: 'gap-analysis',   title: 'Gap Analysis',        subtitle: 'What stands between you and your goal' },
  { id: 'roadmap',        title: 'Growth Roadmap',      subtitle: 'Your personalised action plan' },
  { id: 'resources',      title: 'Resources',           subtitle: 'Tools to accelerate your journey' },
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

  if (!blueprint) return null

  const currentStepIdx = STEPS.findIndex(s => s.id === currentStep)
  const currentStepMeta = STEPS[currentStepIdx]
  const isLastStep = currentStepIdx === STEPS.length - 1
  const canAdvance = currentStep !== 'path-selection' || !!selectedPath

  const handleNext = () => {
    if (!canAdvance) return
    setCompletedSteps(prev => prev.includes(currentStep) ? prev : [...prev, currentStep])
    const next = STEPS[currentStepIdx + 1]
    if (next) setCurrentStep(next.id)
  }

  const handleBack = () => {
    const prev = STEPS[currentStepIdx - 1]
    if (prev) setCurrentStep(prev.id)
  }

  return (
    <div className="min-h-screen flex flex-col">

      {/* Sticky top nav */}
      <div className="sticky top-0 z-40 bg-[var(--bg)] border-b border-[var(--border-ws)] px-6 py-4">
        <div className="max-w-2xl mx-auto">
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
            onStepClick={setCurrentStep}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-2xl mx-auto">

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
          <div className="mt-10 flex items-center justify-between">
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
                  ? 'Select a path to continue'
                  : `Continue to ${STEPS[currentStepIdx + 1]?.title} →`
                }
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
