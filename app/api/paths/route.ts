import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()

  const paths = await db.learningPath.findMany({
    include: {
      careerLevel: { select: { id: true, name: true } },
      _count: { select: { entries: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  // ── Estimated hours: gather all experience entityIds across all paths ──
  const allExpEntries = await db.learningPathEntry.findMany({
    where: {
      learningPathId: { in: paths.map((p) => p.id) },
      entityType: 'experience',
    },
    select: { learningPathId: true, entityId: true },
  })

  // Collect unique experience IDs and fetch their durationMins
  const uniqueExpIds = [...new Set(allExpEntries.map((e) => e.entityId))]
  const experiences =
    uniqueExpIds.length > 0
      ? await db.experience.findMany({
          where: { id: { in: uniqueExpIds } },
          select: { id: true, durationMins: true },
        })
      : []
  const expDurationMap = new Map(experiences.map((e) => [e.id, e.durationMins ?? 20]))

  // Compute estimated hours per path
  const estimatedHoursByPath: Record<string, number> = {}
  for (const path of paths) {
    const entries = allExpEntries.filter((e) => e.learningPathId === path.id)
    const totalMins = entries.reduce((sum, e) => sum + (expDurationMap.get(e.entityId) ?? 20), 0)
    estimatedHoursByPath[path.id] = Math.round((totalMins / 60) * 10) / 10
  }

  // ── Auth: active path + completed counts ──
  let activeLearningPathId: string | null = null
  let completedByPath: Record<string, number> = {}

  if (session) {
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { activeLearningPathId: true },
    })
    activeLearningPathId = user?.activeLearningPathId ?? null

    if (paths.length > 0) {
      const completedSessions = await db.learningSession.findMany({
        where: {
          userId: session.userId,
          completedAt: { not: null },
          experienceId: { not: null },
        },
        select: { experienceId: true },
      })
      const completedExpIds = new Set(
        completedSessions
          .map((s) => s.experienceId)
          .filter((id): id is string => id !== null)
      )

      for (const path of paths) {
        if (completedExpIds.size === 0) continue
        const entries = allExpEntries.filter((e) => e.learningPathId === path.id)
        const count = entries.filter((e) => completedExpIds.has(e.entityId)).length
        if (count > 0) completedByPath[path.id] = count
      }
    }
  }

  const result = paths.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description ?? '',
    careerLevel: p.careerLevel,
    experienceCount: p._count.entries,
    estimatedHours: estimatedHoursByPath[p.id] ?? 0,
    userProgress: session
      ? {
          isActive: activeLearningPathId === p.id,
          completedCount: completedByPath[p.id] ?? 0,
          currentOrder: null,
        }
      : null,
  }))

  return NextResponse.json(result)
}
