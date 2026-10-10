import { careerMapSchema, type CandidateDraft, type CareerDirectionDraft } from '@/lib/agent-contracts'
import type { CareerCandidate, CareerMap } from '@/types/career-intelligence'
import { canonicalizeTitle } from '@/lib/role-taxonomy'

// Deterministic scoring and Safe / Growth / Bold selection for the Career Direction Generator.
//
// The model interprets evidence and proposes candidate directions with 0-100 component sub-scores.
// Everything below is reproducible: the same drafts always give the same scores and the same picks.
//
//   E = 0.30 capability + 0.25 project + 0.20 transferable + 0.15 context + 0.10 recency
//   M = 0.25 demand     + 0.20 growth  + 0.20 future       + 0.15 adjacency + 0.10 relevance + 0.10 safety
//       where safety = 100 - risk (exposure to automation, hype, saturation or decline)
//   I = 0.30 direct     + 0.25 behavioural + 0.20 stated   + 0.15 curiosity  + 0.10 adjacency
//   CareerScore = (0.40E + 0.40M + 0.20I) * (0.75 + 0.25C)

export const FORMULA = '0.40E + 0.40M + 0.20I, confidence-adjusted' as const

export const WEIGHTS = {
  overall: { experience: 0.4, market: 0.4, interest: 0.2 },
  experience: { capability: 0.3, project: 0.25, transferable: 0.2, context: 0.15, recency: 0.1 },
  market: { demand: 0.25, growth: 0.2, future: 0.2, adjacency: 0.15, relevance: 0.1, safety: 0.1 },
  interest: { direct: 0.3, behavioural: 0.25, stated: 0.2, curiosity: 0.15, adjacency: 0.1 },
} as const

// capabilityDistance is 0 (already doing it) to 100 (a completely different field).
export const SELECTION = {
  safeMaxDistance: 35,
  growthMinDistance: 20,
  growthMaxDistance: 60,
  boldMinDistance: 45,
  boldMaxDistance: 85, // beyond this a direction is not a plausible bet
  maxSimilarity: 0.6, // picks must not be near-duplicate names for the same job
} as const

export class InsufficientCandidatesError extends Error {
  constructor(message = 'Not enough distinct career directions to select Safe, Growth and Bold.') {
    super(message)
    this.name = 'InsufficientCandidatesError'
  }
}

const clamp = (n: number, lo: number, hi: number) => (Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo)
const round1 = (n: number) => Math.round(n * 10) / 10
const round2 = (n: number) => Math.round(n * 100) / 100

function weighted<K extends string>(values: Record<K, number>, weights: Record<K, number>): number {
  return (Object.keys(weights) as K[]).reduce((sum, key) => sum + weights[key] * clamp(values[key], 0, 100), 0)
}

/** Weak evidence lowers confidence, not possibility: the multiplier never drops below 0.75. */
export function confidenceMultiplier(evidenceConfidence: number): number {
  return 0.75 + 0.25 * clamp(evidenceConfidence, 0, 1)
}

export function experienceScore(c: CandidateDraft['experience']): number {
  return weighted(c, WEIGHTS.experience)
}
/** Safety = 100 - risk. When the model gave no risk, use the mean of the other market signals (neutral, not invented). */
export function marketSafety(c: CandidateDraft['market']): number {
  if (typeof c.risk === 'number' && Number.isFinite(c.risk)) return 100 - clamp(c.risk, 0, 100)
  return (c.demand + c.growth + c.future + c.adjacency + c.relevance) / 5
}
export function marketScore(c: CandidateDraft['market']): number {
  const { demand, growth, future, adjacency, relevance } = c
  return weighted({ demand, growth, future, adjacency, relevance, safety: marketSafety(c) }, WEIGHTS.market)
}
export function interestScore(c: CandidateDraft['interest']): number {
  return weighted(c, WEIGHTS.interest)
}

export function careerScore(experience: number, market: number, interest: number, evidenceConfidence: number): number {
  const base =
    WEIGHTS.overall.experience * experience +
    WEIGHTS.overall.market * market +
    WEIGHTS.overall.interest * interest
  return round1(base * confidenceMultiplier(evidenceConfidence))
}

export function scoreCandidate(draft: CandidateDraft, fallbackConfidence: number): CareerCandidate {
  const E = experienceScore(draft.experience)
  const M = marketScore(draft.market)
  const I = interestScore(draft.interest)
  const C = clamp(draft.confidence ?? fallbackConfidence, 0, 1)
  const base = WEIGHTS.overall.experience * E + WEIGHTS.overall.market * M + WEIGHTS.overall.interest * I
  const multiplier = confidenceMultiplier(C)
  return {
    direction: draft.direction,
    experienceScore: round1(E),
    marketScore: round1(M),
    interestScore: round1(I),
    confidence: round2(C),
    careerScore: round1(base * multiplier),
    archetype: 'reserve',
    whyThisPerson: draft.whyThisPerson,
    whyNow: draft.whyNow,
    evidenceIds: draft.evidenceIds,
    capabilityDistance: round1(draft.capabilityDistance),
    rationale: draft.rationale,
    ...titleFields(draft.direction),
    ...(typeof draft.market.risk === 'number' ? { marketRisk: round1(draft.market.risk) } : {}),
    risks: draft.risks ?? [],
    scoreBreakdown: {
      experience: draft.experience,
      market: draft.market,
      interest: draft.interest,
      baseScore: round1(base),
      confidenceMultiplier: round2(multiplier),
    },
  }
}

function titleFields(direction: string): Pick<CareerCandidate, 'baseTitle' | 'family' | 'focus'> {
  const c = canonicalizeTitle(direction)
  return c ? { baseTitle: c.base.title, family: c.base.family, focus: c.focus } : {}
}

