import { normalizeExtracted } from '@/lib/extracted-shape'
import { detectStudent } from '@/lib/student/detect'
import { edgeFinder, targetPlanner } from '@/lib/student/agents'
import { gatherStudentEvidence } from '@/lib/student/evidence'
import { buildResumeFacts, checkClaim, checkDays, checkEdge, checkLanes } from '@/lib/student/verify'
import type { Lane, SourceRef, StudentPlan } from '@/lib/student/types'
import type { ExtractedCareerData } from '@/types/wingspan'

export type StudentProgress = (id: 'edge' | 'scout' | 'planner' | 'verifier', status: 'start' | 'done' | 'error', note?: string) => void

/** Runs the student agents in order and returns a verified plan. Throws only when no usable plan can be made. */
export async function buildStudentPlan(raw: ExtractedCareerData, interests: string[], progress: StudentProgress = () => {}): Promise<StudentPlan> {
  const data = normalizeExtracted(raw)
  const detection = detectStudent(data)
  const facts = buildResumeFacts(data)
  if (!facts.length) throw new Error('We could not find enough on the resume to build a plan. Please upload a fuller resume or portfolio.')
  const resumeIds = new Set(facts.map((f) => f.id))

  // The Edge Finder reads only the resume; the Market Scout reads only our database. They run together.
  progress('edge', 'start'); progress('scout', 'start')
  const [edgeRaw, ev] = await Promise.all([
    edgeFinder(facts, interests).then((e) => { progress('edge', 'done', 'Found your edge'); return e }),
    gatherStudentEvidence().then((e) => { progress('scout', 'done', `${e.facts.length} dated sources, ${e.companies.length} employers, ${e.openings.length} openings`); return e }),
  ])
  const edge = checkEdge(edgeRaw, resumeIds)

  progress('planner', 'start')
  const out = await targetPlanner(facts, edge, ev, interests)
  progress('planner', 'done', 'Chose your lanes and your first 14 days')

  progress('verifier', 'start')
  const known = new Map<string, SourceRef>([...ev.facts, ...ev.openingSources].map((s) => [s.id, s]))
  const companies = new Map(ev.companies.map((c) => [c.key, { name: c.name, kind: c.kind, cities: c.cities, fresherScore: c.fresherScore }]))
  const rawWho = new Map<number, string[]>(out.lanes.slice(0, 2).map((l, i) => [i, l.whoHires]))
  const lanes = checkLanes(out.lanes.slice(0, 2).map((l) => ({ ...l, whoHires: [] }) as unknown as Lane), resumeIds, known, companies, rawWho)
  const market = out.market.map((m) => checkClaim(m, known)).slice(0, 5)
  const bridge = { title: out.bridge.title, why: out.bridge.why, whereToLook: out.bridge.whereToLook.slice(0, 5), claim: checkClaim(out.bridge.claim, known) }
  const days = checkDays(out.days)

  const used = new Set<string>([...market.flatMap((m) => m.sources), ...lanes.flatMap((l) => l.demand.sources), ...bridge.claim.sources, ...ev.openings.map((o) => o.sourceId)])
  const sources = [...known.values()].filter((s) => used.has(s.id))
  const unsupported = [...market, ...lanes.map((l) => l.demand), bridge.claim].filter((c) => c.general || c.unverifiedNumber).length
  progress('verifier', 'done', unsupported ? `${unsupported} statement${unsupported === 1 ? '' : 's'} marked as general guidance` : 'Every statement traced to a source')

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    detection: { reasons: detection.reasons },
    edge, market, lanes, bridge,
    openings: ev.openings, openingsNote: ev.openingsNote,
    days, sources,
    caveats: [
      ...out.caveats.slice(0, 3),
      'Placement and hiring figures describe groups of people, not you. They show where the market is, not what will happen to you.',
      'Application drafting and interview practice are done with your mentor; this plan guides and nudges.',
    ],
  }
}
