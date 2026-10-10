'use client'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink, ChevronDown, BookOpen, Link2, Code2, Users, Pen, ArrowRight, CheckCircle2, Circle, Clock, type LucideIcon } from 'lucide-react'
import { Action, ActionType } from '@/types/wingspan'
import { Badge, Bar, Card, EmptyState, FieldLabel, FOCUS_RING, INK } from './shell/ui'

type ProgressState = 'not-started' | 'in-progress' | 'done'

const STORAGE_KEY = 'wingspan-action-progress'

function loadProgress(): Record<string, ProgressState> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') } catch { return {} }
}

function saveProgress(p: Record<string, ProgressState>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)) } catch { /* storage unavailable */ }
}

const ACTION_ICON: Partial<Record<ActionType, LucideIcon>> = {
  publish: Pen, book: BookOpen, course: BookOpen, link: Link2, project: Code2, connect: Users, community: Users,
}

const PROGRESS: Record<ProgressState, { label: string; icon: typeof Circle; cls: string; next: ProgressState }> = {
  'not-started': { label: 'Not started', icon: Circle,       cls: 'text-[var(--text-muted)] border-[var(--border-ws)]', next: 'in-progress' },
  'in-progress': { label: 'In progress', icon: Clock,        cls: 'text-amber-500 border-amber-500/40 bg-amber-500/10', next: 'done' },
  'done':        { label: 'Done',        icon: CheckCircle2, cls: `${INK} border-[var(--neon-border)] bg-[var(--neon-surface)]`, next: 'not-started' },
}

function ProgressButton({ state, onChange, title }: { state: ProgressState; onChange: (s: ProgressState) => void; title: string }) {
  const cfg = PROGRESS[state]
  const Icon = cfg.icon
  return (
    <button
      type="button"
      onClick={() => onChange(cfg.next)}
      aria-label={`${title}: ${cfg.label}. Mark as ${PROGRESS[cfg.next].label.toLowerCase()}`}
      className={`shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-[12px] font-semibold transition-colors ${FOCUS_RING} ${cfg.cls}`}
    >
      <Icon size={13} aria-hidden />{cfg.label}
    </button>
  )
}

const PRIORITY_TONE = { high: 'accent', medium: 'warn', low: 'neutral' } as const

function ActionCard({ action, progress, onProgress }: {
  action: Action
  progress: ProgressState
  onProgress: (s: ProgressState) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const Icon = ACTION_ICON[action.actionType] ?? ArrowRight
  const done = progress === 'done'
  const hasDetail = !!(action.howToStart || action.whereToStart || action.measurable || action.link)

  return (
    <Card as="li" className={`overflow-hidden ${done ? 'opacity-70' : ''}`}>
      <div className="p-5 flex items-start gap-4">
        <span className={`shrink-0 w-9 h-9 rounded-[10px] bg-[var(--surface-dim)] flex items-center justify-center ${INK}`}>
          <Icon size={16} aria-hidden />
        </span>
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <p className={`text-[15px] font-semibold leading-snug ${done ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>{action.title}</p>
          {action.description && <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">{action.description}</p>}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {action.priority && <Badge tone={PRIORITY_TONE[action.priority] ?? 'neutral'}>{action.priority[0].toUpperCase() + action.priority.slice(1)} priority</Badge>}
            {action.timeEstimate && (
              <span className="inline-flex items-center gap-1 text-[12px] text-[var(--text-muted)]"><Clock size={12} aria-hidden />{action.timeEstimate}</span>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 pb-4 flex items-center justify-between gap-3">
        {hasDetail ? (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded(e => !e)}
            className={`inline-flex items-center gap-1.5 h-8 rounded-[8px] text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] ${FOCUS_RING}`}
          >
            {expanded ? 'Hide steps' : 'How to start'}
            <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden />
          </button>
        ) : <span />}
        <ProgressButton state={progress} onChange={onProgress} title={action.title} />
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mx-5 mb-5 pt-4 border-t border-[var(--border-ws)] flex flex-col gap-4">
              {action.howToStart && (
                <div>
                  <FieldLabel>Where to begin</FieldLabel>
                  <p className="text-[14px] text-[var(--text-primary)] leading-relaxed">{action.howToStart}</p>
                </div>
              )}
              {action.whereToStart && (
                <div>
                  <FieldLabel>Where</FieldLabel>
                  <p className="text-[14px] text-[var(--text-secondary)]">{action.whereToStart}</p>
                </div>
              )}
              {action.measurable && (
                <div>
                  <FieldLabel>You’ll know it worked when</FieldLabel>
                  <p className={`text-[14px] ${INK}`}>{action.measurable}</p>
                </div>
              )}
              {action.link && (
                <a
                  href={action.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`self-start inline-flex items-center gap-2 h-9 px-4 rounded-[10px] bg-[var(--neon)] text-[#0a0a0a] text-[13px] font-bold hover:opacity-90 ${FOCUS_RING}`}
                >
                  {action.linkLabel ?? 'Open link'}
                  <ExternalLink size={13} aria-hidden />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

const GROUPS = [
  { key: 'immediate',  title: 'Now',   description: 'Start here.' },
  { key: 'mediumTerm', title: 'Next',  description: 'Build toward these once the first steps are moving.' },
  { key: 'longTerm',   title: 'Later', description: 'The long game.' },
] as const

/** Now / Next / Later action lists with progress tracking (stored on this device). */
export function ActionsSection({ actions }: { actions: { immediate: Action[]; mediumTerm: Action[]; longTerm: Action[] } }) {
  const [progress, setProgress] = useState<Record<string, ProgressState>>(loadProgress)

  const setActionProgress = (title: string, state: ProgressState) => {
    const next = { ...progress, [title]: state }
    setProgress(next)
    saveProgress(next)
  }

  const all = [...actions.immediate, ...actions.mediumTerm, ...actions.longTerm]
  if (all.length === 0) {
    return <EmptyState title="No actions for this path yet" body="Run the analysis again to generate concrete next steps." />
  }
  const doneCount = all.filter(a => progress[a.title] === 'done').length
  const inProgressCount = all.filter(a => progress[a.title] === 'in-progress').length
  const pct = Math.round((doneCount / all.length) * 100)

  return (
    <>
      <Card tone="quiet" className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
        <p className="text-[14px] text-[var(--text-secondary)]">
          <span className="text-[var(--text-primary)] font-semibold tabular-nums">{doneCount} of {all.length}</span> done
          {inProgressCount > 0 && <>, <span className="tabular-nums">{inProgressCount}</span> in progress</>}
        </p>
        <div className="flex-1"><Bar value={pct} label={`${pct} percent of actions done`} /></div>
      </Card>

      {GROUPS.map(g => {
        const list = actions[g.key]
        if (list.length === 0) return null
        return (
          <section key={g.key} className="flex flex-col gap-4" aria-labelledby={`actions-${g.key}`}>
            <div className="flex items-baseline gap-3">
              <h3 id={`actions-${g.key}`} className="text-[18px] font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>{g.title}</h3>
              <span className="text-[13px] text-[var(--text-muted)]">{list.length} {list.length === 1 ? 'action' : 'actions'}. {g.description}</span>
            </div>
            <ul className="flex flex-col gap-3">
              {list.map((action, i) => (
                <ActionCard
                  key={`${action.title}-${i}`}
                  action={action}
                  progress={progress[action.title] ?? 'not-started'}
                  onProgress={(s) => setActionProgress(action.title, s)}
                />
              ))}
            </ul>
          </section>
        )
      })}
    </>
  )
}
