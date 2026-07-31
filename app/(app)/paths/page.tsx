import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import PathCard from '@/components/paths/PathCard'

export const metadata = { title: 'Learning Paths — Design Evolution' }

export default async function PathsPage() {
  const session = await getSession()

  const paths = await db.learningPath.findMany({
    include: {
      careerLevel: { select: { id: true, name: true } },
      _count: { select: { entries: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  // ── Estimated hours: batch-fetch all experience entries + durations ──
  const allExpEntries = await db.learningPathEntry.findMany({
    where: {
      learningPathId: { in: paths.map((p) => p.id) },
      entityType: 'experience',
    },
    select: { learningPathId: true, entityId: true },
  })
  const uniqueExpIds = [...new Set(allExpEntries.map((e) => e.entityId))]
  const experiences =
    uniqueExpIds.length > 0
      ? await db.experience.findMany({
          where: { id: { in: uniqueExpIds } },
          select: { id: true, durationMins: true },
        })
      : []
  const expDurationMap = new Map(experiences.map((e) => [e.id, e.durationMins ?? 20]))
  const estimatedHoursByPath: Record<string, number> = {}
  for (const path of paths) {
    const entries = allExpEntries.filter((e) => e.learningPathId === path.id)
    const totalMins = entries.reduce((sum, e) => sum + (expDurationMap.get(e.entityId) ?? 20), 0)
    estimatedHoursByPath[path.id] = Math.round((totalMins / 60) * 10) / 10
  }

  // ── Auth: active path and completed counts per path ──
  let activeLearningPathId: string | null = null
  let completedByPath: Record<string, number> = {}

  if (session && paths.length > 0) {
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { activeLearningPathId: true },
    })
    activeLearningPathId = user?.activeLearningPathId ?? null

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

    if (completedExpIds.size > 0) {
      for (const path of paths) {
        const entries = allExpEntries.filter((e) => e.learningPathId === path.id)
        const count = entries.filter((e) => completedExpIds.has(e.entityId)).length
        if (count > 0) completedByPath[path.id] = count
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#23262F] text-[#f0f0f0]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1
            className="text-3xl font-bold text-[#f0f0f0] mb-2"
            style={{ fontFamily: 'var(--font-sora)' }}
          >
            Learning Paths
          </h1>
          <p className="text-[#666] text-base">Choose your journey. Switch anytime.</p>
        </div>

        {/* Grid */}
        {paths.length === 0 ? (
          <p className="text-[#555] text-sm">No learning paths available yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {paths.map((path) => (
              <PathCard
                key={path.id}
                id={path.id}
                title={path.title}
                description={path.description ?? ''}
                careerLevel={path.careerLevel}
                experienceCount={path._count.entries}
                estimatedHours={estimatedHoursByPath[path.id] ?? 0}
                userProgress={
                  session
                    ? {
                        isActive: activeLearningPathId === path.id,
                        completedCount: completedByPath[path.id] ?? 0,
                        currentOrder: null,
                      }
                    : null
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
