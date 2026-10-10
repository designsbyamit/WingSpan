import { z } from 'zod'
import { callValidated } from '@/lib/v02-agents'
import { factsOf } from '@/lib/experience'
import { normalizeExtracted } from '@/lib/extracted-shape'
import { CATALOG, catalogById, catalogPrompt, matchCatalog } from '@/lib/resources-catalog'
import type { Bet } from '@/lib/bets'
import type { AgentRun } from '@/lib/orchestrator'
import type { ExtractedCareerData, Gap, GapType, Resource } from '@/types/wingspan'

// Growth Planner: for each of the three chosen directions, which capabilities stand between the
// person and the role (with grounded current vs required levels), and which real resources from the
// curated catalog close them. Runs in parallel with the Orchestrator, so it adds no waiting time.

const GAP_TYPES: GapType[] = ['Skills Gap', 'Positioning Gap', 'Leadership Gap', 'Visibility Gap', 'Domain Gap']
const PHASES = ['Today', '30 Days', '90 Days', '6 Months', '12 Months'] as const

const level = z.union([z.number(), z.string().trim().regex(/^\d+(\.\d+)?%?$/).transform((s) => Number(s.replace('%', '')))])
  .transform((n) => Math.max(0, Math.min(100, n <= 1 && n > 0 ? n * 100 : n)))

const gapSchema = z.object({
  capability: z.string().min(2),
  gapType: z.string().default('Skills Gap'),
  currentLevel: level,
  requiredLevel: level,
  evidence: z.string().default(''),
  currentState: z.string().default(''),
  desiredState: z.string().default(''),
  requiredCapabilities: z.array(z.string()).default([]),
  whyItMatters: z.string().default(''),
  howToClose: z.string().default(''),
  timeline: z.string().default(''),
  effort: z.string().default(''),
  objectives: z.array(z.string()).default([]),
})
const resourcePickSchema = z.object({
  id: z.string(),
  capability: z.string().default(''),
  phase: z.string().default(''),
  whereToStart: z.string().default(''),
  firstStep: z.string().default(''),
})
export const growthSchema = z.object({
  paths: z.array(z.object({
    direction: z.string(),
    gaps: z.array(gapSchema).default([]),
    resources: z.array(resourcePickSchema).default([]),
  })),
})
export type GrowthOutput = z.infer<typeof growthSchema>

export interface GrowthPlan { gaps: Gap[]; resources: Resource[]; notes: string[] }

const SYSTEM = `You are the Growth Planner agent. For each chosen career direction you identify the capability gaps that stand between this person and the role, and you pick learning resources that close them. You never invent evidence. Current levels must be grounded in the person's evidence and must differ by capability: when a gap capability is the same as or close to an evidenced capability, use that capability's level; years in role count as evidence (a person with 10+ years in a discipline is at least 60-70 in its fundamentals); only when there is genuinely no evidence of a capability may its current level be 35 or lower, and say so in "evidence". Gaps are what the TARGET role newly demands. Never list the fundamentals of the person's own discipline (for a designer: interaction design, visual design, UX research, prototyping) as gaps for a senior or leader profile unless the evidence shows they are missing. Required levels come from the market's capability requirements where relevant, otherwise from what the role typically demands (usually 70-90). Frame gaps as capability unlocks, never as deficits. Recommend resources ONLY by id from the catalog provided. Return only JSON.`

