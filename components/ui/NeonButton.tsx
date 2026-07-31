// components/ui/NeonButton.tsx
'use client'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface NeonButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  fullWidth?: boolean
  className?: string
}

export function NeonButton({ children, onClick, disabled, fullWidth, className = '' }: NeonButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        px-5 py-2.5 rounded-[10px]
        text-sm font-bold tracking-tight
        transition-all duration-200
        ${disabled
          ? 'bg-[#2a2a2a] text-[#555] cursor-not-allowed'
          : 'bg-[var(--neon)] text-[#0a0a0a] cursor-pointer'
        }
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {children}
    </motion.button>
  )
}
