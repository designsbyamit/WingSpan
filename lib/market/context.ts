
// Reads the market database for the Market Intelligence agent: a short, cited briefing of the most
// relevant, most trustworthy and most recent observations. Never throws; an empty database simply
// means the agent falls back to its general knowledge.

export interface BriefingItem { id: string; statement: string; publisher: string; when: string; reliability: number; region: string; url: string | null; title: string | null; retrievedAt: string | null }
export interface MarketBriefing { lines: string[]; items: BriefingItem[]; observations: number; sources: number; latest: Date | null }

const RELEVANT = /design|ux|ui\b|product|software|\bai\b|artificial|automation|data|leader|manage|skill|creative|media|marketing|all roles|gcc|jobs/i
const ENTRY = /fresher|entry|early-career|recent (college )?grad|graduate|intern|junior|proof of work|portfolio|0-3 years/i
const DAY = 86_400_000

export async function getMarketBriefing(regions: string[] = [], limit = 36, opts: { entryLevel?: boolean; cite?: boolean } = {}): Promise<MarketBriefing> {
  const empty: MarketBriefing = { lines: [], items: [], observations: 0, sources: 0, latest: null }
  try {
    const { db } = await import('@/lib/db')
    const rows = await Promise.race([
      db.marketObservation.findMany({
        where: { supersededAt: null },
        include: { source: { select: { name: true, publisher: true } }, document: { select: { url: true, title: true, fetchedAt: true } } },
        orderBy: [{ observedAt: 'desc' }],
        take: 600,
      }),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('market briefing timed out')), 4000)),
    ])
    if (rows.length === 0) return empty
    const want = new Set(['Global', ...regions.map((r) => r.toLowerCase().includes('india') ? 'India' : r)])
    const now = Date.now()
    // Keep only the newest reading of each series (same source, metric, subject, region).
    const newest = new Map<string, (typeof rows)[number]>()
    for (const r of rows) {
      const k = [r.sourceId, r.metric, r.subject, r.region].join('|')
      const cur = newest.get(k)
      if (!cur || (r.observedAt?.getTime() ?? 0) > (cur.observedAt?.getTime() ?? 0)) newest.set(k, r)
    }
    const scoredAll = [...newest.values()].map((r) => {
      const age = r.observedAt ? (now - r.observedAt.getTime()) / DAY : 400
      const score = r.reliability + (want.has(r.region) ? 0.25 : 0) + (RELEVANT.test(r.subject) || RELEVANT.test(r.statement) ? 0.15 : 0) + (opts.entryLevel && (ENTRY.test(r.subject) || ENTRY.test(r.statement) || r.metric === 'fresher_hiring_intent' || r.metric === 'entry_level_employment' || r.metric === 'entry_requirement' || r.metric === 'placement_rate') ? 0.6 : 0) + (age < 550 ? 0.1 : -0.1)
      return { r, score }
    }).sort((a, b) => b.score - a.score)
    // No single source may crowd out the rest (the Indeed feed alone has ~90 series).
    const perSource = new Map<string, number>()
    const picked = scoredAll.filter(({ r }) => {
      const n = perSource.get(r.sourceId) ?? 0
      if (n >= 8) return false
      perSource.set(r.sourceId, n + 1)
      return true
    }).slice(0, limit)
    const scored = picked
    const lines = scored.map(({ r }) => {
      const when = r.observedAt ? r.observedAt.toISOString().slice(0, 7) : 'undated'
      return `- ${opts.cite ? `[S${scored.findIndex((x) => x.r === r) + 1}] ` : ''}${r.statement} [${r.source.publisher}, ${when}, reliability ${Math.round(r.reliability * 100)}%]`
    })
    const latest = scored.reduce<Date | null>((m, { r }) => (r.observedAt && (!m || r.observedAt > m) ? r.observedAt : m), null)
    const items = scored.map(({ r }, i) => ({ id: `S${i + 1}`, url: r.document?.url && /^https?:/.test(r.document.url) ? r.document.url : null, title: r.document?.title ?? null, retrievedAt: r.document?.fetchedAt ? r.document.fetchedAt.toISOString().slice(0, 10) : null, statement: r.statement, publisher: r.source.publisher, when: r.observedAt ? r.observedAt.toISOString().slice(0, 7) : 'undated', reliability: Math.round(r.reliability * 100) / 100, region: r.region }))
    return { lines, items, observations: newest.size, sources: new Set(scored.map(({ r }) => r.sourceId)).size, latest }
  } catch (e) {
    console.warn('Market briefing unavailable:', e instanceof Error ? e.message : e)
    return empty
  }
}
