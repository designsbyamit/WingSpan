import { z } from 'zod'
import { aggregatorAgent, careerAlphaAgent, marketIntelligenceAgent, careerDirectionGenerator, callValidated } from '@/lib/v02-agents'
import { experienceFacts, groundingRules } from '@/lib/experience'
import { normalizeExtracted } from '@/lib/extracted-shape'
import { computeArchetypeFingerprint } from '@/lib/career-alpha'
import { WEIGHTS, SELECTION } from '@/lib/career-scoring'
export { betsFrom, type Bet } from '@/lib/bets'
import type { ExtractedCareerData, CareerAlphaIntelligence, CareerStage } from '@/types/wingspan'
import type {
  EvidenceGraph, CareerDNA, MarketGraph, CareerMap, CareerCandidate,
  DeepAnalysis, DeepAnalysisAgent, DeepAnalysisCandidate,
} from '@/types/career-intelligence'

// The Orchestrator sits above the four v0.2 agents. It never re-reads the resume and never researches
// the market: it receives their outputs plus the deterministic scores, explains how they combine, and
// produces the overall recommendation (the Career Alpha view the rest of the app already understands).

export type AgentId = DeepAnalysisAgent['id']
export interface AgentRun { evidenceGraph: EvidenceGraph; careerDNA: CareerDNA; marketGraph: MarketGraph; careerMap: CareerMap; timings: Partial<Record<AgentId, number>> }
export type AgentProgress = (id: AgentId, status: 'start' | 'done', note?: string) => void

const pct = (n: number | undefined) => Math.round((Number.isFinite(n as number) ? (n as number) : 0) * 100)
const top = <T,>(xs: T[] | undefined, n: number) => (Array.isArray(xs) ? xs.slice(0, n) : [])

// ------------------------------------------------------------------ the four agents

export async function runAgents(rawData: ExtractedCareerData, interests: string[], onProgress: AgentProgress = () => {}): Promise<AgentRun> {
  const data = normalizeExtracted(rawData)
  const facts = experienceFacts(data.timeline)
  const grounding = groundingRules(facts, interests)
  const timings: AgentRun['timings'] = {}

  async function step<T>(id: AgentId, run: () => Promise<T>, note: (r: T) => string): Promise<T> {
    onProgress(id, 'start')
    const started = Date.now()
    const result = await run()
    timings[id] = Date.now() - started
    onProgress(id, 'done', note(result))
    return result
  }

  // The market view is independent of the person, so it runs alongside the evidence → DNA chain.
  const marketP = step('market',
    () => marketIntelligenceAgent([...(data.geographySignals ?? []), ...(data.footprintSignals ?? [])]),
    (m) => `Assessed ${m.directions.length} career directions against market signals`)
  const personP = (async () => {
    const evidenceGraph = await step('aggregator', () => aggregatorAgent(data, interests),
      (g) => `Found ${g.evidence.length} pieces of evidence and ${g.capabilities.length} capabilities`)
    const careerDNA = await step('careerDna', () => careerAlphaAgent(evidenceGraph, data, interests, grounding),
      (d) => `Career DNA: ${d.currentIdentity}`)
    return { evidenceGraph, careerDNA }
  })()

  const [m, p] = await Promise.allSettled([marketP, personP])
  if (m.status === 'rejected') throw m.reason
  if (p.status === 'rejected') throw p.reason
  const marketGraph = m.value
  const { evidenceGraph, careerDNA } = p.value

  const careerMap = await step('directions', () => careerDirectionGenerator(careerDNA, marketGraph, grounding),
    (c) => `Scored ${c.candidates.length} directions; picked ${c.safe.direction}, ${c.growth.direction}, ${c.bold.direction}`)

  return { evidenceGraph, careerDNA, marketGraph, careerMap, timings }
}

// ------------------------------------------------------------------ the Orchestrator

const dimensionSchema = z.object({ insight: z.string().min(1), signals: z.array(z.string()).default([]) })
export const orchestratorSchema = z.object({
  archetypeLabel: z.string().min(2),
  synthesis: z.string().min(20),
  weightingRationale: z.string().min(10),
  methodSummary: z.string().optional(),
  observations: z.array(z.string()).default([]),
  dimensions: z.object({
    intrinsicSignal: dimensionSchema,
    marketIntelligence: dimensionSchema,
    futuresAnalysis: dimensionSchema,
    humanAdvantageIndex: dimensionSchema,
    careerROI: dimensionSchema,
  }),
  recommendation: z.object({
    whyThisOrder: z.string().optional(),
    tradeoffs: z.array(z.string()).optional(),
    caveats: z.array(z.string()).optional(),
  }).optional(),
})
export type OrchestratorOutput = z.infer<typeof orchestratorSchema>

