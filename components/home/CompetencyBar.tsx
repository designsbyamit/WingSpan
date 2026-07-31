// components/home/CompetencyBar.tsx
'use client'

import { motion } from 'framer-motion'
import type { CompetencyBarData } from '@/types/design-evolution'

interface CompetencyBarProps {
  data: CompetencyBarData
  index?: number
}

export function CompetencyBar({ data, index = 0 }: CompetencyBarProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span
          className="text-xs text-white/60 font-medium tracking-wide"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          {data.name}
        </span>
        <motion.span
          className="text-xs font-bold text-[#B6FF2E]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
        >
          {data.score}
        </motion.span>
      </div>
      <div className="h-[2px] w-full rounded-full bg-[#353B45]">
        <motion.div
          className="h-full rounded-full bg-[#B6FF2E]"
          initial={{ width: 0 }}
          animate={{ width: `${data.score}%` }}
          transition={{
            delay: 0.2 + index * 0.1,
            duration: 0.7,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      </div>
    </div>
  )
}
