import { normalizeExtracted } from '@/lib/extracted-shape'
import { detectStudent } from '@/lib/student/detect'
import { edgeFinder, targetPlanner } from '@/lib/student/agents'
import { gatherStudentEvidence } from '@/lib/student/evidence'
import { checkSupport } from '@/lib/student/check'
import { buildResumeFacts, stripIds, checkClaim, checkDays, checkEdge, checkLanes } from '@/lib/student/verify'
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
  const lanes0 = checkLanes(out.lanes.slice(0, 2).map((l) => ({ ...l, whoHires: [] }) as unknown as Lane), resumeIds, known, companies, rawWho)
  const market0 = out.market.map((m) => checkClaim(m, known)).slice(0, 5)
  const bridge0 = { title: out.bridge.title, why: out.bridge.why, whereToLook: out.bridge.whereToLook.slice(0, 5), claim: checkClaim(out.bridge.claim, known) }
  // Second reading: do the cited sources really say what the statement says? (the last two entries are the lane demands)
  const flat = [...market0, ...lanes0.map((l) => l.demand), bridge0.claim]
  const checked = await checkSupport(flat, known)
  const market = checked.slice(0, market0.length).map((c) => ({ ...c, text: stripIds(c.text) }))
  const lanes = lanes0.map((l, i) => ({ ...l, whyYou: stripIds(l.whyYou), proofNeeded: l.proofNeeded.map(stripIds), honestOdds: stripIds(l.honestOdds), demand: { ...checked[market0.length + i], text: stripIds(checked[market0.length + i].text) } }))
  const bridge = { ...bridge0, why: stripIds(bridge0.why), claim: { ...checked[checked.length - 1], text: stripIds(checked[checked.length - 1].text) } }
  const days = checkDays(out.days)

  const used = new Set<string>([...market.flatMap((m) => m.sources), ...lanes.flatMap((l) => l.demand.sources), ...bridge.claim.sources, ...ev.openings.map((o) => o.sourceId)])
  const sources = [...known.values()].filter((s) => used.has(s.id))
  const unsupported = [...market, ...lanes.map((l) => l.demand), bridge.claim].filter((c) => c.general || c.unverifiedNumber || c.unchecked).length
  progress('verifier', 'done', unsupported ? `${unsupported} statement${unsupported === 1 ? '' : 's'} marked as general guidance` : 'Every statement traced to a source')

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    detection: { reasons: detection.reasons },
    edge: { ...edge, headline: stripIds(edge.headline) }, market, lanes, bridge,
    openings: ev.openings, openingsNote: ev.openingsNote,
    days, sources,
    caveats: [
      ...out.caveats.slice(0, 3),
      'Placement and hiring figures describe groups of people, not you. They show where the market is, not what will happen to you.',
      'Application drafting and interview practice are done with your mentor; this plan guides and nudges.',
    ],
  }
}
