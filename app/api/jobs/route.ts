import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { levelsFor } from '@/lib/profile/levels'
import { safeUrl } from '@/lib/links'
import type { CareerTrack } from '@/lib/student/detect'

// Roles from the job board the mentor keeps, filtered to the person's level. Signed-in users only.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  const track = (['STUDENT', 'BOTH'].includes(req.nextUrl.searchParams.get('track') ?? '') ? req.nextUrl.searchParams.get('track') : 'PROFESSIONAL') as CareerTrack
  const yearsParam = Number(req.nextUrl.searchParams.get('years'))
  const years = Number.isFinite(yearsParam) && yearsParam >= 0 ? Math.min(60, yearsParam) : null
  const levels = levelsFor(track, years)
  const since = new Date(Date.now() - 60 * 86_400_000)
  try {
    const where = { status: 'OPEN', isDesign: true, lastSeenAt: { gte: since } }
    const [rows, total] = await Promise.all([
      db.jobListing.findMany({ where: { ...where, level: { in: levels } }, orderBy: { lastSeenAt: 'desc' }, take: 12 }),
      db.jobListing.count({ where }),
    ])
    return NextResponse.json({
      total, levels,
      jobs: rows.map((j) => ({
        id: j.id, title: j.title, company: j.company, location: j.location ?? j.city, level: j.level, workMode: j.workMode, salaryText: j.salaryText,
        applyUrl: safeUrl(j.applyUrl), sourceName: j.sourceName, postedText: j.postedText, seenAt: j.lastSeenAt.toISOString().slice(0, 10),
      })),
    })
  } catch {
    return NextResponse.json({ total: 0, levels, jobs: [] }) // the job board never blocks the profile
  }
}
