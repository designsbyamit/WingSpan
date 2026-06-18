'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, ChevronDown, BookOpen, Link2, Code2, Users, Pen, ArrowRight, CheckCircle2, Circle, Clock } from 'lucide-react'
import { Blueprint, Action, Resource, ActionType } from '@/types/wingspan'

type ProgressState = 'not-started' | 'in-progress' | 'done'

const STORAGE_KEY = 'wingspan-action-progress'

function loadProgress(): Record<string, ProgressState> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') } catch { return {} }
}

function saveProgress(p: Record<string, ProgressState>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}

function actionIcon(type: ActionType) {
  switch (type) {
    case 'publish':   return <Pen size={14} />
    case 'book':      return <BookOpen size={14} />
    case 'course':    return <BookOpen size={14} />
    case 'link':      return <Link2 size={14} />
    case 'project':   return <Code2 size={14} />
    case 'connect':   return <Users size={14} />
    case 'community': return <Users size={14} />
    default:          return <ArrowRight size={14} />
  }
}

function ProgressPill({ state, onChange }: { state: ProgressState; onChange: (s: ProgressState) => void }) {
  const next: Record<ProgressState, ProgressState> = {
    'not-started': 'in-progress',
    'in-progress': 'done',
    'done': 'not-started',
  }
  const cfg = {
    'not-started': { label: 'Not started', icon: <Circle size={11} />, cls: 'text-[var(--text-dim)] border-[var(--border-ws)] bg-transparent' },
    'in-progress': { label: 'In progress', icon: <Clock size={11} />, cls: 'text-yellow-400 border-yellow-800/50 bg-yellow-950/30' },
    'done':        { label: 'Done', icon: <CheckCircle2 size={11} />, cls: 'text-[var(--neon)] border-[var(--neon-border)] bg-[var(--neon-surface)]' },
  }
  const { label, icon, cls } = cfg[state]
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(next[state]) }}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold transition-all ${cls}`}
    >
      {icon}{label}
    </button>
  )
}

function ActionCard({ action, progress, onProgress }: {
  action: Action
  progress: ProgressState
  onProgress: (s: ProgressState) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const priorityCls = action.priority === 'high'
    ? 'text-[var(--neon)] bg-[var(--neon-surface)] border-[var(--neon-border)]'
    : action.priority === 'medium'
    ? 'text-yellow-400 bg-yellow-950/20 border-yellow-800/40'
    : 'text-[var(--text-muted)] bg-transparent border-[var(--border-ws)]'

  return (
    <motion.div
      layout
      className={`rounded-[12px] border transition-all overflow-hidden ${
        progress === 'done'
          ? 'bg-[#111] border-[var(--border-ws)] opacity-60'
          : 'bg-[var(--surface)] border-[var(--border-ws)]'
      }`}
    >
      {/* Header row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-start gap-3"
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-[8px] bg-[var(--neon-surface)] border border-[var(--neon-border)] flex items-center justify-center text-[var(--neon)] mt-0.5">
          {actionIcon(action.actionType)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className={`text-sm font-semibold leading-snug ${progress === 'done' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
              {action.title}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${priorityCls}`}>
                {action.priority}
              </span>
              <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={14} className="text-[var(--text-muted)]" />
              </motion.div>
            </div>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{action.description}</p>
          {action.timeEstimate && (
            <span className="text-[10px] text-[var(--text-muted)] mt-1 flex items-center gap-1">
              <Clock size={9} />{action.timeEstimate}
            </span>
          )}
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-4 border-t border-[var(--border-ws)] pt-4">
              <div>
                <p className="text-[10px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-2">How to start</p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[#1a1a1a] rounded-[8px] p-3 border border-[var(--border-ws)]">
                  {action.howToStart}
                </p>
              </div>
              {action.whereToStart && (
                <div>
                  <p className="text-[10px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">Where</p>
                  <p className="text-xs text-[var(--text-secondary)]">{action.whereToStart}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">You'll know it worked when</p>
                <p className="text-xs text-[var(--neon)] opacity-80">{action.measurable}</p>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-3">
                {action.link && (
                  <a
                    href={action.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[var(--neon)] text-[#0a0a0a] text-xs font-bold hover:opacity-90 transition-opacity"
                    style={{ boxShadow: '0 0 14px var(--neon-glow)' }}
                  >
                    {action.linkLabel ?? 'Open link'}
                    <ExternalLink size={11} />
                  </a>
                )}
                <ProgressPill state={progress} onChange={onProgress} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed progress pill */}
      {!expanded && (
        <div className="px-4 pb-3 flex justify-end">
          <ProgressPill state={progress} onChange={onProgress} />
        </div>
      )}
    </motion.div>
  )
}

function ResourceCard({ resource }: { resource: Resource }) {
  const [expanded, setExpanded] = useState(false)
  const icon = resource.type === 'book' || resource.type === 'course'
    ? <BookOpen size={13} />
    : resource.type === 'community'
    ? <Users size={13} />
    : <Link2 size={13} />

  return (
    <motion.div layout className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left p-3 flex items-center gap-3">
        <div className="flex-shrink-0 w-6 h-6 rounded-[6px] bg-[#222] border border-[var(--border-ws)] flex items-center justify-center text-[var(--text-muted)]">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-[var(--text-muted)] capitalize">{resource.type}</span>
          <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight">{resource.title}</p>
        </div>
        <div className="flex items-center gap-2">
          {resource.url && (
            <a href={resource.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[var(--neon)] hover:opacity-80 transition-opacity">
              <ExternalLink size={13} />
            </a>
          )}
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={13} className="text-[var(--text-muted)]" />
          </motion.div>
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[var(--border-ws)]"
          >
            <div className="p-3 flex flex-col gap-2">
              {resource.whereToStart && (
                <div>
                  <p className="text-[10px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">Where to start</p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{resource.whereToStart}</p>
                </div>
              )}
              {resource.firstStep && (
                <div>
                  <p className="text-[10px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">First step</p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{resource.firstStep}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function ActionsSection({ blueprint }: { blueprint: Blueprint }) {
  const { actions } = blueprint
  const [progress, setProgress] = useState<Record<string, ProgressState>>({})

  useEffect(() => { setProgress(loadProgress()) }, [])

  const setActionProgress = (title: string, state: ProgressState) => {
    const next = { ...progress, [title]: state }
    setProgress(next)
    saveProgress(next)
  }

  const allActions = [
    ...actions.immediate,
    ...actions.mediumTerm,
    ...actions.longTerm,
  ]
  const doneCount = allActions.filter(a => progress[a.title] === 'done').length
  const inProgressCount = allActions.filter(a => progress[a.title] === 'in-progress').length

  return (
    <div className="flex flex-col gap-8">

      {/* Progress summary bar */}
      {(doneCount > 0 || inProgressCount > 0) && (
        <div className="rounded-[12px] bg-[#111] border border-[var(--border-ws)] p-4 flex items-center gap-6">
          <div className="text-center">
            <div className="text-xl font-bold text-[var(--neon)]" style={{ textShadow: '0 0 8px var(--neon-glow)' }}>{doneCount}</div>
            <div className="text-[10px] text-[var(--text-muted)]">completed</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-400">{inProgressCount}</div>
            <div className="text-[10px] text-[var(--text-muted)]">in progress</div>
          </div>
          <div className="flex-1">
            <div className="h-[2px] rounded-full bg-[var(--border-ws)]">
              <div
                className="h-full rounded-full bg-[var(--neon)] transition-all duration-700"
                style={{ width: `${Math.round((doneCount / allActions.length) * 100)}%`, boxShadow: '0 0 6px var(--neon-glow)' }}
              />
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">{Math.round((doneCount / allActions.length) * 100)}% complete</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">Immediate Actions</h3>
          <span className="text-[10px] text-[var(--text-dim)]">Start this week</span>
        </div>
        {actions.immediate.map((action) => (
          <ActionCard key={action.title} action={action} progress={progress[action.title] ?? 'not-started'} onProgress={(s) => setActionProgress(action.title, s)} />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">Medium-Term</h3>
          <span className="text-[10px] text-[var(--text-dim)]">Next 3–6 months</span>
        </div>
        {actions.mediumTerm.map((action) => (
          <ActionCard key={action.title} action={action} progress={progress[action.title] ?? 'not-started'} onProgress={(s) => setActionProgress(action.title, s)} />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">Long-Term</h3>
          <span className="text-[10px] text-[var(--text-dim)]">6–18 months</span>
        </div>
        {actions.longTerm.map((action) => (
          <ActionCard key={action.title} action={action} progress={progress[action.title] ?? 'not-started'} onProgress={(s) => setActionProgress(action.title, s)} />
        ))}
      </div>

      {actions.resources.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">Resources</h3>
          {actions.resources.map((resource) => (
            <ResourceCard key={resource.title} resource={resource} />
          ))}
        </div>
      )}
    </div>
  )
}
