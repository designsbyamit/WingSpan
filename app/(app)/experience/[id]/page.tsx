// app/(app)/experience/[id]/page.tsx
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { ConceptGuide } from '@/components/experience/ConceptGuide'
import { ChallengeResponse } from '@/components/experience/ChallengeResponse'
import { MentorFloating } from '@/components/experience/MentorFloating'
import { ExperienceImage } from '@/components/experience/ExperienceImage'
import type { ExperienceData, LearningSessionData } from '@/types/design-evolution'

/** Renders a markdown string as styled JSX — handles **bold**, numbered lists, and --- dividers. */
function MarkdownText({ text }: { text: string }) {
  // Split on --- dividers first, then process each block
  const blocks = text.split(/\n?---\n?/).filter(Boolean)

  return (
    <>
      {blocks.map((block, blockIdx) => {
        const lines = block.trim().split('\n')
        const elements: React.ReactNode[] = []

        lines.forEach((line, i) => {
          const trimmed = line.trim()
          if (!trimmed) return

          // Numbered list item: "1. " or "2. " etc.
          const listMatch = trimmed.match(/^(\d+)\.\s+(.+)$/)
          if (listMatch) {
            elements.push(
              <div key={i} className="flex gap-2">
                <span className="text-[#B6FF2E] font-semibold shrink-0 w-5">{listMatch[1]}.</span>
                <span>{renderInline(listMatch[2])}</span>
              </div>
            )
            return
          }

          elements.push(<p key={i}>{renderInline(trimmed)}</p>)
        })

        return (
          <div key={blockIdx} className="flex flex-col gap-2">
            {elements}
          </div>
        )
      })}
    </>
  )
}

/** Renders inline markdown: **bold** → <strong> */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

interface PageProps {
  params: Promise<{ id: string }>
}

async function getOrCreateSession(
  userId: string,
  experienceId: string
): Promise<LearningSessionData> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  let session = await db.learningSession.findFirst({
    where: {
      userId,
      experienceId,
      startedAt: { gte: todayStart, lte: todayEnd },
    },
  })

  if (!session) {
    session = await db.learningSession.create({
      data: {
        userId,
        entityType: 'experience',
        entityId: experienceId,
        experienceId,
        startedAt: new Date(),
        completedAt: null,
        reflectionText: null,
        aiMessages: '[]',
      },
    })
  }

  return {
    id: session.id,
    experienceId: session.experienceId ?? experienceId,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    reflectionText: session.reflectionText ?? null,
    aiMessages: JSON.parse(session.aiMessages ?? '[]'),
  }
}

export default async function ExperiencePage({ params }: PageProps) {
  const { id } = await params
  const authSession = await getSession()
  if (!authSession) redirect('/login')

  const experience = await db.experience.findUnique({
    where: { id },
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

  if (!experience) notFound()

  const learningSession = await getOrCreateSession(authSession.userId, id)

  const experienceData: ExperienceData = {
    id: experience.id,
    title: experience.title,
    description: experience.description ?? '',
    narrativeText: experience.narrativeText,
    scenarioText: experience.scenarioText,
    estimatedMinutes: experience.durationMins,
    xpReward: experience.xpReward,
    concepts: experience.concepts
      .map(({ concept }) => ({
        id: concept.id,
        name: concept.title,
        definition: concept.body,
        whyItMatters: concept.summary ?? '',
      }))
      .filter(c => c.definition && c.definition.trim().length > 20)
      .slice(0, 5),
    competencies: experience.competencies.map(({ competency }) => ({
      id: competency.id,
      name: competency.name,
      description: competency.description ?? '',
      weight: competency.weight,
    })),
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-2xl mx-auto px-6 py-14 flex flex-col gap-12 pb-24">

        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {experienceData.competencies.map((comp) => (
              <span
                key={comp.id}
                className="px-3 py-1 rounded-full text-xs font-medium bg-[#B6FF2E]/10 text-[#B6FF2E] border border-[#B6FF2E]/20"
              >
                {comp.name}
              </span>
            ))}
          </div>
          <h1
            className="text-4xl font-bold text-white leading-tight"
            style={{ fontFamily: 'var(--font-sora)' }}
          >
            {experienceData.title}
          </h1>
          <p className="text-white/50 text-sm">
            {experienceData.estimatedMinutes} min · {experienceData.xpReward} XP
          </p>
        </div>

        {/* Hero image */}
        <ExperienceImage experienceId={id} title={experienceData.title} />

        {/* Narrative */}
        {experienceData.narrativeText && (
          <section className="flex flex-col gap-4">
            <h2
              className="text-xs font-semibold uppercase tracking-widest text-white/30"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              The Story
            </h2>
            <div className="text-base text-white/80 leading-[1.9] flex flex-col gap-3">
              <MarkdownText text={experienceData.narrativeText} />
            </div>
          </section>
        )}

        {/* Concept guide — collapsible reference, shown before the challenge */}
        {experienceData.concepts.length > 0 && (
          <ConceptGuide concepts={experienceData.concepts} />
        )}

        {/* Challenge */}
        {experienceData.scenarioText && (
          <section className="rounded-2xl border border-[#B6FF2E]/20 bg-[#B6FF2E]/5 px-6 py-6 flex flex-col gap-3">
            <h2
              className="text-xs font-semibold uppercase tracking-widest text-[#B6FF2E]/70"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              Your Challenge
            </h2>
            <div className="text-sm text-white/75 leading-relaxed flex flex-col gap-3">
              <MarkdownText text={experienceData.scenarioText} />
            </div>
          </section>
        )}

        {/* Structured response */}
        {!learningSession.completedAt ? (
          <section className="flex flex-col gap-4">
            <h2
              className="text-xs font-semibold uppercase tracking-widest text-white/30"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              Your Response
            </h2>
            <ChallengeResponse
              sessionId={learningSession.id}
              experienceId={id}
              scenarioText={experienceData.scenarioText ?? ''}
            />
          </section>
        ) : (
          <div className="rounded-xl border border-[#B6FF2E]/20 bg-[#B6FF2E]/5 px-5 py-4 flex items-center gap-3">
            <p className="text-sm text-[#B6FF2E]">
              Experience completed on{' '}
              {new Date(learningSession.completedAt).toLocaleDateString()}.
            </p>
          </div>
        )}

      </main>

      {/* Floating AI mentor button + panel */}
      <MentorFloating sessionId={learningSession.id} experienceId={id} />
    </div>
  )
}