// ---------------------------------------------------------------- selection

const words = (s: string) =>
  new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2))

export function similarity(a: string, b: string): number {
  const A = words(a)
  const B = words(b)
  if (A.size === 0 || B.size === 0) return a.trim().toLowerCase() === b.trim().toLowerCase() ? 1 : 0
  let shared = 0
  A.forEach((w) => { if (B.has(w)) shared += 1 })
  return shared / (A.size + B.size - shared)
}

const normalizedKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

const byScore = (a: CareerCandidate, b: CareerCandidate) =>
  b.careerScore - a.careerScore ||
  a.capabilityDistance - b.capabilityDistance ||
  a.direction.localeCompare(b.direction)

const boldPotential = (c: CareerCandidate) => 0.55 * c.marketScore + 0.45 * c.interestScore
const byBoldPotential = (a: CareerCandidate, b: CareerCandidate) =>
  boldPotential(b) - boldPotential(a) || byScore(a, b)

function dedupe(candidates: CareerCandidate[]): CareerCandidate[] {
  const best = new Map<string, CareerCandidate>()
  for (const c of [...candidates].sort(byScore)) {
    const key = normalizedKey(c.direction)
    if (key && !best.has(key)) best.set(key, c)
  }
  return [...best.values()]
}

// Same base title with a different focus ("Head of Design, AI Products" vs "Head of Design, Fintech")
// is the same kind of work, so it never counts as a distinct pick.
const sameJob = (a: CareerCandidate, b: CareerCandidate) =>
  (!!a.baseTitle && a.baseTitle === b.baseTitle) || similarity(a.direction, b.direction) >= SELECTION.maxSimilarity

function firstDistinct(sorted: CareerCandidate[], picked: CareerCandidate[]): CareerCandidate | undefined {
  return sorted.find((c) => !picked.includes(c) && picked.every((p) => !sameJob(c, p)))
}

export interface BetSelection {
  candidates: CareerCandidate[]
  safe: CareerCandidate
  growth: CareerCandidate
  bold: CareerCandidate
  notes: string[]
}

export function selectBets(scored: CareerCandidate[]): BetSelection {
  const notes: string[] = []
  const unique = dedupe(scored)
  if (unique.length < 3) throw new InsufficientCandidatesError()
  const ranked = [...unique].sort(byScore)

  // Safe: strongest defensible continuation (small capability distance, best overall score).
  let safe = firstDistinct(ranked.filter((c) => c.capabilityDistance <= SELECTION.safeMaxDistance), [])
  if (!safe) {
    safe = [...ranked].sort(
      (a, b) => a.capabilityDistance - b.capabilityDistance || byScore(a, b),
    )[0]
    notes.push(`Safe: no candidate within capability distance ${SELECTION.safeMaxDistance}; used the closest continuation.`)
  }

  // Growth: strongest overall score with a moderate capability gap.
  let growth = firstDistinct(
    ranked.filter(
      (c) => c.capabilityDistance > SELECTION.growthMinDistance && c.capabilityDistance <= SELECTION.growthMaxDistance,
    ),
    [safe],
  )
  if (!growth) {
    growth = firstDistinct(ranked, [safe])
    if (growth) notes.push('Growth: no distinct candidate with a moderate capability gap; used the best remaining score.')
  }
  if (!growth) throw new InsufficientCandidatesError()

  // Bold: highest market + interest potential with a larger but still plausible gap.
  const picked = [safe, growth]
  const remaining = [...ranked].sort(byBoldPotential)
  let bold = firstDistinct(
    remaining.filter(
      (c) => c.capabilityDistance >= SELECTION.boldMinDistance && c.capabilityDistance <= SELECTION.boldMaxDistance,
    ),
    picked,
  )
  if (!bold) {
    bold = firstDistinct(remaining.filter((c) => c.capabilityDistance <= SELECTION.boldMaxDistance), picked)
    if (bold) notes.push(`Bold: no candidate in the larger-gap range (${SELECTION.boldMinDistance}-${SELECTION.boldMaxDistance}); used the highest market and interest potential.`)
  }
  if (!bold) {
    bold = firstDistinct(remaining, picked)
    if (bold) notes.push('Bold: every remaining candidate is beyond a plausible capability gap; used the highest potential anyway.')
  }
  if (!bold) throw new InsufficientCandidatesError()

  const archetypeOf = new Map<CareerCandidate, CareerCandidate['archetype']>([
    [safe, 'safe'],
    [growth, 'growth'],
    [bold, 'bold'],
  ])
  const withArchetype = (c: CareerCandidate): CareerCandidate => ({ ...c, archetype: archetypeOf.get(c) ?? 'reserve' })

  return {
    candidates: ranked.map(withArchetype),
    safe: withArchetype(safe),
    growth: withArchetype(growth),
    bold: withArchetype(bold),
    notes,
  }
}

// ---------------------------------------------------------------- entry point

export function buildCareerMap(draft: CareerDirectionDraft, fallbackConfidence: number): CareerMap {
  const scored = draft.candidates.map((d) => scoreCandidate(d, fallbackConfidence))
  const { candidates, safe, growth, bold, notes } = selectBets(scored)
  const confidence = round2((safe.confidence + growth.confidence + bold.confidence) / 3)

  const map = {
    version: '0.2' as const,
    formula: FORMULA,
    candidates,
    safe,
    growth,
    bold,
    confidence,
    validation: [
      `Scored ${scored.length} candidates deterministically; ${candidates.length} distinct after de-duplication.`,
      ...notes,
    ],
  }
  return careerMapSchema.parse(map) as CareerMap
}
