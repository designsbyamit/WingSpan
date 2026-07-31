import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import ExperienceRow from '@/components/paths/ExperienceRow'
import ActivatePathButton from '@/components/paths/ActivatePathButton'
import { BookOpen } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const path = await db.learningPath.findUnique({ where: { id }, select: { title: true } })
  return { title: path ? `${path.title} — Design Evolution` : 'Path not found' }
}

export default async function PathDetailPage({ params }: Props) {
  const { id } = await params
  const session = await getSession()

  const path = await db.learningPath.findUnique({
    where: { id },
    include: {
      careerLevel: { select: { name: true } },
      entries: {
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!path) notFound()

  // Determine active state and completed experience IDs for this user
  let isActive = false
  let completedIds = new Set<string>()

  if (session) {
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { activeLearningPathId: true },
    })
    isActive = user?.activeLearningPathId === id

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
      completedIds = new Set(
        sessions.map((s) => s.experienceId).filter((eid): eid is string => eid !== null)
      )
    }
  }

  // Load experience details for each entry
  const expEntries = path.entries.filter((e) => e.entityType === 'experience')

  const entriesWithDetail = await Promise.all(
    expEntries.map(async (entry, index) => {
      const exp = await db.experience.findUnique({
        where: { id: entry.entityId },
        select: {
          id: true,
          title: true,
          description: true,
          xpReward: true,
          durationMins: true,
        },
      })

      // Unlock logic: first entry always unlocked; subsequent entries require previous completed
      const isUnlocked =
        index === 0 || completedIds.has(expEntries[index - 1].entityId)

      return {
        id: entry.id,
        order: entry.order,
        entityId: entry.entityId,
        exp,
        completedByUser: completedIds.has(entry.entityId),
        isUnlocked,
      }
    })
  )

  const experienceCount = expEntries.length

  return (
    <div className="min-h-screen bg-[#23262F] text-[#f0f0f0]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Path header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              {path.careerLevel && (
                <span className="inline-block text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2.5 py-0.5 mb-3">
                  {path.careerLevel.name}
                </span>
              )}
              <h1
                className="text-3xl font-bold text-[#f0f0f0] leading-tight"
                style={{ fontFamily: 'var(--font-sora)' }}
              >
                {path.title}
              </h1>
            </div>
            {session && !isActive && <ActivatePathButton pathId={id} />}
            {isActive && (
              <span className="flex-shrink-0 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-3 py-1.5 mt-1">
                Active Path
              </span>
            )}
          </div>
          <p className="text-[#888] text-base leading-relaxed mb-4">{path.description}</p>
          <div className="flex items-center gap-4 text-sm text-[#555]">
            <span className="flex items-center gap-1.5">
              <BookOpen size={14} />
              {experienceCount} experience{experienceCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#353B45] mb-6" />

        {/* Experience list */}
        {entriesWithDetail.length === 0 ? (
          <p className="text-[#555] text-sm">No experiences in this path yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {entriesWithDetail.map((item) =>
              item.exp ? (
                <ExperienceRow
                  key={item.id}
                  order={item.order}
                  experienceId={item.entityId}
                  title={item.exp.title}
                  durationMins={item.exp.durationMins}
                  xpReward={item.exp.xpReward}
                  completedByUser={item.completedByUser}
                  isUnlocked={item.isUnlocked}
                />
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  )
}
