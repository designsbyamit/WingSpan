'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, BookOpen, Users, Link2, ChevronDown } from 'lucide-react'
import { Blueprint, Resource } from '@/types/wingspan'
import { useWingspan } from '@/context/WingspanContext'

function ResourceCard({ resource }: { resource: Resource }) {
  const [expanded, setExpanded] = useState(false)
  const icon = resource.type === 'book' || resource.type === 'course'
    ? <BookOpen size={14} />
    : resource.type === 'community'
    ? <Users size={14} />
    : <Link2 size={14} />

  return (
    <motion.div layout className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left p-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-[8px] bg-[var(--surface)] border border-[var(--border-ws)] flex items-center justify-center text-[var(--text-muted)]">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-[var(--text-muted)] capitalize mb-0.5">{resource.type}</p>
          <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug" style={{ fontFamily: 'var(--font-sora)' }}>
            {resource.title}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {resource.url && (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-[var(--neon)] hover:opacity-80 transition-opacity"
            >
              <ExternalLink size={14} />
            </a>
          )}
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} className="text-[var(--text-muted)]" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto' as const, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[var(--border-ws)]"
          >
            <div className="p-4 flex flex-col gap-3">
              {resource.whereToStart && (
                <div>
                  <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">Where to Start</p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{resource.whereToStart}</p>
                </div>
              )}
              {resource.firstStep && (
                <div>
                  <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">First Step</p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{resource.firstStep}</p>
                </div>
              )}
              {resource.url && (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[var(--neon)] text-[#0a0a0a] text-xs font-bold w-fit"
                >
                  Open Resource <ExternalLink size={11} />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function Resources({ blueprint }: { blueprint: Blueprint }) {
  const { state } = useWingspan()
  const selectedPath = state.selectedPath

  if (!selectedPath) {
    return (
      <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-8 text-center">
        <p className="text-sm text-[var(--text-muted)]">Select a future path first to see contextual resources.</p>
      </div>
    )
  }

  const filteredResources = blueprint.actions.resources.filter(r =>
    r.pathway === selectedPath || r.pathway.includes(selectedPath.split('/')[0].trim())
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <p className="text-[10px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">Resources for</p>
        <p className="text-base font-bold text-[var(--neon)]" style={{ fontFamily: 'var(--font-sora)' }}>
          {selectedPath}
        </p>
      </div>

      {filteredResources.length === 0 ? (
        <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-6 text-center">
          <p className="text-sm text-[var(--text-muted)]">No specific resources for this path yet.</p>
        </div>
      ) : (
        filteredResources.map(resource => (
          <ResourceCard key={resource.title} resource={resource} />
        ))
      )}
    </div>
  )
}
