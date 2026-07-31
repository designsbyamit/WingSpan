// components/blueprint/CareerAlphaDashboard.tsx
'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { CareerAlphaIntelligence } from '@/types/wingspan'

const DIMENSION_LABELS: Record<string, string> = {
  intrinsicSignal:    'Your Signal',
  marketIntelligence: 'Market Intelligence',
  futuresAnalysis:    'Futures Analysis',
  humanAdvantageIndex:'Human Advantage',
  careerROI:          'Career ROI',
}

const DIMENSION_ORDER = [
  'intrinsicSignal',
  'marketIntelligence',
  'futuresAnalysis',
  'humanAdvantageIndex',
  'careerROI',
] as const

// First sentence is the sharp headline, rest is progressive detail
function splitInsight(insight: string): { headline: string; detail: string } {
  const idx = insight.search(/[.!?]\s/)
  if (idx === -1) return { headline: insight, detail: '' }
  return { headline: insight.slice(0, idx + 1).trim(), detail: insight.slice(idx + 1).trim() }
}

function DimensionCard({ dimKey, dim, idx }: {
  dimKey: string
  dim: { insight: string; signals: string[] } | undefined
  idx: number
}) {
  const [expanded, setExpanded] = useState(false)
  if (!dim) return null
  const { headline, detail } = splitInsight(dim.insight)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05, duration: 0.25 }}
      className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] overflow-hidden"
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left p-4 flex flex-col gap-1.5"
      >
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--neon)]">
            {DIMENSION_LABELS[dimKey]}
          </p>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.18 }}>
            <ChevronDown size={12} className="text-[var(--text-muted)]" />
          </motion.div>
        </div>
        <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug">
          {headline}
        </p>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[var(--border-ws)]"
          >
            <div className="px-4 py-3 flex flex-col gap-3">
              {detail && (
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{detail}</p>
              )}
              {dim.signals.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {dim.signals.map(s => (
                    <span
                      key={s}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--card-inner)] border border-[var(--border-ws)] text-[var(--text-muted)]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function CareerAlphaDashboard({ careerAlpha }: { careerAlpha: CareerAlphaIntelligence }) {
  return (
    <div className="flex flex-col gap-2">
      {DIMENSION_ORDER.map((key, idx) => (
        <DimensionCard
          key={key}
          dimKey={key}
          dim={careerAlpha.dimensions[key]}
          idx={idx}
        />
      ))}
      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pt-3 border-t border-[var(--border-ws)] mt-1">
        {careerAlpha.methodSummary}
      </p>
    </div>
  )
}
