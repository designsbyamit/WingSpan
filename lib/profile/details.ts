import { detectStudent, type CareerTrack } from '@/lib/student/detect'
import { experienceFacts } from '@/lib/experience'
import { safeUrl } from '@/lib/links'
import { identityFrom } from '@/lib/profile/contact'
import type { ExtractedCareerData } from '@/types/wingspan'

// The person's own details as read from a resume, and the rules for keeping them:
//  - the first confirmed name is locked; a resume with another name never changes the profile,
//  - a resume with the same name may propose changes to the other fields, applied only with consent.

export interface ProfileDetails {
  fullName: string
  email: string
  phone: string
  location: string
  linkedinUrl: string
  portfolioUrl: string
  githubUrl: string
  experienceYears: number | null
  track: CareerTrack
  currentRole: string
  currentOrg: string
  education: string
}

export const EDITABLE_FIELDS = ['email', 'phone', 'location', 'linkedinUrl', 'portfolioUrl', 'githubUrl', 'experienceYears', 'track', 'currentRole', 'currentOrg', 'education'] as const
export type EditableField = (typeof EDITABLE_FIELDS)[number]

export const FIELD_LABELS: Record<keyof ProfileDetails, string> = {
  fullName: 'Name', email: 'Email', phone: 'Phone', location: 'Location', linkedinUrl: 'LinkedIn', portfolioUrl: 'Portfolio', githubUrl: 'GitHub',
  experienceYears: 'Years of experience', track: 'You are', currentRole: 'Latest role', currentOrg: 'Organisation', education: 'Education',
}
export const TRACK_LABELS: Record<CareerTrack, string> = { STUDENT: 'A student', PROFESSIONAL: 'An experienced professional', BOTH: 'Both: studying and working' }

const clean = (s: unknown, max = 200) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim().slice(0, max) : '')
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function cleanEmail(s: unknown): string { const v = clean(s, 120).toLowerCase(); return EMAIL.test(v) ? v : '' }
export function cleanPhone(s: unknown): string {
  const v = clean(s, 40)
  const digits = v.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15 ? v : ''
}
export function cleanUrl(s: unknown): string { const u = safeUrl(clean(s, 300)); return u ? u.replace(/\/$/, '') : '' }

