import { randomUUID } from 'node:crypto'
import type { Prisma } from '@/lib/generated/prisma/client'
import type { CareerDNA, CareerMap, EvidenceGraph, MarketGraph } from '@/types/career-intelligence'
import type {
  AgentName,
  BetArchetype,
  CapabilityType,
  Directionality,
  DnaDimensionKind,
  EvidenceCategory,
  EvidenceSourceType,
  MarketHorizon,
  MarketSourceType,
} from '@/lib/generated/prisma/enums'

// Pure mapping from pipeline output to database rows. No database access, so it is unit-testable.

export interface PipelineResult {
  evidenceGraph: EvidenceGraph
  careerDNA: CareerDNA
  marketGraph: MarketGraph
  careerMap: CareerMap
}

// ---------------------------------------------------------------- enum mapping

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  const upper = typeof value === 'string' ? value.trim().toUpperCase().replace(/[\s-]+/g, '_') : ''
  return (allowed as readonly string[]).includes(upper) ? (upper as T) : fallback
}

const SOURCE_TYPES = ['RESUME', 'PORTFOLIO', 'PROJECT', 'EDUCATION', 'INTEREST', 'BEHAVIOUR', 'CONVERSATION'] as const satisfies readonly EvidenceSourceType[]
const CATEGORIES = ['ROLE', 'RESPONSIBILITY', 'SKILL', 'CAPABILITY', 'ACHIEVEMENT', 'IMPACT', 'INTEREST', 'BEHAVIOUR', 'TRAJECTORY', 'CONSTRAINT'] as const satisfies readonly EvidenceCategory[]
const CAPABILITY_TYPES = ['CORE', 'TRANSFERABLE', 'DISTINCTIVE', 'DOMAIN', 'LEADERSHIP', 'STRATEGIC', 'CREATIVE', 'COLLABORATION'] as const satisfies readonly CapabilityType[]
const MARKET_SOURCES = ['GOVERNMENT', 'LABOUR_MARKET', 'EMPLOYER', 'RESEARCH', 'INDUSTRY', 'INVESTMENT', 'EXPERT', 'WEAK_SIGNAL'] as const satisfies readonly MarketSourceType[]
const DIRECTIONALITY = ['POSITIVE', 'NEGATIVE', 'UNCERTAIN'] as const satisfies readonly Directionality[]
const ARCHETYPES = ['SAFE', 'GROWTH', 'BOLD', 'RESERVE'] as const satisfies readonly BetArchetype[]

// The agents' unknown labels fall back to the lowest-claim value, same as the schema contracts do.
const toSourceType = (v: unknown) => pick<EvidenceSourceType>(v, SOURCE_TYPES, 'CONVERSATION')
const toCategory = (v: unknown) => pick<EvidenceCategory>(v, CATEGORIES, 'CAPABILITY')
const toCapabilityType = (v: unknown) => pick<CapabilityType>(v, CAPABILITY_TYPES, 'CORE')
const toMarketSource = (v: unknown) => pick<MarketSourceType>(v, MARKET_SOURCES, 'WEAK_SIGNAL')
const toDirectionality = (v: unknown) => pick<Directionality>(v, DIRECTIONALITY, 'UNCERTAIN')
const toArchetype = (v: unknown) => pick<BetArchetype>(v, ARCHETYPES, 'RESERVE')

export function toHorizon(value: unknown): MarketHorizon {
  switch (typeof value === 'string' ? value.trim().toLowerCase() : '') {
    case '1-3_years': return 'ONE_TO_THREE_YEARS'
    case '3-5_years': return 'THREE_TO_FIVE_YEARS'
    case '5-10_years': return 'FIVE_TO_TEN_YEARS'
    default: return 'CURRENT'
  }
}

