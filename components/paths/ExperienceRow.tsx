'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, Lock, Clock, Zap } from 'lucide-react'

interface ExperienceRowProps {
  order: number
  experienceId: string
  title: string
  durationMins: number
  xpReward: number
  completedByUser: boolean
  isUnlocked: boolean
}

export default function ExperienceRow({
  order,
  experienceId,
  title,
  durationMins,
  xpReward,
  completedByUser,
  isUnlocked,
}: ExperienceRowProps) {
  const router = useRouter()

  function handleClick() {
    if (isUnlocked) {
      router.push(`/experience/${experienceId}`)
    }
  }

  return (
    <motion.div
      whileHover={isUnlocked ? { x: 4 } : {}}
      transition={{ duration: 0.15 }}
      onClick={handleClick}
      className={[
        'flex items-center gap-4 rounded-xl px-4 py-3.5 border transition-colors duration-150',
        isUnlocked && !completedByUser
          ? 'bg-[#353B45] border-[#2a2a2a] cursor-pointer hover:border-indigo-500/40 hover:bg-[#1e1e1e]'
          : completedByUser
          ? 'bg-[#111] border-[#1f1f1f] cursor-pointer'
          : 'bg-[#111] border-[#353B45] cursor-not-allowed opacity-50',
      ].join(' ')}
      role={isUnlocked ? 'button' : undefined}
      tabIndex={isUnlocked ? 0 : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick()
      }}
    >
      {/* Order number */}
      <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-[#252525] text-[#666]">
        {order}
      </span>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p
          className={[
            'text-sm font-semibold truncate',
            completedByUser
              ? 'text-[#666] line-through'
              : isUnlocked
              ? 'text-[#f0f0f0]'
              : 'text-[#555]',
          ].join(' ')}
        >
          {title}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-[#555]">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {durationMins}m
          </span>
          <span className="flex items-center gap-1 text-indigo-500">
            <Zap size={11} />
            {xpReward} XP
          </span>
        </div>
      </div>

      {/* Difficulty stub + status icon */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {/* Difficulty — no data available, show neutral indicator */}
        <div className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#333]" />
          ))}
        </div>
        {completedByUser ? (
          <CheckCircle2 size={18} className="text-indigo-400" />
        ) : !isUnlocked ? (
          <Lock size={15} className="text-[#444]" />
        ) : null}
      </div>
    </motion.div>
  )
}
