// components/blueprint/GapAnalysis.tsx
'use client'
import { useState } from 'react'
import { Check, Gauge, Signpost } from 'lucide-react'
import { matchesPath } from '@/lib/path-match'
import { Blueprint, Gap, GapObjective } from '@/types/wingspan'
import { useWingspan } from '@/context/WingspanContext'
import { SectionFrame, type SectionTab } from './shell/SectionFrame'
import { useShell } from './shell/ShellContext'
import { Badge, Card, Chip, EmptyState, FieldLabel, FOCUS_RING, INK, PrimaryButton, TextButton } from './shell/ui'
import { GAP_SIZE_LABEL, GAP_SIZE_LEVEL, gapSizeOf, readinessOf } from './gap-readiness'

const OBJECTIVES_KEY = 'wingspan-gap-objectives'
const IN_PROGRESS_KEY = 'wingspan_inprogress_gaps'

const SIZE_TONE = { small: 'positive', medium: 'warn', large: 'danger' } as const
// A bigger gap fills more of the meter, coloured like its badge (so a large gap never reads as "good").
const SIZE_FILL = { small: 'bg-emerald-500/80', medium: 'bg-amber-500/80', large: 'bg-red-400/80' } as const

function loadObjectives(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(OBJECTIVES_KEY) ?? '{}') } catch { return {} }
}

function saveObjective(key: string, completed: boolean) {
  try {
    const all = loadObjectives()
    all[key] = completed
    localStorage.setItem(OBJECTIVES_KEY, JSON.stringify(all))
  } catch { /* storage unavailable */ }
}

const gapKey = (g: Gap) => `${g.pathway}-${g.gapType}`
const typeTabId = (type: string) => `type:${type}`

// ── Readiness ───────────────────────────────────────────────────────────────

function ReadinessMeter({ gap, size = 'sm' }: { gap: Gap; size?: 'sm' | 'lg' }) {
  const r = readinessOf(gap)
  const h = size === 'lg' ? 'h-2' : 'h-1.5'

  if (r.kind === 'qualitative') {
    const level = GAP_SIZE_LEVEL[r.size]
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="w-14 shrink-0 text-[12px] font-semibold text-[var(--text-muted)]">Gap</span>
          <div className="flex-1 grid grid-cols-3 gap-1" role="img" aria-label={`${GAP_SIZE_LABEL[r.size]}, no readiness score available`}>
            {[1, 2, 3].map(i => (
              <span key={i} className={`${h} rounded-full ${i <= level ? SIZE_FILL[r.size] : 'bg-[var(--surface-dim)]'}`} />
            ))}
          </div>
          <span className="w-16 shrink-0 text-right text-[12px] font-semibold text-[var(--text-secondary)]">{r.size[0].toUpperCase() + r.size.slice(1)}</span>
        </div>
        <p className="text-[12px] text-[var(--text-muted)] pl-[68px]">Sized from your evidence. No readiness score yet.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {[
        { label: 'Now', value: r.now, cls: 'bg-[var(--text-muted)]', text: 'text-[var(--text-secondary)]' },
        { label: 'Target', value: r.target, cls: 'bg-[var(--neon)]', text: INK },
      ].map(row => (
        <div key={row.label} className="flex items-center gap-3">
          <span className={`w-14 shrink-0 text-[12px] font-semibold ${row.label === 'Target' ? INK : 'text-[var(--text-muted)]'}`}>{row.label}</span>
          <div className={`flex-1 ${h} rounded-full bg-[var(--surface-dim)] overflow-hidden`} role="img" aria-label={`${row.label} readiness ${row.value} percent`}>
            <div className={`h-full rounded-full ${row.cls}`} style={{ width: `${row.value}%` }} />
          </div>
          <span className={`w-16 shrink-0 text-right text-[12px] font-semibold tabular-nums ${row.text}`}>{row.value}%</span>
        </div>
      ))}
      <p className="text-[12px] text-[var(--text-muted)] pl-[68px]">{r.points}-point gap to close</p>
    </div>
  )
}

// ── Objectives & progress ───────────────────────────────────────────────────

function ObjectiveItem({ objective, storageKey }: { objective: GapObjective; storageKey: string }) {
  const [checked, setChecked] = useState(() => loadObjectives()[storageKey] ?? objective.completed)
  const toggle = () => { const next = !checked; setChecked(next); saveObjective(storageKey, next) }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={toggle}
      className={`group flex items-start gap-3 text-left w-full rounded-[8px] p-2 -m-2 hover:bg-[var(--surface-dim)] ${FOCUS_RING}`}
    >
      <span className={`shrink-0 mt-0.5 w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center transition-colors ${
        checked ? 'bg-[var(--neon)] border-[var(--neon)] text-[#0a0a0a]' : 'border-[var(--border-ws)] group-hover:border-[var(--neon)]'
      }`}>
        {checked && <Check size={11} strokeWidth={3.5} aria-hidden />}
      </span>
      <span className={`text-[14px] leading-relaxed ${checked ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'}`}>
        {objective.text}
      </span>
    </button>
  )
}

