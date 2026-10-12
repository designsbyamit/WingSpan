'use client'
import { AlertCircle, ArrowRight, Check } from 'lucide-react'
import { canResume } from '@/lib/pipeline'
import { useWingspan } from '@/context/WingspanContext'
import { currentActivityLabel, formatElapsed, useNow } from './activity'
import { FlowFooter } from './FlowFooter'
import { CancelFlowButton } from './CancelFlow'
import { cx, linkButton, primaryButton } from './ui'
import { firstNameOf } from '@/lib/student/name'
import { identityFrom } from '@/lib/profile/contact'

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
  /** Stops the analysis and returns to the start. Rendered with a confirmation. */
  onCancel: () => void
}

/** The processed-data screen's footer: same FlowFooter as every other stage, different content. */
export function AnalysisStatus({ onOpenDetails, onOpenBlueprint, onRetry, onCancel }: AnalysisStatusProps) {
  const { state } = useWingspan()
  const phase = useAnalysisPhase()
  const now = useNow(phase === 'running')

  const analysisStart = state.activity.find((e) => e.source !== 'extract')?.at ?? state.activity[0]?.at
  const elapsed = analysisStart ? formatElapsed(now - analysisStart) : null
  const label = currentActivityLabel(state.activity.filter((e) => e.source !== 'extract')) ?? 'Starting the analysis'
  const student = state.flowMode === 'student'
  const who = student ? firstNameOf(identityFrom(state.extractedData).name) : null
  const cancel = <CancelFlowButton onConfirm={onCancel} />
  const details = <button type="button" onClick={onOpenDetails} className={cx(linkButton, 'flex-shrink-0 whitespace-nowrap')}>View progress</button>

  if (phase === 'ready') {
    return (
      <FlowFooter
        tone="ready"
        role="status"
        message={<span className="inline-flex items-center gap-2"><Check size={15} strokeWidth={3} className="rounded-full bg-[var(--neon)] p-[2px] text-[#0a0a0a]" aria-hidden />{student ? (who ? `${who}, your plan is ready` : 'Your plan is ready') : 'Your Blueprint is ready'}</span>}
        hint="Review your details above if you like, or open it now."
        actions={<>
          {details}
          {cancel}
          <button type="button" onClick={onOpenBlueprint} className={primaryButton}>{student ? 'Open your plan' : 'Open your Blueprint'} <ArrowRight size={15} aria-hidden /></button>
        </>}
      />
    )
  }

  if (phase === 'error') {
    return (
      <FlowFooter
        tone="error"
        role="alert"
        message={<span className="inline-flex items-center gap-2"><AlertCircle size={16} className="text-red-300" aria-hidden />The analysis stopped</span>}
        hint={<span className="line-clamp-2">{state.error}{canResume() ? ' Your analysis so far is saved.' : ''}</span>}
        actions={<>
          {details}
          {cancel}
          <button type="button" onClick={onRetry} className={primaryButton}>{canResume() ? 'Resume' : 'Try again'}</button>
        </>}
      />
    )
  }

  const secs = analysisStart ? Math.max(0, Math.floor((now - analysisStart) / 1000)) : 0
  const quips = student ? studentQuips(who) : QUIPS
  const quip = quips[Math.floor(secs / 7) % quips.length]
  const remaining = Math.ceil(((student ? STUDENT_SECONDS : EXPECTED_SECONDS) - secs) / 60)
  const eta =
    secs < 8 ? (student ? 'About 2 minutes' : 'About 4 minutes')
    : remaining >= 2 ? `About ${remaining} min left`
    : remaining === 1 ? 'Under a minute or two left'
    : 'Nearly there, thanks for waiting'
  // Eases toward 95% so the line always feels alive without promising a finish time.
  const pct = Math.min(95, Math.round(95 * (1 - Math.exp(-secs / (student ? 55 : 110)))))

  return (
    <FlowFooter
      progress={pct}
      role="status"
      message={<span key={quip} className="block motion-safe:animate-[ws-fade_0.5s_ease-out]">{quip}</span>}
      hint={<>{eta}{elapsed ? ` · ${elapsed}` : ''} · {label}. Meanwhile, look through your details above and fix anything that looks off.</>}
      actions={<>{details}{cancel}</>}
    />
  )
}

const EXPECTED_SECONDS = 240
const STUDENT_SECONDS = 120

const studentQuips = (who: string | null) => (who ? [`${who}, I am finding what makes you different…`, ...STUDENT_QUIPS.slice(1, 5), `${who}, your work already says more than you think…`, STUDENT_QUIPS[6]] : STUDENT_QUIPS)
const STUDENT_QUIPS = [
  'Finding what makes you different…',
  'Reading what employers say about freshers right now…',
  'Checking every claim against its source…',
  'Matching your work to the lanes that are hiring…',
  'Turning your strengths into a plan for the next two weeks…',
  'Your work already says more than you think…',
  'Almost there. Great plans take a minute…',
]

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
