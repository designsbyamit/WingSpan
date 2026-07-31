// app/api/session/today/route.ts
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import type { TodaySessionResponse } from '@/types/design-evolution'

export const maxDuration = 60

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Get user with active learning path
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { careerLevelId: true, activeLearningPathId: true },
    })

    if (!user?.activeLearningPathId) {
      return NextResponse.json({ error: 'No active learning path' }, { status: 404 })
    }

    // 2. Find completed experience IDs for this user
    const completedSessions = await db.learningSession.findMany({
      where: {
        userId: session.userId,
        completedAt: { not: null },
        experienceId: { not: null },
      },
      select: { experienceId: true },
    })
    const completedIds = completedSessions
      .map((s) => s.experienceId)
      .filter((id): id is string => id !== null)

    // 3. Find the next unstarted entry (entityType=experience) in the path
    const nextEntry = await db.learningPathEntry.findFirst({
      where: {
        learningPathId: user.activeLearningPathId,
        entityType: 'experience',
        entityId: { notIn: completedIds },
      },
      orderBy: { order: 'asc' },
    })

    if (!nextEntry) {
      return NextResponse.json({ error: 'Learning path complete' }, { status: 404 })
    }

    // 4. Load the full experience
    const experience = await db.experience.findUnique({
      where: { id: nextEntry.entityId },
      include: {
        concepts: {
          include: {
            concept: {
              select: { id: true, title: true, body: true, summary: true },
            },
          },
        },
        competencies: {
          include: {
            competency: {
              select: { id: true, name: true, description: true, weight: true },
            },
          },
        },
      },
    })

    if (!experience) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 })
    }

    // 5. Find or create today's session
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    let learningSession = await db.learningSession.findFirst({
      where: {
        userId: session.userId,
        experienceId: experience.id,
        startedAt: { gte: todayStart, lte: todayEnd },
      },
    })

    if (!learningSession) {
      learningSession = await db.learningSession.create({
        data: {
          userId: session.userId,
          entityType: 'experience',
          entityId: experience.id,
          experienceId: experience.id,
          startedAt: new Date(),
          completedAt: null,
          reflectionText: null,
          aiMessages: '[]',
        },
      })
    }

    const response: TodaySessionResponse = {
      experience: {
        id: experience.id,
        title: experience.title,
        description: experience.description ?? '',
        narrativeText: experience.narrativeText,
        scenarioText: experience.scenarioText,
        estimatedMinutes: experience.durationMins,
        xpReward: experience.xpReward,
        concepts: experience.concepts.map(({ concept }) => ({
          id: concept.id,
          name: concept.title,
          definition: concept.body,
          whyItMatters: concept.summary ?? '',
        })),
        competencies: experience.competencies.map(({ competency }) => ({
          id: competency.id,
          name: competency.name,
          description: competency.description ?? '',
          weight: competency.weight,
        })),
      },
      session: {
        id: learningSession.id,
        experienceId: learningSession.experienceId ?? experience.id,
        startedAt: learningSession.startedAt.toISOString(),
        completedAt: learningSession.completedAt?.toISOString() ?? null,
        reflectionText: learningSession.reflectionText ?? null,
        aiMessages: JSON.parse(learningSession.aiMessages ?? '[]'),
      },
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('GET /api/session/today error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