// ── Names ───────────────────────────────────────────────────────────────────
const TITLES = new Set(['mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'er', 'shri', 'smt', 'kumari'])
const nameTokens = (n: string) => n.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z\s'-]/g, ' ').split(/\s+/).filter((t) => t && !TITLES.has(t))

/** Same person if the first and last names agree (an initial matches a full name); order and middle names are ignored. */
export function sameName(a: string, b: string): boolean {
  const x = nameTokens(a), y = nameTokens(b)
  if (!x.length || !y.length) return false
  const eq = (p: string, q: string) => p === q || (p.length === 1 && q.startsWith(p)) || (q.length === 1 && p.startsWith(q))
  // A lone first name against a full name is not enough to call two people the same.
  if (x.length === 1 || y.length === 1) return x.length === y.length && x[0] === y[0]
  const direct = eq(x[0], y[0]) && eq(x[x.length - 1], y[y.length - 1])
  const swapped = eq(x[0], y[y.length - 1]) && eq(x[x.length - 1], y[0]) // "Sharma Priya" vs "Priya Sharma"
  return direct || swapped
}

/** Names printed in capitals (MAYURI BHIDE) are stored as Mayuri Bhide. */
const titleCaseIfShouting = (n: string) => (n && n === n.toUpperCase() ? n.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase()) : n)

// ── Reading details out of a resume ─────────────────────────────────────────
const yearOf = (s: string | undefined) => Number(String(s ?? '').match(/(19|20)\d{2}/)?.[0] ?? NaN)

export function proposeDetails(data: Partial<ExtractedCareerData>, urls: Record<string, string> = {}, now = new Date().getFullYear()): ProfileDetails {
  const d = { timeline: [], education: [], skills: [], rawText: '', ...data } as ExtractedCareerData
  const id = identityFrom(d)
  const c = id.contact
  const det = detectStudent(d, now)
  const facts = experienceFacts(d.timeline ?? [], now)
  // Current role: the latest role on the timeline, preferring one marked as current.
  const rows = [...(d.timeline ?? [])].sort((a, b) => (yearOf(b.endDate) || now) - (yearOf(a.endDate) || now) || (yearOf(b.startDate) || 0) - (yearOf(a.startDate) || 0))
  const cur = rows.find((t) => /present|current|ongoing|now/i.test(String(t.endDate ?? ''))) ?? rows[0]
  const edu = [...(d.education ?? [])].sort((a, b) => (yearOf(b.year) || 0) - (yearOf(a.year) || 0))[0]
  return {
    fullName: titleCaseIfShouting(clean(id.name, 80)),
    email: cleanEmail(c.email),
    phone: cleanPhone(c.phone),
    location: clean(c.location, 80),
    linkedinUrl: cleanUrl(c.linkedinUrl || urls.linkedin),
    portfolioUrl: cleanUrl(c.portfolioUrl || urls.portfolio),
    githubUrl: cleanUrl(c.githubUrl || urls.github),
    experienceYears: det.fullTimeYears > 0 ? Math.round(det.fullTimeYears * 2) / 2 : (facts.years > 0 && !det.isStudent ? facts.years : 0),
    track: det.track,
    currentRole: clean(cur?.role, 100),
    currentOrg: clean(cur?.company, 100),
    education: edu ? clean(`${edu.degree}${edu.institution ? `, ${edu.institution}` : ''}${edu.year ? ` (${edu.year})` : ''}`, 160) : '',
  }
}

// ── Comparing with what is saved ────────────────────────────────────────────
export interface FieldChange { field: EditableField; label: string; from: string; to: string }

const norm = (f: EditableField, v: unknown): string => {
  if (v === null || v === undefined) return ''
  if (f === 'phone') return String(v).replace(/\D/g, '').replace(/^(?:0|91)(?=\d{10}$)/, '')
  if (f === 'linkedinUrl' || f === 'portfolioUrl' || f === 'githubUrl') return String(v).toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
  if (f === 'experienceYears') return String(Math.round(Number(v) * 2) / 2)
  return String(v).trim().toLowerCase()
}
const show = (f: EditableField, v: unknown): string => (f === 'track' ? TRACK_LABELS[v as CareerTrack] ?? '' : f === 'experienceYears' ? (v === null || v === undefined || v === '' ? '' : `${v} years`) : String(v ?? ''))

/** Fields where the new resume says something different from what is saved. Empty values never overwrite saved ones. */
export function diffDetails(saved: Partial<ProfileDetails>, proposed: ProfileDetails): FieldChange[] {
  const out: FieldChange[] = []
  for (const f of EDITABLE_FIELDS) {
    const to = proposed[f]
    if (to === '' || to === null || to === undefined) continue
    if (f === 'experienceYears' && Number(to) === 0 && saved.experienceYears) continue
    if (norm(f, saved[f]) !== norm(f, to)) out.push({ field: f, label: FIELD_LABELS[f], from: show(f, saved[f]), to: show(f, to) })
  }
  return out
}

/** Applies only the accepted fields to the saved details. The name is never touched. */
export function applyChanges(saved: ProfileDetails, proposed: ProfileDetails, accept: readonly string[]): ProfileDetails {
  const next = { ...saved }
  for (const f of EDITABLE_FIELDS) if (accept.includes(f) && proposed[f] !== '' && proposed[f] !== null) (next as Record<string, unknown>)[f] = proposed[f]
  return next
}

export type Proposal =
  | { status: 'new'; proposed: ProfileDetails }
  | { status: 'same-person'; proposed: ProfileDetails; changes: FieldChange[] }
  | { status: 'unchanged' }
  | { status: 'different-name' }
  | { status: 'no-name' }

export function decide(saved: ProfileDetails | null, proposed: ProfileDetails): Proposal {
  if (!saved) return { status: 'new', proposed } // even with no name found: the person types it in while validating
  if (!proposed.fullName) return { status: 'no-name' }
  if (!sameName(saved.fullName, proposed.fullName)) return { status: 'different-name' }
  const changes = diffDetails(saved, proposed)
  return changes.length ? { status: 'same-person', proposed, changes } : { status: 'unchanged' }
}
