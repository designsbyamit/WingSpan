'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, BookOpen, Users, Link2, ChevronDown, Download, FileText, X } from 'lucide-react'
import { Blueprint, Resource } from '@/types/wingspan'
import { useWingspan } from '@/context/WingspanContext'
import { exportToNotionMarkdown, downloadMarkdown, printAsPDF } from '@/lib/export'
import { auth } from '@/lib/firebase'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

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
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<'notion' | 'pdf' | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  async function signInAndExport() {
    setLoginLoading(true)
    setLoginError('')
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider())
      const idToken = await result.user.getIdToken()
      await fetch('/api/auth/firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })
      setShowLoginModal(false)
      if (pendingAction === 'notion') doNotionExport()
      if (pendingAction === 'pdf') printAsPDF(blueprint, selectedPath)
    } catch {
      setLoginError('Sign-in failed. Please try again.')
    } finally {
      setLoginLoading(false)
    }
  }

  function doNotionExport() {
    setExporting(true)
    const md = exportToNotionMarkdown(blueprint, selectedPath)
    downloadMarkdown(md, `wingspan-blueprint-${new Date().toISOString().split('T')[0]}.md`)
    setTimeout(() => setExporting(false), 1500)
  }

  function handleExport(action: 'notion' | 'pdf') {
    setPendingAction(action)
    setShowLoginModal(true)
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
            onClick={doNotionExport}
            disabled={exporting}
            className="flex items-center justify-center gap-2 py-3 px-5 rounded-[10px] bg-[var(--neon)] text-[#0a0a0a] text-sm font-bold transition-opacity"
            style={{ opacity: exporting ? 0.7 : 1 }}
          >
            <Download size={14} />
            {exporting ? 'Exporting…' : 'Export to Notion (.md)'}
          </motion.button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center justify-center gap-2 py-3 px-5 rounded-[10px] border border-[var(--border-ws)] text-[var(--text-secondary)] text-sm font-semibold hover:border-[var(--neon)] hover:text-[var(--neon)] transition-colors"
          >
            <FileText size={14} />
            Save as PDF
          </button>
        </div>
        <p className="text-[10px] text-[var(--text-muted)]">
          The Markdown file includes your roadmap, gap analysis, actions, and resources. Open Notion → New page → Paste to import.
        </p>
      </div>

      {/* Login modal */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
            onClick={() => setShowLoginModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-[var(--border-ws)] p-6 flex flex-col gap-4"
              style={{ backgroundColor: '#23262F' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white font-sora">Save your Blueprint</p>
                <button onClick={() => setShowLoginModal(false)} className="text-[var(--text-muted)] hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-jakarta leading-relaxed">
                Sign in with Google to export and save your Blueprint. Free, takes 5 seconds.
              </p>
              <button
                onClick={signInAndExport}
                disabled={loginLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[var(--border-ws)] bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-white disabled:opacity-50"
              >
                {loginLoading ? (
                  <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.8-11.3-7L6 33.5C9.4 39.6 16.2 44 24 44z"/>
                    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4-4.2 5.2l6.2 5.2C41 34.8 44 29.8 44 24c0-1.3-.1-2.7-.4-4z"/>
                  </svg>
                )}
                {loginLoading ? 'Signing in…' : 'Continue with Google'}
              </button>
              {loginError && <p className="text-xs text-red-400 text-center">{loginError}</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
