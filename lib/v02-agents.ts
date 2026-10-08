import { routeCall } from '@/lib/router'
import type { ExtractedCareerData } from '@/types/wingspan'
import type { EvidenceGraph, CareerDNA, MarketGraph, CareerMap } from '@/types/career-intelligence'
import { evidenceGraphSchema, careerDNASchema, marketGraphSchema, careerDirectionDraftSchema } from '@/lib/agent-contracts'
import { buildCareerMap } from '@/lib/career-scoring'

const json = (s:string) => JSON.parse(s.replace(/^\`\`\`(?:json)?\n?/m,'').replace(/\n?\`\`\`$/m,'').trim())

async function call(system:string, user:string, max=7000){ return json(await routeCall(system,user,'analysis',max)) }

/** Summarise validation problems compactly enough to hand back to the model. */
export function describeIssues(err: unknown): string {
 const issues = (err as { issues?: { path: (string|number)[]; message: string }[] })?.issues
 if (!Array.isArray(issues)) return err instanceof Error ? err.message : String(err)
 const lines = issues.slice(0, 12).map((i) => `- ${i.path.join('.') || '(root)'}: ${i.message}`)
 return lines.join('\n') + (issues.length > 12 ? `\n- ...and ${issues.length - 12} more` : '')
}

/**
 * Ask for JSON, validate it, and if it does not match the contract ask once more with the exact
 * problems listed. Smaller models often get a field name wrong on the first try; a pointed retry fixes it.
 */
export async function callValidated<T>(system:string, user:string, parse:(out:unknown)=>T, max=7000, ask=call):Promise<T>{
 let out: unknown
 try {
  out = await ask(system,user,max)
  return parse(out)
 } catch (first) {
  console.warn('Agent output failed validation, retrying once:', describeIssues(first).slice(0, 300))
  const retryUser = `${user}\n\nYour previous reply did not match the required JSON structure:\n${describeIssues(first)}\n\nReturn the COMPLETE corrected JSON again, using exactly the field names and types specified. Return only JSON.`
  return parse(await ask(system,retryUser,max))
 }
}

export async function aggregatorAgent(data:ExtractedCareerData, interests:string[]):Promise<EvidenceGraph>{
 const system = `You are Aggregator Agent v0.2. Extract evidence, never recommend careers. Build an evidence graph. Distinguish observed evidence from inference. Do not invent metrics, projects, dates or outcomes. Evidence strength hierarchy: measurable business impact 100, measurable product impact 95, shipped transformation 90, successful project 80, repeated ownership 70, participation 50, claimed experience 35. Important capabilities need recurrence across contexts. Include uncertainties and contradictions. Return only JSON matching the requested structure.`
 const user = `Career data: ${JSON.stringify(data)}\nInterests: ${JSON.stringify(interests)}\nBuild version 0.2 EvidenceGraph with evidence, inferred capabilities, recurring patterns, uncertainties, contradictions and constraints.\nReturn exactly this JSON structure: {"version":"0.2","evidence":[{"id":string,"sourceType":string,"sourceId":string,"statement":string,"category":string,"strength":0-100,"recency":0-100,"specificity":0-100,"reliability":0-100,"startDate":string,"endDate":string,"entities":string[],"capabilities":string[],"supports":string[],"contradicts":string[],"confidence":0-1}],"capabilities":[{"id":string,"name":string,"capabilityType":"core"|"transferable"|"distinctive"|"domain"|"leadership"|"strategic"|"creative"|"collaboration","level":0-100,"evidenceIds":string[],"recurrence":number,"confidence":0-1,"rationale":string}],"patterns":string[],"uncertainties":string[],"contradictions":string[],"constraints":string[],"confidence":0-1}. Every evidence item needs id, sourceType, statement, category and all four 0-100 scores. startDate, endDate and sourceId may be omitted.`
 return callValidated(system,user,(o)=>evidenceGraphSchema.parse(o) as unknown as EvidenceGraph)
}

export async function careerAlphaAgent(graph:EvidenceGraph, data:ExtractedCareerData, interests:string[]):Promise<CareerDNA>{
 const system = `You are Career Alpha Agent v0.2. Analyze only internal/past evidence plus stated interests. Do not use current market information or recommend a career direction. Distinguish Current identity, Emerging identity, and Underlying capability. Seniority is not capability maturity. A stated interest without behavioural evidence is an interest signal, not a demonstrated strength. Return only JSON.`
 const user = `EvidenceGraph: ${JSON.stringify(graph)}\nSource timeline: ${JSON.stringify(data.timeline)}\nProjects: ${JSON.stringify(data.projects)}\nSkills: ${JSON.stringify(data.skills)}\nInterests: ${JSON.stringify(interests)}\nCreate CareerDNA v0.2 with strongest/transferable/distinctive capabilities, patterns, trajectory, maturity, deep interest signals, constraints and confidence.\nReturn exactly this JSON structure: {"version":"0.2","currentIdentity":string,"emergingIdentity":string[],"underlyingCapabilities":string[],"strongestCapabilities":[{"name":string,"score":0-100,"evidenceIds":string[],"confidence":0-1,"rationale":string}],"transferableCapabilities":[{"name":string,"score":0-100,"evidenceIds":string[],"confidence":0-1,"rationale":string}],"distinctiveStrengths":[{"name":string,"score":0-100,"evidenceIds":string[],"confidence":0-1,"rationale":string}],"workingPatterns":string[],"problemSolvingPatterns":string[],"leadershipPatterns":string[],"domainExpertise":string[],"strategicMaturity":string,"creativePatterns":string[],"collaborationPatterns":string[],"careerTrajectory":string,"capabilityMaturity":string,"deepInterestSignals":string[],"constraints":string[],"confidence":0-1}.`
 return callValidated(system,user,(o)=>careerDNASchema.parse(o) as unknown as CareerDNA)
}

export async function marketIntelligenceAgent(locationHints:string[]=[]):Promise<MarketGraph>{
 const system = `You are Market Intelligence Agent v0.2. Analyze the external market independently of any person. Prefer hard labour-market data, then employer signals, macro trends and credible forecasts. Weak signals may support but never dominate. Think current, 1-3 years, 3-5 years, 5-10 years. Separate structural trend from hype. Return only JSON. Never personalize recommendations.`
 const user = `Geography hints: ${JSON.stringify(locationHints)}\nBuild a MarketGraph for major professional/design/technology career directions likely relevant to modern knowledge workers. Include current demand, momentum, future potential, resilience, adjacency, capabilities, future thesis, invalidation risks, geography, horizon, evidence provenance and confidence. Cover enough distinct directions for downstream candidate generation.\nReturn exactly this JSON structure: {"version":"0.2","directions":[{"name":string,"currentDemand":0-100,"momentum":0-100,"futurePotential":0-100,"resilience":0-100,"adjacency":string[],"currentCapabilities":string[],"growingCapabilities":string[],"decliningCapabilities":string[],"futureThesis":string,"invalidationRisks":string[],"geography":string[],"horizon":string,"confidence":0-1,"evidence":[{"id":string,"direction":string,"signal":string,"source":string,"sourceType":"government"|"labour_market"|"employer"|"research"|"industry"|"investment"|"expert"|"weak_signal","geography":string,"observedAt":string,"horizon":"current"|"1-3_years"|"3-5_years"|"5-10_years","directionality":"positive"|"negative"|"uncertain","magnitude":number,"reliability":0-1,"supportingEvidence":string[]}]}],"capabilityRequirements":[{"capability":string,"importance":0-100,"levelRequired":0-100,"futureImportance":0-100,"marketDemand":0-100}],"confidence":0-1}. Keep each direction to at most 3 evidence items.`
 return callValidated(system,user,(o)=>marketGraphSchema.parse(o) as unknown as MarketGraph,10000)
}

// The model proposes candidate directions and 0-100 component sub-scores. The final scores and the
// Safe / Growth / Bold picks are computed deterministically in lib/career-scoring.ts, so they are
// reproducible and auditable.
export async function careerDirectionGenerator(dna:CareerDNA, market:MarketGraph):Promise<CareerMap>{
 const system=`You are Career Direction Generator v0.2, the decision agent. Do not re-parse resumes and do not independently research markets. Consume CareerDNA and MarketGraph only. Generate 8-15 meaningfully different candidate directions: genuinely different kinds of work, not several names for the same job. For each, give honest 0-100 sub-scores. Do not compute final scores and do not choose Safe, Growth or Bold; the application does both deterministically. Experience sub-scores must come from demonstrated evidence in CareerDNA. Market sub-scores must come from MarketGraph, never from hype. Interest sub-scores must keep stated interest separate from behavioural evidence. Demand alone must not make a direction look good for this person. Weak evidence should lower the evidence confidence, not erase the possibility. Every candidate must answer why this person, why this direction, why now. Return only JSON.`
 const user=`CareerDNA: ${JSON.stringify(dna)}\nMarketGraph: ${JSON.stringify(market)}\nReturn JSON of the form {"candidates":[{"direction":string,"experience":{"capability":0-100,"project":0-100,"transferable":0-100,"context":0-100,"recency":0-100},"market":{"demand":0-100,"growth":0-100,"future":0-100,"adjacency":0-100,"relevance":0-100},"interest":{"direct":0-100,"behavioural":0-100,"stated":0-100,"curiosity":0-100,"adjacency":0-100},"capabilityDistance":0-100,"confidence":0-1,"whyThisPerson":string,"whyNow":string,"evidenceIds":string[],"rationale":string}]}. capabilityDistance is 0 when the person already does this work and 100 for a completely different field. confidence is how well the evidence supports this specific direction.`
 const draft=await callValidated(system,user,(o)=>careerDirectionDraftSchema.parse(o),10000)
 return buildCareerMap(draft, dna.confidence)
}
