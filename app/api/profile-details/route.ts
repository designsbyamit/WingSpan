import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { applyChanges, cleanEmail, cleanPhone, cleanUrl, decide, proposeDetails, sameName, EDITABLE_FIELDS, type ProfileDetails } from '@/lib/profile/details'
import type { ExtractedCareerData } from '@/types/wingspan'

// The person's confirmed details.
//  GET  -> what is saved (or null).
//  POST -> { extracted, urls }: reads details from a resume and says what to ask the person (never saves).
//  PUT  -> { details } to confirm the first time, or { extracted, urls, accept } to apply approved changes
//          from a same-name resume, or { edit } for the person's own edits. The name is never changed once saved.

type Row = NonNullable<Awaited<ReturnType<typeof db.userProfile.findUnique>>>
const toDetails = (r: Row): ProfileDetails => ({
  fullName: r.fullName, email: r.email ?? '', phone: r.phone ?? '', location: r.location ?? '', linkedinUrl: r.linkedinUrl ?? '', portfolioUrl: r.portfolioUrl ?? '',
  githubUrl: r.githubUrl ?? '', experienceYears: r.experienceYears, track: (['STUDENT', 'PROFESSIONAL', 'BOTH'].includes(r.track) ? r.track : 'PROFESSIONAL') as ProfileDetails['track'],
  currentRole: r.currentRole ?? '', currentOrg: r.currentOrg ?? '', education: r.education ?? '',
})
const nul = (s: string) => (s === '' ? null : s)

/** Cleans anything the browser sends: every field is re-validated here. */
function sanitize(d: Partial<ProfileDetails> | undefined): ProfileDetails {
  const s = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, n) : '')
  const years = typeof d?.experienceYears === 'number' && Number.isFinite(d.experienceYears) ? Math.min(60, Math.max(0, Math.round(d.experienceYears * 2) / 2)) : null
  const track = d?.track === 'STUDENT' || d?.track === 'BOTH' ? d.track : 'PROFESSIONAL'
  return {
    fullName: s(d?.fullName, 80), email: cleanEmail(d?.email), phone: cleanPhone(d?.phone), location: s(d?.location, 80), linkedinUrl: cleanUrl(d?.linkedinUrl),
    portfolioUrl: cleanUrl(d?.portfolioUrl), githubUrl: cleanUrl(d?.githubUrl), experienceYears: years, track, currentRole: s(d?.currentRole, 100), currentOrg: s(d?.currentOrg, 100), education: s(d?.education, 160),
  }
}

export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  const row = await db.userProfile.findUnique({ where: { userId: session.userId } })
  return NextResponse.json({ profile: row ? { ...toDetails(row), confirmedAt: row.confirmedAt.toISOString() } : null })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  const body = await req.json().catch(() => null) as { extracted?: ExtractedCareerData; urls?: Record<string, string> } | null
  if (!body?.extracted) return NextResponse.json({ error: 'No resume data' }, { status: 400 })
  const proposed = proposeDetails(body.extracted, body.urls ?? {})
  const row = await db.userProfile.findUnique({ where: { userId: session.userId } })
  return NextResponse.json(decide(row ? toDetails(row) : null, proposed))
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  const body = await req.json().catch(() => null) as { details?: Partial<ProfileDetails>; extracted?: ExtractedCareerData; urls?: Record<string, string>; accept?: string[]; edit?: Partial<ProfileDetails> } | null
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  const existing = await db.userProfile.findUnique({ where: { userId: session.userId } })

  // 1) First confirmation: the person has checked every field, including the name.
  if (!existing) {
    const d = sanitize(body.details)
    if (!d.fullName) return NextResponse.json({ error: 'Please enter your name.' }, { status: 422 })
    const row = await db.userProfile.create({ data: { userId: session.userId, ...d, email: nul(d.email), phone: nul(d.phone), location: nul(d.location), linkedinUrl: nul(d.linkedinUrl), portfolioUrl: nul(d.portfolioUrl), githubUrl: nul(d.githubUrl), currentRole: nul(d.currentRole), currentOrg: nul(d.currentOrg), education: nul(d.education) } })
    await db.user.updateMany({ where: { id: session.userId, name: null }, data: { name: d.fullName } })
    return NextResponse.json({ profile: { ...toDetails(row), confirmedAt: row.confirmedAt.toISOString() } })
  }

  const saved = toDetails(existing)
  let next: ProfileDetails
  if (body.edit) {
    // The person's own edit of a saved field. The name stays as confirmed.
    const e = sanitize({ ...saved, ...body.edit })
    next = { ...e, fullName: saved.fullName }
  } else if (body.extracted) {
    // Changes read from a newer resume, only for the same person and only the fields they approved.
    const proposed = proposeDetails(body.extracted, body.urls ?? {})
    if (!sameName(saved.fullName, proposed.fullName)) return NextResponse.json({ error: 'This resume has a different name, so your profile was not changed.' }, { status: 409 })
    const accept = (body.accept ?? []).filter((f) => (EDITABLE_FIELDS as readonly string[]).includes(f))
    next = applyChanges(saved, proposed, accept)
  } else return NextResponse.json({ error: 'Nothing to save' }, { status: 400 })

  const row = await db.userProfile.update({ where: { userId: session.userId }, data: { email: nul(next.email), phone: nul(next.phone), location: nul(next.location), linkedinUrl: nul(next.linkedinUrl), portfolioUrl: nul(next.portfolioUrl), githubUrl: nul(next.githubUrl), experienceYears: next.experienceYears, track: next.track, currentRole: nul(next.currentRole), currentOrg: nul(next.currentOrg), education: nul(next.education) } })
  return NextResponse.json({ profile: { ...toDetails(row), confirmedAt: row.confirmedAt.toISOString() } })
}