export async function growthAgent(run: AgentRun, bets: Bet[], rawData: ExtractedCareerData, interests: string[]): Promise<GrowthPlan> {
  const data = normalizeExtracted(rawData)
  const facts = factsOf(data)
  const { careerDNA: dna, evidenceGraph: g, marketGraph: m } = run
  const caps = [
    ...dna.strongestCapabilities.map((c) => `${c.name}: ${Math.round(c.score)} (strongest)`),
    ...dna.distinctiveStrengths.map((c) => `${c.name}: ${Math.round(c.score)} (distinctive)`),
    ...dna.transferableCapabilities.map((c) => `${c.name}: ${Math.round(c.score)} (transferable)`),
    ...g.capabilities.map((c) => `${c.name}: ${Math.round(c.level)} (evidence, recurrence ${c.recurrence})`),
  ]
  const reqs = m.capabilityRequirements.slice(0, 20).map((r) => `${r.capability}: level required ${Math.round(r.levelRequired)}, importance ${Math.round(r.importance)}, future importance ${Math.round(r.futureImportance)}`)
  const user = `PERSON: ${facts.years} years; latest role ${facts.latestRole}${facts.latestCompany ? ` at ${facts.latestCompany}` : ''}; seniority ${facts.seniority}. Interests: ${interests.join(', ')}.
EVIDENCED CAPABILITIES (name: level 0-100):
${caps.join('\n') || 'none recorded'}

MARKET CAPABILITY REQUIREMENTS:
${reqs.join('\n') || 'none recorded'}

CHOSEN DIRECTIONS:
${bets.map((b) => `- "${b.direction}" (${b.archetype} bet; experience fit ${Math.round(b.experienceScore)}, market ${Math.round(b.marketScore)}). Why: ${b.whyThisPerson}`).join('\n')}

RESOURCE CATALOG (id | type | title — provider | what it's for | tags):
${catalogPrompt()}

For EACH direction return 3-4 gaps (most important first) and 5-6 resources (a mix of types: e.g. one book, one course or certification, one framework or tool, one community or event). Resource ids must come from the catalog; tie each to the capability it helps close and the roadmap phase where it fits (${PHASES.join(', ')}). whereToStart and firstStep must be concrete for this person (not generic).
gapType is one of: ${GAP_TYPES.join(', ')}.
Return exactly: {"paths":[{"direction":string (exact title from above),"gaps":[{"capability":string (2-5 words),"gapType":string,"currentLevel":0-100,"requiredLevel":0-100,"evidence":string,"currentState":string,"desiredState":string,"requiredCapabilities":string[],"whyItMatters":string,"howToClose":string,"timeline":string,"effort":"Low"|"Medium"|"High","objectives":string[3]}],"resources":[{"id":string,"capability":string,"phase":string,"whereToStart":string,"firstStep":string}]}]}`

  const out = await callValidated(SYSTEM, user, (o) => {
    const parsed = growthSchema.parse(o)
    if (parsed.paths.length === 0) throw new Error('No paths returned')
    return parsed
  }, 9000)
  const evidenced = [
    ...dna.strongestCapabilities, ...dna.distinctiveStrengths, ...dna.transferableCapabilities,
  ].map((c) => ({ name: c.name, level: c.score })).concat(g.capabilities.map((c) => ({ name: c.name, level: c.level })))
  return toGrowthPlan(out, bets, { evidenced, years: facts.years, seniority: facts.seniority })
}

const capWords = (s: string) => new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !['and', 'the', 'for', 'with', 'design', 'management', 'strategy', 'skills'].includes(w)))
const CRAFT = /interaction design|visual design|ui design|ux design|user research|ux research|prototyp|wirefram|usability|information architecture|product design/i

/**
 * Keep current levels honest: never below the level of a matching evidenced capability, and for
 * experienced people, never below a sensible floor for the fundamentals of their own craft.
 */
