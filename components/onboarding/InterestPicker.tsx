'use client'
import { useId, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Check, Plus, X } from 'lucide-react'
import { useWingspan } from '@/context/WingspanContext'
import {
  INTEREST_GROUPS, INTERESTS, MAX_INTERESTS, MIN_INTERESTS,
  orderedGroups, suggestInterests, interestByLabel, type Interest,
} from '@/lib/interests'
import { factsOf } from '@/lib/experience'
import type { ExtractedCareerData } from '@/types/wingspan'
import type { ExtractionStatus } from './useResumeExtraction'
import { cx, focusRing, linkButton, quietButton } from './ui'

/** How many chips per group show on a phone before "Show more". Desktop shows all. */
const MOBILE_VISIBLE = 4

function useInterestSelection() {
  const { state, dispatch } = useWingspan()
  const selected = state.interests
  const atMax = selected.length >= MAX_INTERESTS
  const toggle = (label: string) => {
    if (!selected.includes(label) && atMax) return
    dispatch({ type: 'TOGGLE_INTEREST', interest: label })
  }
  return { selected, atMax, toggle }
}

// ── Chip ────────────────────────────────────────────────────────────────────

function InterestChip({ interest, className }: { interest: Interest; className?: string }) {
  const { selected, atMax, toggle } = useInterestSelection()
  const isOn = selected.includes(interest.label)
  const blocked = !isOn && atMax
  return (
    <button
      type="button"
      aria-pressed={isOn}
      aria-disabled={blocked || undefined}
      title={blocked ? `${interest.hint}. You've chosen ${MAX_INTERESTS}; remove one to add this.` : interest.hint}
      onClick={() => toggle(interest.label)}
      className={cx(
        'inline-flex min-h-[34px] items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors',
        focusRing,
        isOn
          ? 'border-[var(--neon)] bg-[var(--neon-surface)] text-[var(--text-primary)]'
          : blocked
          ? 'cursor-not-allowed border-[var(--border-ws)] text-[var(--text-dim)]'
          : 'border-[var(--border-ws)] text-[var(--text-secondary)] hover:border-[var(--text-dim)] hover:text-[var(--text-primary)]',
        className,
      )}
    >
      {isOn
        ? <Check size={13} className="text-[var(--neon)]" aria-hidden />
        : <Plus size={13} className="opacity-60" aria-hidden />}
      {interest.label}
      <span className="sr-only">. {interest.hint}</span>
    </button>
  )
}

// ── Suggested from your resume ─────────────────────────────────────────────

interface SuggestedProps {
  status: ExtractionStatus
  data: ExtractedCareerData | null
  error: string | null
  onRetry: () => void
  onReupload: () => void
}

