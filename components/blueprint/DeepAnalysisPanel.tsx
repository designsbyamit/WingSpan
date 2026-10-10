'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, X } from 'lucide-react'
import type { DeepAnalysis } from '@/types/career-intelligence'

type Tab = 'overall' | 'agents' | 'directions' | 'market' | 'evidence'
const TABS: { id: Tab; label: string }[] = [
  { id: 'overall', label: 'Recommendation' },
  { id: 'agents', label: 'Agents' },
  { id: 'directions', label: 'Directions' },
  { id: 'market', label: 'Market' },
  { id: 'evidence', label: 'Evidence' },
]
const ARCH_COLOR: Record<string, string> = { safe: '#5eead4', growth: '#B6FF2E', bold: '#fb923c', reserve: 'rgba(255,255,255,0.35)' }

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1.5">{children}</p>
)
const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-4">{children}</div>
)
const List = ({ items }: { items: string[] }) => (
  <ul className="flex flex-col gap-1.5">
    {items.filter(Boolean).map((t, i) => (
      <li key={i} className="text-xs text-[var(--text-secondary)] leading-relaxed pl-3 relative">
        <span className="absolute left-0 top-[7px] w-1 h-1 rounded-full bg-[var(--text-muted)]" />{t}
      </li>
    ))}
  </ul>
)
const Bar = ({ value, color = 'var(--neon)' }: { value: number; color?: string }) => (
  <div className="h-1 rounded-full bg-white/10 overflow-hidden">
    <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} />
  </div>
)

function Overall({ d }: { d: DeepAnalysis }) {
  const o = d.orchestration
  const picks = d.candidates.filter((c) => c.archetype !== 'reserve')
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <Label>The orchestrator’s view</Label>
        <p className="text-sm text-[var(--text-primary)] leading-relaxed">{d.agents.find((a) => a.id === 'orchestrator')?.insights[0]}</p>
      </Card>
      <Card>
        <Label>How the weighting works</Label>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">{o.narrative}</p>
        <div className="flex gap-2 mb-3">
          {o.weights.map((w) => (
            <div key={w.label} className="flex-1 rounded-[8px] border border-[var(--border-ws)] px-3 py-2 text-center">
              <p className="text-base font-bold text-[var(--neon)]" style={{ fontFamily: 'var(--font-sora)' }}>{w.value}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{w.label}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{o.confidenceRule}</p>
      </Card>
      <Card>
        <Label>The three picks, with the arithmetic</Label>
        <div className="flex flex-col gap-3">
          {picks.map((c) => (
            <div key={c.direction}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  <span className="text-[10px] uppercase tracking-[1.5px] mr-2" style={{ color: ARCH_COLOR[c.archetype] }}>{c.archetype}</span>{c.direction}
                </p>
                <p className="text-sm font-bold" style={{ color: ARCH_COLOR[c.archetype] }}>{c.score}</p>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 break-words">{c.calc}</p>
            </div>
          ))}
        </div>
      </Card>
      {o.whyThisOrder && <Card><Label>Why these three</Label><p className="text-xs text-[var(--text-secondary)] leading-relaxed">{o.whyThisOrder}</p></Card>}
      {o.tradeoffs.length > 0 && <Card><Label>Trade-offs</Label><List items={o.tradeoffs} /></Card>}
      <Card>
        <Label>How the picks are chosen</Label>
        <List items={[...o.selectionRules, ...o.notes]} />
      </Card>
      {o.caveats.length > 0 && <Card><Label>Limits of this analysis</Label><List items={o.caveats} /></Card>}
    </div>
  )
}

function Agents({ d }: { d: DeepAnalysis }) {
  return (
    <div className="flex flex-col gap-3">
      {d.agents.map((a) => (
        <Card key={a.id}>
          <div className="flex items-start justify-between gap-3 mb-1">
            <p className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>{a.name}</p>
            <p className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">
              {a.confidence !== null && <>confidence {a.confidence}%</>}
              {a.durationMs !== null && <> · {Math.max(1, Math.round(a.durationMs / 1000))}s</>}
            </p>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mb-2">{a.role}</p>
          <List items={a.insights} />
        </Card>
      ))}
    </div>
  )
}

function Directions({ d }: { d: DeepAnalysis }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
        Every direction the agents considered, with its Experience, Market and Interest scores. Distance is how far the work is from what you do today (0 = same work).
      </p>
      {d.candidates.map((c) => (
        <Card key={c.direction}>
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{c.direction}</p>
            <p className="text-sm font-bold" style={{ color: ARCH_COLOR[c.archetype] }}>{c.score}</p>
          </div>
          {(['experience', 'market', 'interest'] as const).map((k) => (
            <div key={k} className="mb-1.5">
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-0.5"><span className="capitalize">{k}</span><span>{c[k]}</span></div>
              <Bar value={c[k]} color={ARCH_COLOR[c.archetype]} />
            </div>
          ))}
          <p className="text-[10px] text-[var(--text-muted)] mt-2">
            {c.archetype === 'reserve' ? 'Considered, not selected' : `Selected as ${c.archetype}`} · distance {c.distance} · evidence confidence {Math.round(c.confidence * 100)}%
          </p>
        </Card>
      ))}
    </div>
  )
}

function Market({ d }: { d: DeepAnalysis }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{d.market.basis}</p>
      {d.market.directions.map((m) => (
        <Card key={m.name}>
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">{m.name}</p>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {([['Demand', m.demand], ['Momentum', m.momentum], ['Future', m.future], ['Resilience', m.resilience]] as const).map(([l, v]) => (
              <div key={l}><p className="text-[10px] text-[var(--text-muted)] mb-0.5">{l} {v}</p><Bar value={v} /></div>
            ))}
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{m.thesis}</p>
        </Card>
      ))}
    </div>
  )
}

