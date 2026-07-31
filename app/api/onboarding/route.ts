// app/api/onboarding/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let careerLevelId: string
  let domainIds: string[]

  try {
    const body = await request.json()
    careerLevelId = body.careerLevelId
    domainIds = body.domainIds
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!careerLevelId || typeof careerLevelId !== 'string') {
    return NextResponse.json({ error: 'careerLevelId is required' }, { status: 400 })
  }

  if (
    !Array.isArray(domainIds) ||
    domainIds.length < 1 ||
    domainIds.length > 3 ||
    domainIds.some((id) => typeof id !== 'string')
  ) {
    return NextResponse.json(
      { error: 'domainIds must be an array of 1–3 strings' },
      { status: 400 }
    )
  }

  // 1. Update user's careerLevelId
  await db.user.update({
    where: { id: session.userId },
    data: { careerLevelId },
  })

  // 2. Find the default learning path for this career level
  const learningPath = await db.learningPath.findFirst({
    where: { careerLevelId },
    orderBy: { id: 'asc' },
  })

  if (learningPath) {
    // 3. Enrol user in the learning path (idempotent)
    await db.userLearningPath.upsert({
      where: {
        userId_learningPathId: {
          userId: session.userId,
          learningPathId: learningPath.id,
        },
      },
      create: {
        userId: session.userId,
        learningPathId: learningPath.id,
      },
      update: {},
    })
  }

  // 4. Seed UserCompetency rows for all competencies at score 0 (idempotent)
  const allCompetencies = await db.competency.findMany({ select: { id: true } })

  await Promise.all(
    allCompetencies.map((competency) =>
      db.userCompetency.upsert({
        where: {
          userId_competencyId: {
            userId: session.userId,
            competencyId: competency.id,
          },
        },
        create: {
          userId: session.userId,
          competencyId: competency.id,
          level: 0,
        },
        update: {},
      })
    )
  )

  return NextResponse.json({ success: true })
}
