// components/blueprint/PathSelection.tsx
'use client'
import { motion } from 'framer-motion'
import { Blueprint } from '@/types/wingspan'
import { useWingspan } from '@/context/WingspanContext'

const DEMAND_COLOR: Record<string, string> = {
  'Very High': 'text-[var(--neon)]',
  'High':      'text-emerald-400',
  'Moderate':  'text-yellow-400',
  'Emerging':  'text-blue-400',
}

const STATUS_STYLE: Record<string, string> = {
  'Strongly Recommended': 'bg-[var(--neon-surface)] text-[var(--neon)] border-[var(--neon-border)]',
  'Recommended':          'bg-emerald-950/30 text-emerald-400 border-emerald-800/50',
  'Emerging Opportunity': 'bg-blue-950/30 text-blue-400 border-blue-800/50',
}

export function PathSelection({ blueprint }: { blueprint: Blueprint }) {
  const { state, dispatch } = useWingspan()
  const { futurePaths } = blueprint

  return (
    <div className="flex flex-col gap-6">

      <div className="mb-2">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Based on your profile, strengths, interests, and market trends — these are your strongest future directions. Select one path to generate your personalised gap analysis and roadmap.
        </p>
      </div>

      {futurePaths.map((path, idx) => {
        const isSelected = state.selectedPath === path.title

        return (
          <motion.div
            key={path.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.4 }}
            className={`
              rounded-[16px] border p-5 flex flex-col gap-4 transition-all
              ${isSelected
                ? 'border-[var(--neon)] bg-[var(--surface)]'
                : 'border-[var(--border-ws)] bg-[var(--surface)]'
              }
            `}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className="text-base font-bold text-[var(--text-primary)]"
                    style={{ fontFamily: 'var(--font-sora)' }}
                  >
                    {path.title}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[path.recommendationStatus] ?? STATUS_STYLE['Recommended']}`}>
                    {path.recommendationStatus}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{path.whyItFits}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-bold text-[var(--neon)]" style={{ fontFamily: 'var(--font-sora)' }}>
                  {path.confidence}%
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">match</div>
              </div>
            </div>

            {/* Metadata row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-[8px] bg-[#111] border border-[var(--border-ws)] p-2 text-center">
                <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-[var(--text-muted)] mb-0.5">Timeline</p>
                <p className="text-xs font-semibold text-[var(--text-primary)]">{path.timeline}</p>
              </div>
              <div className="rounded-[8px] bg-[#111] border border-[var(--border-ws)] p-2 text-center">
                <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-[var(--text-muted)] mb-0.5">Demand</p>
                <p className={`text-xs font-semibold ${DEMAND_COLOR[path.marketDemand] ?? 'text-[var(--text-primary)]'}`}>
                  {path.marketDemand}
                </p>
              </div>
              <div className="rounded-[8px] bg-[#111] border border-[var(--border-ws)] p-2 text-center">
                <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-[var(--text-muted)] mb-0.5">Growth</p>
                <p className="text-xs font-semibold text-[var(--text-primary)]">{path.growthPotential}</p>
              </div>
            </div>

            {/* Key transition areas */}
            {path.keyTransitionAreas && path.keyTransitionAreas.length > 0 && (
              <div>
                <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-2">Key Transition Areas</p>
                <div className="flex flex-wrap gap-1.5">
                  {path.keyTransitionAreas.map(area => (
                    <span key={area} className="text-xs px-2.5 py-1 rounded-[6px] bg-[var(--surface)] border border-[var(--border-ws)] text-[var(--text-secondary)]">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => dispatch({ type: 'SELECT_PATH', path: path.title })}
              className={`
                w-full py-3 rounded-[10px] text-sm font-bold transition-all border
                ${isSelected
                  ? 'bg-[var(--neon)] text-[#0a0a0a] border-[var(--neon)]'
                  : 'bg-transparent text-[var(--neon)] border-[var(--neon-border)] hover:bg-[var(--neon-surface)]'
                }
              `}
            >
              {isSelected ? '✓ Path Selected' : 'Select This Path'}
            </motion.button>

          </motion.div>
        )
      })}
    </div>
  )
}
