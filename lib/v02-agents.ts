import { routeCall } from '@/lib/router'
import type { ExtractedCareerData } from '@/types/wingspan'
import type { EvidenceGraph, CareerDNA, MarketGraph, CareerMap } from '@/types/career-intelligence'
import { evidenceGraphSchema, careerDNASchema, marketGraphSchema, careerMapSchema } from '@/lib/agent-contracts'

const json = (s:string) => JSON.parse(s.replace(/^\`\`\`(?:json)?\n?/m,'').replace(/\n?\`\`\`$/m,'').trim())

async function call(system:string, user:string, max=7000){ return json(await routeCall(system,user,'analysis',max)) }

export async function aggregatorAgent(data:ExtractedCareerData, interests:string[]):Promise<EvidenceGraph>{
 const system = `You are Aggregator Agent v0.2. Extract evidence, never recommend careers. Build an evidence graph. Distinguish observed evidence from inference. Do not invent metrics, projects, dates or outcomes. Evidence strength hierarchy: measurable business impact 100, measurable product impact 95, shipped transformation 90, successful project 80, repeated ownership 70, participation 50, claimed experience 35. Important capabilities need recurrence across contexts. Include uncertainties and contradictions. Return only JSON matching the requested structure.`
 const user = `Career data: ${JSON.stringify(data)}\nInterests: ${JSON.stringify(interests)}\nBuild version 0.2 EvidenceGraph with evidence, inferred capabilities, recurring patterns, uncertainties, contradictions and constraints.`
 const out=await call(system,user)
 return evidenceGraphSchema.parse(out)
}

export async function careerAlphaAgent(graph:EvidenceGraph, data:ExtractedCareerData, interests:string[]):Promise<CareerDNA>{
 const system = `You are Career Alpha Agent v0.2. Analyze only internal/past evidence plus stated interests. Do not use current market information or recommend a career direction. Distinguish Current identity, Emerging identity, and Underlying capability. Seniority is not capability maturity. A stated interest without behavioural evidence is an interest signal, not a demonstrated strength. Return only JSON.`
 const user = `EvidenceGraph: ${JSON.stringify(graph)}\nSource timeline: ${JSON.stringify(data.timeline)}\nProjects: ${JSON.stringify(data.projects)}\nSkills: ${JSON.stringify(data.skills)}\nInterests: ${JSON.stringify(interests)}\nCreate CareerDNA v0.2 with strongest/transferable/distinctive capabilities, patterns, trajectory, maturity, deep interest signals, constraints and confidence.`
 const out=await call(system,user)
 return careerDNASchema.parse(out)
}

export async function marketIntelligenceAgent(locationHints:string[]=[]):Promise<MarketGraph>{
 const system = `You are Market Intelligence Agent v0.2. Analyze the external market independently of any person. Prefer hard labour-market data, then employer signals, macro trends and credible forecasts. Weak signals may support but never dominate. Think current, 1-3 years, 3-5 years, 5-10 years. Separate structural trend from hype. Return only JSON. Never personalize recommendations.`
 const user = `Geography hints: ${JSON.stringify(locationHints)}\nBuild a MarketGraph for major professional/design/technology career directions likely relevant to modern knowledge workers. Include current demand, momentum, future potential, resilience, adjacency, capabilities, future thesis, invalidation risks, geography, horizon, evidence provenance and confidence. Cover enough distinct directions for downstream candidate generation.`
 const out=await call(system,user,10000)
 return marketGraphSchema.parse(out)
}

function expScore(candidate:any, dna:CareerDNA){
 const names=[...dna.strongestCapabilities,...dna.transferableCapabilities,...dna.distinctiveStrengths].map((x:any)=>String(x.name).toLowerCase())
 const t=String(candidate.direction).toLowerCase()
 const matches=names.filter(n=>t.includes(n)||n.split(' ').some((w:string)=>w.length>3 && t.includes(w))).length
 return Math.min(100,45+matches*15+(dna.confidence*20))
}
function interestScore(direction:string, dna:CareerDNA){
 const hay=[...dna.deepInterestSignals,...dna.emergingIdentity].join(' ').toLowerCase()
 const words=direction.toLowerCase().split(/\W+/).filter(w=>w.length>4)
 const hits=words.filter(w=>hay.includes(w)).length
 return Math.min(100,25+hits*18)
}

export async function careerDirectionGenerator(dna:CareerDNA, market:MarketGraph):Promise<CareerMap>{
 const system=`You are Career Direction Generator v0.2, the decision agent. Do not re-parse resumes and do not independently research markets. Consume CareerDNA and MarketGraph only. Generate 8-15 meaningfully different candidate directions internally. Score each with Experience 40%, Market 40%, Interest 20%. Confidence may adjust final score but cannot overpower it. Select Safe, Growth, Bold with real directional diversity. Safe should maximize defensible continuity. Growth should maximize intersection of demonstrated capability, market momentum and interest. Bold can have larger capability distance when the future case is strong. Every recommendation must answer why this person, why this direction, why now. Never manufacture three recommendations when evidence is insufficient, but aim for three when reasonable. Return only JSON.`
 const user=`CareerDNA: ${JSON.stringify(dna)}\nMarketGraph: ${JSON.stringify(market)}\nReturn CareerMap v0.2. Base score = 0.40E + 0.40M + 0.20I. CareerScore = base * (0.75 + 0.25C), C = evidence confidence. Include evidenceIds as capability/direction references, capabilityDistance 0-100, and validation checks.`
 const out=await call(system,user,10000)
 let parsed:any
 try { parsed=careerMapSchema.parse(out) } catch {
   throw new Error('Career direction generation returned invalid structured data.')
 }
 return parsed
}