'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, ArrowRight, Play, Clock } from 'lucide-react'

interface PathCardProps {
  id: string
  title: string
  description: string
  careerLevel: { name: string } | null
  experienceCount: number
  estimatedHours: number
  userProgress: {
    isActive: boolean
    completedCount: number
    currentOrder: null
  } | null
}

export default function PathCard({
  id,
  title,
  description,
  careerLevel,
  experienceCount,
  estimatedHours,
  userProgress,
}: PathCardProps) {
  const isActive = userProgress?.isActive ?? false
  const completedCount = userProgress?.completedCount ?? 0
  const progressPct =
    experienceCount > 0 ? Math.round((completedCount / experienceCount) * 100) : 0
  const hasStarted = completedCount > 0

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={[
        'relative flex flex-col gap-4 rounded-2xl p-6',
        'bg-[#353B45] border transition-colors duration-200',
        isActive
          ? 'border-indigo-500 shadow-[0_0_0_1px_rgba(99,102,241,0.3)]'
          : 'border-[#2a2a2a] hover:border-[#3a3a3a]',
      ].join(' ')}
    >
      {/* Active badge */}
      {isActive && (
        <span className="absolute top-4 right-4 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-2.5 py-0.5">
          Active
        </span>
      )}

      {/* Header */}
      <div className="flex flex-col gap-2 pr-16">
        <h2
          className="text-xl font-semibold text-[#f0f0f0] leading-snug"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          {title}
        </h2>
        <p className="text-sm text-[#999] leading-relaxed line-clamp-2">{description}</p>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 flex-wrap text-sm text-[#666]">
        {careerLevel && (
          <span className="px-2.5 py-0.5 rounded-full bg-[#252525] border border-[#2a2a2a] text-[#aaa] text-xs font-medium">
            {careerLevel.name}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <BookOpen size={13} />
          {experienceCount} experience{experienceCount !== 1 ? 's' : ''}
        </span>
        {estimatedHours > 0 && (
          <span className="flex items-center gap-1.5">
            <Clock size={13} />
            ~{estimatedHours}h
          </span>
        )}
      </div>

      {/* Progress bar */}
      {hasStarted && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-[#666]">
            <span>
              {completedCount} / {experienceCount} completed
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#252525] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-auto pt-2">
        <Link
          href={`/paths/${id}`}
          className={[
            'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150',
            isActive
              ? 'bg-indigo-500 text-white hover:bg-indigo-400'
              : 'bg-[#252525] text-[#ccc] hover:bg-[#2e2e2e] hover:text-white border border-[#333]',
          ].join(' ')}
        >
          {isActive ? (
            <>
              <Play size={14} />
              Continue
            </>
          ) : (
            <>
              Start Path
              <ArrowRight size={14} />
            </>
          )}
        </Link>
      </div>
    </motion.div>
  )
}
