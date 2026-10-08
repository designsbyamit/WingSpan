import { z } from 'zod'

export const evidenceSchema = z.object({
  id:z.string(), sourceType:z.string(), sourceId:z.string().optional(), statement:z.string(),
  category:z.string(), strength:z.number().min(0).max(100), recency:z.number().min(0).max(100),
  specificity:z.number().min(0).max(100), reliability:z.number().min(0).max(100),
  startDate:z.string().optional(), endDate:z.string().optional(), entities:z.array(z.string()).optional(),
  capabilities:z.array(z.string()).optional(), supports:z.array(z.string()).optional(),
  contradicts:z.array(z.string()).optional(), confidence:z.number().min(0).max(1)
})

export const evidenceGraphSchema = z.object({
  version:z.literal('0.2'), evidence:z.array(evidenceSchema), capabilities:z.array(z.any()),
  patterns:z.array(z.string()), uncertainties:z.array(z.string()), contradictions:z.array(z.string()),
  constraints:z.array(z.string()), confidence:z.number().min(0).max(1)
})

export const careerDNASchema = z.object({
  version:z.literal('0.2'), currentIdentity:z.string(), emergingIdentity:z.array(z.string()),
  underlyingCapabilities:z.array(z.string()), strongestCapabilities:z.array(z.any()),
  transferableCapabilities:z.array(z.any()), distinctiveStrengths:z.array(z.any()),
  workingPatterns:z.array(z.string()), problemSolvingPatterns:z.array(z.string()),
  leadershipPatterns:z.array(z.string()), domainExpertise:z.array(z.string()),
  strategicMaturity:z.string(), creativePatterns:z.array(z.string()), collaborationPatterns:z.array(z.string()),
  careerTrajectory:z.string(), capabilityMaturity:z.string(), deepInterestSignals:z.array(z.string()),
  constraints:z.array(z.string()), confidence:z.number().min(0).max(1)
})

export const marketGraphSchema = z.object({
  version:z.literal('0.2'), directions:z.array(z.any()), capabilityRequirements:z.array(z.any()),
  confidence:z.number().min(0).max(1)
})

export const careerMapSchema = z.object({
  version:z.literal('0.2'), formula:z.string(), candidates:z.array(z.any()),
  safe:z.any(), growth:z.any(), bold:z.any(), confidence:z.number().min(0).max(1), validation:z.array(z.string())
})