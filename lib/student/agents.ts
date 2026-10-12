import { z } from 'zod'
import { callValidated } from '@/lib/v02-agents'
import type { EdgeCard, ResumeFact, SourceRef } from '@/lib/student/types'
import type { StudentEvidence } from '@/lib/student/evidence'

// Edge Finder and Target Planner. They may only reason from what is passed in: the student's resume facts (R-ids),
// dated published evidence (S-ids) and the employers we track. The Verifier then checks every id they cite.

const txt = z.string().trim()
const list = z.array(txt).default([])
const rids = z.array(txt).default([])

export const edgeSchema = z.object({
  headline: txt.min(8),
  differentiators: z.array(z.object({
    title: txt.min(3), whyHirersCare: txt.min(5), evidence: rids,
    strength: z.string().transform((s) => (s.toLowerCase().startsWith('demon') ? 'demonstrated' : 'indicated') as 'demonstrated' | 'indicated').default('indicated'),
  })).min(1).max(5),
  alreadyProven: z.array(z.object({ text: txt.min(5), evidence: rids })).default([]),
  honestGaps: list,
})

const claim = z.object({ text: txt.min(5), sources: rids })
export const plannerSchema = z.object({
  market: z.array(claim).default([]),
  lanes: z.array(z.object({
    name: txt.min(3), whyYou: txt.min(5), evidence: rids, demand: claim,
    whoHires: list, proofNeeded: list, honestOdds: txt.default(''),
  })).min(1).max(3),
  bridge: z.object({ title: txt.min(3), why: txt.min(5), whereToLook: list, claim }),
  days: z.array(z.object({ day: z.coerce.number(), action: txt.default(''), why: txt.default(''), minutes: z.coerce.number().default(20), guidance: txt.default('') })).default([]),
  caveats: list,
})
export type PlannerOutput = z.infer<typeof plannerSchema>

const LANES = [
  'Product / UX / UI designer (product companies and startups)', 'Visual, brand and communication design', 'Interaction and motion design',
  'UX research associate', 'Design systems and design operations associate', 'Content design and UX writing',
  'Service and strategic design (consulting, GCCs)', 'Industrial and product design (hardware, mobility, consumer)',
  'Game, XR and 3D design', 'Creative technologist / design engineer',
]

const TONE = `Voice: warm, direct and specific. The reader is a design student who has invested heavily in their education, faces a weak fresher market, and needs honest guidance and real confidence built from their actual work, not hype. Never promise outcomes, never flatter, never invent. If the evidence is thin, say so and say what would strengthen it.`

export async function edgeFinder(facts: ResumeFact[], interests: string[]): Promise<EdgeCard> {
  const system = `You are the Edge Finder agent in a job coach for early-career design students. Your job: find what makes THIS student different and hireable, using only their resume facts. ${TONE}
Rules: every differentiator and every "already proven" item must cite resume fact ids (R1, R2...) that truly support it; use "demonstrated" only when a fact shows it was done, "indicated" when it is suggested. Do not invent projects, metrics, tools or outcomes. Prefer specific combinations (for example a prior engineering degree plus interaction design) over generic traits like "creative" or "passionate". Honest gaps are what hiring managers for entry-level design roles would still want to see, stated kindly. Return only JSON.`
  const user = `RESUME FACTS:\n${facts.map((f) => `${f.id} [${f.kind}] ${f.text}`).join('\n')}\n\nFOCUS AREAS THE STUDENT CHOSE: ${JSON.stringify(interests)}\n\nReturn exactly: {"headline": one positioning line of at most 22 words in the student's voice ("I ..."), "differentiators": [{"title": string, "whyHirersCare": string, "evidence": ["R#"], "strength": "demonstrated"|"indicated"}] (exactly 3 where the resume allows), "alreadyProven": [{"text": string, "evidence": ["R#"]}] (2-4 concrete things they have already done that a hirer values), "honestGaps": [string] (up to 3)}`
  return callValidated(system, user, (o) => edgeSchema.parse(o) as unknown as EdgeCard, 5000)
}

export async function targetPlanner(facts: ResumeFact[], edge: EdgeCard, ev: StudentEvidence, interests: string[]): Promise<PlannerOutput> {
  const sources = ev.facts.map((s: SourceRef) => `${s.id} ${s.statement} [${s.publisher}${s.publishedAt ? `, ${s.publishedAt}` : ''}; reliability ${Math.round((s.reliability ?? 0) * 100)}%]`).join('\n')
  const companies = ev.companies.map((c) => `${c.key} | ${c.name} | ${c.kind} | ${c.sector ?? ''} | ${c.cities.join('/')}${c.fresherScore !== null ? ` | fresher score ${c.fresherScore}` : ''}`).join('\n')
  const openings = ev.openings.map((o) => `${o.company}: ${o.title} (${o.location ?? 'location n/a'}; ${o.fresherFriendly ? 'open to freshers' : `${o.seniority}${o.minYears !== null ? `, asks ${o.minYears}+ years` : ''}`})`).join('\n')
  const system = `You are the Target Planner agent in a job coach for early-career design students in India. Given the student's Edge Card and dated market evidence, you choose where they should aim and what to do in the next 14 days. ${TONE}
Rules:
1. Choose exactly TWO target lanes from the lane menu (you may rename for clarity) that best fit the student's evidence, and ONE bridge job: a realistic way to earn and build proof while the main search continues (freelance, contract, adjacent role, internship). Say honestly how crowded each lane is.
2. Market statements must cite evidence ids (S#) that actually support them, and must not state a number that is not in the cited evidence. If you have no evidence for a statement, still write it as general guidance with an empty sources list; it will be labelled as such.
3. "whoHires" uses only employer keys from the list given. Do not name any other employers.
4. The student's AI coach nudges and guides only. Application drafting, outreach messages and mock interviews are done with a human mentor (Amit). On days themed Apply and Practice, guide the student on what to look for and how to prepare; never write the application or answers for them.
5. The 14 days follow a weekly rhythm: Position, Proof, Reach, Apply, Practice, Skill, Reflect (day 1 = Position). Each day is ONE action of at most 20 minutes, concrete and tied to this student's own work and lanes. Include a one-line "why" and a short "guidance" on how to do it.
Return only JSON.`
  const user = `EDGE CARD: ${JSON.stringify(edge)}\nRESUME FACTS:\n${facts.map((f) => `${f.id} ${f.text}`).join('\n')}\nFOCUS AREAS: ${JSON.stringify(interests)}\n\nLANE MENU:\n- ${LANES.join('\n- ')}\n\nPUBLISHED EVIDENCE (cite by id):\n${sources || '(none available)'}\n\nEMPLOYERS WE TRACK (key | name | kind | sector | cities | fresher score):\n${companies || '(none)'}\n\nREAL OPENINGS WE FOUND TODAY:\n${openings || '(none open to freshers or near-fresher)'}\n\nReturn exactly: {"market": [{"text": string, "sources": ["S#"]}] (3-5 statements on where freshers are being hired now), "lanes": [{"name": string, "whyYou": string, "evidence": ["R#"], "demand": {"text": string, "sources": ["S#"]}, "whoHires": ["employer key"], "proofNeeded": [string] (2-3 pieces of portfolio proof this lane expects), "honestOdds": string}] (exactly 2), "bridge": {"title": string, "why": string, "whereToLook": [string], "claim": {"text": string, "sources": ["S#"]}}, "days": [{"day": 1-14, "action": string, "why": string, "minutes": 5-20, "guidance": string}] (all 14), "caveats": [string] (1-3 honest limits of this plan)}`
  return callValidated(system, user, (o) => plannerSchema.parse(o), 9000)
}