export const orchestratorWeightsText = () =>
  `Overall = ${WEIGHTS.overall.experience}×Experience + ${WEIGHTS.overall.market}×Market + ${WEIGHTS.overall.interest}×Interest, then × (0.75 + 0.25 × evidence confidence).`

const ORCH_SYSTEM = `You are the Orchestrator Agent v0.2. Four specialist agents have already done their work: the Aggregator (evidence), Career DNA (who the person is), Market Intelligence (where the market is moving) and the Direction Generator (candidate directions with deterministic scores). You do NOT re-read the resume and do NOT research the market. You weigh and reconcile their outputs and explain the overall recommendation to the person in plain, specific language. Never contradict the computed numbers or the ground truth. Never invent facts that are not in the agents' outputs. Write for the person ("you"), not about "the candidate". Return only JSON.`

const ORCH_SCHEMA = `{
 "archetypeLabel": "string (2-5 words, a recognisable professional identity, e.g. 'Design Leader, Systems Thinker')",
 "synthesis": "string (3-4 sentences: who you are, where the market is moving, and what the overall recommendation is and why)",
 "weightingRationale": "string (2-3 sentences explaining how Experience, Market and Interest were weighed for this person, citing the actual numbers)",
 "methodSummary": "string (1-2 sentences)",
 "observations": ["string (3-5 short, specific insights for a live feed, each grounded in the agents' findings)"],
 "dimensions": {
  "intrinsicSignal": {"insight": "string (from Career DNA + evidence)", "signals": ["string"]},
  "marketIntelligence": {"insight": "string (from Market Intelligence)", "signals": ["string"]},
  "futuresAnalysis": {"insight": "string (where the field goes in 1-3 and 3-5 years)", "signals": ["string"]},
  "humanAdvantageIndex": {"insight": "string (what this person does that compounds as AI spreads)", "signals": ["string"]},
  "careerROI": {"insight": "string (which of the three directions pays back most, and why)", "signals": ["string"]}
 },
 "recommendation": {
  "whyThisOrder": "string (why the Safe, Growth and Bold picks are what they are, referencing their scores)",
  "tradeoffs": ["string (2-3 real trade-offs between the picks)"],
  "caveats": ["string (1-3 honest limits: thin evidence, market assumptions, contradictions)"]
 }
}`

function compactCandidates(map: CareerMap): string {
  return map.candidates.slice(0, 12).map((c) =>
    `- ${c.direction} [${c.archetype}] E=${c.experienceScore} M=${c.marketScore} I=${c.interestScore} conf=${c.confidence} score=${c.careerScore} distance=${c.capabilityDistance}`).join('\n')
}
function compactMarket(m: MarketGraph): string {
  return [...m.directions]
    .sort((a, b) => (b.currentDemand + b.momentum + b.futurePotential) - (a.currentDemand + a.momentum + a.futurePotential))
    .slice(0, 10)
    .map((d) => `- ${d.name}: demand ${d.currentDemand}, momentum ${d.momentum}, future ${d.futurePotential}, resilience ${d.resilience}. ${d.futureThesis}`)
    .join('\n')
}

export async function orchestratorAgent(run: AgentRun, data: ExtractedCareerData, interests: string[]): Promise<OrchestratorOutput> {
  const facts = experienceFacts(normalizeExtracted(data).timeline)
  const { careerDNA: dna, careerMap: map, marketGraph: market, evidenceGraph: graph } = run
  const user = `${groundingRules(facts, interests)}

AGGREGATOR (evidence, ${graph.evidence.length} items, confidence ${pct(graph.confidence)}%):
Top capabilities: ${top(graph.capabilities, 8).map((c) => `${c.name} (${c.level})`).join('; ')}
Patterns: ${top(graph.patterns, 5).join(' | ')}
Uncertainties: ${top(graph.uncertainties, 4).join(' | ')}
Contradictions: ${top(graph.contradictions, 3).join(' | ') || 'none'}

CAREER DNA (confidence ${pct(dna.confidence)}%):
Current identity: ${dna.currentIdentity}
Emerging identity: ${dna.emergingIdentity.join('; ')}
Strongest: ${top(dna.strongestCapabilities, 5).map((c) => `${c.name} (${c.score})`).join('; ')}
Distinctive: ${top(dna.distinctiveStrengths, 4).map((c) => `${c.name} (${c.score})`).join('; ')}
Trajectory: ${dna.careerTrajectory}
Maturity: ${dna.capabilityMaturity}; strategic: ${dna.strategicMaturity}
Interest signals: ${top(dna.deepInterestSignals, 5).join('; ')}

MARKET INTELLIGENCE (confidence ${pct(market.confidence)}%, based on general market knowledge):
${compactMarket(market)}

DIRECTION GENERATOR — candidates scored deterministically (${orchestratorWeightsText()}):
${compactCandidates(map)}

SELECTED: Safe = ${map.safe.direction} (${map.safe.careerScore}); Growth = ${map.growth.direction} (${map.growth.careerScore}); Bold = ${map.bold.direction} (${map.bold.careerScore}).
Selection notes: ${map.validation.join(' ')}

Write the orchestration result. Explain the recommendation using the real numbers above.
Return ONLY valid JSON matching:
${ORCH_SCHEMA}`
  return callValidated(ORCH_SYSTEM, user, (o) => orchestratorSchema.parse(o), 6000)
}

