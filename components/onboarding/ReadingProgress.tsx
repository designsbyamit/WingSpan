'use client'
import { Check, Loader2 } from 'lucide-react'
import { formatElapsed, useNow } from './activity'
import { cx, linkButton } from './ui'

interface ReadingProgressProps {
  fileName: string | undefined
  interests: string[]
  startedAt: number | null
  onBack: () => void
}

type StepState = 'done' | 'active' | 'pending'

function StepMark({ state }: { state: StepState }) {
  if (state === 'done') {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--neon)]" aria-hidden>
        <Check size={12} strokeWidth={3} className="text-[#0a0a0a]" />
      </span>
    )
  }
  if (state === 'active') {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--neon-border)]" aria-hidden>
        <Loader2 size={12} className="animate-spin text-[var(--neon)] motion-reduce:animate-none" />
      </span>
    )
  }
  return <span className="h-5 w-5 rounded-full border border-[var(--border-ws)]" aria-hidden />
}

/**
 * Shown when the person asks for their Blueprint while the resume is still being read.
 * Calm and factual: what is done, what is happening, what comes next. Resolves on its own.
 */
export function ReadingProgress({ fileName, interests, startedAt, onBack }: ReadingProgressProps) {
  const now = useNow(true)
  const elapsed = startedAt ? formatElapsed(now - startedAt) : null

  const steps: { title: string; detail?: string; state: StepState }[] = [
    { title: 'Resume uploaded', detail: fileName, state: 'done' },
    { title: 'Focus areas chosen', detail: interests.join(', '), state: 'done' },
    { title: 'Reading roles, projects and skills', detail: elapsed ? `${elapsed} elapsed` : undefined, state: 'active' },
    { title: 'Start the career analysis', state: 'pending' },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-semibold leading-tight text-[var(--text-primary)] sm:text-[28px]" style={{ fontFamily: 'var(--font-sora)' }}>
          Finishing reading your resume
        </h2>
        <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-[var(--text-secondary)]">
          Your analysis starts the moment this is done. It usually takes under a minute.
        </p>
      </div>

      <div className="h-[2px] w-full overflow-hidden rounded-full bg-[var(--border-ws)]" aria-hidden>
        <div className="h-full w-1/3 rounded-full bg-[var(--neon)] opacity-70 motion-safe:animate-[ws-indeterminate_2.4s_ease-in-out_infinite]" />
      </div>

      <ol className="flex flex-col" aria-label="Progress">
        {steps.map((step, i) => (
          <li key={step.title} className="relative flex gap-3.5 pb-6 last:pb-0">
            {i < steps.length - 1 && (
              <span className="absolute left-[9.5px] top-6 bottom-1 w-px bg-[var(--border-ws)]" aria-hidden />
            )}
            <StepMark state={step.state} />
            <div className="min-w-0 -mt-0.5">
              <p
                className={cx('text-sm font-semibold', step.state === 'pending' ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]')}
                {...(step.state === 'active' ? { role: 'status', 'aria-live': 'polite' as const } : {})}
              >
                {step.title}
                <span className="sr-only">{step.state === 'done' ? ', done' : step.state === 'active' ? ', in progress' : ', next'}</span>
              </p>
              {step.detail && <p className="mt-0.5 truncate text-[13px] text-[var(--text-muted)]">{step.detail}</p>}
            </div>
          </li>
        ))}
      </ol>

      <div>
        <button type="button" onClick={onBack} className={linkButton}>Change focus areas</button>
      </div>

      <style>{`@keyframes ws-indeterminate { 0% { transform: translateX(-110%); } 100% { transform: translateX(310%); } }`}</style>
    </div>
  )
}
