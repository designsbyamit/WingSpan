// components/blueprint/PathSelection.tsx
'use client'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, ChevronDown, Loader2, Signpost } from 'lucide-react'
import { Blueprint, FuturePath } from '@/types/wingspan'
import { useWingspan } from '@/context/WingspanContext'
import { SectionFrame, type SectionTab } from './shell/SectionFrame'
import { useShell } from './shell/ShellContext'
import { Badge, Block, Card, EmptyState, Figure, FOCUS_RING, INK, PrimaryButton, SecondaryButton, TextButton } from './shell/ui'

const BET: Record<string, { label: string; tone: 'warn' | 'positive' | 'accent'; blurb: string }> = {
  safe:   { label: 'Safe bet',   tone: 'warn',     blurb: 'Builds directly on what you do today.' },
  growth: { label: 'Growth bet', tone: 'positive', blurb: 'A stretch with strong market pull.' },
  bold:   { label: 'Bold bet',   tone: 'accent',   blurb: 'A bigger leap with the highest upside.' },
}

const LEARNING: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High', 'very-high': 'Very high' }

const pathTab = (i: number) => `path:${i}`

function score(p: FuturePath): number | null {
  const v = p.careerAlphaScore ?? p.confidence
  return typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null
}

function tabLabel(p: FuturePath, all: FuturePath[]): string {
  const bet = BET[p.betArchetype]
  const unique = bet && all.filter(o => o.betArchetype === p.betArchetype).length === 1
  if (unique) return bet.label
  return p.title.length > 26 ? `${p.title.slice(0, 25)}…` : p.title
}

const ROWS: { label: string; value: (p: FuturePath) => string; strong?: boolean }[] = [
  { label: 'Career Alpha', value: p => score(p)?.toString() ?? '—', strong: true },
  { label: 'Career ROI', value: p => (typeof p.careerROIScore === 'number' ? String(Math.round(p.careerROIScore)) : '—') },
  { label: 'Timeline', value: p => p.timeline || '—' },
  { label: 'Market demand', value: p => p.marketDemand || '—' },
  { label: 'Growth potential', value: p => p.growthPotential || '—' },
  { label: 'Learning investment', value: p => LEARNING[p.learningInvestment] ?? '—' },
]

function ChooseButton({ path, selected, onChoose, full = false, compact = false }: { path: FuturePath; selected: boolean; onChoose: () => void; full?: boolean; compact?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={selected ? `${path.title} is your chosen path` : `Choose ${path.title}`}
      onClick={onChoose}
      className={`inline-flex items-center justify-center gap-2 h-10 px-4 rounded-[10px] text-[13px] font-bold whitespace-nowrap transition-colors ${FOCUS_RING} ${full ? 'w-full' : ''} ${
        selected
          ? 'bg-[var(--neon)] text-[#0a0a0a]'
          : `border border-[var(--neon-border)] ${INK} hover:bg-[var(--neon-surface)]`
      }`}
    >
      {selected && <Check size={14} aria-hidden />}
      {selected ? 'Your path' : compact ? 'Choose' : 'Choose this path'}
    </button>
  )
}

function PathBadges({ path, recommended }: { path: FuturePath; recommended: boolean }) {
  const bet = BET[path.betArchetype]
  return (
    <div className="flex flex-wrap items-center gap-2">
      {bet && <Badge tone={bet.tone}>{bet.label}</Badge>}
      {recommended && <Badge tone="neutral">Best fit</Badge>}
    </div>
  )
}

// ── Compare ─────────────────────────────────────────────────────────────────

