// app/(app)/page.tsx
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { ExperienceCard } from '@/components/home/ExperienceCard'
import { CompetencyBar } from '@/components/home/CompetencyBar'
import type { TodaySessionResponse, CompetencyBarData } from '@/types/design-evolution'

function getGreeting(name: string): string {
  const hour = new Date().getHours()
  if (hour < 12) return `Good morning, ${name}`
  if (hour < 17) return `Good afternoon, ${name}`
  return `Good evening, ${name}`
}

export default async function HomePage() {
  // DEV BYPASS: hardcoded session, remove before shipping
  const session = (await getSession()) ?? { userId: 'cmrx3naan0001yqil02daq62x', email: 'amit.xasap@gmail.com' }

  // ── User data ────────────────────────────────────────────────────────────
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      streak: true,
      xp: true,
      careerLevelId: true,
      activeLearningPathId: true,
    },
  })

  // ── Today's session (inlined — avoids cookieless server-side fetch) ──────
  let todayData: TodaySessionResponse | null = null

  if (user?.activeLearningPathId) {
    // Find completed experience IDs for this user
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

    // Find the next unstarted experience entry in the path
    const nextEntry = await db.learningPathEntry.findFirst({
      where: {
        learningPathId: user.activeLearningPathId,
        entityType: 'experience',
        entityId: { notIn: completedIds },
      },
      orderBy: { order: 'asc' },
    })

    if (nextEntry) {
      // Load the full experience with concepts and competencies
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

      if (experience) {
        // Find or create today's session
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

        todayData = {
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
      }
    }
  }

  // ── Top 3 competencies (clean, no broken where clause) ───────────────────
  const topCompetencies = await db.competency.findMany({
    take: 3,
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  const competencyScores: CompetencyBarData[] = await Promise.all(
    topCompetencies.map(async (comp) => {
      const uc = await db.userCompetency.findUnique({
        where: {
          userId_competencyId: { userId: session.userId, competencyId: comp.id },
        },
        select: { score: true },
      })
      return { id: comp.id, name: comp.name, score: uc?.score ?? 0 }
    })
  )

  const streak = user?.streak ?? 0
  const firstName =
    user?.name?.split(' ')[0] ?? session.email.split('@')[0]

  return (
    <main className="max-w-2xl mx-auto px-6 py-14 flex flex-col gap-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1
          className="text-3xl font-bold text-white"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          {getGreeting(firstName)}
        </h1>
        {streak > 0 && (
          <div className="flex items-center gap-2 rounded-full border border-[#353B45] bg-[#2D3139] px-4 py-2">
            <span className="text-base">🔥</span>
            <span className="text-sm font-semibold text-white">{streak}</span>
            <span className="text-xs text-white/40">day streak</span>
          </div>
        )}
      </div>

      {/* Daily experience card */}
      {todayData ? (
        <ExperienceCard
          experience={todayData.experience}
          session={todayData.session}
        />
      ) : (
        <div className="rounded-2xl border border-[#353B45] bg-[#2D3139] p-8">
          <p className="text-white/40 text-sm">
            No active learning path found. Complete onboarding to begin.
          </p>
        </div>
      )}

      {/* Competency progress */}
      {competencyScores.length > 0 && (
        <section className="flex flex-col gap-5">
          <h2
            className="text-xs font-semibold uppercase tracking-widest text-white/30"
            style={{ fontFamily: 'var(--font-sora)' }}
          >
            Your Progress
          </h2>
          <div className="flex flex-col gap-4">
            {competencyScores.map((comp, i) => (
              <CompetencyBar key={comp.id} data={comp} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* AI nudge card */}
      <div className="rounded-xl border border-[#B6FF2E]/20 bg-[#B6FF2E]/5 px-5 py-4">
        <p className="text-sm text-white/70 leading-relaxed">
          <span className="text-[#B6FF2E] font-medium">AI Mentor · </span>
          Let&apos;s build on yesterday&apos;s work. Your mentor is ready when you begin.
        </p>
      </div>
    </main>
  )
}
