// components/home/ExperienceCard.tsx
'use client'

import Link from 'next/link'
import { Clock, Zap, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import type { ExperienceData, LearningSessionData } from '@/types/design-evolution'

interface ExperienceCardProps {
  experience: ExperienceData
  session: LearningSessionData
}

export function ExperienceCard({ experience, session }: ExperienceCardProps) {
  const isCompleted = !!session.completedAt

  return (
    <motion.div
      className="rounded-2xl border border-[#353B45] bg-[#2D3139] p-8 flex flex-col gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Meta row */}
      <div className="flex items-center gap-4 text-xs text-white/40">
        <span className="flex items-center gap-1.5">
          <Clock size={12} />
          {experience.estimatedMinutes} min
        </span>
        <span className="flex items-center gap-1.5">
          <Zap size={12} />
          {experience.xpReward} XP
        </span>
        {isCompleted && (
          <span className="ml-auto text-[#B6FF2E] font-semibold">Completed</span>
        )}
      </div>

      {/* Title + description */}
      <div className="flex flex-col gap-3">
        <h2
          className="text-2xl font-bold text-white leading-tight"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          {experience.title}
        </h2>
        <p className="text-sm text-white/60 leading-relaxed">
          {experience.description}
        </p>
      </div>

      {/* Competency tags */}
      <div className="flex flex-wrap gap-2">
        {experience.competencies.map((comp) => (
          <span
            key={comp.id}
            className="px-3 py-1 rounded-full text-xs font-medium bg-[#B6FF2E]/10 text-[#B6FF2E] border border-[#B6FF2E]/20"
          >
            {comp.name}
          </span>
        ))}
      </div>

      {/* CTA */}
      {!isCompleted ? (
        <Link
          href={`/experience/${experience.id}`}
          className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#B6FF2E] px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Begin Experience
          <ArrowRight size={16} />
        </Link>
      ) : (
        <Link
          href={`/experience/${experience.id}`}
          className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-[#353B45] px-6 py-3.5 text-sm font-medium text-white/60 transition-colors hover:text-white"
        >
          Review Experience
        </Link>
      )}
    </motion.div>
  )
}
