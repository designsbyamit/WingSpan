'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWingspan } from '@/context/WingspanContext'
import { GhostButton } from '@/components/ui/GhostButton'
import { ProfileMap } from '@/components/blueprint/ProfileMap'
import { CareerIntelligence } from '@/components/blueprint/CareerIntelligence'
import { GapAnalysis } from '@/components/blueprint/GapAnalysis'
import { ActionsSection } from '@/components/blueprint/ActionsSection'
import { Blueprint } from '@/types/wingspan'

const SECTIONS = [
  { id: 'profile', title: 'Profile Map', next: 'Career Intelligence' },
  { id: 'intelligence', title: 'Career Intelligence', next: 'Gap Analysis' },
  { id: 'gaps', title: 'Gap Analysis', next: 'Actions' },
  { id: 'actions', title: 'Actions', next: null },
] as const

function SectionContent({ id, blueprint }: { id: string; blueprint: Blueprint }) {
  switch (id) {
    case 'profile': return <ProfileMap blueprint={blueprint} />
    case 'intelligence': return <CareerIntelligence blueprint={blueprint} />
    case 'gaps': return <GapAnalysis blueprint={blueprint} />
    case 'actions': return <ActionsSection blueprint={blueprint} />
    default: return null
  }
}

export function BlueprintScreen() {
  const { state } = useWingspan()
  const { blueprint } = state
  const [revealedCount, setRevealedCount] = useState(1)

  if (!blueprint) return null

  const { profileMap } = blueprint

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="max-w-xl w-full flex flex-col gap-6">
        {/* Header */}
        <div>
          <span className="text-xs font-normal tracking-[0.2em] text-[var(--neon)]" style={{ textShadow: '0 0 12px var(--neon-glow)' }}>
            Future Self Blueprint™
          </span>
          <p className="text-sm text-[var(--text-secondary)] mt-3 leading-relaxed">
            {profileMap.identityStatement}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: profileMap.yearsOfExperience, label: 'yrs experience' },
            { value: profileMap.industries.length, label: 'industries' },
            { value: blueprint.futurePaths.length, label: 'future paths' },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-[10px] bg-[var(--surface)] border border-[var(--border-ws)] p-3 text-center">
              <div className="text-2xl font-bold text-[var(--neon)]" style={{ textShadow: '0 0 8px var(--neon-glow)' }}>
                {value}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Progressive sections */}
        {SECTIONS.map((section, idx) => {
          const isRevealed = idx < revealedCount

          if (!isRevealed) {
            return (
              <div
                key={section.id}
                className="rounded-[10px] border border-dashed border-[var(--border-dim)] p-4 opacity-50"
                style={{ background: 'var(--surface-dim)' }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-[var(--text-dim)]">{section.title}</span>
                  <span className="text-[10px] font-bold tracking-[1.5px] text-[var(--text-dim)]">LOCKED</span>
                </div>
              </div>
            )
          }

          return (
            <AnimatePresence key={section.id}>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' as const }}
                className="rounded-[10px] bg-[var(--surface)] border border-[var(--border-ws)] p-4 flex flex-col gap-4"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-[var(--text-primary)]">{section.title}</span>
                  <span className="text-[10px] font-bold tracking-[1.5px] text-[var(--neon)]">REVEALED</span>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <SectionContent id={section.id} blueprint={blueprint} />
                </motion.div>

                {section.next && idx === revealedCount - 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    <GhostButton onClick={() => setRevealedCount(revealedCount + 1)}>
                      Continue to {section.next} →
                    </GhostButton>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          )
        })}
      </div>
    </div>
  )
}