function CompareTab({ paths, selected, recommended, onChoose, onOpen }: {
  paths: FuturePath[]
  selected: string | null
  recommended: string | undefined
  onChoose: (p: FuturePath) => void
  onOpen: (i: number) => void
}) {
  const cols = `minmax(112px,150px) repeat(${paths.length}, minmax(0,1fr))`
  return (
    <>
      {/* Desktop / tablet: side-by-side table */}
      <div className="hidden md:block">
        <Card className="overflow-hidden">
          <div role="table" aria-label="Compare future paths">
            <div role="row" className="grid border-b border-[var(--border-ws)]" style={{ gridTemplateColumns: cols }}>
              <div role="columnheader" className="p-5"><span className="sr-only">Attribute</span></div>
              {paths.map((p, i) => {
                const isSel = p.title === selected
                return (
                  <div role="columnheader" key={p.title} className={`p-5 flex flex-col gap-3 border-l border-[var(--border-ws)] ${isSel ? 'bg-[var(--neon-surface)]' : ''}`}>
                    <PathBadges path={p} recommended={p.title === recommended} />
                    <p className="text-[16px] font-semibold text-[var(--text-primary)] leading-snug" style={{ fontFamily: 'var(--font-sora)' }}>{p.title}</p>
                    <p className="text-[13px] font-normal text-[var(--text-secondary)] leading-relaxed line-clamp-3">{p.betRationale || p.whyItFits}</p>
                    <TextButton onClick={() => onOpen(i)} className="self-start mt-auto">Details</TextButton>
                  </div>
                )
              })}
            </div>
            {ROWS.map(row => (
              <div role="row" key={row.label} className="grid border-b border-[var(--border-ws)]" style={{ gridTemplateColumns: cols }}>
                <div role="rowheader" className="px-5 py-3.5 text-[13px] text-[var(--text-muted)]">{row.label}</div>
                {paths.map(p => (
                  <div
                    role="cell"
                    key={p.title}
                    className={`px-5 py-3.5 border-l border-[var(--border-ws)] text-[14px] tabular-nums ${p.title === selected ? 'bg-[var(--neon-surface)]' : ''} ${
                      row.strong ? `font-semibold ${INK}` : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {row.value(p)}
                  </div>
                ))}
              </div>
            ))}
            <div role="row" className="grid" style={{ gridTemplateColumns: cols }}>
              <div role="rowheader" className="p-5"><span className="sr-only">Choose</span></div>
              {paths.map(p => (
                <div role="cell" key={p.title} className={`p-5 border-l border-[var(--border-ws)] ${p.title === selected ? 'bg-[var(--neon-surface)]' : ''}`}>
                  <ChooseButton path={p} selected={p.title === selected} onChoose={() => onChoose(p)} full compact />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Phone: stacked cards */}
      <ul className="md:hidden flex flex-col gap-4">
        {paths.map((p, i) => {
          const isSel = p.title === selected
          return (
            <Card as="li" key={p.title} className={`p-5 flex flex-col gap-4 ${isSel ? '!border-[var(--neon)]' : ''}`}>
              <PathBadges path={p} recommended={p.title === recommended} />
              <div>
                <p className="text-[17px] font-semibold text-[var(--text-primary)] leading-snug" style={{ fontFamily: 'var(--font-sora)' }}>{p.title}</p>
                <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mt-2 line-clamp-3">{p.betRationale || p.whyItFits}</p>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                {ROWS.map(row => (
                  <div key={row.label}>
                    <dt className="text-[12px] text-[var(--text-muted)]">{row.label}</dt>
                    <dd className={`text-[14px] tabular-nums ${row.strong ? `font-semibold ${INK}` : 'text-[var(--text-primary)]'}`}>{row.value(p)}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex gap-2">
                <ChooseButton path={p} selected={isSel} onChoose={() => onChoose(p)} full />
                <SecondaryButton onClick={() => onOpen(i)} className="shrink-0">Details</SecondaryButton>
              </div>
            </Card>
          )
        })}
      </ul>

      <p className="text-[13px] text-[var(--text-muted)] leading-relaxed max-w-[68ch]">
        Career Alpha scores how well each path fits your profile: evidence, market signals, future resilience and learning investment. Each path is scored on its own, so scores are not a ranking of the paths against each other.
      </p>
    </>
  )
}

// ── Single path ─────────────────────────────────────────────────────────────

function AdjustPath({ blueprint, path }: { blueprint: Blueprint; path: FuturePath }) {
  const { state, dispatch } = useWingspan()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!draft.trim()) return
    setError(''); setBusy(true)
    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'paths', blueprint, instruction: `For the path '${path.title}': ${draft}`, careerAlpha: state.careerAlpha }),
      })
      const data = await res.json()
      if (!res.ok || !data.refined?.futurePaths) { setError(data.error ?? 'Could not adjust this path. Try rephrasing.'); return }
      dispatch({ type: 'SET_BLUEPRINT', blueprint: { ...blueprint, futurePaths: data.refined.futurePaths } })
      setDraft(''); setOpen(false)
    } catch {
      setError('Could not adjust this path. Check your connection and try again.')
    } finally { setBusy(false) }
  }

  return (
    <Card tone="quiet" className="overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-3 p-5 text-left rounded-[14px] ${FOCUS_RING} focus-visible:ring-offset-0`}
      >
        <span>
          <span className="block text-[14px] font-semibold text-[var(--text-primary)]">Adjust this path</span>
          <span className="block text-[13px] text-[var(--text-muted)] mt-0.5">Steer it toward what you actually want.</span>
        </span>
        <ChevronDown size={16} className={`shrink-0 text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-5 pb-5 flex flex-col gap-3">
              <label htmlFor={`adjust-${path.title}`} className="sr-only">How should this path change?</label>
              <textarea
                id={`adjust-${path.title}`}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="e.g. Focus it more on AI-native product design."
                rows={2}
                className={`w-full bg-[var(--bg)] border border-[var(--border-ws)] rounded-[10px] px-3 py-2.5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none ${FOCUS_RING}`}
              />
              {error && <p role="alert" className="text-[13px] text-red-400">{error}</p>}
              <PrimaryButton onClick={submit} disabled={busy || !draft.trim()} className="self-start h-9">
                {busy && <Loader2 size={14} className="animate-spin" aria-hidden />}
                {busy ? 'Adjusting' : 'Adjust path'}
              </PrimaryButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

function PathDetail({ blueprint, path, selected, recommended, onChoose }: {
  blueprint: Blueprint
  path: FuturePath
  selected: boolean
  recommended: boolean
  onChoose: () => void
}) {
  const evidence = Array.isArray(path.evidence) ? path.evidence.filter(Boolean) : []
  const areas = Array.isArray(path.keyTransitionAreas) ? path.keyTransitionAreas.filter(Boolean) : []
  const bet = BET[path.betArchetype]
  const months = typeof path.estimatedTransitionMonths === 'number' && path.estimatedTransitionMonths > 0 ? path.estimatedTransitionMonths : null

  return (
    <>
      <Card className={`p-6 sm:p-8 flex flex-col gap-6 ${selected ? '!border-[var(--neon)]' : ''}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 max-w-[60ch]">
            <PathBadges path={path} recommended={recommended} />
            <h2 className="text-[24px] font-semibold text-[var(--text-primary)] leading-tight mt-3" style={{ fontFamily: 'var(--font-sora)' }}>{path.title}</h2>
            {bet && <p className="text-[13px] text-[var(--text-muted)] mt-2">{bet.blurb}</p>}
          </div>
          <ChooseButton path={path} selected={selected} onChoose={onChoose} />
        </div>
        {(path.betRationale || path.whyItFits) && (
          <p className="text-[15px] text-[var(--text-secondary)] leading-[1.7] max-w-[68ch]">{path.betRationale || path.whyItFits}</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-[var(--border-ws)]">
          <Figure value={score(path) ?? '—'} label="Career Alpha" accent />
          <Figure value={typeof path.careerROIScore === 'number' ? Math.round(path.careerROIScore) : '—'} label="Career ROI" />
          <Figure value={path.timeline || '—'} label="Timeline" />
          <Figure value={months ? `${months} mo` : '—'} label="Estimated transition" />
        </div>
      </Card>

      {path.whyItFits && path.betRationale && (
        <Block title="Why it fits you">
          <p className="text-[15px] text-[var(--text-secondary)] leading-[1.7] max-w-[68ch]">{path.whyItFits}</p>
        </Block>
      )}

      <div className="grid md:grid-cols-2 gap-10">
        {evidence.length > 0 && (
          <Block title="Evidence from your work">
            <ul className="flex flex-col gap-3">
              {evidence.map((e, i) => (
                <li key={i} className="flex gap-3 text-[14px] text-[var(--text-secondary)] leading-relaxed">
                  <span className="mt-[8px] w-1.5 h-1.5 rounded-full bg-[var(--neon)] shrink-0" aria-hidden />{e}
                </li>
              ))}
            </ul>
          </Block>
        )}
        {areas.length > 0 && (
          <Block title="What you'll need to build">
            <ul className="flex flex-col gap-3">
              {areas.map(a => (
                <li key={a} className="flex gap-3 text-[14px] text-[var(--text-primary)] leading-relaxed">
                  <ArrowRight size={14} className={`mt-1 shrink-0 ${INK}`} aria-hidden />{a}
                </li>
              ))}
            </ul>
          </Block>
        )}
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-6">
        {[
          { label: 'Market demand', value: path.marketDemand },
          { label: 'Growth potential', value: path.growthPotential },
          { label: 'Learning investment', value: LEARNING[path.learningInvestment] },
        ].filter(r => r.value).map(r => (
          <div key={r.label}>
            <dt className="text-[12px] font-semibold text-[var(--text-muted)] mb-1.5">{r.label}</dt>
            <dd className="text-[15px] font-semibold text-[var(--text-primary)]">{r.value}</dd>
          </div>
        ))}
      </dl>

      {path.whyNotOtherPaths && (
        <Block title="Why not the other paths">
          <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed max-w-[68ch]">{path.whyNotOtherPaths}</p>
        </Block>
      )}

      <AdjustPath blueprint={blueprint} path={path} />
    </>
  )
}

// ── Section ─────────────────────────────────────────────────────────────────

export function PathSelection({ blueprint }: { blueprint: Blueprint }) {
  const { state, dispatch } = useWingspan()
  const { goTo } = useShell()
  const paths = (blueprint.futurePaths ?? []).filter(p => p && p.title)
  const [tab, setTab] = useState('compare')
  const [justChose, setJustChose] = useState(false)

  const recommended = paths.reduce<FuturePath | undefined>((best, p) =>
    !best || (score(p) ?? 0) > (score(best) ?? 0) ? p : best, undefined)?.title

  const choose = (p: FuturePath) => {
    dispatch({ type: 'SELECT_PATH', path: p.title })
    setJustChose(true)
  }

  if (paths.length === 0) {
    return (
      <SectionFrame section="path-selection" tabs={[]} activeTab="" onTabChange={() => {}}>
        <EmptyState icon={Signpost} title="No paths were generated" body="Run the analysis again. Adding more projects or interests usually helps." />
      </SectionFrame>
    )
  }

  const tabs: SectionTab[] = [
    { id: 'compare', label: 'Compare' },
    ...paths.map((p, i) => ({ id: pathTab(i), label: tabLabel(p, paths) })),
  ]
  const activeIdx = tab.startsWith('path:') ? Number(tab.slice(5)) : -1
  const activePath = paths[activeIdx]

  return (
    <SectionFrame
      section="path-selection"
      context={state.selectedPath ? <Badge tone="accent"><Check size={12} aria-hidden />Chosen: {state.selectedPath}</Badge> : <Badge tone="neutral">Choose one to continue</Badge>}
      stat={{ value: paths.length, label: 'directions to compare' }}
      tabs={tabs}
      activeTab={tab}
      onTabChange={setTab}
    >
      <AnimatePresence>
        {state.selectedPath && justChose && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-[14px] border border-[var(--neon-border)] bg-[var(--neon-surface)] p-5 flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <p className="flex-1 text-[14px] text-[var(--text-primary)] leading-relaxed">
              <span className="font-semibold">{state.selectedPath}</span> is your path. Gap Analysis, Roadmap and Resources now follow it.
            </p>
            <PrimaryButton onClick={() => goTo('gap-analysis')} className="shrink-0">
              Continue to Gap Analysis<ArrowRight size={14} aria-hidden />
            </PrimaryButton>
          </motion.div>
        )}
      </AnimatePresence>

      {activePath ? (
        <PathDetail
          blueprint={blueprint}
          path={activePath}
          selected={state.selectedPath === activePath.title}
          recommended={activePath.title === recommended}
          onChoose={() => choose(activePath)}
        />
      ) : (
        <CompareTab paths={paths} selected={state.selectedPath} recommended={recommended} onChoose={choose} onOpen={i => setTab(pathTab(i))} />
      )}
    </SectionFrame>
  )
}
