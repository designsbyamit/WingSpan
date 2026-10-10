import { createHash } from 'crypto'

// Polite web fetching for the market crawler: identifies itself, honours robots.txt, caps size and time.

const UA = 'WingSpanMarketBot/1.0 (career-market research; respects robots.txt)'
const MAX_BYTES = 6_000_000
const MAX_FEED_BYTES = 60_000_000
const robotsCache = new Map<string, string[]>()

async function disallowed(url: URL): Promise<string[]> {
  const cached = robotsCache.get(url.origin)
  if (cached) return cached
  let rules: string[] = []
  try {
    const res = await fetch(`${url.origin}/robots.txt`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(6000) })
    if (res.ok) {
      let applies = false
      for (const raw of (await res.text()).split('\n')) {
        const line = raw.split('#')[0].trim()
        const [k, ...rest] = line.split(':')
        const v = rest.join(':').trim()
        if (/^user-agent$/i.test(k)) applies = v === '*'
        else if (applies && /^disallow$/i.test(k) && v) rules.push(v)
      }
    }
  } catch { rules = [] }
  robotsCache.set(url.origin, rules)
  return rules
}

export async function allowedByRobots(rawUrl: string): Promise<boolean> {
  try {
    const u = new URL(rawUrl)
    return !(await disallowed(u)).some((r) => u.pathname.startsWith(r.replace(/\*.*$/, '')))
  } catch { return false }
}

export interface Fetched { url: string; contentType: string; body: Buffer }

export async function fetchUrl(rawUrl: string, timeoutMs = 20_000, opts: { feed?: boolean } = {}): Promise<Fetched> {
  if (!(await allowedByRobots(rawUrl))) throw new Error('Disallowed by robots.txt')
  const res = await fetch(rawUrl, {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/pdf,text/csv,application/json;q=0.9,*/*;q=0.5' },
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const body = Buffer.from(await res.arrayBuffer())
  if (body.length > (opts.feed ? MAX_FEED_BYTES : MAX_BYTES)) throw new Error('Document too large')
  return { url: res.url || rawUrl, contentType: res.headers.get('content-type') ?? '', body }
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ', '&ndash;': '–', '&mdash;': '—', '&rsquo;': '’', '&lsquo;': '‘' }

export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg|nav|footer|header|form)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|br|section|article)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? ' ')
    .replace(/[ \t\r\f]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim()
}

export function pageMeta(html: string): { title?: string; publishedAt?: Date } {
  const title = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1]
    ?? html.match(/<title[^>]*>([^<]+)/i)?.[1]
  const date = html.match(/property=["']article:published_time["'][^>]+content=["']([^"']+)/i)?.[1]
    ?? html.match(/"datePublished"\s*:\s*"([^"]+)"/i)?.[1]
    ?? html.match(/<time[^>]+datetime=["']([^"']+)/i)?.[1]
  const d = date ? new Date(date) : undefined
  return { title: title?.trim().replace(/\s+/g, ' ').slice(0, 300), publishedAt: d && !isNaN(d.getTime()) ? d : undefined }
}

export async function pdfToText(buf: Buffer): Promise<string> {
  const { extractText } = await import('unpdf')
  const result = await extractText(new Uint8Array(buf), { mergePages: true })
  return (Array.isArray(result.text) ? result.text.join('\n') : result.text ?? '').trim()
}

/** Fetch a URL and return readable text plus metadata, whatever its format. */
export async function fetchDocument(url: string): Promise<{ url: string; text: string; title?: string; publishedAt?: Date }> {
  const f = await fetchUrl(url)
  const isPdf = /pdf/i.test(f.contentType) || /\.pdf($|\?)/i.test(f.url)
  if (isPdf) return { url: f.url, text: await pdfToText(f.body) }
  const html = f.body.toString('utf8')
  return { url: f.url, text: htmlToText(html), ...pageMeta(html) }
}

export function extractLinks(html: string, base: string): { url: string; text: string }[] {
  const out: { url: string; text: string }[] = []
  const seen = new Set<string>()
  for (const m of html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      const abs = new URL(m[1], base).toString()
      if (seen.has(abs)) continue
      seen.add(abs)
      out.push({ url: abs, text: htmlToText(m[2]).slice(0, 200) })
    } catch { /* skip malformed href */ }
  }
  return out
}

export const sha = (s: string) => createHash('sha256').update(s).digest('hex')
export const sha1 = (s: string) => createHash('sha1').update(s).digest('hex')
