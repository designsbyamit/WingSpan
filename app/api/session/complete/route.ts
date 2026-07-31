// app/api/session/complete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import type { CompleteSessionRequest, CompleteSessionResponse } from '@/types/design-evolution'

export const maxDuration = 60

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isYesterday(date: Date, relativeTo: Date): boolean {
  const yesterday = new Date(relativeTo)
  yesterday.setDate(yesterday.getDate() - 1)
  return isSameDay(date, yesterday)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { sessionId, reflectionText } = body as CompleteSessionRequest

  if (!sessionId || typeof reflectionText !== 'string') {
    return NextResponse.json(
      { error: 'sessionId and reflectionText are required' },
      { status: 400 }
    )
  }

  try {
    const now = new Date()

    // 1. Mark session complete
    const learningSession = await db.learningSession.update({
      where: { id: sessionId, userId: session.userId },
      data: { completedAt: now, reflectionText },
    })

    const experienceId = learningSession.experienceId ?? learningSession.entityId

    // 2. Load experience with competencies and concepts
    const experience = await db.experience.findUnique({
      where: { id: experienceId },
      include: {
        competencies: {
          include: {
            competency: { select: { id: true, name: true, weight: true } },
          },
        },
        concepts: {
          include: {
            concept: { select: { id: true } },
          },
        },
      },
    })

    if (!experience) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 })
    }

    // 3. Get user for streak computation
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { xp: true, streak: true, lastActiveAt: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 6. Compute new streak
    let newStreak: number
    if (user.lastActiveAt && isYesterday(user.lastActiveAt, now)) {
      newStreak = (user.streak ?? 0) + 1
    } else if (user.lastActiveAt && isSameDay(user.lastActiveAt, now)) {
      newStreak = user.streak ?? 1
    } else {
      newStreak = 1
    }

    // Increment XP + streak
    await db.user.update({
      where: { id: session.userId },
      data: {
        xp: { increment: experience.xpReward },
        streak: newStreak,
        lastActiveAt: now,
      },
    })

    // 4. Upsert UserCompetency for each competency
    const competenciesUpdated: CompleteSessionResponse['competenciesUpdated'] = []
    for (const { competency } of experience.competencies) {
      const delta = Math.round(competency.weight * 5)
      const existing = await db.userCompetency.findUnique({
        where: {
          userId_competencyId: { userId: session.userId, competencyId: competency.id },
        },
        select: { score: true },
      })
      const currentScore = existing?.score ?? 0
      const newScore = Math.min(100, currentScore + delta)
      await db.userCompetency.upsert({
        where: {
          userId_competencyId: { userId: session.userId, competencyId: competency.id },
        },
        create: {
          userId: session.userId,
          competencyId: competency.id,
          score: newScore,
        },
        update: { score: newScore },
      })
      competenciesUpdated.push({ name: competency.name, newScore })
    }

    // 5. Upsert UserConceptMastery for each concept
    for (const { concept } of experience.concepts) {
      const existing = await db.userConceptMastery.findUnique({
        where: {
          userId_conceptId: { userId: session.userId, conceptId: concept.id },
        },
        select: { seenCount: true },
      })
      const newSeenCount = (existing?.seenCount ?? 0) + 1
      await db.userConceptMastery.upsert({
        where: {
          userId_conceptId: { userId: session.userId, conceptId: concept.id },
        },
        create: {
          userId: session.userId,
          conceptId: concept.id,
          seenCount: newSeenCount,
          lastSeen: now,
          mastered: newSeenCount >= 3,
        },
        update: {
          seenCount: newSeenCount,
          lastSeen: now,
          mastered: newSeenCount >= 3,
        },
      })
    }

    // 7. Advance UserLearningPath.currentEntryId to the next entry
    const user2 = await db.user.findUnique({
      where: { id: session.userId },
      select: { activeLearningPathId: true },
    })
    if (user2?.activeLearningPathId) {
      const currentEntry = await db.learningPathEntry.findFirst({
        where: {
          learningPathId: user2.activeLearningPathId,
          entityType: 'experience',
          entityId: experienceId,
        },
        select: { id: true, order: true },
      })
      if (currentEntry) {
        const nextEntry = await db.learningPathEntry.findFirst({
          where: {
            learningPathId: user2.activeLearningPathId,
            order: { gt: currentEntry.order },
          },
          orderBy: { order: 'asc' },
          select: { id: true },
        })
        await db.userLearningPath.update({
          where: {
            userId_learningPathId: {
              userId: session.userId,
              learningPathId: user2.activeLearningPathId,
            },
          },
          data: { currentEntryId: nextEntry?.id ?? null },
        })
      }
    }

    // 8. Upsert AIMentorContext — append reflection
    const existingCtx = await db.aIMentorContext.findUnique({
      where: { userId: session.userId },
      select: { reflectionHistory: true },
    })
    const reflectionHistory = [
      ...JSON.parse(existingCtx?.reflectionHistory ?? '[]'),
      reflectionText,
    ]
    await db.aIMentorContext.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        context: '',
        weaknesses: '[]',
        reflectionHistory: JSON.stringify(reflectionHistory),
      },
      update: { reflectionHistory: JSON.stringify(reflectionHistory) },
    })

    const result: CompleteSessionResponse = {
      xpEarned: experience.xpReward,
      competenciesUpdated,
      newStreak,
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('POST /api/session/complete error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
