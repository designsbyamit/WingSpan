import { z } from 'zod'

// Schema contracts for the v0.2 agents.
//
// Rules used here:
//  - Numbers may arrive as JSON numbers or numeric strings; anything else (null, text) is rejected,
//    so a missing value is never silently turned into 0.
//  - Score-like numbers are clamped into their documented range.
//  - Narrative text and list fields default to empty rather than failing the whole agent.
//  - Enum fields fall back to the most conservative (lowest-claim) value.

const num = z.union([
  z.number(),
  z.string().trim().regex(/^-?\d+(\.\d+)?$/).transform(Number),
])
const pct = num.transform((n) => Math.min(100, Math.max(0, n)))
const unit = num.transform((n) => Math.min(1, Math.max(0, n)))
const strings = z.array(z.string()).default([])

// ---------------------------------------------------------------- Aggregator / evidence

export const evidenceSchema = z.object({
  id:z.string(), sourceType:z.string(), sourceId:z.string().optional(), statement:z.string(),
  category:z.string(), strength:z.number().min(0).max(100), recency:z.number().min(0).max(100),
  specificity:z.number().min(0).max(100), reliability:z.number().min(0).max(100),
  startDate:z.string().optional(), endDate:z.string().optional(), entities:z.array(z.string()).optional(),
  capabilities:z.array(z.string()).optional(), supports:z.array(z.string()).optional(),
  contradicts:z.array(z.string()).optional(), confidence:z.number().min(0).max(1)
})

export const inferredCapabilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  capabilityType: z.enum([
    'core', 'transferable', 'distinctive', 'domain', 'leadership', 'strategic', 'creative', 'collaboration',
  ]).catch('core'),
  level: num,
  evidenceIds: strings,
  recurrence: num,
  confidence: unit,
  rationale: z.string().default(''),
})

export const evidenceGraphSchema = z.object({
  version:z.literal('0.2'), evidence:z.array(evidenceSchema), capabilities:z.array(inferredCapabilitySchema),
  patterns:z.array(z.string()), uncertainties:z.array(z.string()), contradictions:z.array(z.string()),
  constraints:z.array(z.string()), confidence:z.number().min(0).max(1)
})

// ---------------------------------------------------------------- Career Alpha / DNA

const dimensionObject = z.object({
  name: z.string(),
  score: num,
  evidenceIds: strings,
  confidence: unit,
  rationale: z.string().default(''),
})

// The model sometimes returns a bare capability name instead of a scored object. Keep the name, but
// mark the missing score honestly (score 0, confidence 0) rather than inventing one.
export const dnaDimensionSchema = z.union([
  dimensionObject,
  z.string().min(1).transform((name) => ({
    name, score: 0, evidenceIds: [] as string[], confidence: 0, rationale: '',
  })),
])

export const careerDNASchema = z.object({
  version:z.literal('0.2'), currentIdentity:z.string(), emergingIdentity:z.array(z.string()),
  underlyingCapabilities:z.array(z.string()), strongestCapabilities:z.array(dnaDimensionSchema),
  transferableCapabilities:z.array(dnaDimensionSchema), distinctiveStrengths:z.array(dnaDimensionSchema),
  workingPatterns:z.array(z.string()), problemSolvingPatterns:z.array(z.string()),
  leadershipPatterns:z.array(z.string()), domainExpertise:z.array(z.string()),
  strategicMaturity:z.string(), creativePatterns:z.array(z.string()), collaborationPatterns:z.array(z.string()),
  careerTrajectory:z.string(), capabilityMaturity:z.string(), deepInterestSignals:z.array(z.string()),
  constraints:z.array(z.string()), confidence:z.number().min(0).max(1)
})

// ---------------------------------------------------------------- Market intelligence

export const marketEvidenceSchema = z.object({
  id: z.string(),
  direction: z.string().default(''),
  signal: z.string(),
  source: z.string().default(''),
  sourceType: z.enum([
    'government', 'labour_market', 'employer', 'research', 'industry', 'investment', 'expert', 'weak_signal',
  ]).catch('weak_signal'),
  geography: z.string().default(''),
  observedAt: z.string().default(''),
  horizon: z.enum(['current', '1-3_years', '3-5_years', '5-10_years']).catch('current'),
  directionality: z.enum(['positive', 'negative', 'uncertain']).catch('uncertain'),
  magnitude: num,
  reliability: unit,
  supportingEvidence: strings,
})

