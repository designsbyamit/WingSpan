import { db } from '@/lib/db'
import { SOURCES } from '@/lib/market/sources'
import { CURATED } from '@/lib/market/curated'
import { fetchUrl, fetchDocument, extractLinks, sha } from '@/lib/market/fetch'
import { extractObservations } from '@/lib/market/extract'
import { fetchIndeed, fetchWorldBank, type FeedObservation } from '@/lib/market/feeds'
import { fingerprint } from '@/lib/market/fingerprint'
import { normalizeRegion, type Metric } from '@/lib/market/vocabulary'

// The refresh job. Idempotent: running it twice never duplicates anything, and a source is only
// re-fetched once its cadence (default 10 days) has passed. Safe to call daily.

const DAY = 86_400_000
type Category = 'INDUSTRY_PERFORMANCE' | 'JOB_MARKET'

export interface RefreshOptions {
  trigger: 'cron' | 'manual' | 'health'
  force?: boolean
  onlySource?: string
  budgetMs?: number        // stop starting new work after this long
  maxExtractions?: number  // AI extractions per run; the rest wait for the next run
}
export interface SourceResult { key: string; status: 'OK' | 'SKIPPED' | 'FAILED' | 'PARTIAL'; documents: number; observations: number; note?: string }
export interface RefreshSummary { runId: string; status: string; sourcesTried: number; documentsNew: number; observationsNew: number; results: SourceResult[] }

export async function ensureSources(): Promise<void> {
  for (const s of SOURCES) {
    await db.marketDataSource.upsert({
      where: { key: s.key },
      create: {
        key: s.key, name: s.name, publisher: s.publisher, category: s.category, kind: s.kind, url: s.url, region: s.region,
        licence: s.licence, reliability: s.reliability, cadenceDays: s.cadenceDays ?? 10, config: (s.config ?? undefined) as never, notes: s.notes, enabled: s.enabled !== false,
      },
      // Registry edits flow through; operational state (enabled, lastFetchedAt) is never overwritten.
      update: { ...(s.enabled === false ? { enabled: false } : {}), name: s.name, publisher: s.publisher, category: s.category, kind: s.kind, url: s.url, region: s.region, licence: s.licence, reliability: s.reliability, cadenceDays: s.cadenceDays ?? 10, config: (s.config ?? undefined) as never, notes: s.notes },
    })
  }
}

interface SaveObs { metric: string; subject: string; region: string; value: number | null; unit: string | null; period: string | null; statement: string; reliability: number; observedAt?: Date | null }

async function saveObservations(source: { id: string; category: Category }, documentId: string | null, rows: SaveObs[], now: Date): Promise<number> {
  let created = 0
  for (const r of rows) {
    const fp = fingerprint(source.id, r)
    const existing = await db.marketObservation.findUnique({ where: { fingerprint: fp }, select: { id: true } })
    if (existing) {
      await db.marketObservation.update({ where: { id: existing.id }, data: { lastSeenAt: now, supersededAt: null, statement: r.statement, reliability: r.reliability, documentId: documentId ?? undefined } })
    } else {
      await db.marketObservation.create({
        data: {
          fingerprint: fp, sourceId: source.id, documentId, category: source.category, metric: r.metric, subject: r.subject,
          region: normalizeRegion(r.region), value: r.value, unit: r.unit, period: r.period, statement: r.statement,
          reliability: r.reliability, observedAt: r.observedAt ?? null, firstSeenAt: now, lastSeenAt: now,
        },
      })
      created++
    }
  }
  return created
}

const fromFeed = (o: FeedObservation, reliability: number): SaveObs => ({ ...o, reliability })

async function upsertDoc(sourceId: string, url: string, data: { title?: string | null; publishedAt?: Date | null; contentHash: string; wordCount: number; status: string; error?: string | null }) {
  return db.marketDataDocument.upsert({
    where: { sourceId_url: { sourceId, url } },
    create: { sourceId, url, title: data.title ?? null, publishedAt: data.publishedAt ?? null, contentHash: data.contentHash, wordCount: data.wordCount, status: data.status, error: data.error ?? null },
    update: { title: data.title ?? undefined, publishedAt: data.publishedAt ?? undefined, contentHash: data.contentHash, wordCount: data.wordCount, status: data.status, error: data.error ?? null, fetchedAt: new Date() },
  })
}

