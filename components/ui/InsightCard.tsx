// components/ui/InsightCard.tsx
'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { ProgressBar } from './ProgressBar'

interface InsightCardProps {
  name: string
  confidence: number
  evidence: string
  rationale?: string
  projects?: string[]
  projectCount?: number
}

export function InsightCard({ name, confidence, evidence, rationale, projects, projectCount }: InsightCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-[10px] bg-[var(--surface)] border border-[var(--border-ws)] p-3">
      <div className="flex justify-between items-start mb-1">
        <span className="text-sm font-semibold text-[var(--text-primary)]">{name}</span>
        <span
          className="text-xs font-bold text-[var(--neon)] tabular-nums"
          style={{ textShadow: '0 0 8px var(--neon-glow)' }}
        >
          {confidence}%
        </span>
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-2">{evidence}</p>
      <ProgressBar value={confidence} />

      {(rationale || projects) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-2 text-xs text-[var(--text-muted)] hover:text-[var(--neon)] transition-colors"
        >
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={12} />
          </motion.span>
          {expanded ? 'Less detail' : 'More detail'}
        </button>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {rationale && (
              <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">{rationale}</p>
            )}
            {projects && projects.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {projects.map((p) => (
                  <span
                    key={p}
                    className="text-[10px] px-2 py-0.5 rounded bg-[var(--neon-surface)] text-[var(--neon)] border border-[var(--neon-border)]"
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