export const marketDirectionSchema = z.object({
  name: z.string(),
  currentDemand: pct,
  momentum: pct,
  futurePotential: pct,
  resilience: pct,
  adjacency: strings,
  currentCapabilities: strings,
  growingCapabilities: strings,
  decliningCapabilities: strings,
  futureThesis: z.string().default(''),
  invalidationRisks: strings,
  geography: strings,
  horizon: z.string().default(''),
  confidence: unit,
  evidence: z.array(marketEvidenceSchema).default([]),
})

export const capabilityRequirementSchema = z.object({
  capability: z.string(),
  importance: pct,
  levelRequired: pct,
  futureImportance: pct,
  marketDemand: pct,
})

export const marketGraphSchema = z.object({
  version:z.literal('0.2'),
  directions:z.array(marketDirectionSchema),
  capabilityRequirements:z.array(capabilityRequirementSchema),
  confidence:z.number().min(0).max(1)
})

// ---------------------------------------------------------------- Career direction

// What the model returns: raw 0-100 component sub-scores. The app computes the final scores.
export const candidateDraftSchema = z.object({
  direction: z.string().trim().min(1),
  experience: z.object({
    capability: pct, project: pct, transferable: pct, context: pct, recency: pct,
  }),
  market: z.object({
    demand: pct, growth: pct, future: pct, adjacency: pct, relevance: pct,
    // 0 = very safe, 100 = highly exposed (automation, hype, saturation, decline). Optional for old drafts.
    risk: pct.optional(),
  }),
  interest: z.object({
    direct: pct, behavioural: pct, stated: pct, curiosity: pct, adjacency: pct,
  }),
  capabilityDistance: pct,
  risks: z.array(z.string()).optional(),
  confidence: unit.optional(),
  whyThisPerson: z.string().default(''),
  whyNow: z.string().default(''),
  evidenceIds: strings,
  rationale: z.string().default(''),
})

export const careerDirectionDraftSchema = z.object({
  candidates: z.array(candidateDraftSchema),
})

export type CandidateDraft = z.infer<typeof candidateDraftSchema>
export type CareerDirectionDraft = z.infer<typeof careerDirectionDraftSchema>

// What the app returns after deterministic scoring and selection.
export const scoreBreakdownSchema = z.object({
  experience: z.object({
    capability: pct, project: pct, transferable: pct, context: pct, recency: pct,
  }),
  market: z.object({
    demand: pct, growth: pct, future: pct, adjacency: pct, relevance: pct, risk: pct.optional(),
  }),
  interest: z.object({
    direct: pct, behavioural: pct, stated: pct, curiosity: pct, adjacency: pct,
  }),
  baseScore: pct,
  confidenceMultiplier: num,
})

export const careerCandidateSchema = z.object({
  direction: z.string(),
  experienceScore: pct,
  marketScore: pct,
  interestScore: pct,
  confidence: unit,
  careerScore: pct,
  archetype: z.enum(['safe', 'growth', 'bold', 'reserve']),
  whyThisPerson: z.string().default(''),
  whyNow: z.string().default(''),
  evidenceIds: strings,
  capabilityDistance: pct,
  rationale: z.string().default(''),
  scoreBreakdown: scoreBreakdownSchema.optional(),
  baseTitle: z.string().optional(),
  family: z.string().optional(),
  focus: z.string().nullable().optional(),
  marketRisk: pct.optional(),
  risks: strings.optional(),
})

export const careerMapSchema = z.object({
  version:z.literal('0.2'),
  formula:z.string(),
  candidates:z.array(careerCandidateSchema),
  safe:careerCandidateSchema,
  growth:careerCandidateSchema,
  bold:careerCandidateSchema,
  confidence:unit,
  validation:z.array(z.string())
})
