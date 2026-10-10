import type { TimelineEntry } from '@/types/wingspan'

const CURRENT = /present|current|now|ongoing|till date|to date/i

function yearOf(s: string | undefined, now: number): number | null {
  if (!s) return null
  if (CURRENT.test(s)) return now
  const m = String(s).match(/(19|20)\d{2}/)
  return m ? Number(m[0]) : null
}

export interface ExperienceFacts {
  years: number            // span from earliest start to latest end
  latestRole: string
  latestCompany: string
  seniority: 'early' | 'mid' | 'senior' | 'leader'
  leadershipSignals: boolean
}

const LEADER_TITLE = /\b(head|director|vp|vice president|chief|cdo|cxo|principal|lead|manager|founder|partner)\b/i

/** Deterministic facts about the career, so the AI doesn't have to guess seniority. */
export function experienceFacts(timeline: TimelineEntry[] = [], now = new Date().getFullYear(), fallbackStartYear?: number): ExperienceFacts {
  const rows = timeline
    .map((t) => ({ t, start: yearOf(t.startDate, now), end: yearOf(t.endDate, now) ?? yearOf(t.startDate, now) }))
    .filter((r) => r.start !== null) as { t: TimelineEntry; start: number; end: number }[]
  const earliest = rows.length ? Math.min(...rows.map((r) => r.start)) : now
  const latestEnd = rows.length ? Math.max(...rows.map((r) => r.end)) : now
  const latest = [...rows].sort((a, b) => b.end - a.end || b.start - a.start)[0]?.t ?? timeline[0]
  let years = Math.max(0, latestEnd - earliest)
  if (years === 0 && !rows.length && fallbackStartYear && fallbackStartYear <= now) years = Math.max(0, now - fallbackStartYear)
  const leadershipSignals = timeline.some((t) => LEADER_TITLE.test(t.role ?? ''))
  const seniority = years >= 12 || (years >= 8 && leadershipSignals) ? 'leader'
    : years >= 7 ? 'senior'
    : years >= 3 ? 'mid'
    : 'early'
  return { years, latestRole: latest?.role ?? '', latestCompany: latest?.company ?? '', seniority, leadershipSignals }
}

/** Shared rules that keep recommended directions grounded in who the person actually is. */
export function groundingRules(f: ExperienceFacts, interests: string[]): string {
  return `GROUND TRUTH (computed from the timeline — do not contradict):
- Years of professional experience: ${f.years}
- Most recent role: ${f.latestRole || 'unknown'}${f.latestCompany ? ` at ${f.latestCompany}` : ''}
- Seniority band: ${f.seniority}${f.leadershipSignals ? ' (has held lead/manager/director-level titles)' : ''}

DIRECTION RULES:
1. Every recommended path title must be a real, recognisable job title that companies hire for today (e.g. "VP of Design", "Head of Product Design", "Design Director, AI Products"). Never invent jargon titles.
2. Paths must be at or above the current seniority band. For a "${f.seniority}" profile, never recommend junior or individual-contributor-only roles unless the evidence shows a deliberate move to a principal IC track.
3. Stay anchored in the person's core discipline (from their roles and projects). Interests (${interests.join(', ') || 'none given'}) shape the flavour and domain of a path; they never replace the discipline. A design leader interested in AI becomes a design leader for AI products, not an AI engineer or systems architect.
4. The safe bet is the most natural next step from "${f.latestRole || 'the current role'}". The growth bet is an adjacent step up. The bold bet may be emerging, but must still be credible for someone with exactly this history.`
}

/** Facts for a whole profile: when roles carry no dates, fall back to the earliest graduation year. */
export function factsOf(data: { timeline?: TimelineEntry[]; education?: { year?: string }[] } | null | undefined): ExperienceFacts {
  const years = (data?.education ?? []).map((e) => Number(String(e.year ?? '').match(/(19|20)\d{2}/)?.[0])).filter((y) => y > 1950)
  return experienceFacts(data?.timeline ?? [], new Date().getFullYear(), years.length ? Math.max(...years) : undefined)
}