function useInProgress() {
  const [set, setSet] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try { return new Set(JSON.parse(localStorage.getItem(IN_PROGRESS_KEY) ?? '[]')) } catch { return new Set() }
  })
  const toggle = (key: string) => {
    const next = new Set(set)
    if (next.has(key)) next.delete(key); else next.add(key)
    setSet(next)
    try { localStorage.setItem(IN_PROGRESS_KEY, JSON.stringify([...next])) } catch { /* storage unavailable */ }
  }
  return { has: (k: string) => set.has(k), toggle, count: (keys: string[]) => keys.filter(k => set.has(k)).length }
}

// Same key format as before, so existing in-progress flags survive.
const progressKey = (g: Gap) => g.pathway + g.gapType

// ── Cards ───────────────────────────────────────────────────────────────────

function GapBadges({ gap, inProgress }: { gap: Gap; inProgress: boolean }) {
  const size = gapSizeOf(gap)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone={SIZE_TONE[size]}>{GAP_SIZE_LABEL[size]}</Badge>
      {inProgress && <Badge tone="accent">In progress</Badge>}
    </div>
  )
}

function Meta({ gap }: { gap: Gap }) {
  const items = [
    gap.timeline && { label: 'Timeline', value: gap.timeline },
    gap.effort && { label: 'Effort', value: gap.effort },
  ].filter(Boolean) as { label: string; value: string }[]
  if (items.length === 0) return null
  return (
    <dl className="flex flex-wrap gap-x-8 gap-y-2">
      {items.map(i => (
        <div key={i.label} className="min-w-0">
          <dt className="text-[12px] text-[var(--text-muted)]">{i.label}</dt>
          <dd className="text-[13px] font-semibold text-[var(--text-primary)]">{i.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function GapSummaryCard({ gap, inProgress, onOpen }: { gap: Gap; inProgress: boolean; onOpen: () => void }) {
  return (
    <Card as="li" className="p-5 sm:p-6 flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-[16px] font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>{gap.gapType}</h3>
        <GapBadges gap={gap} inProgress={inProgress} />
      </div>
      <ReadinessMeter gap={gap} />
      {gap.whyItMatters && <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">{gap.whyItMatters}</p>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Meta gap={gap} />
        <TextButton onClick={onOpen}>See how to close it</TextButton>
      </div>
    </Card>
  )
}

function GapDetail({ gap, inProgress, onToggleProgress }: { gap: Gap; inProgress: boolean; onToggleProgress: () => void }) {
  const caps = Array.isArray(gap.requiredCapabilities) ? gap.requiredCapabilities : []
  return (
    <Card as="article" className="p-5 sm:p-7 flex flex-col gap-7">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-[20px] font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>{gap.gapType}</h3>
          <GapBadges gap={gap} inProgress={inProgress} />
        </div>
        <ReadinessMeter gap={gap} size="lg" />
        <Meta gap={gap} />
      </div>

      {(gap.currentState || gap.desiredState) && (
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-[10px] bg-[var(--card-inner)] border border-[var(--border-ws)] p-4">
            <FieldLabel>Where you are</FieldLabel>
            <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">{gap.currentState || 'Not described.'}</p>
          </div>
          <div className="rounded-[10px] bg-[var(--neon-surface)] border border-[var(--neon-border)] p-4">
            <FieldLabel accent>Where you need to be</FieldLabel>
            <p className="text-[14px] text-[var(--text-primary)] leading-relaxed">{gap.desiredState || 'Not described.'}</p>
          </div>
        </div>
      )}

      {gap.whyItMatters && (
        <div>
          <FieldLabel>Why it matters</FieldLabel>
          <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed max-w-[68ch]">{gap.whyItMatters}</p>
        </div>
      )}

      {caps.length > 0 && (
        <div>
          <FieldLabel>Capabilities to build</FieldLabel>
          <div className="flex flex-wrap gap-2">{caps.map(c => <Chip key={c}>{c}</Chip>)}</div>
        </div>
      )}

      {gap.howToClose && (
        <div className="border-l-2 border-[var(--neon)] pl-4">
          <FieldLabel accent>How to close it</FieldLabel>
          <p className="text-[14px] text-[var(--text-primary)] leading-relaxed max-w-[68ch]">{gap.howToClose}</p>
        </div>
      )}

      {gap.objectives && gap.objectives.length > 0 && (
        <div>
          <FieldLabel>Things to do</FieldLabel>
          <div className="flex flex-col gap-3 mt-2">
            {gap.objectives.map(obj => (
              <ObjectiveItem key={obj.id} objective={obj} storageKey={`${gap.pathway}-${gap.gapType}-${obj.id}`} />
            ))}
          </div>
        </div>
      )}

      <div className="pt-5 border-t border-[var(--border-ws)]">
        <button
          type="button"
          aria-pressed={inProgress}
          onClick={onToggleProgress}
          className={`inline-flex items-center gap-2 h-9 px-4 rounded-full border text-[13px] font-semibold transition-colors ${FOCUS_RING} ${
            inProgress
              ? `border-[var(--neon)] bg-[var(--neon-surface)] ${INK}`
              : 'border-[var(--border-ws)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          {inProgress && <Check size={14} aria-hidden />}
          {inProgress ? 'Working on this' : "I'm already working on this"}
        </button>
      </div>
    </Card>
  )
}

// ── Section ─────────────────────────────────────────────────────────────────

export function GapAnalysis({ blueprint }: { blueprint: Blueprint }) {
  const { state } = useWingspan()
  const { goTo } = useShell()
  const selectedPath = state.selectedPath
  const [tab, setTab] = useState('overview')
  const progress = useInProgress()

  const gaps = (Array.isArray(blueprint.gaps) ? blueprint.gaps : []).filter(g => g && matchesPath(g.pathway, selectedPath))
  const types = [...new Set(gaps.map(g => g.gapType || 'Other gap'))]

  if (!selectedPath) {
    return (
      <SectionFrame section="gap-analysis" tabs={[]} activeTab="" onTabChange={() => {}}>
        <EmptyState
          icon={Signpost}
          title="Choose a path to see your gaps"
          body="Gaps are measured against a specific direction. Pick one in Future Paths and this page fills in."
          action={<PrimaryButton onClick={() => goTo('path-selection')}>Go to Future Paths</PrimaryButton>}
        />
      </SectionFrame>
    )
  }

  const tabs: SectionTab[] = [
    { id: 'overview', label: 'Overview' },
    ...types.map(t => {
      const n = gaps.filter(g => (g.gapType || 'Other gap') === t).length
      return { id: typeTabId(t), label: t, count: n > 1 ? n : undefined }
    }),
  ]
  const large = gaps.filter(g => gapSizeOf(g) === 'large').length
  const inProgressCount = progress.count(gaps.map(progressKey))

  return (
    <SectionFrame
      section="gap-analysis"
      context={<Badge tone="accent">For {selectedPath}</Badge>}
      stat={gaps.length ? { value: gaps.length, label: gaps.length === 1 ? 'gap to close' : 'gaps to close' } : null}
      tabs={gaps.length ? tabs : []}
      activeTab={tab}
      onTabChange={setTab}
    >
      {gaps.length === 0 ? (
        <EmptyState
          icon={Gauge}
          title="No gaps found for this path"
          body="The analysis didn't return gaps for this direction. Try another path, or run the analysis again with more project detail."
          action={<PrimaryButton onClick={() => goTo('path-selection')}>Review Future Paths</PrimaryButton>}
        />
      ) : tab === 'overview' || !types.some(t => typeTabId(t) === tab) ? (
        <>
          <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed max-w-[68ch]">
            {gaps.length === 1 ? 'One gap stands' : `${gaps.length} gaps stand`} between you and {selectedPath}
            {large > 0 ? `. ${large === 1 ? 'One is large' : `${large} are large`}, so start there` : ''}
            {inProgressCount > 0 ? `. You're already working on ${inProgressCount}` : ''}.
          </p>
          <ul className="flex flex-col gap-4">
            {[...gaps]
              .sort((a, b) => GAP_SIZE_LEVEL[gapSizeOf(b)] - GAP_SIZE_LEVEL[gapSizeOf(a)])
              .map(gap => (
                <GapSummaryCard
                  key={gapKey(gap)}
                  gap={gap}
                  inProgress={progress.has(progressKey(gap))}
                  onOpen={() => setTab(typeTabId(gap.gapType || 'Other gap'))}
                />
              ))}
          </ul>
        </>
      ) : (
        gaps
          .filter(g => typeTabId(g.gapType || 'Other gap') === tab)
          .map(gap => (
            <GapDetail
              key={gapKey(gap)}
              gap={gap}
              inProgress={progress.has(progressKey(gap))}
              onToggleProgress={() => progress.toggle(progressKey(gap))}
            />
          ))
      )}
    </SectionFrame>
  )
}
