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
  const headingId = useId()
  const suggestions = useMemo(() => (status === 'done' && data ? suggestInterests(data, 6) : []), [status, data])

  // While the resume is still being read there is nothing to show: progress lives in the tray below.
  if (status === 'reading' || status === 'idle') return null

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id={headingId} className="text-[15px] font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>
          Suggested from your resume
        </h3>
        <p aria-live="polite" className="text-xs text-[var(--text-muted)]">
          {status === 'done' && suggestions.length > 0 && `${suggestions.length} suggestions`}
        </p>
      </div>

      {status === 'error' && (
        <div role="alert" className="flex flex-col gap-3 rounded-[12px] border border-red-400/25 bg-red-400/[0.06] p-4">
          <div className="flex gap-2.5">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-300" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">We couldn&apos;t read your resume</p>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-secondary)]">{error}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">You can still choose focus areas below. Your Blueprint needs a readable resume.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pl-[26px]">
            <button type="button" onClick={onRetry} className={cx(quietButton, 'py-2 text-[13px]')}>Try again</button>
            <button type="button" onClick={onReupload} className={cx(quietButton, 'py-2 text-[13px]')}>Upload a different file</button>
          </div>
        </div>
      )}

      {status === 'done' && suggestions.length === 0 && (
        <p className="rounded-[12px] border border-[var(--border-ws)] bg-[var(--surface)] px-4 py-3 text-[13px] text-[var(--text-secondary)]">
          Nothing stood out strongly enough to suggest. Choose from the areas below.
        </p>
      )}

      {status === 'done' && suggestions.length > 0 && (
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
                    isOn
                      ? 'border-[var(--neon)] bg-[var(--neon-surface)]'
                      : blocked
                      ? 'cursor-not-allowed border-[var(--border-ws)] bg-[var(--surface)] opacity-60'
                      : 'border-[var(--border-ws)] bg-[var(--surface)] hover:border-[var(--text-dim)]',
                  )}
                >
                  <span className={cx(
                    'mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border',
                    isOn ? 'border-[var(--neon)] bg-[var(--neon)]' : 'border-[var(--text-dim)]',
                  )} aria-hidden>
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
      )}
    </section>
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
      <h3 id={headingId} className="mb-1 text-[15px] font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>
        All focus areas
      </h3>
      <p className="mb-4 text-xs text-[var(--text-muted)]">Hover or long-press an area to see what it covers.</p>
      {groups.map((g) => (
        <GroupBlock key={g.id} groupId={g.id} label={g.label} description={g.description} />
      ))}
    </section>
  )
}

// ── Selection tray ──────────────────────────────────────────────────────────

export function SelectionTray({ actions, status }: { actions: React.ReactNode; status?: ExtractionStatus }) {
  const { selected, toggle } = useInterestSelection()
  const n = selected.length
  const helper =
    n < MIN_INTERESTS ? `Choose ${MIN_INTERESTS - n} more to continue.`
    : n < MAX_INTERESTS ? `You can add ${MAX_INTERESTS - n} more.`
    : `That's ${MAX_INTERESTS}. Remove one to choose another.`

  return (
    <div className="sticky bottom-0 z-10 -mx-4 px-4 pb-4 pt-6 sm:-mx-6 sm:px-6"
      style={{ background: 'linear-gradient(to top, var(--bg) 78%, transparent)' }}>
      <div className="rounded-[14px] border border-[var(--border-ws)] bg-[var(--surface)] p-3.5 shadow-[0_-8px_32px_rgba(0,0,0,0.35)] sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-[var(--text-primary)]">
            <span className="font-semibold">Your focus</span>
            <span className="text-[var(--text-muted)]"> · {n} of {MAX_INTERESTS}</span>
          </p>
          <div className="flex gap-1" aria-hidden>
            {Array.from({ length: MAX_INTERESTS }).map((_, i) => (
              <span key={i} className={cx(
                'h-1 w-4 rounded-full transition-colors',
                i < n ? 'bg-[var(--neon)]' : i < MIN_INTERESTS ? 'bg-[var(--text-dim)]' : 'bg-[var(--border-ws)]',
              )} />
            ))}
          </div>
        </div>

        <ul className="-mx-1 mt-2.5 flex min-h-[30px] gap-1.5 overflow-x-auto px-1 py-0.5 sm:flex-wrap sm:overflow-visible" aria-label="Chosen focus areas">
          <AnimatePresence initial={false}>
            {selected.map((label) => (
              <motion.li
                key={label}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.16 }}
                className="flex-shrink-0"
              >
                <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[var(--neon-border)] bg-[var(--neon-surface)] py-1 pl-2.5 pr-1 text-xs font-medium text-[var(--text-primary)]"
                  title={interestByLabel(label)?.hint}>
                  {label}
                  <button
                    type="button"
                    onClick={() => toggle(label)}
                    aria-label={`Remove ${label}`}
                    className={cx('flex h-5 w-5 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-dim)] hover:text-[var(--text-primary)]', focusRing)}
                  >
                    <X size={12} aria-hidden />
                  </button>
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
          {n === 0 && <li className="self-center text-xs text-[var(--text-dim)]">Nothing chosen yet</li>}
        </ul>

        <p className="mt-2 text-xs text-[var(--text-muted)]" aria-live="polite">{helper}</p>

        <div className="mt-3 flex gap-2">{actions}</div>

        {status === 'reading' && (
          <p className="mt-3 flex items-center gap-2 border-t border-[var(--border-ws)] pt-3 text-xs text-[var(--text-muted)]" role="status">
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--neon)] motion-safe:animate-pulse" aria-hidden />
            Reading your resume in the background. Suggestions appear here when it is done.
          </p>
        )}
      </div>
    </div>
  )
}
