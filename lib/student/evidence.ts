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
  out.facts = briefing.items.map((i) => ({
    id: i.id, kind: 'REPORT', label: i.title ?? i.publisher, publisher: i.publisher, url: i.url, publishedAt: i.when === 'undated' ? null : i.when,
    retrievedAt: i.retrievedAt, reliability: i.reliability, statement: i.statement,
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
