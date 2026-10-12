import { getMarketBriefing } from '@/lib/market/context'
import type { Opening, SourceRef } from '@/lib/student/types'

// Gathers everything the student agents may cite, from our own database: dated market facts (S-ids), employers
// we track, and real openings read from employers' job boards (J-ids). Never throws: an empty result simply
// means the plan says so instead of inventing anything.

export interface CompanyInfo { key: string; name: string; kind: string; sector: string | null; cities: string[]; fresherScore: number | null }
export interface StudentEvidence {
  facts: SourceRef[]
  companies: CompanyInfo[]
  openings: Opening[]
  openingSources: SourceRef[]
  openingsNote: string
}

export async function gatherStudentEvidence(): Promise<StudentEvidence> {
  const out: StudentEvidence = { facts: [], companies: [], openings: [], openingSources: [], openingsNote: '' }
  const briefing = await getMarketBriefing(['India'], 26, { entryLevel: true, cite: true })
  // One citation per document: facts from the same report share an id, so the source list has no repeats.
  const groups = new Map<string, { first: (typeof briefing.items)[number]; statements: string[]; reliability: number }>()
  for (const i of briefing.items) {
    const key = i.url ?? `${i.publisher}|${i.title}`
    const g = groups.get(key)
    const line = `${i.statement}${i.region && i.region !== 'Global' ? ` (${i.region})` : ''}`
    if (g) { g.statements.push(line); g.reliability = Math.min(g.reliability, i.reliability) } else groups.set(key, { first: i, statements: [line], reliability: i.reliability })
  }
  out.facts = [...groups.values()].map((g, idx) => ({
    id: `S${idx + 1}`, kind: 'REPORT' as const, label: g.first.title ?? g.first.publisher, publisher: g.first.publisher, url: g.first.url,
    publishedAt: g.first.when === 'undated' ? null : g.first.when, retrievedAt: g.first.retrievedAt, reliability: g.reliability,
    statement: g.statements.join(' | '), region: g.first.region,
  }))
  try {
    const { db } = await import('@/lib/db')
    const companies = await db.company.findMany({ select: { key: true, name: true, kind: true, sector: true, cities: true, fresherScore: true }, orderBy: { name: 'asc' } })
    out.companies = companies
    const rows = await db.posting.findMany({
      where: { isDesign: true, closedAt: null, OR: [{ inIndia: true }, { remote: true }] },
      orderBy: [{ fresherOk: 'desc' }, { minYears: { sort: 'asc', nulls: 'last' } }, { lastSeenAt: 'desc' }],
      take: 8,
      include: { company: { select: { name: true } } },
    })
    rows.forEach((p, i) => {
      const id = `J${i + 1}`
      const day = p.lastSeenAt.toISOString().slice(0, 10)
      out.openings.push({ title: p.title, company: p.company.name, location: p.location, url: p.url, seniority: p.seniority, minYears: p.minYears, fresherFriendly: p.fresherOk, retrievedAt: day, sourceId: id })
      out.openingSources.push({ id, kind: 'POSTING', label: p.title, publisher: p.company.name, url: p.url, publishedAt: p.postedAt ? p.postedAt.toISOString().slice(0, 10) : null, retrievedAt: day, reliability: null })
    })
    const friendly = out.openings.filter((o) => o.fresherFriendly).length
    out.openingsNote = !out.openings.length
      ? 'We found no open design roles in India or remote at the employers we track today.'
      : friendly
        ? `${friendly} of these ${out.openings.length} roles look open to freshers.`
        : `None of the ${out.openings.length} design roles we found today are explicitly open to freshers. These are the closest in seniority; most ask for some experience, so treat them as a guide to what employers want.`
  } catch (e) {
    console.warn('Student evidence: database unavailable:', e instanceof Error ? e.message : e)
    out.openingsNote = 'Live openings could not be loaded just now.'
  }
  return out
}
