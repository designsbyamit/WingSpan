import type { ExtractedCareerData } from '@/types/wingspan'
import type { Claim, DayTheme, Differentiator, EdgeCard, Lane, PlanDay, ResumeFact, SourceRef } from '@/lib/student/types'

// The Verifier. Plain code, not another model: it checks what the agents wrote against what we actually hold.
//  - a claim about the student must cite facts that exist on their resume;
//  - a claim about the market must cite sources that exist in our database; without one it is labelled general guidance;
//  - a figure in a claim must appear in the sources it cites, or the claim is flagged;
//  - employers named must be on our list; the 14 days always have the right themes.

export const THEMES: DayTheme[] = ['Position', 'Proof', 'Reach', 'Apply', 'Practice', 'Skill', 'Reflect']
export const themeOfDay = (day: number): DayTheme => THEMES[(day - 1) % 7]

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

export function buildResumeFacts(data: ExtractedCareerData): ResumeFact[] {
  const out: ResumeFact[] = []
  const add = (kind: ResumeFact['kind'], text: string) => { if (text.trim()) out.push({ id: `R${out.length + 1}`, kind, text: clip(text.trim().replace(/\s+/g, ' '), 400) }) }
  for (const t of data.timeline ?? []) add('role', `${t.role} at ${t.company} (${t.startDate || '?'}–${t.endDate || '?'})${t.description ? `: ${t.description}` : ''}`)
  for (const p of data.projects ?? []) add('project', `${p.name}${p.company ? ` (${p.company})` : ''}${p.year ? `, ${p.year}` : ''}${p.summary ? `: ${p.summary}` : ''}${p.impact ? ` Impact: ${p.impact}` : ''}`)
  for (const e of data.education ?? []) add('education', `${e.degree} at ${e.institution}${e.year ? `, ${e.year}` : ''}`)
  if ((data.skills ?? []).length) add('skills', `Skills listed: ${(data.skills ?? []).slice(0, 40).join(', ')}`)
  return out
}

const NUM = /\d[\d,]*(?:\.\d+)?/g
const normNum = (s: string) => s.replace(/,/g, '')

/** True when every figure in `text` (other than tiny counts and years) appears in the cited sources' text. */
export function figuresSupported(text: string, sourceTexts: string[]): boolean {
  const hay = normNum(sourceTexts.join(' '))
  for (const m of text.match(NUM) ?? []) {
    const n = normNum(m)
    if (n.length < 2 || /^(19|20)\d{2}$/.test(n)) continue // single digits and years are not data claims
    if (!hay.includes(n)) return false
  }
  return true
}

export function checkClaim(c: { text: string; sources?: string[] }, known: Map<string, SourceRef>): Claim {
  const sources = [...new Set((c.sources ?? []).filter((id) => known.has(id)))]
  if (!sources.length) return { text: c.text, sources: [], general: true }
  const supported = figuresSupported(c.text, sources.map((id) => `${known.get(id)!.statement ?? ''} ${known.get(id)!.label}`))
  return supported ? { text: c.text, sources } : { text: c.text, sources, unverifiedNumber: true }
}

export function checkEdge(raw: EdgeCard, resumeIds: Set<string>): EdgeCard {
  const keep = (ev: string[]) => [...new Set(ev.filter((id) => resumeIds.has(id)))]
  const differentiators: Differentiator[] = raw.differentiators
    .map((d) => ({ ...d, evidence: keep(d.evidence) }))
    .filter((d) => d.evidence.length > 0)
    .slice(0, 3)
  const alreadyProven = raw.alreadyProven.map((p) => ({ ...p, evidence: keep(p.evidence) })).filter((p) => p.evidence.length > 0).slice(0, 4)
  if (!differentiators.length) throw new Error('The Edge Finder could not tie any strength to something on your resume.')
  return { headline: raw.headline, differentiators, alreadyProven, honestGaps: raw.honestGaps.slice(0, 4) }
}

export function checkLanes(raw: Lane[], resumeIds: Set<string>, known: Map<string, SourceRef>, companies: Map<string, { name: string; kind: string; cities: string[]; fresherScore: number | null }>, rawWho: Map<number, string[]>): Lane[] {
  return raw.slice(0, 2).map((l, i) => ({
    ...l,
    evidence: [...new Set(l.evidence.filter((id) => resumeIds.has(id)))],
    demand: checkClaim(l.demand, known),
    whoHires: (rawWho.get(i) ?? []).map((k) => companies.get(k)).filter((c): c is NonNullable<typeof c> => !!c).slice(0, 6),
  }))
}

const DEFAULT_ACTIONS: Record<DayTheme, { action: string; why: string; guidance: string }> = {
  Position: { action: 'Rewrite the top two lines of your portfolio and LinkedIn headline around your Edge line', why: 'Hirers decide in seconds; your edge should be the first thing they read', guidance: 'Read your headline aloud. If it could describe any designer, make it specific to your edge.' },
  Proof: { action: 'Pick your strongest project and add one concrete outcome or decision to its case study', why: 'Case studies with results get more attention than process alone', guidance: 'Ask: what changed because of this work? A number, a decision, a user quote.' },
  Reach: { action: 'Find 3 designers at employers on your list and read their recent work', why: 'Knowing who hires and what they value makes outreach specific', guidance: 'Note one thing in each person’s work you could genuinely comment on. Sending is your call.' },
  Apply: { action: 'Review the openings shown in this plan and shortlist the two that fit you best', why: 'A few well-matched applications beat many generic ones', guidance: 'For each, list which of your projects best answers what the posting asks for. Amit will help with drafting.' },
  Practice: { action: 'Talk through your best project in 90 seconds, then write down where you stumbled', why: 'Explaining your work clearly is the first thing interviews test', guidance: 'Structure: the problem, your role, one decision, the result. Amit will run mock interviews with you.' },
  Skill: { action: 'Spend 20 minutes on one skill your target lane asks for and you have not shown yet', why: 'Closing one visible gap makes your proof stronger', guidance: 'Choose the gap from your Edge Card’s honest gaps.' },
  Reflect: { action: 'Write down what you finished this week and one thing you are proud of', why: 'Seeing progress keeps momentum when the market is slow', guidance: 'Small counts: a sentence rewritten, a message sent, a project updated.' },
}

export function checkDays(raw: Array<Partial<PlanDay>>): PlanDay[] {
  const byDay = new Map<number, Partial<PlanDay>>()
  for (const d of raw) if (typeof d.day === 'number') byDay.set(d.day, d)
  return Array.from({ length: 14 }, (_, i) => {
    const day = i + 1, theme = themeOfDay(day), r = byDay.get(day), d = DEFAULT_ACTIONS[theme]
    const ok = r && r.action && r.action.trim().length > 8
    return {
      day, theme,
      action: ok ? clip(r!.action!.trim(), 220) : d.action,
      why: ok && r!.why ? clip(r!.why.trim(), 220) : d.why,
      minutes: Math.max(5, Math.min(20, Number(r?.minutes) || 20)),
      guidance: ok && r!.guidance ? clip(r!.guidance.trim(), 300) : d.guidance,
    }
  })
}
