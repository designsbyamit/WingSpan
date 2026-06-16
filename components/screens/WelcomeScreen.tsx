// components/screens/WelcomeScreen.tsx
'use client'
import { motion, type Variants } from 'framer-motion'
import { useWingspan } from '@/context/WingspanContext'
import { NeonButton } from '@/components/ui/NeonButton'

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

export function WelcomeScreen() {
  const { dispatch } = useWingspan()

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6">
      {/* Neon radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 40%, rgba(163,230,53,0.04) 0%, transparent 70%)',
        }}
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 max-w-xl w-full text-center flex flex-col items-center gap-5"
      >
        {/* Wordmark */}
        <motion.div variants={item}>
          <span
            className="text-xs font-normal tracking-[0.2em] text-[var(--neon)]"
            style={{ textShadow: '0 0 16px var(--neon-glow)' }}
          >
            Wingspan
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={item}
          className="text-4xl md:text-5xl font-light leading-tight tracking-tight text-[var(--text-primary)]"
        >
          Discover the patterns<br />
          <strong className="font-bold text-white">hidden in your career.</strong>
        </motion.h1>

        {/* Body */}
        <motion.p
          variants={item}
          className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-sm"
        >
          Transform your professional footprint into a personalized Future Self Blueprint™ powered by AI.
        </motion.p>

        {/* CTA */}
        <motion.div variants={item}>
          <NeonButton onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'footprint' })}>
            Start Discovery →
          </NeonButton>
        </motion.div>

        {/* Trust chips */}
        <motion.div variants={item} className="flex gap-2 flex-wrap justify-center">
          {['AI-powered', 'Single session', 'No signup'].map((chip) => (
            <span
              key={chip}
              className="text-xs px-3 py-1 rounded-md bg-[#222] text-[#888] border border-[var(--border-ws)]"
            >
              {chip}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
