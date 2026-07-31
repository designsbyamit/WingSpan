// components/ui/StepNav.tsx
'use client'
import { motion } from 'framer-motion'
import { BlueprintStep } from '@/types/wingspan'

const STEPS: { id: BlueprintStep; label: string; short: string }[] = [
  { id: 'profile',        label: 'Profile',       short: '01' },
  { id: 'intelligence',   label: 'Intelligence',  short: '02' },
  { id: 'path-selection', label: 'Future Paths',  short: '03' },
  { id: 'gap-analysis',   label: 'Gap Analysis',  short: '04' },
  { id: 'roadmap',        label: 'Roadmap',       short: '05' },
  { id: 'resources',      label: 'Resources',     short: '06' },
]

interface StepNavProps {
  currentStep: BlueprintStep
  completedSteps: BlueprintStep[]
  onStepClick: (step: BlueprintStep) => void
}

export function StepNav({ currentStep, completedSteps, onStepClick }: StepNavProps) {
  return (
    <nav className="flex items-center gap-0 border border-[var(--border-ws)] rounded-[12px] overflow-hidden">
      {STEPS.map((step) => {
        const isActive = step.id === currentStep
        const isCompleted = completedSteps.includes(step.id)
        // All tabs are always clickable — future tabs are just dimmed
        const isFuture = !isActive && !isCompleted

        return (
          <button
            key={step.id}
            onClick={() => onStepClick(step.id)}
            className={`
              flex-1 flex flex-col items-center py-3 px-2 text-center border-r border-[var(--border-ws)] last:border-r-0
              transition-all duration-150 relative
              ${isActive ? 'bg-[var(--neon)]' : ''}
              ${isCompleted && !isActive ? 'hover:bg-[var(--neon-surface)] cursor-pointer' : ''}
              ${isFuture ? 'hover:bg-[var(--surface-dim)] cursor-pointer' : ''}
            `}
          >
            <span className={`text-[9px] font-bold tracking-[1.5px] ${isActive ? 'text-[#0a0a0a]' : isFuture ? 'text-[var(--text-dim)]' : 'text-[var(--neon)]'}`}>
              {step.short}
            </span>
            <span className={`text-[10px] font-semibold mt-0.5 hidden sm:block ${isActive ? 'text-[#0a0a0a]' : isFuture ? 'text-[var(--text-dim)]' : 'text-[var(--neon)]'}`}>
              {step.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="step-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0a0a0a]"
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