/** Parse the agent's date string; null when it is missing or not a real date. */
export function parseObservedAt(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const id = (): string => randomUUID()
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

function without<T extends object, K extends keyof T>(row: T, key: K): Omit<T, K> {
  const copy = { ...row }
  delete copy[key]
  return copy
}

function dedupeBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const k = key(item)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

// ---------------------------------------------------------------- mapping

/** Turn one pipeline result into row sets. Pure, so it can be tested without a database. */
export function mapPipelineResult(runId: string, result: PipelineResult, expiresAt: Date) {
  const { evidenceGraph, careerDNA, marketGraph, careerMap } = result

  const evidence = dedupeBy(evidenceGraph.evidence, (e) => e.id).map((e) => ({
    id: id(),
    runId,
    key: e.id,
    sourceType: toSourceType(e.sourceType),
    sourceRef: e.sourceId ?? null,
    category: toCategory(e.category),
    statement: e.statement,
    strength: num(e.strength),
    recency: num(e.recency),
    specificity: num(e.specificity),
    reliability: num(e.reliability),
    confidence: num(e.confidence),
    startDate: e.startDate ?? null,
    endDate: e.endDate ?? null,
    entities: e.entities ?? [],
  }))
  const evidenceIdByKey = new Map(evidence.map((e) => [e.key, e.id]))
  const evidenceIds = (keys: string[] | undefined) =>
    dedupeBy(
      (keys ?? []).flatMap((k) => {
        const found = evidenceIdByKey.get(k)
        return found ? [found] : [] // an id the agent invented is dropped, never stored
      }),
      (x) => x,
    )

  const links = dedupeBy(
    evidenceGraph.evidence.flatMap((e) => {
      const from = evidenceIdByKey.get(e.id)
      if (!from) return []
      const rows: { fromId: string; toId: string; relation: 'SUPPORTS' | 'CONTRADICTS' }[] = []
      for (const k of e.supports ?? []) {
        const to = evidenceIdByKey.get(k)
        if (to && to !== from) rows.push({ fromId: from, toId: to, relation: 'SUPPORTS' })
      }
      for (const k of e.contradicts ?? []) {
        const to = evidenceIdByKey.get(k)
        if (to && to !== from) rows.push({ fromId: from, toId: to, relation: 'CONTRADICTS' })
      }
      return rows
    }),
    (l) => `${l.fromId}|${l.toId}|${l.relation}`,
  )

  const capabilities = dedupeBy(evidenceGraph.capabilities, (c) => c.id).map((c) => ({
    id: id(),
    runId,
    key: c.id,
    name: c.name,
    capabilityType: toCapabilityType(c.capabilityType),
    level: num(c.level),
    recurrence: Math.round(num(c.recurrence)),
    confidence: num(c.confidence),
    rationale: c.rationale || null,
    evidenceKeys: c.evidenceIds,
  }))
  const capabilityEvidence = capabilities.flatMap((c) =>
    evidenceIds(c.evidenceKeys).map((evidenceId) => ({ capabilityId: c.id, evidenceId })),
  )

  const snapshotId = id()
  const dna = {
    id: snapshotId,
    runId,
    currentIdentity: careerDNA.currentIdentity,
    emergingIdentity: careerDNA.emergingIdentity,
    underlyingCapabilities: careerDNA.underlyingCapabilities,
    workingPatterns: careerDNA.workingPatterns,
    problemSolvingPatterns: careerDNA.problemSolvingPatterns,
    leadershipPatterns: careerDNA.leadershipPatterns,
    domainExpertise: careerDNA.domainExpertise,
    strategicMaturity: careerDNA.strategicMaturity,
    creativePatterns: careerDNA.creativePatterns,
    collaborationPatterns: careerDNA.collaborationPatterns,
    careerTrajectory: careerDNA.careerTrajectory,
    capabilityMaturity: careerDNA.capabilityMaturity,
    deepInterestSignals: careerDNA.deepInterestSignals,
    constraints: careerDNA.constraints,
    confidence: num(careerDNA.confidence),
  }
  const dimensionGroups: [DnaDimensionKind, CareerDNA['strongestCapabilities']][] = [
    ['STRONGEST', careerDNA.strongestCapabilities],
    ['TRANSFERABLE', careerDNA.transferableCapabilities],
    ['DISTINCTIVE', careerDNA.distinctiveStrengths],
  ]
  const dimensions = dimensionGroups.flatMap(([kind, list]) =>
    list.map((d) => ({
      id: id(),
      snapshotId,
      kind,
      name: d.name,
      score: num(d.score),
      confidence: num(d.confidence),
      rationale: d.rationale || null,
      evidenceKeys: d.evidenceIds,
    })),
  )
  const dimensionEvidence = dimensions.flatMap((d) =>
    evidenceIds(d.evidenceKeys).map((evidenceId) => ({ dimensionId: d.id, evidenceId })),
  )

  const directions = dedupeBy(marketGraph.directions, (d) => d.name).map((d) => ({
    id: id(),
    runId,
    name: d.name,
    currentDemand: num(d.currentDemand),
    momentum: num(d.momentum),
    futurePotential: num(d.futurePotential),
    resilience: num(d.resilience),
    adjacency: d.adjacency,
    currentCapabilities: d.currentCapabilities,
    growingCapabilities: d.growingCapabilities,
    decliningCapabilities: d.decliningCapabilities,
    futureThesis: d.futureThesis || null,
    invalidationRisks: d.invalidationRisks,
    geography: d.geography,
    horizon: d.horizon || null,
    confidence: num(d.confidence),
    signals: d.evidence,
  }))
  const signals = directions.flatMap((d) =>
    d.signals.map((s) => ({
      id: id(),
      directionId: d.id,
      key: s.id,
      signal: s.signal,
      source: s.source || null,
      sourceType: toMarketSource(s.sourceType),
      geography: s.geography || null,
      observedAt: parseObservedAt(s.observedAt),
      horizon: toHorizon(s.horizon),
      directionality: toDirectionality(s.directionality),
      magnitude: num(s.magnitude),
      reliability: num(s.reliability),
      supportingEvidence: s.supportingEvidence ?? [],
    })),
  )

  const requirements = marketGraph.capabilityRequirements.map((r) => ({
    id: id(),
    runId,
    capability: r.capability,
    importance: num(r.importance),
    levelRequired: num(r.levelRequired),
    futureImportance: num(r.futureImportance),
    marketDemand: num(r.marketDemand),
  }))

  const candidates = dedupeBy(careerMap.candidates, (c) => c.direction).map((c, index) => ({
    id: id(),
    runId,
    rank: index + 1,
    direction: c.direction,
    archetype: toArchetype(c.archetype),
    experienceScore: num(c.experienceScore),
    marketScore: num(c.marketScore),
    interestScore: num(c.interestScore),
    confidence: num(c.confidence),
    careerScore: num(c.careerScore),
    capabilityDistance: num(c.capabilityDistance),
    whyThisPerson: c.whyThisPerson || null,
    whyNow: c.whyNow || null,
    rationale: c.rationale || null,
    breakdown: c.scoreBreakdown ? (c.scoreBreakdown as unknown as Prisma.InputJsonObject) : undefined,
    evidenceKeys: c.evidenceIds,
  }))
  const candidateEvidence = candidates.flatMap((c) =>
    evidenceIds(c.evidenceKeys).map((evidenceId) => ({ candidateId: c.id, evidenceId })),
  )

  const agentOutputs: [AgentName, unknown][] = [
    ['AGGREGATOR', evidenceGraph],
    ['CAREER_ALPHA', careerDNA],
    ['MARKET_INTELLIGENCE', marketGraph],
    ['DIRECTION_GENERATOR', careerMap],
  ]

  return {
    evidence,
    links,
    capabilities: capabilities.map((c) => without(c, 'evidenceKeys')),
    capabilityEvidence,
    dna,
    dimensions: dimensions.map((d) => without(d, 'evidenceKeys')),
    dimensionEvidence,
    directions: directions.map((d) => without(d, 'signals')),
    signals,
    requirements,
    candidates: candidates.map((c) => without(c, 'evidenceKeys')),
    candidateEvidence,
    agentOutputs: agentOutputs.map(([agent, raw]) => ({ agent, raw, expiresAt })),
  }
}