interface Budget { deadline: number; extractionsLeft: number }

async function processDocument(source: { id: string; key: string; publisher: string; category: Category; reliability: number }, url: string, budget: Budget, now: Date): Promise<{ docNew: number; obs: number; note?: string }> {
  const doc = await fetchDocument(url)
  const hash = sha(doc.text)
  const prior = await db.marketDataDocument.findUnique({ where: { sourceId_url: { sourceId: source.id, url } } })
  if (prior && prior.contentHash === hash && prior.status === 'OK') {
    await db.marketObservation.updateMany({ where: { documentId: prior.id, supersededAt: null }, data: { lastSeenAt: now } })
    return { docNew: 0, obs: 0, note: 'unchanged' }
  }
  const words = doc.text.split(/\s+/).length
  if (doc.text.length < 400) {
    await upsertDoc(source.id, url, { title: doc.title, publishedAt: doc.publishedAt, contentHash: hash, wordCount: words, status: 'EMPTY', error: 'Too little readable text' })
    return { docNew: prior ? 0 : 1, obs: 0, note: 'too little text' }
  }
  if (doc.publishedAt && now.getTime() - doc.publishedAt.getTime() > 2 * 365 * DAY) {
    await upsertDoc(source.id, url, { title: doc.title, publishedAt: doc.publishedAt, contentHash: hash, wordCount: words, status: 'EMPTY', error: 'Older than two years' })
    return { docNew: prior ? 0 : 1, obs: 0, note: 'stale' }
  }
  if (budget.extractionsLeft <= 0 || Date.now() > budget.deadline) return { docNew: 0, obs: 0, note: 'deferred to next run' }
  budget.extractionsLeft--
  const extracted = await extractObservations(doc.text, { title: doc.title, publisher: source.publisher, url })
  const saved = await upsertDoc(source.id, url, { title: doc.title, publishedAt: doc.publishedAt, contentHash: hash, wordCount: words, status: 'OK' })
  const created = await saveObservations(source, saved.id, extracted.map((e) => ({
    ...e, reliability: Math.round(source.reliability * (e.hasSource ? 1 : 0.85) * 100) / 100, observedAt: doc.publishedAt ?? null,
  })), now)
  // Facts from an earlier version of this document that no longer appear are retired, not deleted.
  await db.marketObservation.updateMany({ where: { documentId: saved.id, lastSeenAt: { lt: now }, supersededAt: null }, data: { supersededAt: now } })
  return { docNew: prior ? 0 : 1, obs: created }
}

