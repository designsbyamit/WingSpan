'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, BookOpen, Users, Link2, ChevronDown, Download, FileText } from 'lucide-react'
import { Blueprint, Resource } from '@/types/wingspan'
import { useWingspan } from '@/context/WingspanContext'
import { exportToNotionMarkdown, downloadMarkdown, printAsPDF } from '@/lib/export'

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
  const [exporting, setExporting] = useState(false)

  const handleNotionExport = () => {
    setExporting(true)
    const md = exportToNotionMarkdown(blueprint, selectedPath)
    const filename = `wingspan-blueprint-${new Date().toISOString().split('T')[0]}.md`
    downloadMarkdown(md, filename)
    setTimeout(() => setExporting(false), 1500)
  }

  if (!selectedPath) {
    return (
      <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-8 text-center">
        <p className="text-sm text-[var(--text-muted)]">Pick a direction and we'll point you to the right resources.</p>
      </div>
    )
  }

  const filteredResources = blueprint.actions.resources.filter(r =>
    r.pathway === selectedPath || r.pathway.includes(selectedPath.split('/')[0].trim())
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <p className="text-[10px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">Useful stuff for</p>
        <p className="text-base font-bold text-[var(--neon)]" style={{ fontFamily: 'var(--font-sora)' }}>
          {selectedPath}
        </p>
      </div>

      {filteredResources.length === 0 ? (
        <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-6 text-center">
          <p className="text-sm text-[var(--text-muted)]">Nothing specific here yet — but that'll change as the Blueprint grows.</p>
        </div>
      ) : (
        filteredResources.map(resource => (
          <ResourceCard key={resource.title} resource={resource} />
        ))
      )}

      {/* Export section */}
      <div className="mt-4 rounded-[16px] bg-[var(--surface)] border border-[var(--border-ws)] p-5 flex flex-col gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-[2.5px] uppercase text-[var(--neon)] mb-1">Continue in Notion</p>
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-2" style={{ fontFamily: 'var(--font-sora)' }}>
            Take your Blueprint with you
          </p>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Export your full roadmap — milestones, actions, gaps, and resources — into Notion-ready Markdown. Paste directly into any Notion page to continue tracking your progress.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleNotionExport}
            disabled={exporting}
            className="flex items-center justify-center gap-2 py-3 px-5 rounded-[10px] bg-[var(--neon)] text-[#0a0a0a] text-sm font-bold transition-opacity"
            style={{ opacity: exporting ? 0.7 : 1 }}
          >
            <Download size={14} />
            {exporting ? 'Exporting…' : 'Export to Notion (.md)'}
          </motion.button>
          {/* PDF export temporarily hidden */}
          {/* <button onClick={() => printAsPDF(blueprint, selectedPath)} ...>Export as PDF</button> */}
        </div>
        <p className="text-[10px] text-[var(--text-muted)]">
          The Markdown file includes your roadmap, gap analysis, actions, and resources. Open Notion → New page → Paste to import.
        </p>
      </div>
    </div>
  )
}