export function SuggestedInterests({ status, data, error, onRetry, onReupload }: SuggestedProps) {
  const { selected, atMax, toggle } = useInterestSelection()
  const suggestions = useMemo(() => (status === 'done' && data ? suggestInterests(data, 6) : []), [status, data])

  if (status === 'idle' || status === 'reading') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[14px] border border-dashed border-[var(--border-ws)] px-6 py-12 text-center" role="status">
        <div className="flex items-end gap-1" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="w-1.5 rounded-full bg-[var(--neon)] motion-safe:animate-[ws-bars_1.1s_ease-in-out_infinite]" style={{ height: 8 + (i % 3) * 6, animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Reading your resume</p>
          <p className="mx-auto mt-1 max-w-[42ch] text-[13px] leading-relaxed text-[var(--text-muted)]">
            Suggestions based on your roles, projects and skills will appear here. You can pick from all focus areas in the meantime.
          </p>
        </div>
        <style>{`@keyframes ws-bars { 0%, 100% { transform: scaleY(.5); opacity: .5 } 50% { transform: scaleY(1.4); opacity: 1 } }`}</style>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div role="alert" className="flex flex-col gap-3 rounded-[12px] border border-red-400/25 bg-red-400/[0.06] p-4">
        <div className="flex gap-2.5">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-300" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">We couldn&apos;t read your resume</p>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">{error}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Try again, or go back and upload a different file.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pl-[26px]">
          <button type="button" onClick={onRetry} className={cx(quietButton, 'py-2 text-[13px]')}>Try again</button>
          <button type="button" onClick={onReupload} className={cx(quietButton, 'py-2 text-[13px]')}>Upload a different file</button>
        </div>
      </div>
    )
  }

  if (suggestions.length === 0) {
    return (
      <p className="rounded-[12px] border border-[var(--border-ws)] bg-[var(--surface)] px-4 py-3 text-[13px] text-[var(--text-secondary)]">
        Nothing stood out strongly enough to suggest. Choose from all focus areas.
      </p>
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {suggestions.map(({ interest, reason }) => {
        const isOn = selected.includes(interest.label)
        const blocked = !isOn && atMax
        return (
          <li key={interest.id}>
            <button
              type="button"
              aria-pressed={isOn}
              aria-disabled={blocked || undefined}
              title={interest.hint}
              onClick={() => toggle(interest.label)}
              className={cx(
                'flex w-full items-start gap-2.5 rounded-[12px] border px-3.5 py-3 text-left transition-colors',
                focusRing,
                isOn ? 'border-[var(--neon)] bg-[var(--neon-surface)]'
                  : blocked ? 'cursor-not-allowed border-[var(--border-ws)] bg-[var(--surface)] opacity-60'
                  : 'border-[var(--border-ws)] bg-[var(--surface)] hover:border-[var(--text-dim)]',
              )}
            >
              <span className={cx('mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border', isOn ? 'border-[var(--neon)] bg-[var(--neon)]' : 'border-[var(--text-dim)]')} aria-hidden>
                {isOn && <Check size={10} strokeWidth={3} className="text-[#0a0a0a]" />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[var(--text-primary)]">{interest.label}</span>
                <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{reason}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

// ── All focus areas, grouped ───────────────────────────────────────────────

function GroupBlock({ groupId, label, description }: { groupId: string; label: string; description: string }) {
  const { selected } = useInterestSelection()
  const [expanded, setExpanded] = useState(false)
  const headingId = useId()
  const listId = useId()
  const items = INTERESTS.filter((i) => i.group === groupId)
  const chosen = items.filter((i) => selected.includes(i.label)).length
  const hiddenOnMobile = items.filter((it, idx) => idx >= MOBILE_VISIBLE && !selected.includes(it.label)).length

  return (
    <section aria-labelledby={headingId} className="border-t border-[var(--border-ws)] py-5 first:border-t-0 first:pt-1">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h4 id={headingId} className="text-sm font-semibold text-[var(--text-primary)]">{label}</h4>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{description}</p>
        </div>
        {chosen > 0 && <span className="flex-shrink-0 text-xs font-semibold text-[var(--neon)]">{chosen} chosen</span>}
      </div>
      <div id={listId} className="flex flex-wrap gap-2">
        {items.map((interest, idx) => (
          <InterestChip
            key={interest.id}
            interest={interest}
            className={!expanded && idx >= MOBILE_VISIBLE && !selected.includes(interest.label) ? 'hidden sm:inline-flex' : undefined}
          />
        ))}
      </div>
      {hiddenOnMobile > 0 && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((v) => !v)}
          className={cx(linkButton, 'mt-3 sm:hidden')}
        >
          {expanded ? 'Show fewer' : `Show ${hiddenOnMobile} more`}
        </button>
      )}
    </section>
  )
}

export function InterestGroups({ data }: { data: ExtractedCareerData | null }) {
  const headingId = useId()
  const groups = useMemo(() => {
    if (!data?.timeline?.length) return INTEREST_GROUPS
    return orderedGroups(factsOf(data).seniority)
  }, [data])

  return (
    <section aria-labelledby={headingId} className="flex flex-col">
      <h3 id={headingId} className="sr-only">All focus areas</h3>
      <p className="mb-4 text-xs text-[var(--text-muted)]">Hover or long-press an area to see what it covers.</p>
      {groups.map((g) => (
        <GroupBlock key={g.id} groupId={g.id} label={g.label} description={g.description} />
      ))}
    </section>
  )
}

// ── Tabs: all focus areas / suggested for your resume ─────────────────────

export function FocusTabs({ status, data, error, onRetry, onReupload }: SuggestedProps) {
  const [tab, setTab] = useState<'all' | 'suggested'>('all')
  const baseId = useId()
  const count = useMemo(() => (status === 'done' && data ? suggestInterests(data, 6).length : 0), [status, data])
  const tabs = [
    { id: 'all' as const, label: 'All focus areas' },
    { id: 'suggested' as const, label: 'Suggested for your resume' },
  ]
  return (
    <div>
      <div role="tablist" aria-label="Focus areas" className="flex gap-1 border-b border-[var(--border-ws)]">
        {tabs.map((t) => {
          const on = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`${baseId}-${t.id}`}
              aria-selected={on}
              aria-controls={`${baseId}-panel`}
              tabIndex={on ? 0 : -1}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setTab(t.id === 'all' ? 'suggested' : 'all') } }}
              className={cx('relative -mb-px inline-flex h-11 items-center gap-2 border-b-2 px-3 text-sm transition-colors', focusRing,
                on ? 'border-[var(--neon)] font-semibold text-[var(--text-primary)]' : 'border-transparent font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]')}
            >
              {t.label}
              {t.id === 'suggested' && status === 'reading' && <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--border-ws)] border-t-[var(--neon)] motion-reduce:animate-none" aria-label="Reading" />}
              {t.id === 'suggested' && status === 'done' && count > 0 && (
                <span className={cx('inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold', on ? 'bg-[var(--neon)] text-[#0a0a0a]' : 'bg-[var(--neon-surface)] text-[var(--text-primary)]')}>{count}</span>
              )}
            </button>
          )
        })}
      </div>
      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-${tab}`} className="pt-5">
        {tab === 'all'
          ? <InterestGroups data={status === 'done' ? data : null} />
          : <SuggestedInterests status={status} data={data} error={error} onRetry={onRetry} onReupload={onReupload} />}
      </div>
    </div>
  )
}

// ── Chosen focus areas (in the page) and the footer helper text ────────────

export function focusHelper(n: number): string {
  return n < MIN_INTERESTS ? `Choose ${MIN_INTERESTS - n} more to continue.`
    : n < MAX_INTERESTS ? `You can add ${MAX_INTERESTS - n} more.`
    : `That's ${MAX_INTERESTS}. Remove one to choose another.`
}

export function SelectedFocus() {
  const { selected, toggle } = useInterestSelection()
  const n = selected.length
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-[var(--text-muted)]">Your focus · {n} of {MAX_INTERESTS}</p>
      <ul className="flex min-h-[30px] flex-wrap gap-1.5" aria-label="Chosen focus areas">
        <AnimatePresence initial={false}>
          {selected.map((label) => (
            <motion.li key={label} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.16 }}>
              <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[var(--neon-border)] bg-[var(--neon-surface)] py-1 pl-2.5 pr-1 text-xs font-medium text-[var(--text-primary)]" title={interestByLabel(label)?.hint}>
                {label}
                <button type="button" onClick={() => toggle(label)} aria-label={`Remove ${label}`}
                  className={cx('flex h-5 w-5 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-dim)] hover:text-[var(--text-primary)]', focusRing)}>
                  <X size={12} aria-hidden />
                </button>
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
        {n === 0 && <li className="self-center text-xs text-[var(--text-dim)]">Nothing chosen yet</li>}
      </ul>
    </div>
  )
}

export { MIN_INTERESTS, MAX_INTERESTS }
