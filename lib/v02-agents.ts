import { routeCall } from '@/lib/router'
import type { ExtractedCareerData } from '@/types/wingspan'
import type { EvidenceGraph, CareerDNA, MarketGraph, CareerMap } from '@/types/career-intelligence'
import { evidenceGraphSchema, careerDNASchema, marketGraphSchema, careerDirectionDraftSchema } from '@/lib/agent-contracts'
import { buildCareerMap } from '@/lib/career-scoring'

const json = (s:string) => JSON.parse(s.replace(/^\`\`\`(?:json)?\n?/m,'').replace(/\n?\`\`\`$/m,'').trim())

async function call(system:string, user:string, max=7000){ return json(await routeCall(system,user,'analysis',max)) }

export async function aggregatorAgent(data:ExtractedCareerData, interests:string[]):Promise<EvidenceGraph>{
 const system = `You are Aggregator Agent v0.2. Extract evidence, never recommend careers. Build an evidence graph. Distinguish observed evidence from inference. Do not invent metrics, projects, dates or outcomes. Evidence strength hierarchy: measurable business impact 100, measurable product impact 95, shipped transformation 90, successful project 80, repeated ownership 70, participation 50, claimed experience 35. Important capabilities need recurrence across contexts. Include uncertainties and contradictions. Return only JSON matching the requested structure.`
 const user = `Career data: ${JSON.stringify(data)}\nInterests: ${JSON.stringify(interests)}\nBuild version 0.2 EvidenceGraph with evidence, inferred capabilities, recurring patterns, uncertainties, contradictions and constraints.`
 const out=await call(system,user)
 return evidenceGraphSchema.parse(out) as unknown as EvidenceGraph
}

export async function careerAlphaAgent(graph:EvidenceGraph, data:ExtractedCareerData, interests:string[]):Promise<CareerDNA>{
 const system = `You are Career Alpha Agent v0.2. Analyze only internal/past evidence plus stated interests. Do not use current market information or recommend a career direction. Distinguish Current identity, Emerging identity, and Underlying capability. Seniority is not capability maturity. A stated interest without behavioural evidence is an interest signal, not a demonstrated strength. Return only JSON.`
 const user = `EvidenceGraph: ${JSON.stringify(graph)}\nSource timeline: ${JSON.stringify(data.timeline)}\nProjects: ${JSON.stringify(data.projects)}\nSkills: ${JSON.stringify(data.skills)}\nInterests: ${JSON.stringify(interests)}\nCreate CareerDNA v0.2 with strongest/transferable/distinctive capabilities, patterns, trajectory, maturity, deep interest signals, constraints and confidence.`
 const out=await call(system,user)
 return careerDNASchema.parse(out) as unknown as CareerDNA
}

export async function marketIntelligenceAgent(locationHints:string[]=[]):Promise<MarketGraph>{
 const system = `You are Market Intelligence Agent v0.2. Analyze the external market independently of any person. Prefer hard labour-market data, then employer signals, macro trends and credible forecasts. Weak signals may support but never dominate. Think current, 1-3 years, 3-5 years, 5-10 years. Separate structural trend from hype. Return only JSON. Never personalize recommendations.`
 const user = `Geography hints: ${JSON.stringify(locationHints)}\nBuild a MarketGraph for major professional/design/technology career directions likely relevant to modern knowledge workers. Include current demand, momentum, future potential, resilience, adjacency, capabilities, future thesis, invalidation risks, geography, horizon, evidence provenance and confidence. Cover enough distinct directions for downstream candidate generation.`
 const out=await call(system,user,10000)
 return marketGraphSchema.parse(out) as unknown as MarketGraph
}

// The model proposes candidate directions and 0-100 component sub-scores. The final scores and the
// Safe / Growth / Bold picks are computed deterministically in lib/career-scoring.ts, so they are
// reproducible and auditable.
export async function careerDirectionGenerator(dna:CareerDNA, market:MarketGraph):Promise<CareerMap>{
 const system=`You are Career Direction Generator v0.2, the decision agent. Do not re-parse resumes and do not independently research markets. Consume CareerDNA and MarketGraph only. Generate 8-15 meaningfully different candidate directions: genuinely different kinds of work, not several names for the same job. For each, give honest 0-100 sub-scores. Do not compute final scores and do not choose Safe, Growth or Bold; the application does both deterministically. Experience sub-scores must come from demonstrated evidence in CareerDNA. Market sub-scores must come from MarketGraph, never from hype. Interest sub-scores must keep stated interest separate from behavioural evidence. Demand alone must not make a direction look good for this person. Weak evidence should lower the evidence confidence, not erase the possibility. Every candidate must answer why this person, why this direction, why now. Return only JSON.`
 const user=`CareerDNA: ${JSON.stringify(dna)}\nMarketGraph: ${JSON.stringify(market)}\nReturn JSON of the form {"candidates":[{"direction":string,"experience":{"capability":0-100,"project":0-100,"transferable":0-100,"context":0-100,"recency":0-100},"market":{"demand":0-100,"growth":0-100,"future":0-100,"adjacency":0-100,"relevance":0-100},"interest":{"direct":0-100,"behavioural":0-100,"stated":0-100,"curiosity":0-100,"adjacency":0-100},"capabilityDistance":0-100,"confidence":0-1,"whyThisPerson":string,"whyNow":string,"evidenceIds":string[],"rationale":string}]}. capabilityDistance is 0 when the person already does this work and 100 for a completely different field. confidence is how well the evidence supports this specific direction.`
 const out=await call(system,user,10000)
 const draft=careerDirectionDraftSchema.safeParse(out)
 if(!draft.success) throw new Error('Career direction generation returned invalid structured data.')
 return buildCareerMap(draft.data, dna.confidence)
}
