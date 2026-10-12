import { fetchUrl, extractLinks, htmlToText, sha1 } from '@/lib/market/fetch'
import { isDesignRole } from '@/lib/jobs/classify'
import type { RawPosting } from '@/lib/jobs/ats'

// Reads openings from an employer's own careers page using schema.org JobPosting data (JSON-LD), which many
// career sites publish for search engines. Respects robots.txt (via fetchUrl). Pages that load their jobs with
// script and publish no structured data simply yield nothing, and are reported as such rather than guessed at.

type J = Record<string, unknown>
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : v == null ? [] : [v])

function walk(node: unknown, out: J[]) {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) return node.forEach((n) => walk(n, out))
  const o = node as J
  const types = asArr(o['@type']).map(String)
  if (types.includes('JobPosting')) out.push(o)
  for (const k of ['@graph', 'itemListElement', 'item', 'mainEntity']) if (o[k]) walk(o[k], out)
}

export function parseJobPostings(html: string, pageUrl: string): RawPosting[] {
  const found: J[] = []
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { walk(JSON.parse(m[1].trim()), found) } catch { /* malformed block: skip */ }
  }
  return found.map((j) => {
    const loc = asArr(j.jobLocation).map((l) => (l as J).address as J | undefined).filter(Boolean).map((a) => [a!.addressLocality, a!.addressRegion, a!.addressCountry].filter((x) => typeof x === 'string').join(', ')).filter(Boolean)
    const remote = String(j.jobLocationType ?? '') === 'TELECOMMUTE' ? 'Remote' : ''
    const url = typeof j.url === 'string' ? j.url : pageUrl
    const idv = (j.identifier as J | undefined)?.value
    const d = j.datePosted ? new Date(String(j.datePosted)) : null
    return {
      externalId: String(idv ?? sha1(`${url}|${j.title}`)),
      title: String(j.title ?? ''),
      url,
      location: [...loc, remote].filter(Boolean).join('; ') || null,
      postedAt: d && !isNaN(d.getTime()) ? d : null,
      text: htmlToText(String(j.description ?? '')),
    }
  }).filter((p) => p.title)
}

const JOBISH = /job|career|opening|position|vacanc|role|requisition|apply/i

/** Read the careers page, then follow up to `maxDetail` same-site links that look like design openings. */
export async function readCareerPage(careersUrl: string, maxDetail = 10): Promise<{ postings: RawPosting[]; pagesRead: number; structured: boolean }> {
  const page = await fetchUrl(careersUrl, 15_000)
  const html = page.body.toString('utf8')
  const byId = new Map<string, RawPosting>()
  for (const p of parseJobPostings(html, page.url)) byId.set(p.externalId, p)
  let pagesRead = 1
  const origin = new URL(page.url).origin
  const links = extractLinks(html, page.url)
    .filter((l) => l.url.startsWith(origin) && JOBISH.test(l.url) && (isDesignRole(l.text) || /design|ux|ui-ui|product-design/i.test(l.url)))
    .slice(0, maxDetail)
  for (const l of links) {
    try {
      const detail = await fetchUrl(l.url, 12_000)
      pagesRead++
      for (const p of parseJobPostings(detail.body.toString('utf8'), detail.url)) byId.set(p.externalId, p)
    } catch { /* one dead link does not stop the rest */ }
  }
  return { postings: [...byId.values()], pagesRead, structured: byId.size > 0 }
}
