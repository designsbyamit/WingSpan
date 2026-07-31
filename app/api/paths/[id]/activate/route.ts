import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify path exists
  const path = await db.learningPath.findUnique({ where: { id }, select: { id: true } })
  if (!path) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Update user's activeLearningPathId
  await db.user.update({
    where: { id: session.userId },
    data: { activeLearningPathId: id },
  })

  // Ensure enrollment record exists in UserLearningPath
  await db.userLearningPath.upsert({
    where: { userId_learningPathId: { userId: session.userId, learningPathId: id } },
    create: { userId: session.userId, learningPathId: id },
    update: {},
  })

  return NextResponse.json({ ok: true })
}
