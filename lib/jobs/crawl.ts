import { db } from '@/lib/db'
import { COMPANIES } from '@/lib/jobs/companies'
import { fetchBoard, discoverBoard, type AtsType } from '@/lib/jobs/ats'
import { isDesignRole, inIndia, isRemote, seniorityOf, fresherOk } from '@/lib/jobs/classify'
import { fresherScore } from '@/lib/jobs/score'

// Refresh job for the company/posting tables. Safe to run repeatedly: postings are upserted, postings that vanish
// from a board that answered are marked closed (never deleted), and companies are processed least-recently-crawled first.

const DAY = 86_400_000
export interface CrawlOptions { budgetMs?: number; limit?: number; onlyCompany?: string; rediscover?: boolean }
export interface CompanyResult { key: string; status: string; board?: string; design?: number; fresherOk?: number; score?: number | null }
export interface CrawlSummary { companies: number; results: CompanyResult[] }

export async function ensureCompanies(): Promise<void> {
  for (const s of COMPANIES) {
    await db.company.upsert({
      where: { key: s.key },
      create: { key: s.key, name: s.name, kind: s.kind, sector: s.sector, cities: s.cities, careersUrl: s.careersUrl, atsType: s.ats?.type, atsToken: s.ats?.token },
      update: { name: s.name, kind: s.kind, sector: s.sector, cities: s.cities, careersUrl: s.careersUrl, ...(s.ats ? { atsType: s.ats.type, atsToken: s.ats.token } : {}) },
    })
  }
}

const seededBoard = (key: string) => !!COMPANIES.find((s) => s.key === key)?.ats

async function crawlOne(co: { id: string; key: string; name: string; kind: string; atsType: string | null; atsToken: string | null; lastStatus: string | null; lastCrawledAt: Date | null }, rediscover: boolean): Promise<CompanyResult> {
  const now = new Date()
  let type = co.atsType as AtsType | null, token = co.atsToken
  if (rediscover && !seededBoard(co.key)) { type = null; token = null }
  if (!type || !token) {
    const retry = rediscover || !co.lastCrawledAt || now.getTime() - co.lastCrawledAt.getTime() > 14 * DAY
    if (!retry) return { key: co.key, status: 'NO_BOARD (rechecked later)' }
    const found = await discoverBoard(co.key, co.name)
    if (!found) {
      await db.company.update({ where: { id: co.id }, data: { lastCrawledAt: now, lastStatus: 'NO_BOARD', ...(rediscover ? { atsType: null, atsToken: null } : {}) } })
      return { key: co.key, status: 'NO_BOARD' }
    }
    type = found.type; token = found.token
    await db.company.update({ where: { id: co.id }, data: { atsType: type, atsToken: token } })
  }
  const raw = await fetchBoard(type, token).catch(() => null)
  if (!raw) {
    await db.company.update({ where: { id: co.id }, data: { lastCrawledAt: now, lastStatus: 'FEED_ERROR' } })
    return { key: co.key, status: 'FEED_ERROR', board: `${type}:${token}` }
  }
  const seen = new Set<string>()
  for (const p of raw) {
    if (!p.title || !isDesignRole(p.title)) continue
    const text = p.text.slice(0, 4000)
    const { seniority, minYears } = seniorityOf(p.title, text)
    seen.add(p.externalId)
    const data = {
      title: p.title.slice(0, 200), url: p.url, location: p.location, inIndia: inIndia(p.location), remote: isRemote(p.location, text),
      isDesign: true, seniority, minYears, fresherOk: fresherOk(p.title, text), postedAt: p.postedAt, lastSeenAt: now, closedAt: null, excerpt: text.slice(0, 500),
    }
    await db.posting.upsert({ where: { companyId_externalId: { companyId: co.id, externalId: p.externalId } }, create: { companyId: co.id, externalId: p.externalId, ...data }, update: data })
  }
  // The board answered, so anything we hold that is no longer listed has closed.
  await db.posting.updateMany({ where: { companyId: co.id, closedAt: null, externalId: { notIn: [...seen] } }, data: { closedAt: now } })

  const open = await db.posting.findMany({ where: { companyId: co.id, closedAt: null, isDesign: true }, select: { inIndia: true, remote: true, fresherOk: true } })
  const reach = open.filter((p) => p.inIndia || p.remote)
  const seen90 = await db.posting.count({ where: { companyId: co.id, isDesign: true, fresherOk: true, OR: [{ inIndia: true }, { remote: true }], lastSeenAt: { gte: new Date(now.getTime() - 90 * DAY) } } })
  const r = fresherScore({ kind: co.kind, crawledOk: true, designOpen: open.length, indiaDesignOpen: reach.length, fresherOpen: reach.filter((p) => p.fresherOk).length, fresherSeen90d: seen90 })
  await db.company.update({ where: { id: co.id }, data: { lastCrawledAt: now, lastStatus: 'OK', fresherScore: r.score, scoreSignals: { ...r.signals, confidence: r.confidence } } })
  return { key: co.key, status: 'OK', board: `${type}:${token}`, design: open.length, fresherOk: reach.filter((p) => p.fresherOk).length, score: r.score }
}

export async function crawlJobs(opts: CrawlOptions = {}): Promise<CrawlSummary> {
  await ensureCompanies()
  const started = Date.now()
  const budget = opts.budgetMs ?? 200_000
  const list = await db.company.findMany({
    where: opts.onlyCompany ? { key: opts.onlyCompany } : {},
    orderBy: [{ lastCrawledAt: { sort: 'asc', nulls: 'first' } }],
    take: opts.limit ?? 12,
  })
  const results: CompanyResult[] = []
  for (const co of list) {
    if (Date.now() - started > budget) break
    try { results.push(await crawlOne(co, !!opts.rediscover)) }
    catch (e) { results.push({ key: co.key, status: `ERROR ${e instanceof Error ? e.message.slice(0, 80) : 'failed'}` }) }
  }
  return { companies: results.length, results }
}
