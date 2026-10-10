import { fetchUrl } from '@/lib/market/fetch'
import { normalizeRegion, type Metric } from '@/lib/market/vocabulary'

// Numeric feeds are parsed deterministically: no AI, no guessing.

export interface FeedObservation {
  metric: Metric
  subject: string
  region: string
  value: number
  unit: string
  period: string
  statement: string
  observedAt: Date
}

const RAW = 'https://raw.githubusercontent.com/hiring-lab/job_postings_tracker/master'
const WINDOW_DAYS = 28
const DAY = 86_400_000

/** Parse one Indeed sector CSV into: latest 4-week average index and its change on a year earlier. */
export function parseIndeedSectors(csv: string, country: string, sectors: string[]): FeedObservation[] {
  const want = new Set(sectors)
  const bySector = new Map<string, { t: number; v: number }[]>()
  const lines = csv.split('\n')
  const header = lines[0].split(',')
  const iDate = header.indexOf('date'), iVal = header.indexOf('indeed_job_postings_index')
  const iVar = header.indexOf('variable'), iName = header.indexOf('display_name')
  if ([iDate, iVal, iVar, iName].some((i) => i < 0)) throw new Error('Unexpected Indeed CSV columns')
  for (let n = 1; n < lines.length; n++) {
    const line = lines[n]
    if (!line || line.indexOf('total postings') < 0) continue
    // display_name is the last column and may contain commas only when quoted; sector names here do not.
    const c = line.split(',')
    if (c[iVar] !== 'total postings' || !want.has(c[iName]?.replace(/\r$/, '').replace(/^"|"$/g, ''))) continue
    const t = Date.parse(c[iDate]), v = Number(c[iVal])
    if (!isFinite(t) || !isFinite(v)) continue
    const key = c[iName].replace(/\r$/, '').replace(/^"|"$/g, '')
    ;(bySector.get(key) ?? bySector.set(key, []).get(key)!).push({ t, v })
  }
  const out: FeedObservation[] = []
  const region = normalizeRegion(country)
  for (const [sector, rows] of bySector) {
    rows.sort((a, b) => a.t - b.t)
    const last = rows[rows.length - 1].t
    const avg = (end: number) => {
      const w = rows.filter((r) => r.t > end - WINDOW_DAYS * DAY && r.t <= end)
      return w.length >= 14 ? w.reduce((s, r) => s + r.v, 0) / w.length : null
    }
    const now = avg(last), prior = avg(last - 364 * DAY)
    if (now === null) continue
    const day = new Date(last).toISOString().slice(0, 10)
    out.push({
      metric: 'postings_index', subject: sector, region, value: Math.round(now * 10) / 10, unit: 'index (1 Feb 2020 = 100)', period: day,
      statement: `Indeed ${sector} job-postings index in ${region} averaged ${now.toFixed(1)} over the 4 weeks to ${day} (1 Feb 2020 = 100).`,
      observedAt: new Date(last),
    })
    if (prior !== null && prior > 0) {
      const ch = Math.round((now / prior - 1) * 1000) / 10
      out.push({
        metric: 'postings_change_yoy', subject: sector, region, value: ch, unit: '%', period: day,
        statement: `Indeed ${sector} postings in ${region} are ${ch >= 0 ? 'up' : 'down'} ${Math.abs(ch)}% on a year earlier (4-week average to ${day}).`,
        observedAt: new Date(last),
      })
    }
  }
  return out
}

export async function fetchIndeed(config: { countries?: string[]; sectors?: string[] }): Promise<{ observations: FeedObservation[]; errors: string[] }> {
  const observations: FeedObservation[] = [], errors: string[] = []
  for (const cc of config.countries ?? ['US']) {
    try {
      const f = await fetchUrl(`${RAW}/${cc}/job_postings_by_sector_${cc}.csv`, 60_000, { feed: true })
      observations.push(...parseIndeedSectors(f.body.toString('utf8'), cc, config.sectors ?? []))
    } catch (e) { errors.push(`${cc}: ${e instanceof Error ? e.message : e}`) }
  }
  return { observations, errors }
}

const WB_LABEL: Record<string, string> = { unemployment_rate: 'unemployment rate', employment_rate: 'share of employment in services' }

export function parseWorldBank(json: unknown, metric: Metric): FeedObservation[] {
  const rows = Array.isArray(json) && Array.isArray(json[1]) ? (json[1] as Record<string, unknown>[]) : []
  const latest = new Map<string, Record<string, unknown>>()
  for (const r of rows) {
    if (typeof r.value !== 'number') continue
    const k = String(r.countryiso3code)
    const cur = latest.get(k)
    if (!cur || String(r.date) > String(cur.date)) latest.set(k, r)
  }
  return [...latest.values()].map((r) => {
    const region = normalizeRegion(String(r.countryiso3code))
    const v = Math.round((r.value as number) * 10) / 10
    return {
      metric, subject: 'all', region, value: v, unit: '%', period: String(r.date),
      statement: `World Bank: ${WB_LABEL[metric] ?? metric} in ${region} was ${v}% in ${r.date}.`,
      observedAt: new Date(`${r.date}-12-31`),
    }
  })
}

export async function fetchWorldBank(config: { countries?: string[]; indicators?: Record<string, Metric> }): Promise<{ observations: FeedObservation[]; errors: string[] }> {
  const observations: FeedObservation[] = [], errors: string[] = []
  const countries = (config.countries ?? ['IND']).join(';')
  for (const [indicator, metric] of Object.entries(config.indicators ?? {})) {
    try {
      const f = await fetchUrl(`https://api.worldbank.org/v2/country/${countries}/indicator/${indicator}?format=json&mrv=3&per_page=60`)
      observations.push(...parseWorldBank(JSON.parse(f.body.toString('utf8')), metric))
    } catch (e) { errors.push(`${indicator}: ${e instanceof Error ? e.message : e}`) }
  }
  return { observations, errors }
}
