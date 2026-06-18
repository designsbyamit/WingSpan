// components/blueprint/GapAnalysis.tsx
'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Blueprint, Gap } from '@/types/wingspan'
import { useWingspan } from '@/context/WingspanContext'

const GAP_SIZE_STYLE = {
  small:  { label: 'Small Gap',  cls: 'text-[var(--neon)] border-[var(--neon-border)] bg-[var(--neon-surface)]' },
  medium: { label: 'Medium Gap', cls: 'text-yellow-400 border-yellow-800/50 bg-yellow-950/20' },
  large:  { label: 'High Gap',   cls: 'text-red-400 border-red-800/50 bg-red-950/20' },
}

function GapCard({ gap }: { gap: Gap }) {
  const [expanded, setExpanded] = useState(false)
  const sizeStyle = GAP_SIZE_STYLE[gap.gapSize]
  const currentPct = gap.currentReadiness
  const futurePct = gap.futureReadiness
  const gapPct = futurePct - currentPct

  return (
    <motion.div layout className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-start gap-3"
      >
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <span className="text-sm font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>
              {gap.gapType}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sizeStyle.cls}`}>
              {sizeStyle.label}
            </span>
          </div>

          {/* Current vs desired visual */}
          <div className="flex flex-col gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-16 text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-[1px] flex-shrink-0">Now</div>
              <div className="flex-1 h-[3px] rounded-full bg-[var(--border-ws)]">
                <div className="h-full rounded-full bg-[var(--text-muted)] transition-all" style={{ width: `${currentPct}%` }} />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] tabular-nums w-7 text-right">{currentPct}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 text-[9px] text-[var(--neon)] font-bold uppercase tracking-[1px] flex-shrink-0">Target</div>
              <div className="flex-1 h-[3px] rounded-full bg-[var(--border-ws)]">
                <div className="h-full rounded-full bg-[var(--neon)] transition-all" style={{ width: `${futurePct}%` }} />
              </div>
              <span className="text-[10px] text-[var(--neon)] tabular-nums w-7 text-right">{futurePct}%</span>
            </div>
          </div>

          <p className="text-xs text-[var(--text-muted)]">
            {gapPct} point gap to close · {gap.timeline} · {gap.effort}
          </p>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0 mt-1">
          <ChevronDown size={16} className="text-[var(--text-muted)]" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto' as const, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-4 border-t border-[var(--border-ws)] pt-4">

              {/* Current vs Desired state */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[8px] bg-[#111] border border-[var(--border-ws)] p-3">
                  <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">Current State</p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{gap.currentState}</p>
                </div>
                <div className="rounded-[8px] bg-[var(--neon-surface)] border border-[var(--neon-border)] p-3">
                  <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--neon)] mb-1">Desired State</p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{gap.desiredState}</p>
                </div>
              </div>

              {/* Why it matters */}
              {gap.whyItMatters && (
                <div>
                  <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">Why It Matters</p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{gap.whyItMatters}</p>
                </div>
              )}

              {/* Required capabilities */}
              <div>
                <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-2">Required Capabilities</p>
                <div className="flex flex-wrap gap-1.5">
                  {gap.requiredCapabilities.map(cap => (
                    <span key={cap} className="text-[10px] px-2 py-1 rounded-[6px] bg-[var(--surface)] border border-[var(--border-ws)] text-[var(--text-muted)]">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* How to close */}
              <div className="rounded-[8px] bg-[#111] border border-[var(--border-ws)] p-3">
                <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">How to Close</p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{gap.howToClose}</p>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function GapAnalysis({ blueprint }: { blueprint: Blueprint }) {
  const { state } = useWingspan()
  const { gaps } = blueprint

  const selectedPath = state.selectedPath
  const filteredGaps = selectedPath
    ? gaps.filter(g => g.pathway === selectedPath || g.pathway.includes(selectedPath.split('/')[0].trim()))
    : gaps

  if (!selectedPath) {
    return (
      <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-8 text-center">
        <p className="text-sm text-[var(--text-muted)]">Select a future path first to see your gap analysis.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <p className="text-[10px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">Analysing gaps for</p>
        <p className="text-base font-bold text-[var(--neon)]" style={{ fontFamily: 'var(--font-sora)' }}>
          {selectedPath}
        </p>
      </div>
      {filteredGaps.map(gap => (
        <GapCard key={`${gap.pathway}-${gap.gapType}`} gap={gap} />
      ))}
    </div>
  )
}