function Evidence({ d }: { d: DeepAnalysis }) {
  const e = d.evidence
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <Label>{e.count} pieces of evidence — strongest capabilities</Label>
        <div className="flex flex-col gap-2">
          {e.capabilities.map((c) => (
            <div key={c.name}>
              <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-0.5"><span>{c.name}</span><span>{c.level}</span></div>
              <Bar value={c.level} />
            </div>
          ))}
        </div>
      </Card>
      {e.patterns.length > 0 && <Card><Label>Recurring patterns</Label><List items={e.patterns} /></Card>}
      {e.uncertainties.length > 0 && <Card><Label>What is still uncertain</Label><List items={e.uncertainties} /></Card>}
      {e.contradictions.length > 0 && <Card><Label>Contradictions noticed</Label><List items={e.contradictions} /></Card>}
    </div>
  )
}

export function DeepAnalysisButton({ analysis }: { analysis?: DeepAnalysis | null }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('overall')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open])

  if (!analysis || !Array.isArray(analysis.agents)) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open deep analysis"
        title="Deep analysis"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border-ws)] text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--neon)] hover:border-[var(--neon)] transition-colors"
      >
        <Eye size={13} /> Deep analysis
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog" aria-modal="true" aria-label="Deep analysis"
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-2xl max-h-[92vh] flex flex-col rounded-t-[20px] sm:rounded-[20px] bg-[var(--bg,#0d0d0d)] border border-[var(--border-ws)]"
              style={{ background: 'var(--bg, #0d0d0d)' }}
            >
              <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
                <div>
                  <p className="text-[10px] font-bold tracking-[2.5px] uppercase text-[var(--neon)]">Deep analysis</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>How this recommendation was reached</p>
                </div>
                <button onClick={() => setOpen(false)} aria-label="Close" className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={16} /></button>
              </div>
              <div className="flex gap-1 px-4 pb-3 overflow-x-auto">
                {TABS.map((t) => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className="px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-colors"
                    style={tab === t.id
                      ? { background: 'var(--neon)', color: '#0a0a0a', borderColor: 'var(--neon)' }
                      : { color: 'var(--text-secondary)', borderColor: 'var(--border-ws)' }}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="overflow-y-auto px-4 pb-6">
                {tab === 'overall' && <Overall d={analysis} />}
                {tab === 'agents' && <Agents d={analysis} />}
                {tab === 'directions' && <Directions d={analysis} />}
                {tab === 'market' && <Market d={analysis} />}
                {tab === 'evidence' && <Evidence d={analysis} />}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
