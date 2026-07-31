import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { Flame, Sparkles } from 'lucide-react'
import { CompetencyRadar } from '@/components/profile/CompetencyRadar'
import type { CompetencyRadarData } from '@/components/profile/CompetencyRadar'
import { ActivityTimeline } from '@/components/profile/ActivityTimeline'
import type { TimelineSession } from '@/components/profile/ActivityTimeline'
import { SkillBar } from '@/components/profile/SkillBar'

// ─── Career level badge colours ──────────────────────────────────────────────
const LEVEL_STYLES: Record<string, { bg: string; text: string }> = {
  Beginner:     { bg: 'bg-emerald-950',  text: 'text-emerald-400'  },
  Intermediate: { bg: 'bg-blue-950',     text: 'text-blue-400'     },
  Senior:       { bg: 'bg-violet-950',   text: 'text-violet-400'   },
  Expert:       { bg: 'bg-amber-950',    text: 'text-amber-400'    },
}

function careerLevelStyle(level: string | null) {
  if (!level) return { bg: 'bg-[#353B45]', text: 'text-[#6b7280]' }
  return LEVEL_STYLES[level] ?? { bg: 'bg-[#353B45]', text: 'text-[#6b7280]' }
}

// ─── Skill grouping by domain ─────────────────────────────────────────────────
interface SkillEntry {
  skillId: string
  level: number
  skill: {
    name: string
    domain: { name: string } | null
  }
}

function groupByDomain(skills: SkillEntry[]): Map<string, SkillEntry[]> {
  const map = new Map<string, SkillEntry[]>()
  for (const us of skills) {
    if (us.level === 0) continue
    const domain = us.skill.domain?.name ?? 'General'
    const group = map.get(domain) ?? []
    group.push(us)
    map.set(domain, group)
  }
  return map
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ProfilePage() {
  // DEV BYPASS: hardcoded session, remove before shipping
  const session = (await getSession()) ?? { userId: 'cmrx3naan0001yqil02daq62x', email: 'amit.xasap@gmail.com' }

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

  if (!user) redirect('/login')

  const daysSinceJoined = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Radar: scale level (0–10) → 0–100 for visual display; target = 60
  const radarData: CompetencyRadarData[] = user.competencies.map(uc => ({
    competency: uc.competency.name,
    level: uc.level * 10,
    target: 60,
  }))

  // Timeline: LearningSession is generic (entityType/entityId)
  const timelineSessions: TimelineSession[] = user.learningSessions.map(s => ({
    id: s.id,
    completedAt: s.completedAt!.toISOString(),
    entityType: s.entityType,
    entityId: s.entityId,
    durationSec: s.durationSec,
  }))

  // Skills grouped by domain
  const skillsByDomain = groupByDomain(user.skills)

  // Mastered concepts
  const recentMastered = user.conceptMasteries.slice(0, 5)
  const totalMastered = user.conceptMasteries.length

  const levelStyle = careerLevelStyle(user.careerLevel?.name ?? null)

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-12">

      {/* ── Section 1: Header ──────────────────────────────────────────── */}
      <section aria-labelledby="profile-heading">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1
                id="profile-heading"
                className="text-3xl font-sora font-bold text-white leading-tight"
              >
                {user.name ?? session.email.split('@')[0]}
              </h1>
              <p className="mt-1 text-sm text-[#6b7280] font-jakarta">
                Designer since {daysSinceJoined} day{daysSinceJoined !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Career level badge */}
            {user.careerLevel && (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium font-jakarta ${levelStyle.bg} ${levelStyle.text}`}
              >
                {user.careerLevel.name}
              </span>
            )}
          </div>

          {/* XP + Streak row */}
          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#B6FF2E]" />
              <span className="text-sm font-jakarta font-medium text-white">
                {user.xp.toLocaleString()} XP
              </span>
            </div>
            {user.streak > 0 && (
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-orange-400" />
                <span className="text-sm font-jakarta font-medium text-white">
                  {user.streak} day streak
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Section 2: Competency Radar ────────────────────────────────── */}
      <section aria-labelledby="radar-heading">
        <h2
          id="radar-heading"
          className="text-lg font-sora font-semibold text-white mb-1"
        >
          Competency Map
        </h2>
        <p className="text-sm text-[#6b7280] font-jakarta mb-6">
          Your current levels across design competencies. Dashed line shows the 60-point target.
        </p>
        <div className="bg-[#0a0a14] border border-[#353B45] rounded-2xl px-2 py-4">
          {radarData.length > 0 ? (
            <CompetencyRadar data={radarData} />
          ) : (
            <p className="text-sm text-[#6b7280] font-jakarta text-center py-16">
              Complete your first experience to see your competency map.
            </p>
          )}
        </div>
      </section>

      {/* ── Section 3: Skill Progress ──────────────────────────────────── */}
      <section aria-labelledby="skills-heading">
        <h2
          id="skills-heading"
          className="text-lg font-sora font-semibold text-white mb-6"
        >
          Skill Progress
        </h2>

        {skillsByDomain.size === 0 ? (
          <p className="text-sm text-[#6b7280] font-jakarta">
            No skills recorded yet. Complete experiences to build your skill profile.
          </p>
        ) : (
          <div className="space-y-8">
            {Array.from(skillsByDomain.entries()).map(([domain, skills]) => (
              <div key={domain}>
                <h3 className="text-xs font-jakarta font-semibold uppercase tracking-widest text-[#6b7280] mb-3">
                  {domain}
                </h3>
                <div className="space-y-3">
                  {skills.map(us => (
                    <SkillBar
                      key={us.skillId}
                      name={us.skill.name}
                      level={us.level}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Section 4: Recent Activity ─────────────────────────────────── */}
      <section aria-labelledby="activity-heading">
        <h2
          id="activity-heading"
          className="text-lg font-sora font-semibold text-white mb-6"
        >
          Recent Activity
        </h2>
        <ActivityTimeline sessions={timelineSessions} />
      </section>

      {/* ── Section 5: Concept Mastery ─────────────────────────────────── */}
      <section aria-labelledby="concepts-heading">
        <h2
          id="concepts-heading"
          className="text-lg font-sora font-semibold text-white mb-2"
        >
          Concept Mastery
        </h2>
        <p className="text-5xl font-sora font-bold text-[#B6FF2E] mb-4">
          {totalMastered}
        </p>
        <p className="text-sm text-[#6b7280] font-jakarta mb-4">
          {totalMastered === 1 ? 'concept mastered' : 'concepts mastered'}
        </p>

        {recentMastered.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recentMastered.map(m => (
              <span
                key={m.conceptId}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium font-jakarta bg-[#1a1a2e] text-[#818cf8] border border-[#2a2a3a]"
              >
                {m.concept.title}
              </span>
            ))}
          </div>
        )}
      </section>

    </main>
  )
}
