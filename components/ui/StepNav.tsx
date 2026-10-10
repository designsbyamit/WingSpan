// components/ui/StepNav.tsx
'use client'
import { Check, Lock } from 'lucide-react'
import { BlueprintStep } from '@/types/wingspan'
import { SECTIONS } from '@/components/blueprint/shell/sections'

interface StepNavProps {
  currentStep: BlueprintStep
  completedSteps: BlueprintStep[]
  isLocked: (step: BlueprintStep) => boolean
  onStepClick: (step: BlueprintStep) => void
  /** The chosen Future Path, shown under "Future Paths". */
  selectedPath: string | null
  /** `full` shows labels; `rail` is the icon-only tablet rail. */
  variant?: 'full' | 'rail'
}

const RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon)]'

/**
 * Vertical section navigation drawn as a route: one node per section, joined by a spine that
 * fills in as sections are completed. Sections after Future Paths show a lock until a path is chosen.
 */
export function StepNav({ currentStep, completedSteps, isLocked, onStepClick, selectedPath, variant = 'full' }: StepNavProps) {
  const rail = variant === 'rail'
  const currentIdx = SECTIONS.findIndex(s => s.id === currentStep)

  return (
    <ol className="flex flex-col">
      {SECTIONS.map((step, i) => {
        const isActive = step.id === currentStep
        const isCompleted = completedSteps.includes(step.id) && !isActive
        const locked = isLocked(step.id)
        const Icon = step.icon
        const isLast = i === SECTIONS.length - 1
        const nextLocked = !isLast && isLocked(SECTIONS[i + 1].id)
        const spineDone = isCompleted || i < currentIdx

        const subtitle = locked
          ? 'Choose a path first'
          : step.id === 'path-selection'
          ? (selectedPath ?? 'Not chosen yet')
          : null

        const nodeCls = isActive
          ? 'bg-[var(--neon)] border-[var(--neon)] text-[#0a0a0a]'
          : isCompleted
          ? 'bg-[var(--neon-surface)] border-[var(--neon-border)] text-[var(--ws-ink)]'
          : locked
          ? 'bg-transparent border-dashed border-[var(--border-ws)] text-[var(--text-muted)] opacity-70'
          : 'bg-[var(--surface)] border-[var(--border-ws)] text-[var(--text-secondary)]'

        return (
          <li key={step.id} className="relative">
            {/* Spine segment to the next node */}
            {!isLast && (
              <span
                aria-hidden
                className={`absolute w-0 border-l ${rail ? 'left-1/2 top-[48px] h-[16px]' : 'left-[28px] top-[52px] h-[24px]'} ${
                  nextLocked ? 'border-dashed border-[var(--border-ws)]' : spineDone ? 'border-[var(--neon)]' : 'border-[var(--border-ws)]'
                }`}
              />
            )}
            <button
              type="button"
              onClick={() => onStepClick(step.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-disabled={locked || undefined}
              aria-label={rail ? `${step.label}${locked ? ', locked until you choose a path' : isCompleted ? ', completed' : ''}` : undefined}
              className={`group relative w-full flex items-center gap-3 rounded-[12px] text-left transition-colors ${RING} ${
                rail ? 'justify-center h-[56px]' : 'h-[64px] px-3'
              } ${isActive && !rail ? 'bg-[var(--surface-dim)]' : 'hover:bg-[var(--surface-dim)]'} ${locked ? 'cursor-help' : ''}`}
            >
              <span className={`relative shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${nodeCls}`}>
                <Icon size={15} aria-hidden />
                {(isCompleted || locked) && (
                  <span
                    aria-hidden
                    className={`absolute -right-1 -bottom-1 w-[15px] h-[15px] rounded-full flex items-center justify-center border-2 border-[var(--bg)] ${
                      locked ? 'bg-[var(--surface-dim)] text-[var(--text-muted)]' : 'bg-[var(--neon)] text-[#0a0a0a]'
                    }`}
                  >
                    {locked ? <Lock size={7} strokeWidth={3} /> : <Check size={8} strokeWidth={3.5} />}
                  </span>
                )}
              </span>

              {!rail && (
                <span className="min-w-0 flex-1">
                  <span className={`block text-[14px] leading-tight ${
                    isActive ? 'font-semibold text-[var(--text-primary)]' : locked ? 'font-medium text-[var(--text-muted)]' : 'font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                  }`}>
                    {step.label}
                  </span>
                  {subtitle && (
                    <span className={`block text-[12px] leading-tight mt-1 truncate ${
                      step.id === 'path-selection' && selectedPath ? 'text-[var(--ws-ink)]' : 'text-[var(--text-muted)]'
                    }`}>
                      {subtitle}
                    </span>
                  )}
                  {locked && <span className="sr-only">, locked</span>}
                  {isCompleted && <span className="sr-only">, completed</span>}
                </span>
              )}

              {/* Rail tooltip */}
              {rail && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-[8px] border border-[var(--border-ws)] bg-[var(--surface)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--text-primary)] shadow-lg opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
                >
                  {step.label}{subtitle ? ` (${subtitle})` : ''}
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ol>
  )
}
