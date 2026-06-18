// components/blueprint/CareerIntelligence.tsx
'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Blueprint } from '@/types/wingspan'
import { StrengthRadar } from '@/components/ui/StrengthRadar'

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
  const { strengths, interests } = blueprint
  const [activeStrength, setActiveStrength] = useState(0)

  return (
    <div className="flex flex-col gap-12">

      {/* Strength Landscape */}
      <div>
        <SectionLabel>Strength Landscape</SectionLabel>

        {/* Radar overview */}
        <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-4 mb-4">
          <StrengthRadar strengths={strengths} />
        </div>

        {/* Horizontal scrollable strength cards */}
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

              {/* Mini bar */}
              <div className="h-[2px] rounded-full bg-[var(--border-ws)] mb-3">
                <div
                  className="h-full rounded-full bg-[var(--neon)] transition-all duration-500"
                  style={{ width: `${s.confidence}%` }}
                />
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">{s.evidence}</p>

              <div className="rounded-[8px] bg-[#111] border border-[var(--border-ws)] p-3">
                <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">Career Advantage</p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{s.careerAdvantage}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Interest Landscape */}
      <div>
        <SectionLabel>Interest Landscape</SectionLabel>
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

              {/* Why it appears */}
              {interest.whyItAppears && interest.whyItAppears.length > 0 && (
                <div className="mb-3">
                  <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-2">Why this appears</p>
                  <div className="flex flex-wrap gap-1.5">
                    {interest.whyItAppears.map(reason => (
                      <span key={reason} className="text-[10px] px-2 py-1 rounded-[6px] bg-[var(--surface)] border border-[var(--border-ws)] text-[var(--text-muted)]">
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Future relevance */}
              {interest.futureRelevance && (
                <div className="rounded-[8px] bg-[#111] border border-[var(--border-ws)] p-3">
                  <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">Future Relevance</p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{interest.futureRelevance}</p>
                </div>
              )}

            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
