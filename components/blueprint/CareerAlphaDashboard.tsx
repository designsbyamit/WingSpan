// components/blueprint/CareerAlphaDashboard.tsx
'use client'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { CareerAlphaIntelligence } from '@/types/wingspan'
import { Card, FOCUS_RING } from './shell/ui'

const DIMENSIONS = [
  { key: 'intrinsicSignal',     label: 'Your signal',         question: 'What your work consistently shows' },
  { key: 'marketIntelligence',  label: 'Market intelligence', question: 'Where demand is moving' },
  { key: 'futuresAnalysis',     label: 'Futures analysis',    question: 'How the role changes over the next years' },
  { key: 'humanAdvantageIndex', label: 'Human advantage',     question: 'What stays hard to automate' },
  { key: 'careerROI',           label: 'Career ROI',          question: 'What the investment pays back' },
] as const

// First sentence is the headline, the rest is detail.
function splitInsight(insight: string): { headline: string; detail: string } {
  const text = insight ?? ''
  const idx = text.search(/[.!?]\s/)
  if (idx === -1) return { headline: text, detail: '' }
  return { headline: text.slice(0, idx + 1).trim(), detail: text.slice(idx + 1).trim() }
}

function DimensionCard({ label, question, dim, defaultOpen }: {
  label: string
  question: string
  dim: { insight: string; signals: string[] } | undefined
  defaultOpen: boolean
}) {
  const [expanded, setExpanded] = useState(defaultOpen)
  if (!dim) return null
  const { headline, detail } = splitInsight(dim.insight)
  const signals = Array.isArray(dim.signals) ? dim.signals : []
  const hasMore = !!detail || signals.length > 0

  return (
    <Card as="li" className="overflow-hidden">
      <button
        type="button"
        aria-expanded={hasMore ? expanded : undefined}
        onClick={() => hasMore && setExpanded(e => !e)}
        className={`w-full text-left p-5 flex items-start gap-4 rounded-[14px] ${FOCUS_RING} focus-visible:ring-offset-0 ${hasMore ? '' : 'cursor-default'}`}
      >
        <span className="flex-1 min-w-0">
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[13px] font-semibold text-[var(--ws-ink)]">{label}</span>
            <span className="text-[12px] text-[var(--text-muted)]">{question}</span>
          </span>
          <span className="block mt-2 text-[15px] font-semibold text-[var(--text-primary)] leading-snug">{headline}</span>
        </span>
        {hasMore && <ChevronDown size={16} className={`shrink-0 mt-1 text-[var(--text-muted)] transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden />}
      </button>
      <AnimatePresence initial={false}>
        {expanded && hasMore && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 flex flex-col gap-4">
              {detail && <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed max-w-[68ch]">{detail}</p>}
              {signals.length > 0 && (
                <div>
                  <p className="text-[12px] font-semibold text-[var(--text-muted)] mb-2">Signals</p>
                  <div className="flex flex-wrap gap-2">
                    {signals.map(s => (
                      <span key={s} className="text-[12px] px-2.5 py-1 rounded-full bg-[var(--card-inner)] border border-[var(--border-ws)] text-[var(--text-secondary)]">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

export function CareerAlphaDashboard({ careerAlpha }: { careerAlpha: CareerAlphaIntelligence }) {
  const dims = careerAlpha.dimensions ?? ({} as CareerAlphaIntelligence['dimensions'])
  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-3">
        {DIMENSIONS.map((d, i) => (
          <DimensionCard key={d.key} label={d.label} question={d.question} dim={dims[d.key]} defaultOpen={i === 0} />
        ))}
      </ul>
      {careerAlpha.methodSummary && (
        <p className="text-[13px] text-[var(--text-muted)] leading-relaxed max-w-[68ch]">
          <span className="font-semibold text-[var(--text-secondary)]">How this is scored. </span>
          {careerAlpha.methodSummary}
        </p>
      )}
    </div>
  )
}
