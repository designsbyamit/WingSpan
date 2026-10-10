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
  /** Deterministic inputs behind the scores, so every recommendation is auditable. */
  scoreBreakdown?:CareerScoreBreakdown
  /** Canonical job title (lib/role-taxonomy.ts) and optional focus, e.g. "Head of Design" + "AI Products". */
  baseTitle?:string
  family?:string
  focus?:string|null
  /** 0 = safe, 100 = highly exposed to automation, hype, saturation or decline. */
  marketRisk?:number
  risks?:string[]
}
export interface CareerScoreBreakdown {
  experience:{ capability:number; project:number; transferable:number; context:number; recency:number }
  market:{ demand:number; growth:number; future:number; adjacency:number; relevance:number; risk?:number }
  interest:{ direct:number; behavioural:number; stated:number; curiosity:number; adjacency:number }
  /** 0.40E + 0.40M + 0.20I, before the confidence multiplier */
  baseScore:number
  /** 0.75 + 0.25 * evidenceConfidence */
  confidenceMultiplier:number
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

/** One agent's contribution, as shown in the "Deep analysis" panel. */
export interface DeepAnalysisAgent {
  id:'aggregator'|'careerDna'|'market'|'directions'|'orchestrator'|'growth'
  name:string
  role:string
  durationMs:number|null
  confidence:number|null
  insights:string[]
}
export interface DeepAnalysisCandidate {
  direction:string
  archetype:CareerCandidate['archetype']
  experience:number
  market:number
  interest:number
  confidence:number
  score:number
  distance:number
  calc:string
  /** 0 = safe, 100 = highly exposed; null when the agent gave no risk */
  risk?:number|null
  risks?:string[]
}
/** A compact, user-facing record of how the recommendation was reached. No simulation internals. */
export interface DeepAnalysis {
  generatedAt:string
  agents:DeepAnalysisAgent[]
  evidence:{ count:number; capabilities:{name:string;level:number}[]; patterns:string[]; uncertainties:string[]; contradictions:string[] }
  market:{
    basis:string
    directions:{name:string;demand:number;momentum:number;future:number;resilience:number;thesis:string;risks?:string[]}[]
    /** The dated, cited observations from the market database that the agent was given. */
    evidence?:{statement:string;publisher:string;when:string;reliability:number;region:string}[]
  }
  candidates:DeepAnalysisCandidate[]
  orchestration:{
    formula:string
    weights:{ label:string; value:string }[]
    confidenceRule:string
    selectionRules:string[]
    notes:string[]
    narrative:string
    whyThisOrder:string
    tradeoffs:string[]
    caveats:string[]
  }
}
