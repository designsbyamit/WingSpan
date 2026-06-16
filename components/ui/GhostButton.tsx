// components/ui/GhostButton.tsx
'use client'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface GhostButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
}

export function GhostButton({ children, onClick, className = '' }: GhostButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        inline-flex items-center gap-2
        px-4 py-2 rounded-[8px]
        text-xs font-bold tracking-tight
        bg-[var(--neon-surface)] text-[var(--neon)]
        border border-[var(--neon-border)]
        cursor-pointer transition-all duration-200
        ${className}
      `}
    >
      {children}
    </motion.button>
  )
}
