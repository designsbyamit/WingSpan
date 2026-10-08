import { createHash } from 'node:crypto'

// Pure mapping from the extraction response to ingestion rows. No DB access.

export interface IngestSource {
  kind: 'resume' | 'portfolio' | 'projects-spreadsheet' | 'profile-link' | 'supporting-document'
  name: string
  url?: string
  text?: string
  sizeBytes?: number
  mimeType?: string
}

export interface IngestData {
  timeline?: Array<{ role?: string; company?: string; startDate?: string; endDate?: string; description?: string }>
  projects?: Array<{ name?: string; company?: string; year?: string; summary?: string; impact?: string }>
  skills?: string[]
  education?: Array<{ institution?: string; degree?: string; year?: string }>
}

type SourceKindValue = 'RESUME' | 'PORTFOLIO' | 'PROJECT' | 'LINK' | 'OTHER'

export const sourceKindOf = (k: IngestSource['kind']): SourceKindValue =>
  ({ resume: 'RESUME', portfolio: 'PORTFOLIO', 'projects-spreadsheet': 'PROJECT', 'profile-link': 'LINK', 'supporting-document': 'OTHER' } as const)[k] ?? 'OTHER'

/** Hash of the content when we have it, otherwise of the URL/name, so re-uploads dedupe. */
export function contentHashOf(s: IngestSource): string {
  const basis = s.text?.trim() ? `text:${s.text}` : `ref:${s.kind}:${s.url ?? s.name}`
  return createHash('sha256').update(basis).digest('hex')
}

const clean = (v: unknown, max = 2000): string | null => {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t ? t.slice(0, max) : null
}

const yearOf = (v: unknown): number | null => {
  const m = typeof v === 'string' ? v.match(/(19|20)\d{2}/) : null
  return m ? Number(m[0]) : null
}

export function mapIngestion(data: IngestData) {
  const roles = (data.timeline ?? [])
    .map((t) => ({ title: clean(t.role, 200), company: clean(t.company, 200), startDate: clean(t.startDate, 50), endDate: clean(t.endDate, 50), summary: clean(t.description) }))
    .filter((r): r is typeof r & { title: string } => !!r.title)

  const projects = (data.projects ?? [])
    .map((p) => ({ name: clean(p.name, 300), summary: clean(p.summary), role: null as string | null, outcomes: clean(p.impact) ? [clean(p.impact)!] : [] }))
    .filter((p): p is typeof p & { name: string } => !!p.name)

  const education = (data.education ?? [])
    .map((e) => ({ institution: clean(e.institution, 300), credential: clean(e.degree, 300), endYear: yearOf(e.year) }))
    .filter((e): e is typeof e & { institution: string } => !!e.institution)

  const seen = new Set<string>()
  const skills = (data.skills ?? [])
    .map((s) => clean(s, 120))
    .filter((s): s is string => {
      if (!s) return false
      const k = s.toLowerCase()
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    .slice(0, 200)

  return { roles, projects, education, skills }
}
