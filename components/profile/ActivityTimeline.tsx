'use client'
import { motion } from 'framer-motion'
import { Sparkles, BookOpen, Zap } from 'lucide-react'

// Adapted from plan brief: LearningSession has entityType/entityId (generic),
// no xpEarned or experience.title. We display entityType + entityId as label.
export interface TimelineSession {
  id: string
  completedAt: string   // ISO date string — formatted to "Jul 21" etc.
  entityType: string    // "concept" | "challenge" | "experience" | etc.
  entityId: string
  durationSec: number | null
}

interface Props {
  sessions: TimelineSession[]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function formatDuration(secs: number | null): string | null {
  if (!secs || secs <= 0) return null
  if (secs < 60) return `${secs}s`
  const mins = Math.round(secs / 60)
  return `${mins} min${mins !== 1 ? 's' : ''}`
}

function entityLabel(type: string, id: string): string {
  const capitalized = type.charAt(0).toUpperCase() + type.slice(1)
  // Show type + last 6 chars of id as a compact reference
  return `${capitalized} · ${id.slice(-6)}`
}

function EntityIcon({ type }: { type: string }) {
  if (type === 'challenge') return <Zap size={14} className="text-[#B6FF2E]" />
  return <BookOpen size={14} className="text-[#B6FF2E]" />
}

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, x: -16 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
}

export function ActivityTimeline({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <p className="text-sm text-[#6b7280] font-jakarta py-4">
        No completed sessions yet. Start your first experience to see your
        activity here.
      </p>
    )
  }

  return (
    <motion.ol
      variants={container}
      initial="hidden"
      animate="show"
      className="relative space-y-0"
    >
      {sessions.map((session, index) => {
        const duration = formatDuration(session.durationSec)
        return (
          <motion.li
            key={session.id}
            variants={item}
            className="relative flex gap-4 pb-6 last:pb-0"
          >
            {/* Vertical line — hidden on last item */}
            {index < sessions.length - 1 && (
              <div
                className="absolute left-[15px] top-[32px] bottom-0 w-px bg-[#353B45]"
                aria-hidden="true"
              />
            )}

            {/* Dot */}
            <div className="relative z-10 flex-none w-8 h-8 rounded-full bg-[#353B45] border border-[#2a2a3a] flex items-center justify-center mt-0.5">
              <EntityIcon type={session.entityType} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 bg-[#0f0f1a] border border-[#353B45] rounded-xl px-4 py-3">
              <p className="text-sm font-medium text-[#e5e7eb] font-jakarta leading-snug truncate">
                {entityLabel(session.entityType, session.entityId)}
              </p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-xs text-[#6b7280] font-jakarta">
                  {formatDate(session.completedAt)}
                </span>
                {duration && (
                  <span className="flex items-center gap-1 text-xs text-[#B6FF2E] font-jakarta">
                    <Sparkles size={11} />
                    {duration}
                  </span>
                )}
              </div>
            </div>
          </motion.li>
        )
      })}
    </motion.ol>
  )
}
