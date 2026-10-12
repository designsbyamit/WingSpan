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
    // Roles the mentor shared from screenshots come first when they suit a fresher; employer-board roles fill the rest.
    type Row = { title: string; company: string; location: string | null; url: string | null; seniority: string; minYears: number | null; fresherFriendly: boolean; when: Date; postedAt: Date | null; origin: 'FEED' | 'MENTOR'; via: string | null }
    const picked: Row[] = []
    try {
      const since = new Date(Date.now() - 45 * 86_400_000)
      const shared = await db.jobListing.findMany({ where: { status: 'OPEN', isDesign: true, lastSeenAt: { gte: since } }, orderBy: { lastSeenAt: 'desc' }, take: 60 })
      const rank = (j: (typeof shared)[number]) => (j.level === 'INTERN' || j.level === 'FRESHER' ? 0 : j.level === 'JUNIOR' ? 1 : j.minYears !== null && j.minYears <= 2 ? 2 : 9)
      const friendly = (j: (typeof shared)[number]) => j.level === 'INTERN' || j.level === 'FRESHER' || (j.minYears !== null && j.minYears <= 1)
      shared.filter((j) => rank(j) < 9).sort((a, b) => rank(a) - rank(b) || b.lastSeenAt.getTime() - a.lastSeenAt.getTime()).slice(0, 6).forEach((j) => {
        picked.push({ title: j.title, company: j.company, location: j.location ?? j.city, url: j.applyUrl, seniority: j.level === 'LEAD' ? 'SENIOR' : j.level, minYears: j.minYears, fresherFriendly: friendly(j), when: j.lastSeenAt, postedAt: j.postedAt, origin: 'MENTOR', via: j.sourceName })
      })
    } catch (e) {
      console.warn('Student evidence: job board unavailable:', e instanceof Error ? e.message : e)
    }
    const rows = await db.posting.findMany({
      where: { isDesign: true, closedAt: null, OR: [{ inIndia: true }, { remote: true }] },
      orderBy: [{ fresherOk: 'desc' }, { minYears: { sort: 'asc', nulls: 'last' } }, { lastSeenAt: 'desc' }],
      take: Math.max(2, 10 - picked.length),
      include: { company: { select: { name: true } } },
    })
    for (const p of rows) picked.push({ title: p.title, company: p.company.name, location: p.location, url: p.url, seniority: p.seniority, minYears: p.minYears, fresherFriendly: p.fresherOk, when: p.lastSeenAt, postedAt: p.postedAt, origin: 'FEED', via: null })
    picked.forEach((p, i) => {
      const id = `J${i + 1}`
      const day = p.when.toISOString().slice(0, 10)
      out.openings.push({ title: p.title, company: p.company, location: p.location, url: p.url, seniority: p.seniority, minYears: p.minYears, fresherFriendly: p.fresherFriendly, retrievedAt: day, sourceId: id, origin: p.origin, via: p.via })
      out.openingSources.push({ id, kind: 'POSTING', label: p.title, publisher: p.origin === 'MENTOR' ? `${p.company} (shared by your mentor${p.via ? `, seen on ${p.via}` : ''})` : p.company, url: p.url, publishedAt: p.postedAt ? p.postedAt.toISOString().slice(0, 10) : null, retrievedAt: day, reliability: null })
    })
    const friendlyCount = out.openings.filter((o) => o.fresherFriendly).length
    const mentorCount = out.openings.filter((o) => o.origin === 'MENTOR').length
    out.openingsNote = !out.openings.length
      ? 'We found no open design roles in India or remote today.'
      : (friendlyCount
        ? `${friendlyCount} of these ${out.openings.length} roles look open to freshers or juniors.`
        : `None of the ${out.openings.length} design roles we found today are explicitly open to freshers. These are the closest in seniority; most ask for some experience, so treat them as a guide to what employers want.`)
        + (mentorCount ? ` ${mentorCount} ${mentorCount === 1 ? 'was' : 'were'} picked and shared by your mentor.` : '')
  } catch (e) {
    console.warn('Student evidence: database unavailable:', e instanceof Error ? e.message : e)
    out.openingsNote = 'Live openings could not be loaded just now.'
  }
  return out
}
