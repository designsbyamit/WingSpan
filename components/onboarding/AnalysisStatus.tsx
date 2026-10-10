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

  // Docked footer on every screen size: processing and the primary action stay in one place.
  const shell = cx(
    'fixed inset-x-0 bottom-0 z-40 border-t px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 sm:px-6 backdrop-blur-md',
    'bg-[color-mix(in_srgb,var(--bg)_88%,transparent)]',
  )

  if (phase === 'ready') {
    return (
      <div className={cx(shell, 'border-[var(--neon-border)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)]')}>
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

  const secs = analysisStart ? Math.max(0, Math.floor((now - analysisStart) / 1000)) : 0
  const quip = QUIPS[Math.floor(secs / 7) % QUIPS.length]
  const remaining = Math.ceil((EXPECTED_SECONDS - secs) / 60)
  const eta =
    secs < 8 ? 'About 4 minutes'
    : remaining >= 2 ? `About ${remaining} min left`
    : remaining === 1 ? 'Under a minute or two left'
    : 'Nearly there, thanks for waiting'
  // Eases toward 95% so the line always feels alive without promising a finish time.
  const pct = Math.min(95, Math.round(95 * (1 - Math.exp(-secs / 110))))

  return (
    <div className={cx(shell, 'border-[var(--border-ws)]')}>
      <div className="absolute inset-x-0 top-0 h-[2px] overflow-hidden bg-[var(--border-ws)]" aria-hidden>
        <div className="h-full rounded-full bg-[var(--neon)] transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%` }} />
        <div className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/70 to-transparent motion-safe:animate-[ws-sweep_2.2s_ease-in-out_infinite]" />
      </div>
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
        <span className="relative flex h-2.5 w-2.5 flex-shrink-0" aria-hidden>
          <span className="absolute inset-0 rounded-full bg-[var(--neon)] opacity-40 motion-safe:animate-[ws-breathe_2.4s_ease-in-out_infinite]" />
          <span className="relative m-auto h-1.5 w-1.5 rounded-full bg-[var(--neon)]" />
        </span>
        <div className="min-w-0 flex-1" role="status" aria-live="polite">
          <p key={quip} className="truncate text-sm font-medium text-[var(--text-primary)] motion-safe:animate-[ws-fade_0.5s_ease-out]">{quip}</p>
          <p className="truncate text-xs text-[var(--text-muted)]">
            {eta}<span className="hidden sm:inline"> · {label}. Meanwhile, look through your details above and fix anything that looks off.</span>
          </p>
        </div>
        {elapsed && <span className="hidden flex-shrink-0 text-xs tabular-nums text-[var(--text-muted)] sm:block" aria-label={`Elapsed ${elapsed}`}>{elapsed}</span>}
        <button type="button" onClick={onOpenDetails} className={cx(linkButton, 'flex-shrink-0 text-xs sm:text-[13px]')}>View details</button>
      </div>
      <style>{`
        @keyframes ws-breathe { 0%, 100% { transform: scale(1); opacity: .45 } 50% { transform: scale(2.2); opacity: 0 } }
        @keyframes ws-sweep { 0% { left: -6rem } 100% { left: 100% } }
        @keyframes ws-fade { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
      `}</style>
    </div>
  )
}

const EXPECTED_SECONDS = 240

// Rotated every few seconds while the long analysis runs.
const QUIPS = [
  'Digging for gold in your career history…',
  'Teaching the market to speak your language…',
  'Weighing ten possible futures, keeping the best three…',
  'Checking the job market so you do not have to…',
  'Separating what you have proven from what you could prove…',
  'Sketching the path from where you are to where you could be…',
  'Reading between the lines of your resume…',
  'Hunting for skills the market will pay for next year…',
  'Good careers are built slowly. This part only takes minutes…',
  'Lining up the first moves you can make this week…',
  'Polishing the details. Great things take a few extra minutes…',
]
