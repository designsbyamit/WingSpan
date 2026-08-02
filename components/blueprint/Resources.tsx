'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, BookOpen, Users, Link2, ChevronDown, Download, X, Loader2, Bookmark } from 'lucide-react'
import { Blueprint, Resource } from '@/types/wingspan'
import { useWingspan } from '@/context/WingspanContext'
import { exportToNotionMarkdown, downloadMarkdown } from '@/lib/export'
import { useAuth } from '@/lib/use-auth'

// ── Auth Modal ─────────────────────────────────────────────────────────────

type AuthMode = 'signup' | 'login'

function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [mode, setMode] = useState<AuthMode>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const body = mode === 'signup'
        ? { email, password, name: name.trim() || undefined }
        : { email, password }
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }
      onSuccess()
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  function handleGoogle() {
    window.location.href = `/api/auth/google?redirect=${encodeURIComponent(window.location.pathname)}`
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        transition={{ duration: 0.3, ease: [0.16,1,0.3,1] }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border p-6 flex flex-col gap-5"
        style={{ background: '#0f0f12', borderColor: 'rgba(255,255,255,0.1)' }}>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-base font-semibold text-white">
              {mode === 'signup' ? 'Save your Blueprint' : 'Welcome back'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {mode === 'signup'
                ? 'Create a free account to save your Blueprint and continue your journey.'
                : 'Sign in to access your saved Blueprint.'}
            </p>
          </div>
          <button onClick={onClose} className="text-[rgba(255,255,255,0.3)] hover:text-white transition-colors mt-0.5">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'signup' && (
            <input
              type="text" placeholder="Your name (optional)"
              value={name} onChange={e => setName(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}
            />
          )}
          <input
            type="email" placeholder="Email address" required
            value={email} onChange={e => setEmail(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}
          />
          <input
            type="password" placeholder="Password (min 8 characters)" required
            value={password} onChange={e => setPassword(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
            style={{ background: '#B6FF2E', color: '#0d0d0d' }}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            {mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>or</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Google */}
        <button onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:bg-white/5"
          style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.8-11.3-7L6 33.5C9.4 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4-4.2 5.2l6.2 5.2C41 34.8 44 29.8 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          Continue with Google
        </button>

        {/* Toggle */}
        <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
          {' '}
          <button onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError('') }}
            className="underline underline-offset-2 hover:text-white transition-colors"
            style={{ color: '#B6FF2E' }}>
            {mode === 'signup' ? 'Sign in' : 'Create account'}
          </button>
        </p>
      </motion.div>
    </motion.div>
  )
}

// ── Resource Card ──────────────────────────────────────────────────────────

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
            <a href={resource.url} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()} className="text-[var(--neon)] hover:opacity-80 transition-opacity">
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
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto' as const, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[var(--border-ws)]">
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
                <a href={resource.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[var(--neon)] text-[#0a0a0a] text-xs font-bold w-fit">
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

// ── Main ───────────────────────────────────────────────────────────────────

export function Resources({ blueprint }: { blueprint: Blueprint }) {
  const { state } = useWingspan()
  const selectedPath = state.selectedPath
  const [exporting, setExporting] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<'export' | 'save' | null>(null)
  const { user, loading: authLoading } = useAuth()

  function doExport() {
    setExporting(true)
    const md = exportToNotionMarkdown(blueprint, selectedPath)
    downloadMarkdown(md, `wingspan-blueprint-${new Date().toISOString().split('T')[0]}.md`)
    setTimeout(() => setExporting(false), 1500)
  }

  function handleExport() {
    if (user) { doExport(); return }
    setPendingAction('export')
    setShowAuthModal(true)
  }

  function handleSave() {
    if (user) { doExport(); return } // save = export for now
    setPendingAction('save')
    setShowAuthModal(true)
  }

  function handleAuthSuccess() {
    setShowAuthModal(false)
    if (pendingAction === 'export' || pendingAction === 'save') doExport()
    setPendingAction(null)
    // Reload to update session state across the app
    setTimeout(() => window.location.reload(), 800)
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
      {/* Auth modal */}
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />
        )}
      </AnimatePresence>

      {/* Save Blueprint CTA — shown to unauthenticated users */}
      {!authLoading && !user && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border p-5 flex items-center justify-between gap-4"
          style={{ background: 'rgba(182,255,46,0.04)', borderColor: 'rgba(182,255,46,0.18)' }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#B6FF2E' }}>Save your Blueprint</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Create a free account to save and continue your journey.
            </p>
          </div>
          <button onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all hover:-translate-y-px"
            style={{ background: '#B6FF2E', color: '#0d0d0d' }}>
            <Bookmark size={13} />
            Save
          </button>
        </motion.div>
      )}

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
          <motion.button whileTap={{ scale: 0.98 }} onClick={handleExport} disabled={exporting}
            className="flex items-center justify-center gap-2 py-3 px-5 rounded-[10px] bg-[var(--neon)] text-[#0a0a0a] text-sm font-bold transition-opacity"
            style={{ opacity: exporting ? 0.7 : 1 }}>
            <Download size={14} />
            {exporting ? 'Exporting…' : 'Export to Notion (.md)'}
          </motion.button>
        </div>
        <p className="text-[10px] text-[var(--text-muted)]">
          The Markdown file includes your roadmap, gap analysis, actions, and resources. Open Notion → New page → Paste to import.
        </p>
      </div>
    </div>
  )
}
