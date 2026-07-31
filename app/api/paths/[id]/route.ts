import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getSession()

  const path = await db.learningPath.findUnique({
    where: { id },
    include: {
      careerLevel: { select: { id: true, name: true } },
      entries: {
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!path) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Determine active state and completed experience IDs for this user
  let isActive = false
  let completedExperienceIds = new Set<string>()

  if (session) {
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { activeLearningPathId: true },
    })
    isActive = user?.activeLearningPathId === id

    // Only look at 'experience' entries
    const expEntryIds = path.entries
      .filter((e) => e.entityType === 'experience')
      .map((e) => e.entityId)

    if (expEntryIds.length > 0) {
      const sessions = await db.learningSession.findMany({
        where: {
          userId: session.userId,
          completedAt: { not: null },
          experienceId: { in: expEntryIds },
        },
        select: { experienceId: true },
      })
      completedExperienceIds = new Set(
        sessions.map((s) => s.experienceId).filter((id): id is string => id !== null)
      )
    }
  }

  // Load experience details for each entry
  const entriesWithDetail = await Promise.all(
    path.entries.map(async (entry) => {
      let experienceDetail: {
        id: string
        title: string
        description: string
        xpReward: number
        durationMins: number
        type: string
      } | null = null

      if (entry.entityType === 'experience') {
        const exp = await db.experience.findUnique({
          where: { id: entry.entityId },
          select: {
            id: true,
            title: true,
            description: true,
            xpReward: true,
            durationMins: true,
            type: true,
          },
        })
        if (exp) {
          experienceDetail = {
            ...exp,
            description: exp.description ?? '',
          }
        }
      }

      return {
        id: entry.id,
        order: entry.order,
        entityType: entry.entityType,
        entityId: entry.entityId,
        experience: experienceDetail,
        completedByUser:
          entry.entityType === 'experience'
            ? completedExperienceIds.has(entry.entityId)
            : false,
      }
    })
  )

  const result = {
    id: path.id,
    slug: path.slug,
    title: path.title,
    description: path.description ?? '',
    careerLevel: path.careerLevel,
    userProgress: session ? { isActive, currentOrder: null } : null,
    entries: entriesWithDetail,
  }

  return NextResponse.json(result)
}
