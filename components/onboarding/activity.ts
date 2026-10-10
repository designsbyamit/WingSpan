// Pure helpers that turn state.activity (a flat event log) into one row per agent for the drawer
// and the status line. Everything is pure except the small useNow clock hook at the end.
import { useEffect, useState } from 'react'
import type { ActivityEvent } from '@/types/wingspan'

export const AGENT_NAMES: Record<string, string> = {
  extract: 'Resume reader',
  aggregator: 'Evidence Aggregator',
  careerDna: 'Career DNA',
  market: 'Market Intelligence',
  directions: 'Direction Generator',
  growth: 'Growth Planner',
  orchestrator: 'Orchestrator',
  blueprint: 'Blueprint writer',
  system: 'Analysis',
  fallback: 'Fallback route',
}

export const AGENT_ROLES: Record<string, string> = {
  extract: 'Reads roles, projects, skills and education from your resume',
  aggregator: 'Separates what your history proves from what it suggests',
  careerDna: 'Works out who you are professionally, from your past only',
  market: 'Looks at where demand and capability needs are moving',
  directions: 'Proposes distinct directions and scores each one',
  growth: 'Weighs the options, then plans the capabilities and steps for each direction',
  orchestrator: 'Weighs the agents and forms the recommendation',
  blueprint: 'Writes your Blueprint from the recommendation',
  system: 'Coordinates the analysis',
}

export function agentName(source: string): string {
  if (AGENT_NAMES[source]) return AGENT_NAMES[source]
  const words = source.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export type RowStatus = 'running' | 'done' | 'error' | 'stopped' | 'info'

export interface AgentRow {
  source: string
  name: string
  status: RowStatus
  events: ActivityEvent[]
  startedAt: number
  updatedAt: number
}

/** User-facing order of the steps. The Orchestrator is an internal coordinator: it is shown as part of the Growth Planner. */
const STEP_ORDER = ['extract', 'system', 'aggregator', 'careerDna', 'market', 'directions', 'growth', 'blueprint']
const rank = (source: string) => { const i = STEP_ORDER.indexOf(source); return i === -1 ? STEP_ORDER.length : i }
const userSource = (source: string) => (source === 'orchestrator' ? 'growth' : source)

/** Remove repeats: identical labels, and "in progress" lines once a step has finished. */
function tidy(events: ActivityEvent[], finished: boolean): ActivityEvent[] {
  const out: ActivityEvent[] = []
  for (const e of events) {
    if (finished && e.status === 'start') continue
    const prev = out.find((x) => x.label === e.label && x.status === e.status)
    if (prev) continue
    out.push(e)
  }
  // While running only the latest in-progress line is useful.
  if (!finished) {
    const starts = out.filter((e) => e.status === 'start')
    return out.filter((e) => e.status !== 'start' || e === starts[starts.length - 1])
  }
  return out
}

/** Group events into one row per user-facing step (in a logical order) and derive each step's status. */
export function agentRows(activity: ActivityEvent[], pipelineStopped: boolean): AgentRow[] {
  const bySource = new Map<string, ActivityEvent[]>()
  for (const e of activity) {
    const src = userSource(e.source)
    const ev = e.source === 'orchestrator' && e.status === 'done' ? { ...e, label: 'Weighed the options and formed the recommendation' } : e
    const list = bySource.get(src)
    if (list) list.push(ev)
    else bySource.set(src, [ev])
  }
  const rows = [...bySource.entries()].map(([source, raw]) => {
    const events = raw.slice().sort((a, b) => a.at - b.at)
    const orchestratorOnly = source === 'growth' && activity.some((e) => e.source === 'orchestrator') && !activity.some((e) => e.source === 'growth')
    const lastState = [...events].reverse().find((e) => e.status !== 'info')
    let status: RowStatus =
      !lastState ? 'info'
      : lastState.status === 'error' ? 'error'
      : lastState.status === 'done' ? 'done'
      : 'running'
    // The Growth Planner is only finished when it has reported itself, not just the coordinator.
    if (orchestratorOnly && status === 'done') status = 'running'
    if (status === 'running' && pipelineStopped) status = 'stopped'
    if (source === 'system' && events.some((e) => e.status === 'error')) status = 'error'
    const shown = tidy(events, status === 'done')
    return { source, name: agentName(source), status, events: shown, startedAt: events[0].at, updatedAt: events[events.length - 1].at }
  })
  return rows.sort((a, b) => rank(a.source) - rank(b.source) || a.startedAt - b.startedAt)
}

/** The label to show in the one-line status: what is happening right now. */
export function currentActivityLabel(activity: ActivityEvent[]): string | null {
  for (let i = activity.length - 1; i >= 0; i--) {
    const e = activity[i]
    if (e.status === 'start' || e.status === 'info') return e.label
  }
  return activity.length ? activity[activity.length - 1].label : null
}

export function relativeTime(at: number, now: number): string {
  const s = Math.max(0, Math.round((now - at) / 1000))
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Current time, refreshed on an interval while `active` is true. */
export function useNow(active = true, intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [active, intervalMs])
  return now
}
