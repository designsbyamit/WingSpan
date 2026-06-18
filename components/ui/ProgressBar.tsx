// components/ui/ProgressBar.tsx
'use client'
import { motion } from 'framer-motion'

interface ProgressBarProps {
  value: number // 0-100
  showLabel?: boolean
  label?: string
}

export function ProgressBar({ value, showLabel, label }: ProgressBarProps) {
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-[8px] text-[var(--text-muted)]">{label}</span>
          <span
            className="text-[8px] font-bold text-[var(--neon)]"
          >
            {value}%
          </span>
        </div>
      )}
      <div className="h-[1.5px] rounded-full bg-[var(--border-ws)]">
        <motion.div
          className="h-full rounded-full bg-[var(--neon)]"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