async function runSource(source: Awaited<ReturnType<typeof db.marketDataSource.findMany>>[number], budget: Budget, now: Date): Promise<SourceResult> {
  const base = { key: source.key, documents: 0, observations: 0 }
  const src = { id: source.id, key: source.key, publisher: source.publisher, category: source.category as Category, reliability: source.reliability }
  const cfg = (source.config ?? {}) as Record<string, unknown>
  try {
    if (source.kind === 'MANUAL') {
      for (const d of CURATED) {
        const doc = await upsertDoc(source.id, d.url, { title: d.title, publishedAt: d.publishedAt ? new Date(d.publishedAt) : null, contentHash: sha(JSON.stringify(d.observations)), wordCount: 0, status: 'OK' })
        const n = await saveObservations({ id: source.id, category: d.category }, doc.id, d.observations.map((o) => ({ ...o, observedAt: d.publishedAt ? new Date(d.publishedAt) : null })), now)
        base.documents++; base.observations += n
      }
      return { ...base, status: 'OK' }
    }
    if (source.kind === 'CSV' || source.kind === 'API') {
      const { observations, errors } = source.key.startsWith('indeed')
        ? await fetchIndeed(cfg as never)
        : await fetchWorldBank(cfg as never)
      if (observations.length === 0) throw new Error(errors.join('; ') || 'No data returned')
      const doc = await upsertDoc(source.id, source.url, { title: source.name, contentHash: sha(JSON.stringify(observations.map((o) => o.value))), wordCount: 0, status: 'OK' })
      base.observations = await saveObservations(src, doc.id, observations.map((o) => fromFeed(o, source.reliability)), now)
      base.documents = 1
      return { ...base, status: errors.length ? 'PARTIAL' : 'OK', note: errors.join('; ') || `${observations.length} data points` }
    }
    if (source.kind === 'PAGE') {
      const r = await processDocument(src, source.url, budget, now)
      return { ...base, documents: r.docNew, observations: r.obs, status: 'OK', note: r.note }
    }
    if (source.kind === 'INDEX') {
      const f = await fetchUrl(source.url)
      const html = f.body.toString('utf8')
      const pattern = new RegExp(String(cfg.linkPattern ?? '.'), 'i')
      const include = new RegExp(String(cfg.include ?? '.'), 'i')
      const host = new URL(source.url).host
      const known = new Set((await db.marketDataDocument.findMany({ where: { sourceId: source.id }, select: { url: true } })).map((d) => d.url))
      const fresh = extractLinks(html, f.url)
        .filter((l) => { try { return new URL(l.url).host === host && pattern.test(new URL(l.url).pathname) && include.test(`${l.text} ${l.url}`) && !known.has(l.url) && l.url !== source.url } catch { return false } })
        .slice(0, Number(cfg.maxNew ?? 3))
      const notes: string[] = []
      for (const link of fresh) {
        if (Date.now() > budget.deadline) { notes.push('time budget reached'); break }
        try {
          const r = await processDocument(src, link.url, budget, now)
          base.documents += r.docNew; base.observations += r.obs
        } catch (e) { notes.push(`${link.url}: ${e instanceof Error ? e.message : e}`) }
      }
      return { ...base, status: notes.length && fresh.length === notes.length ? 'FAILED' : 'OK', note: `${fresh.length} new links${notes.length ? '; ' + notes.join('; ') : ''}` }
    }
    return { ...base, status: 'SKIPPED', note: `unknown kind ${source.kind}` }
  } catch (e) {
    return { ...base, status: 'FAILED', note: e instanceof Error ? e.message.slice(0, 300) : String(e) }
  }
}

export async function refreshMarketData(opts: RefreshOptions): Promise<RefreshSummary> {
  const started = Date.now()
  const now = new Date()
  const run = await db.marketIngestionRun.create({ data: { trigger: opts.trigger, status: 'RUNNING' } })
  await ensureSources()
  const sources = await db.marketDataSource.findMany({ where: { enabled: true, ...(opts.onlySource ? { key: opts.onlySource } : {}) }, orderBy: { key: 'asc' } })
  const due = sources.filter((s) => opts.force || !s.lastFetchedAt || now.getTime() - s.lastFetchedAt.getTime() >= s.cadenceDays * DAY)
  const budget: Budget = { deadline: started + (opts.budgetMs ?? 230_000), extractionsLeft: opts.maxExtractions ?? 5 }
  const results: SourceResult[] = []

  for (const s of due) {
    if (Date.now() > budget.deadline) { results.push({ key: s.key, status: 'SKIPPED', documents: 0, observations: 0, note: 'time budget reached; next run' }); continue }
    const r = await runSource(s, budget, now)
    results.push(r)
    // A source stays "due" if nothing could be done for it this time, so the next daily run retries.
    const settled = r.status === 'OK' || r.status === 'PARTIAL'
    const deferred = r.note?.includes('deferred') || r.note?.includes('time budget')
    await db.marketDataSource.update({ where: { id: s.id }, data: { lastStatus: `${r.status}${r.note ? ': ' + r.note : ''}`.slice(0, 500), ...(settled && !deferred ? { lastFetchedAt: now } : {}) } })
  }

  const failed = results.filter((r) => r.status === 'FAILED').length
  const tried = results.filter((r) => r.status !== 'SKIPPED').length
  const status = tried === 0 ? 'OK' : failed === tried ? 'FAILED' : failed > 0 ? 'PARTIAL' : 'OK'
  const documentsNew = results.reduce((n, r) => n + r.documents, 0)
  const observationsNew = results.reduce((n, r) => n + r.observations, 0)
  await db.marketIngestionRun.update({ where: { id: run.id }, data: { finishedAt: new Date(), status, sourcesTried: tried, documentsNew, observationsNew, details: results as never } })
  return { runId: run.id, status, sourcesTried: tried, documentsNew, observationsNew, results }
}

export type { Metric }