// ------------------------------------------------------------------ Career Alpha view (for the existing UI)

const STAGES: CareerStage[] = ['student', 'early', 'mid', 'senior', 'leader']

export function toCareerAlpha(
  out: OrchestratorOutput, run: AgentRun, data: ExtractedCareerData, interests: string[],
): CareerAlphaIntelligence {
  const clean = normalizeExtracted(data)
  const facts = experienceFacts(clean.timeline)
  const careerStage: CareerStage =
    clean.timeline.length === 0 ? 'student' : (STAGES.includes(facts.seniority as CareerStage) ? facts.seniority : 'mid')
  let fingerprint = `${careerStage}-${out.archetypeLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
  try { fingerprint = computeArchetypeFingerprint(clean, interests) } catch { /* keep the label-based slug */ }

  const today = new Date().toISOString().split('T')[0]
  const { careerDNA: dna, marketGraph: market, careerMap: map } = run
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
  // Confidence comes from the agents' evidence, never from how sure the model sounds.
  const conf = {
    intrinsicSignal: pct(dna.confidence),
    marketIntelligence: pct(market.confidence),
    futuresAnalysis: pct(market.confidence),
    humanAdvantageIndex: pct(avg(dna.distinctiveStrengths.map((d) => d.confidence)) || dna.confidence),
    careerROI: pct(map.confidence),
  }
  const dim = (k: keyof typeof conf) => ({
    insight: out.dimensions[k].insight,
    signals: out.dimensions[k].signals,
    cached_at: today,
    confidenceScore: conf[k],
  })
  return {
    careerStage,
    archetypeLabel: out.archetypeLabel,
    archetypeFingerprint: fingerprint,
    dimensions: {
      intrinsicSignal: dim('intrinsicSignal'),
      marketIntelligence: dim('marketIntelligence'),
      futuresAnalysis: dim('futuresAnalysis'),
      humanAdvantageIndex: dim('humanAdvantageIndex'),
      careerROI: dim('careerROI'),
    },
    overallScore: Math.round(avg([map.safe.careerScore, map.growth.careerScore, map.bold.careerScore])),
    synthesis: out.synthesis,
    weightingRationale: out.weightingRationale,
    methodSummary: out.methodSummary || 'Four specialist agents (evidence, career DNA, market, directions) were weighed by an orchestrator.',
    observations: out.observations.length ? out.observations : [out.synthesis.split(/(?<=\.)\s/)[0]],
  }
}

// ------------------------------------------------------------------ Deep analysis (deterministic record)

const f1 = (n: number) => (Math.round(n * 10) / 10).toString()

export function calcString(c: CareerCandidate): string {
  const b = c.scoreBreakdown
  if (!b) return `score ${f1(c.careerScore)}`
  const w = WEIGHTS.overall
  return `${w.experience}×${f1(c.experienceScore)} + ${w.market}×${f1(c.marketScore)} + ${w.interest}×${f1(c.interestScore)} = ${f1(b.baseScore)}; × ${b.confidenceMultiplier} (confidence ${c.confidence}) = ${f1(c.careerScore)}`
}

export function buildDeepAnalysis(run: AgentRun, out: OrchestratorOutput, orchestratorMs: number | null = null): DeepAnalysis {
  const { evidenceGraph: g, careerDNA: d, marketGraph: m, careerMap: map, timings } = run
  const rankedMarket = [...m.directions].sort((a, b) =>
    (b.currentDemand + b.momentum + b.futurePotential) - (a.currentDemand + a.momentum + a.futurePotential))

  const agents: DeepAnalysisAgent[] = [
    {
      id: 'aggregator', name: 'Evidence Aggregator', role: 'Reads your history and separates what is proven from what is inferred.',
      durationMs: timings.aggregator ?? null, confidence: pct(g.confidence),
      insights: [
        `${g.evidence.length} pieces of evidence and ${g.capabilities.length} capabilities identified.`,
        ...top(g.capabilities, 3).map((c) => `Strongest evidenced capability: ${c.name} (level ${Math.round(c.level)}).`).slice(0, 1),
        ...top(g.patterns, 2),
        ...top(g.uncertainties, 1).map((u) => `Open question: ${u}`),
      ],
    },
    {
      id: 'careerDna', name: 'Career DNA', role: 'Works out who you are professionally, from your past only, without looking at the market.',
      durationMs: timings.careerDna ?? null, confidence: pct(d.confidence),
      insights: [
        `Current identity: ${d.currentIdentity}`,
        ...(d.emergingIdentity.length ? [`Emerging: ${top(d.emergingIdentity, 3).join(', ')}`] : []),
        ...(d.strongestCapabilities.length ? [`Strongest: ${top(d.strongestCapabilities, 3).map((c) => c.name).join(', ')}`] : []),
        ...(d.distinctiveStrengths.length ? [`Distinctive: ${top(d.distinctiveStrengths, 2).map((c) => c.name).join(', ')}`] : []),
        d.careerTrajectory,
      ].filter(Boolean),
    },
    {
      id: 'market', name: 'Market Intelligence', role: 'Looks at where demand and capability needs are moving, independent of you.',
      durationMs: timings.market ?? null, confidence: pct(m.confidence),
      insights: [
        `${m.directions.length} career directions assessed across current, 1–3, 3–5 and 5–10 year horizons.`,
        ...top(rankedMarket, 3).map((x) => `${x.name}: demand ${Math.round(x.currentDemand)}, momentum ${Math.round(x.momentum)}, future ${Math.round(x.futurePotential)}.`),
        ...(rankedMarket[0]?.invalidationRisks?.[0] ? [`Main risk to watch: ${rankedMarket[0].invalidationRisks[0]}`] : []),
      ],
    },
    {
      id: 'directions', name: 'Direction Generator', role: 'Proposes distinct directions and scores each on Experience, Market and Interest.',
      durationMs: timings.directions ?? null, confidence: pct(map.confidence),
      insights: [
        `${map.candidates.length} distinct directions scored; three selected.`,
        `Safe: ${map.safe.direction} (${f1(map.safe.careerScore)}).`,
        `Growth: ${map.growth.direction} (${f1(map.growth.careerScore)}).`,
        `Bold: ${map.bold.direction} (${f1(map.bold.careerScore)}).`,
      ],
    },
    {
      id: 'orchestrator', name: 'Orchestrator', role: 'Weighs the four agents and produces the overall recommendation.',
      durationMs: orchestratorMs, confidence: pct(map.confidence),
      insights: [out.synthesis, ...(out.recommendation?.whyThisOrder ? [out.recommendation.whyThisOrder] : [])],
    },
  ]

  const candidates: DeepAnalysisCandidate[] = map.candidates.slice(0, 12).map((c) => ({
    direction: c.direction, archetype: c.archetype,
    experience: c.experienceScore, market: c.marketScore, interest: c.interestScore,
    confidence: c.confidence, score: c.careerScore, distance: c.capabilityDistance, calc: calcString(c),
  }))

  return {
    generatedAt: new Date().toISOString(),
    agents,
    evidence: {
      count: g.evidence.length,
      capabilities: top(g.capabilities, 8).map((c) => ({ name: c.name, level: Math.round(c.level) })),
      patterns: top(g.patterns, 5), uncertainties: top(g.uncertainties, 4), contradictions: top(g.contradictions, 3),
    },
    market: {
      basis: "Based on the model's general market knowledge. Live job-market and industry data feeds are not connected yet.",
      directions: top(rankedMarket, 8).map((x) => ({
        name: x.name, demand: Math.round(x.currentDemand), momentum: Math.round(x.momentum),
        future: Math.round(x.futurePotential), resilience: Math.round(x.resilience), thesis: x.futureThesis,
      })),
    },
    candidates,
    orchestration: {
      formula: map.formula,
      weights: [
        { label: 'Experience', value: `${WEIGHTS.overall.experience * 100}%` },
        { label: 'Market', value: `${WEIGHTS.overall.market * 100}%` },
        { label: 'Interest', value: `${WEIGHTS.overall.interest * 100}%` },
      ],
      confidenceRule: 'Each score is multiplied by 0.75 + 0.25 × evidence confidence, so thin evidence lowers a score by at most 25% and never removes a direction.',
      selectionRules: [
        `Safe: best score within capability distance ${SELECTION.safeMaxDistance} of what you do now.`,
        `Growth: best score with a moderate gap (distance ${SELECTION.growthMinDistance}–${SELECTION.growthMaxDistance}).`,
        `Bold: highest market + interest potential with a larger but plausible gap (distance ${SELECTION.boldMinDistance}–${SELECTION.boldMaxDistance}).`,
        'The three picks must be genuinely different kinds of work, not renamed versions of one job.',
      ],
      notes: map.validation,
      narrative: out.weightingRationale,
      whyThisOrder: out.recommendation?.whyThisOrder ?? '',
      tradeoffs: out.recommendation?.tradeoffs ?? [],
      caveats: out.recommendation?.caveats ?? [],
    },
  }
}

