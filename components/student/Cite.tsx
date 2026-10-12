'use client'
import type { Claim } from '@/lib/student/types'
import { cx, focusRing } from '@/components/onboarding/ui'

/** A small citation chip that jumps to the source in the list at the bottom of the plan. */
export function CiteChip({ id }: { id: string }) {
  const go = () => {
    const el = document.getElementById(`source-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' })
    el.classList.add('ring-2', 'ring-[var(--neon)]')
    window.setTimeout(() => el.classList.remove('ring-2', 'ring-[var(--neon)]'), 1800)
  }
  return (
    <button type="button" onClick={go} aria-label={`Source ${id}`}
      className={cx('ml-1 inline-flex h-[18px] min-w-[26px] items-center justify-center rounded-[5px] border border-[var(--border-ws)] px-1 align-baseline text-[10px] font-bold text-[var(--text-secondary)] hover:border-[var(--neon-border)] hover:text-[var(--text-primary)]', focusRing)}>
      {id}
    </button>
  )
}

/** A statement with its citations, or a plain label when it has none. */
export function ClaimText({ claim }: { claim: Claim }) {
  return (
    <span>
      {claim.text}
      {claim.sources.map((id) => <CiteChip key={id} id={id} />)}
      {claim.general && <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-dim)]">General guidance · no source</span>}
      {claim.unverifiedNumber && <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-amber-300">Figure not confirmed by the source</span>}
    </span>
  )
}
