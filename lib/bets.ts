import { similarity } from '@/lib/career-scoring'
import type { CareerMap, CareerCandidate, MarketGraph } from '@/types/career-intelligence'
import type { Blueprint, FuturePath } from '@/types/wingspan'

/** The three directions chosen by the agents; the Blueprint must be written around exactly these. */
export interface Bet {
  archetype: 'safe' | 'growth' | 'bold'
  direction: string
  careerScore: number
  experienceScore: number
  marketScore: number
  interestScore: number
  resilience: number | null
  whyThisPerson: string
  whyNow: string
  rationale: string
}

export function betsFrom(map: CareerMap, market: MarketGraph): Bet[] {
  const one = (c: CareerCandidate, archetype: Bet['archetype']): Bet => {
    const best = [...(market.directions ?? [])]
      .map((d) => ({ d, s: similarity(d.name, c.direction) }))
      .sort((a, b) => b.s - a.s)[0]
    return {
      archetype, direction: c.direction, careerScore: c.careerScore,
      experienceScore: c.experienceScore, marketScore: c.marketScore, interestScore: c.interestScore,
      resilience: best && best.s >= 0.25 ? Math.round(best.d.resilience) : null,
      whyThisPerson: c.whyThisPerson, whyNow: c.whyNow, rationale: c.rationale,
    }
  }
  return [one(map.safe, 'safe'), one(map.growth, 'growth'), one(map.bold, 'bold')]
}

/** Prompt block that replaces the free-form "generate 3 bets" instruction. */
export function betsInstruction(bets: Bet[]): string {
  const label = { safe: 'SAFE BET', growth: 'GROWTH BET', bold: 'BOLD BET' } as const
  const lines = bets.map((b) =>
    `${label[b.archetype]} (betArchetype: "${b.archetype}") — title MUST be exactly "${b.direction}"
  Why this person: ${b.whyThisPerson}
  Why now: ${b.whyNow}
  Reasoning from the analysis: ${b.rationale}
  Scores already computed (use as given): career fit ${Math.round(b.careerScore)}, market ${Math.round(b.marketScore)}`).join('\n\n')
  return `The career directions have ALREADY been chosen by a multi-agent analysis. Generate exactly 3 Future Paths, one per bet below, using these exact titles and betArchetype values. Do not substitute, rename or add other directions. Your job is to write the detail for each (whyItFits, betRationale, evidence, keyTransitionAreas, whyNotOtherPaths, learningInvestment, estimatedTransitionMonths, careerROIScore, timeline, marketDemand, growthPotential, opportunitySize) grounded in the person's real evidence. Every gap's "pathway" and every action/resource/milestone "pathway" must be one of these exact titles.

${lines}`
}

/** After generation: force titles, archetypes and scores to the agents' decision and keep pathways consistent. */
export function enforceBets(blueprint: Blueprint, bets: Bet[]): Blueprint {
  const paths: FuturePath[] = Array.isArray(blueprint.futurePaths) ? blueprint.futurePaths : []
  const used = new Set<number>()
  const rename = new Map<string, string>()

  const futurePaths = bets.map((bet) => {
    const free = (pred: (p: FuturePath) => boolean) => paths.findIndex((p, j) => !used.has(j) && !!p && pred(p))
    let idx = free((p) => p.betArchetype === bet.archetype)
    if (idx < 0) idx = free((p) => similarity(String(p.title ?? ''), bet.direction) >= 0.5)
    if (idx < 0) idx = free(() => true)
    if (idx >= 0) used.add(idx)
    const base = (idx >= 0 ? paths[idx] : {}) as Partial<FuturePath>
    if (base.title && base.title !== bet.direction) rename.set(String(base.title).toLowerCase(), bet.direction)
    return {
      ...base,
      title: bet.direction,
      betArchetype: bet.archetype,
      whyItFits: base.whyItFits || bet.whyThisPerson,
      betRationale: base.betRationale || bet.rationale,
      careerAlphaScore: Math.round(bet.careerScore),
      marketOpportunityScore: Math.round(bet.marketScore),
      futureResilienceScore: bet.resilience ?? base.futureResilienceScore ?? Math.round(bet.marketScore),
    } as FuturePath
  })

  const fix = <T,>(items: T[] | undefined): T[] | undefined =>
    Array.isArray(items)
      ? items.map((it) => {
          const pw = (it as { pathway?: unknown })?.pathway
          const to = typeof pw === 'string' ? rename.get(pw.toLowerCase()) : undefined
          return to ? ({ ...(it as object), pathway: to } as T) : it
        })
      : items

  const a = blueprint.actions
  return {
    ...blueprint,
    futurePaths,
    gaps: fix(blueprint.gaps) as Blueprint['gaps'],
    roadmapMilestones: fix(blueprint.roadmapMilestones) as Blueprint['roadmapMilestones'],
    actions: a ? {
      ...a,
      immediate: fix(a.immediate) as typeof a.immediate,
      mediumTerm: fix(a.mediumTerm) as typeof a.mediumTerm,
      longTerm: fix(a.longTerm) as typeof a.longTerm,
      resources: fix(a.resources) as typeof a.resources,
    } : a,
  }
}
