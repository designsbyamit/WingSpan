export type EvidenceSourceType = 'resume'|'portfolio'|'project'|'education'|'interest'|'behaviour'|'conversation'
export type EvidenceCategory = 'role'|'responsibility'|'skill'|'capability'|'achievement'|'impact'|'interest'|'behaviour'|'trajectory'|'constraint'
export interface Evidence {
  id:string
  sourceType:EvidenceSourceType
  sourceId?:string
  statement:string
  category:EvidenceCategory
  strength:number
  recency:number
  specificity:number
  reliability:number
  startDate?:string
  endDate?:string
  entities?:string[]
  capabilities?:string[]
  supports?:string[]
  contradicts?:string[]
  confidence:number
}
export interface InferredCapability {
  id:string
  name:string
  capabilityType:'core'|'transferable'|'distinctive'|'domain'|'leadership'|'strategic'|'creative'|'collaboration'
  level:number
  evidenceIds:string[]
  recurrence:number
  confidence:number
  rationale:string
}
export interface EvidenceGraph {
  version:'0.2'
  evidence:Evidence[]
  capabilities:InferredCapability[]
  patterns:string[]
  uncertainties:string[]
  contradictions:string[]
  constraints:string[]
  confidence:number
}
export interface CareerDNADimension {
  name:string
  score:number
  evidenceIds:string[]
  confidence:number
  rationale:string
}
export interface CareerDNA {
  version:'0.2'
  currentIdentity:string
  emergingIdentity:string[]
  underlyingCapabilities:string[]
  strongestCapabilities:CareerDNADimension[]
  transferableCapabilities:CareerDNADimension[]
  distinctiveStrengths:CareerDNADimension[]
  workingPatterns:string[]
  problemSolvingPatterns:string[]
  leadershipPatterns:string[]
  domainExpertise:string[]
  strategicMaturity:string
  creativePatterns:string[]
  collaborationPatterns:string[]
  careerTrajectory:string
  capabilityMaturity:string
  deepInterestSignals:string[]
  constraints:string[]
  confidence:number
}
export interface MarketEvidence {
  id:string
  direction:string
  signal:string
  source:string
  sourceType:'government'|'labour_market'|'employer'|'research'|'industry'|'investment'|'expert'|'weak_signal'
  geography:string
  observedAt:string
  horizon:'current'|'1-3_years'|'3-5_years'|'5-10_years'
  directionality:'positive'|'negative'|'uncertain'
  magnitude:number
  reliability:number
  supportingEvidence:string[]
}
export interface CapabilityRequirement {
  capability:string
  importance:number
  levelRequired:number
  futureImportance:number
  marketDemand:number
}
export interface MarketGraph {
  version:'0.2'
  directions: { name:string; currentDemand:number; momentum:number; futurePotential:number; resilience:number; adjacency:string[]; currentCapabilities:string[]; growingCapabilities:string[]; decliningCapabilities:string[]; futureThesis:string; invalidationRisks:string[]; geography:string[]; horizon:string; confidence:number; evidence:MarketEvidence[] }[]
  capabilityRequirements:CapabilityRequirement[]
  confidence:number
}
export interface CareerCandidate {
  direction:string
  experienceScore:number
  marketScore:number
  interestScore:number
  confidence:number
  careerScore:number
  archetype:'safe'|'growth'|'bold'|'reserve'
  whyThisPerson:string
  whyNow:string
  evidenceIds:string[]
  capabilityDistance:number
  rationale:string
}
export interface CareerMap {
  version:'0.2'
  formula:'0.40E + 0.40M + 0.20I, confidence-adjusted'
  candidates:CareerCandidate[]
  safe:CareerCandidate
  growth:CareerCandidate
  bold:CareerCandidate
  confidence:number
  validation:string[]
}