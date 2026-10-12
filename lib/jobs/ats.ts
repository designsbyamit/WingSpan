// Public job-board feeds. These are the documented JSON endpoints companies publish for embedding their jobs,
// not scraped pages. One normalised shape out, whatever the board.

export type AtsType = 'GREENHOUSE' | 'LEVER' | 'ASHBY' | 'WORKABLE'
export const ATS_TYPES: AtsType[] = ['GREENHOUSE', 'LEVER', 'ASHBY', 'WORKABLE']
export interface RawPosting { externalId: string; title: string; url: string; location: string | null; postedAt: Date | null; text: string }

const UA = 'WingSpanJobsBot/1.0 (career research; public job-board feeds)'
const strip = (h: string) => h.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
const date = (v: unknown) => { const d = v ? new Date(v as string | number) : null; return d && !isNaN(d.getTime()) ? d : null }

async function getJson(url: string): Promise<unknown | null> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(9000) })
  if (!res.ok) return null
  return res.json().catch(() => null)
}

type J = Record<string, unknown>
const arr = (v: unknown): J[] => (Array.isArray(v) ? (v as J[]) : [])

export async function fetchBoard(type: AtsType, token: string): Promise<RawPosting[] | null> {
  const t = encodeURIComponent(token)
  if (type === 'GREENHOUSE') {
    const j = (await getJson(`https://boards-api.greenhouse.io/v1/boards/${t}/jobs?content=true`)) as J | null
    if (!j || !Array.isArray(j.jobs)) return null
    return arr(j.jobs).map((x) => ({ externalId: String(x.id), title: String(x.title ?? ''), url: String(x.absolute_url ?? ''), location: (x.location as J | undefined)?.name as string ?? null, postedAt: date(x.updated_at), text: strip(String(x.content ?? '')) }))
  }
  if (type === 'LEVER') {
    const j = await getJson(`https://api.lever.co/v0/postings/${t}?mode=json`)
    if (!Array.isArray(j)) return null
    return arr(j).map((x) => ({ externalId: String(x.id), title: String(x.text ?? ''), url: String(x.hostedUrl ?? ''), location: ((x.categories as J | undefined)?.location as string) ?? null, postedAt: date(x.createdAt), text: String(x.descriptionPlain ?? '') }))
  }
  if (type === 'ASHBY') {
    const j = (await getJson(`https://api.ashbyhq.com/posting-api/job-board/${t}`)) as J | null
    if (!j || !Array.isArray(j.jobs)) return null
    return arr(j.jobs).map((x) => ({ externalId: String(x.id), title: String(x.title ?? ''), url: String(x.jobUrl ?? ''), location: (x.location as string) ?? null, postedAt: date(x.publishedAt), text: String(x.descriptionPlain ?? '') }))
  }
  const j = (await getJson(`https://apply.workable.com/api/v1/widget/accounts/${t}?details=true`)) as J | null
  if (!j || !Array.isArray(j.jobs)) return null
  return arr(j.jobs).map((x) => ({ externalId: String(x.shortcode ?? x.id), title: String(x.title ?? ''), url: String(x.url ?? x.application_url ?? ''), location: [x.city, x.country].filter(Boolean).join(', ') || null, postedAt: date(x.published_on), text: strip(String(x.description ?? '')) }))
}

/** Candidate board names for a company, most likely first. */
export function tokenCandidates(key: string, name: string): string[] {
  const flat = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  const dash = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return [...new Set([key, flat, dash, `${flat}inc`, `${flat}india`])].filter(Boolean)
}

const flat = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, '')

/** The company name a board reports for itself, where the feed exposes one (Greenhouse, Workable). */
async function boardName(type: AtsType, token: string): Promise<string | null> {
  const t = encodeURIComponent(token)
  if (type === 'GREENHOUSE') return (((await getJson(`https://boards-api.greenhouse.io/v1/boards/${t}`)) as J | null)?.name as string) ?? null
  if (type === 'WORKABLE') return (((await getJson(`https://apply.workable.com/api/v1/widget/accounts/${t}`)) as J | null)?.name as string) ?? null
  return null
}

/** A hit only counts when the board's own name matches the company, so a stranger's board with the same slug is rejected. */
async function verified(type: AtsType, token: string, name: string): Promise<boolean> {
  if (type === 'LEVER' || type === 'ASHBY') return true // these feeds do not expose a name; the slug is the account
  const reported = await boardName(type, token).catch(() => null)
  if (!reported) return false
  const a = flat(reported), b = flat(name)
  return a.length > 1 && (a.includes(b) || b.includes(a))
}

/** Try every board type with every candidate name until one answers with a job list for this company. */
export async function discoverBoard(key: string, name: string): Promise<{ type: AtsType; token: string } | null> {
  for (const token of tokenCandidates(key, name)) {
    // An empty list is indistinguishable from an unknown account on some feeds (Workable answers 200 for any slug), so a board must list at least one job.
    const hits = await Promise.all(ATS_TYPES.map(async (type) => (((await fetchBoard(type, token).catch(() => null))?.length ?? 0) > 0 ? type : null)))
    for (const type of hits) if (type && (await verified(type, token, name))) return { type, token }
  }
  return null
}
