// components/blueprint/CareerIntelligence.tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Blueprint } from '@/types/wingspan'
import { StrengthRadar } from '@/components/ui/StrengthRadar'
import { CareerAlphaDashboard } from '@/components/blueprint/CareerAlphaDashboard'

type IntelTab = 'career-alpha' | 'strengths' | 'interests'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold tracking-[2.5px] uppercase text-[var(--text-muted)] mb-4">
      {children}
    </p>
  )
}

const MARKET_COLOR: Record<string, string> = {
  'Very High Growth': 'text-[var(--neon)] border-[var(--neon-border)] bg-[var(--neon-surface)]',
  'High Growth':      'text-emerald-400 border-emerald-800/50 bg-emerald-950/20',
  'Emerging':         'text-yellow-400 border-yellow-800/50 bg-yellow-950/20',
  'Stable':           'text-[var(--text-muted)] border-[var(--border-ws)] bg-transparent',
}

export function CareerIntelligence({ blueprint }: { blueprint: Blueprint }) {
  const { strengths, interests, careerAlpha } = blueprint
  const defaultTab: IntelTab = careerAlpha ? 'career-alpha' : 'strengths'
  const [activeTab, setActiveTab] = useState<IntelTab>(defaultTab)
  const [activeStrength, setActiveStrength] = useState(0)
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [activeTab])

  const tabs: { id: IntelTab; label: string }[] = [
    ...(careerAlpha ? [{ id: 'career-alpha' as IntelTab, label: 'Career Alpha™' }] : []),
    { id: 'strengths', label: 'Strengths' },
    { id: 'interests', label: 'Interests' },
  ]

  return (
    <div ref={topRef} className="flex flex-col gap-6">

      {/* Internal tab nav */}
      <div className="flex gap-1 p-1 rounded-[10px] bg-[var(--surface)] border border-[var(--border-ws)] w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-2 rounded-[7px] text-sm font-semibold transition-all
              ${activeTab === tab.id
                ? 'bg-[var(--neon)] text-[#0a0a0a]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* Career Alpha tab */}
        {activeTab === 'career-alpha' && careerAlpha && (
          <motion.div
            key="career-alpha"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-4"
          >
            <div className="rounded-[14px] bg-[var(--surface)] border border-[var(--border-ws)] p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] font-bold tracking-[2.5px] uppercase text-[var(--neon)]">Career Alpha™</span>
                <span className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>
                  {careerAlpha.overallScore}
                </span>
                <span className="text-[11px] text-[var(--text-muted)] px-2 py-0.5 rounded-full border border-[var(--border-ws)]">
                  {careerAlpha.archetypeLabel}
                </span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {careerAlpha.synthesis}
              </p>
            </div>
            <CareerAlphaDashboard careerAlpha={careerAlpha} />
          </motion.div>
        )}

        {/* Strengths tab */}
        {activeTab === 'strengths' && (
          <motion.div
            key="strengths"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-6"
          >
            <SectionLabel>What you're good at</SectionLabel>

            <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-4">
              <StrengthRadar strengths={strengths} />
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
              {strengths.map((s, idx) => (
                <motion.button
                  key={s.name}
                  onClick={() => setActiveStrength(idx)}
                  className={`
                    flex-shrink-0 w-72 snap-start rounded-[12px] border p-4 text-left transition-all
                    ${activeStrength === idx
                      ? 'bg-[var(--surface)] border-[var(--neon)]'
                      : 'bg-[var(--surface)] border-[var(--border-ws)]'
                    }
                  `}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>
                      {s.name}
                    </span>
                    <span className="text-sm font-bold text-[var(--neon)] tabular-nums flex-shrink-0 ml-2">
                      {s.confidence}%
                    </span>
                  </div>
                  <div className="h-[2px] rounded-full bg-[var(--border-ws)] mb-3">
                    <div
                      className="h-full rounded-full bg-[var(--neon)] transition-all duration-500"
                      style={{ width: `${s.confidence}%` }}
                    />
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">{s.evidence}</p>
                  <div className="rounded-[8px] bg-[var(--card-inner)] border border-[var(--border-ws)] p-3">
                    <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">Why it matters</p>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{s.careerAdvantage}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Interests tab */}
        {activeTab === 'interests' && (
          <motion.div
            key="interests"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-6"
          >
            <SectionLabel>What draws you in</SectionLabel>
            <div className="flex flex-col gap-3">
              {interests.map((interest) => (
                <div key={interest.name} className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)] mb-0.5" style={{ fontFamily: 'var(--font-sora)' }}>
                        {interest.name}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{interest.evidence}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-[6px] border flex-shrink-0 ${MARKET_COLOR[interest.marketOutlook] ?? MARKET_COLOR['Stable']}`}>
                      {interest.marketOutlook}
                    </span>
                  </div>
                  {interest.whyItAppears && interest.whyItAppears.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-2">Where we spotted this</p>
                      <div className="flex flex-wrap gap-1.5">
                        {interest.whyItAppears.map(reason => (
                          <span key={reason} className="text-[10px] px-2 py-1 rounded-[6px] bg-[var(--surface)] border border-[var(--border-ws)] text-[var(--text-muted)]">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {interest.futureRelevance && (
                    <div className="rounded-[8px] bg-[var(--card-inner)] border border-[var(--border-ws)] p-3">
                      <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">Why it's worth paying attention to</p>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{interest.futureRelevance}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
