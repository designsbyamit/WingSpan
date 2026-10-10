'use client'
import { AlertCircle, ArrowRight, Check } from 'lucide-react'
import { useWingspan } from '@/context/WingspanContext'
import { currentActivityLabel, formatElapsed, useNow } from './activity'
import { cx, linkButton, primaryButton, quietButton } from './ui'

export type AnalysisPhase = 'running' | 'ready' | 'error'

export function useAnalysisPhase(): AnalysisPhase {
  const { state } = useWingspan()
  if (state.blueprintReady) return 'ready'
  if (state.error && !state.blueprintLoading) return 'error'
  return 'running'
}

interface AnalysisStatusProps {
  onOpenDetails: () => void
  onOpenBlueprint: () => void
  onRetry: () => void
}

/**
 * The one-line status of the background analysis. Docked to the bottom on phones (thumb reach,
 * always visible while scrolling the profile) and sticky under the top bar on larger screens.
 */
export function AnalysisStatus({ onOpenDetails, onOpenBlueprint, onRetry }: AnalysisStatusProps) {
  const { state } = useWingspan()
  const phase = useAnalysisPhase()
  const now = useNow(phase === 'running')

  const analysisStart = state.activity.find((e) => e.source !== 'extract')?.at ?? state.activity[0]?.at
  const elapsed = analysisStart ? formatElapsed(now - analysisStart) : null
  const label = currentActivityLabel(state.activity.filter((e) => e.source !== 'extract')) ?? 'Starting the analysis'

  const shell = cx(
    'fixed inset-x-0 bottom-0 z-40 border-t px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3',
    'md:sticky md:inset-x-auto md:bottom-auto md:top-[68px] md:rounded-[14px] md:border md:px-5 md:py-3.5',
    'backdrop-blur-md',
  )

  if (phase === 'ready') {
    return (
      <div className={cx(shell, 'border-[var(--neon-border)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)]')}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3" role="status" aria-live="polite">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--neon)]" aria-hidden>
              <Check size={13} strokeWidth={3} className="text-[#0a0a0a]" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Your Blueprint is ready</p>
              <button type="button" onClick={onOpenDetails} className={cx(linkButton, 'text-xs')}>View details</button>
            </div>
          </div>
          <button type="button" onClick={onOpenBlueprint} className={cx(primaryButton, 'w-full sm:w-auto')}>
            Open your Blueprint <ArrowRight size={15} aria-hidden />
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div role="alert" className={cx(shell, 'border-red-400/30 bg-[color-mix(in_srgb,var(--surface)_94%,transparent)]')}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-red-300" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)]">The analysis stopped</p>
              <p className="mt-0.5 line-clamp-2 text-[13px] text-[var(--text-secondary)]">{state.error}</p>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            <button type="button" onClick={onOpenDetails} className={linkButton}>View details</button>
            <button type="button" onClick={onRetry} className={cx(quietButton, 'flex-1 sm:flex-none')}>Try again</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cx(shell, 'border-[var(--border-ws)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)]')}>
      <div className="flex items-center gap-3">
        <span className="relative flex h-2.5 w-2.5 flex-shrink-0" aria-hidden>
          <span className="absolute inset-0 rounded-full bg-[var(--neon)] opacity-40 motion-safe:animate-[ws-breathe_2.4s_ease-in-out_infinite]" />
          <span className="relative m-auto h-1.5 w-1.5 rounded-full bg-[var(--neon)]" />
        </span>
        <p className="min-w-0 flex-1 text-[13px] leading-snug text-[var(--text-secondary)] sm:text-sm" role="status" aria-live="polite">
          <span className="text-[var(--text-primary)]">Something more is being analysed</span>
          <span className="hidden sm:inline"> — </span>
          <span className="block truncate sm:inline">{label}</span>
        </p>
        {elapsed && <span className="flex-shrink-0 text-xs tabular-nums text-[var(--text-muted)]" aria-label={`Elapsed ${elapsed}`}>{elapsed}</span>}
        <button type="button" onClick={onOpenDetails} className={cx(linkButton, 'flex-shrink-0 text-xs sm:text-[13px]')}>View details</button>
      </div>
      <style>{`@keyframes ws-breathe { 0%, 100% { transform: scale(1); opacity: .45 } 50% { transform: scale(2.2); opacity: 0 } }`}</style>
    </div>
  )
}