export function groundLevel(capability: string, modelLevel: number, ctx: GroundingContext | undefined): { level: number; matched?: string } {
  if (!ctx) return { level: modelLevel }
  const w = capWords(capability)
  let best: { name: string; level: number; s: number } | null = null
  for (const e of ctx.evidenced) {
    const ew = capWords(e.name)
    if (!w.size || !ew.size) continue
    let n = 0
    w.forEach((x) => { if (ew.has(x)) n++ })
    const s = n / Math.min(w.size, ew.size)
    if (s >= 0.5 && (!best || s > best.s || (s === best.s && e.level > best.level))) best = { name: e.name, level: e.level, s }
  }
  let level = modelLevel
  if (best && best.level > level) level = Math.round(best.level)
  if (CRAFT.test(capability) && ctx.years >= 8) level = Math.max(level, ctx.years >= 12 ? 70 : 60)
  return { level, matched: best?.name }
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** Deterministic post-processing: titles, sizes, readiness and real resources only. */
export interface GroundingContext { evidenced: { name: string; level: number }[]; years: number; seniority: string }

export function toGrowthPlan(out: GrowthOutput, bets: Bet[], ground?: GroundingContext): GrowthPlan {
  const notes: string[] = []
  const gaps: Gap[] = []
  const resources: Resource[] = []
  for (const [i, bet] of bets.entries()) {
    const path = out.paths.find((p) => norm(p.direction) === norm(bet.direction)) ?? out.paths[i]
    const used = new Set<string>()
    for (const gp of (path?.gaps ?? []).slice(0, 4)) {
      const grounded = groundLevel(gp.capability, Math.round(gp.currentLevel), ground)
      const current = grounded.level
      if (grounded.level > Math.round(gp.currentLevel)) notes.push(`${bet.direction}: raised "${gp.capability}" from ${Math.round(gp.currentLevel)} to ${grounded.level}${grounded.matched ? ` (evidence: ${grounded.matched})` : ' (years of experience in the discipline)'}.`)
      const required = Math.round(Math.max(gp.requiredLevel, current))
      const diff = required - current
      if (diff < 5) { notes.push(`${bet.direction}: "${gp.capability}" is already at the required level, so it is a strength, not a gap.`); continue }
      const gapType = GAP_TYPES.find((t) => norm(t) === norm(gp.gapType)) ?? GAP_TYPES.find((t) => norm(gp.gapType).includes(norm(t).split(' ')[0])) ?? 'Skills Gap'
      gaps.push({
        title: gp.capability,
        pathway: bet.direction,
        gapType,
        currentReadiness: current,
        futureReadiness: required,
        currentState: gp.currentState || gp.evidence,
        desiredState: gp.desiredState,
        requiredCapabilities: gp.requiredCapabilities.slice(0, 5),
        gapSize: diff <= 15 ? 'small' : diff <= 35 ? 'medium' : 'large',
        whyItMatters: gp.whyItMatters,
        timeline: gp.timeline,
        effort: gp.effort,
        howToClose: gp.howToClose,
        evidence: gp.evidence,
        objectives: gp.objectives.slice(0, 4).map((text, k) => ({ id: `${norm(bet.direction).replace(/ /g, '-')}-${norm(gp.capability).replace(/ /g, '-')}-${k}`, text, completed: false })),
      })
    }
    for (const pick of path?.resources ?? []) {
      const item = catalogById.get(pick.id.trim())
      if (!item || used.has(item.id)) continue
      used.add(item.id)
      resources.push({
        type: item.type, title: item.title, url: item.url, provider: item.provider, cost: item.cost, pathway: bet.direction,
        capability: pick.capability || undefined, phase: PHASES.find((p) => norm(p) === norm(pick.phase)) ?? (pick.phase || undefined),
        whereToStart: pick.whereToStart || item.about, firstStep: pick.firstStep || undefined,
      })
      if (used.size >= 6) break
    }
    // Never leave a path without resources: fill from the catalog by matching the direction and its gaps.
    if (used.size < 4) {
      const gapText = gaps.filter((x) => x.pathway === bet.direction).map((x) => `${x.title} ${x.requiredCapabilities.join(' ')}`).join(' ')
      for (const item of matchCatalog(`${bet.direction} ${gapText}`, 6 - used.size, used)) {
        used.add(item.id)
        resources.push({ type: item.type, title: item.title, url: item.url, provider: item.provider, cost: item.cost, pathway: bet.direction, whereToStart: item.about })
      }
      notes.push(`${bet.direction}: topped up resources from the catalog by topic match.`)
    }
  }
  return { gaps, resources, notes }
}

/** Used when the Growth Planner fails: catalog resources by topic, and no invented gaps. */
export function fallbackGrowth(bets: Bet[]): GrowthPlan {
  const resources: Resource[] = []
  for (const bet of bets) {
    for (const item of matchCatalog(bet.direction, 5)) {
      resources.push({ type: item.type, title: item.title, url: item.url, provider: item.provider, cost: item.cost, pathway: bet.direction, whereToStart: item.about })
    }
  }
  return { gaps: [], resources, notes: ['Growth Planner unavailable; resources matched from the catalog by topic.'] }
}

export const CATALOG_SIZE = CATALOG.length
