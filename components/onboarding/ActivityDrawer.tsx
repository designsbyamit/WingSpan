'use client'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AlertCircle, Check, Loader2, Minus, X } from 'lucide-react'
import { useWingspan } from '@/context/WingspanContext'
import { AGENT_ROLES, agentRows, currentActivityLabel, formatElapsed, relativeTime, useNow, type AgentRow, type RowStatus } from './activity'
import { cx, focusRing } from './ui'

const DESKTOP_QUERY = '(min-width: 768px)'
const subscribeDesktop = (cb: () => void) => {
  const mq = window.matchMedia(DESKTOP_QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribeDesktop, () => window.matchMedia(DESKTOP_QUERY).matches, () => false)
}

const STATUS_TEXT: Record<RowStatus, string> = {
  running: 'Working',
  done: 'Done',
  error: 'Failed',
  stopped: 'Stopped',
  info: 'Update',
}

function StatusIcon({ status }: { status: RowStatus }) {
  const base = 'relative z-[1] flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border'
  const plain = 'bg-[var(--surface)]'
  switch (status) {
    case 'running':
      return <span className={cx(base, plain, 'border-[var(--neon-border)]')}><Loader2 size={13} className="animate-spin text-[var(--neon)] motion-reduce:animate-none" /></span>
    case 'done':
      return <span className={cx(base, 'border-[var(--neon)] bg-[var(--neon)]')}><Check size={13} strokeWidth={3} className="text-[#0a0a0a]" /></span>
    case 'error':
      return <span className={cx(base, plain, 'border-red-400/40')}><AlertCircle size={13} className="text-red-300" /></span>
    case 'stopped':
      return <span className={cx(base, plain, 'border-[var(--border-ws)]')}><Minus size={13} className="text-[var(--text-muted)]" /></span>
    default:
      return <span className={cx(base, plain, 'border-[var(--border-ws)]')}><span className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]" /></span>
  }
}

function AgentRowItem({ row, now, last }: { row: AgentRow; now: number; last: boolean }) {
  const role = AGENT_ROLES[row.source]
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.2, 0, 0, 1] }}
      className="relative flex gap-3 pb-6"
    >
      {!last && <span className="absolute bottom-0 left-[11.5px] top-7 w-px bg-[var(--border-ws)]" aria-hidden />}
      <StatusIcon status={row.status} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {row.name}
            <span className="sr-only">: {STATUS_TEXT[row.status]}</span>
          </p>
          <time className="flex-shrink-0 text-xs tabular-nums text-[var(--text-muted)]" dateTime={new Date(row.updatedAt).toISOString()}>
            {relativeTime(row.updatedAt, now)}
          </time>
        </div>
        {role && <p className="mt-0.5 text-xs text-[var(--text-dim)]">{role}</p>}
        <ul className="mt-2 flex flex-col gap-1.5">
          <AnimatePresence initial={false}>
            {row.events.map((e, i) => {
              const latest = i === row.events.length - 1
              return (
                <motion.li
                  key={e.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <p className={cx('text-[13px] leading-snug', latest ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]',
                    e.status === 'error' && 'text-red-300')}>
                    {e.label}
                  </p>
                  {e.detail && (
                    <p className="mt-0.5 line-clamp-3 text-xs leading-relaxed text-[var(--text-muted)]" title={e.detail}>{e.detail}</p>
                  )}
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      </div>
    </motion.li>
  )
}

interface ActivityDrawerProps {
  open: boolean
  onClose: () => void
}

/** Live activity stream: right-side panel on desktop, bottom sheet on phones. Stays live while open. */
export function ActivityDrawer({ open, onClose }: ActivityDrawerProps) {
  const { state } = useWingspan()
  const reduce = useReducedMotion()
  const isDesktop = useIsDesktop()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  const stopped = !!state.error && !state.blueprintLoading && !state.blueprintReady
  const rows = agentRows(state.activity, stopped)
  const running = !stopped && !state.blueprintReady
  const now = useNow(true)
  const startedAt = state.activity[0]?.at
  const agents = rows.filter((r) => r.source !== 'system')
  const doneCount = agents.filter((r) => r.status === 'done').length
  const latest = currentActivityLabel(state.activity)

  // Focus management: into the panel on open, back to the opener on close.
  useEffect(() => {
    if (!open) return
    returnFocus.current = document.activeElement as HTMLElement | null
    const id = requestAnimationFrame(() => closeRef.current?.focus())
    return () => {
      cancelAnimationFrame(id)
      returnFocus.current?.focus?.()
    }
  }, [open])

  // Escape closes; Tab stays inside the panel while it is open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusables = panelRef.current.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])')
      if (!focusables.length) return
      const first = focusables[0]
      const lastEl = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus() }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const hidden = reduce ? { opacity: 0 } : isDesktop ? { x: '100%' } : { y: '100%' }
  const shown = reduce ? { opacity: 1 } : isDesktop ? { x: 0 } : { y: 0 }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            className="fixed inset-0 z-[60] bg-black/45"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            key="panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ws-activity-title"
            initial={hidden}
            animate={shown}
            exit={hidden}
            transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
            className={cx(
              'fixed z-[61] flex flex-col bg-[var(--surface)] shadow-[0_0_60px_rgba(0,0,0,0.5)]',
              'inset-x-0 bottom-0 max-h-[85vh] rounded-t-[18px] border-t border-[var(--border-ws)]',
              'md:inset-x-auto md:bottom-0 md:right-0 md:top-0 md:h-full md:max-h-none md:w-[420px] md:rounded-none md:border-l md:border-t-0',
            )}
          >
            <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-[var(--border-ws)] md:hidden" aria-hidden />
            <header className="flex items-start justify-between gap-4 border-b border-[var(--border-ws)] px-5 pb-4 pt-4 md:pt-6">
              <div className="min-w-0">
                <h2 id="ws-activity-title" className="text-base font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>
                  Analysis activity
                </h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {agents.length > 0 ? `${doneCount} of ${agents.length} steps done` : 'Waiting for the first step'}
                  {startedAt && <span className="tabular-nums"> · {formatElapsed((state.blueprintReady ? (state.activity[state.activity.length - 1]?.at ?? now) : now) - startedAt)}</span>}
                </p>
                <p className="sr-only" aria-live="polite">{running && latest ? latest : state.blueprintReady ? 'Your Blueprint is ready' : stopped ? 'The analysis stopped' : ''}</p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close activity"
                className={cx('-mr-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] text-[var(--text-muted)] hover:bg-[var(--surface-dim)] hover:text-[var(--text-primary)]', focusRing)}
              >
                <X size={16} aria-hidden />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pt-5" tabIndex={-1}>
              {rows.length === 0 ? (
                <p className="pb-6 text-sm text-[var(--text-muted)]">Nothing has started yet.</p>
              ) : (
                <ol aria-label="Steps">
                  <AnimatePresence initial={false}>
                    {rows.map((row, i) => (
                      <AgentRowItem key={row.source} row={row} now={now} last={i === rows.length - 1} />
                    ))}
                  </AnimatePresence>
                </ol>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
