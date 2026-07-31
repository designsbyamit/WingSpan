'use client'
import { motion } from 'framer-motion'

interface Props {
  name: string
  level: number   // 0–10 (UserSkill.level / UserCompetency.level)
  maxLevel?: number
}

export function SkillBar({ name, level, maxLevel = 10 }: Props) {
  const pct = Math.min(100, Math.max(0, (level / maxLevel) * 100))
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-jakarta text-[#d1d5db]">{name}</span>
        <span className="text-xs font-jakarta text-[#6b7280]">{level}</span>
      </div>
      <div className="h-1.5 bg-[#353B45] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#B6FF2E] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
    </div>
  )
}
