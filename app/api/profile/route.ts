import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import type { ProfileResponse } from './types'

export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      careerLevel: true,
      competencies: {
        include: { competency: true },
        orderBy: { competency: { name: 'asc' } },
      },
      skills: {
        where: { level: { gt: 0 } },
        include: { skill: { include: { domain: true } } },
        orderBy: { level: 'desc' },
      },
      learningSessions: {
        where: { completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
        take: 10,
      },
      conceptMasteries: {
        where: { mastered: true },
        include: { concept: { select: { id: true, title: true } } },
        orderBy: { lastSeenAt: 'desc' },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const daysSinceJoined = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  const body: ProfileResponse = {
    user: {
      name: user.name ?? user.email.split('@')[0],
      email: user.email,
      xp: user.xp,
      streak: user.streak,
      createdAt: user.createdAt.toISOString(),
      careerLevel: user.careerLevel?.name ?? null,
    },
    competencies: user.competencies.map(uc => ({
      competency: {
        id: uc.competency.id,
        name: uc.competency.name,
        description: uc.competency.description,
      },
      level: uc.level,
    })),
    skills: user.skills.map(us => ({
      skillId: us.skillId,
      skill: {
        name: us.skill.name,
        domain: us.skill.domain ? { name: us.skill.domain.name } : null,
      },
      level: us.level,
    })),
    recentSessions: user.learningSessions.map(s => ({
      id: s.id,
      completedAt: s.completedAt!.toISOString(),
      entityType: s.entityType,
      entityId: s.entityId,
      durationSec: s.durationSec,
    })),
    masteredConcepts: user.conceptMasteries.map(m => ({
      conceptId: m.conceptId,
      concept: { title: m.concept.title },
      mastered: m.mastered,
      lastSeenAt: m.lastSeenAt?.toISOString() ?? null,
    })),
    daysSinceJoined,
  }

  return NextResponse.json(body)
}
