'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bookmark, Check, History, Loader2, Trash2, X } from 'lucide-react'
import { useWingspan } from '@/context/WingspanContext'
import { useAuth } from '@/lib/use-auth'
import { AuthModal } from '@/components/blueprint/AuthModal'
import { OPEN_SAVE_VERSION } from '@/lib/blueprint-events'
import type { Blueprint, ExtractedCareerData } from '@/types/wingspan'

interface VersionRow { id: string; label: string | null; savedAt: string; selectedPath: string | null }
interface Listing { working: { id: string; updatedAt: string } | null; versions: VersionRow[] }
type Panel = null | 'save' | 'versions'

const AUTOSAVE_MS = 2500

/**
 * Persistent "Save version" control for the Blueprint header.
 *  - Signed in: the current Blueprint autosaves as the working copy (overwritten each time);
 *    "Save version" freezes it under a label; "Versions" lists/opens/deletes saved ones.
 *  - Signed out: Save version prompts sign-in (no page reload, the Blueprint stays in memory).
 */
export function BlueprintVersions() {
  const { state, dispatch } = useWingspan()
  const { blueprint, extractedData, selectedPath } = state
  const { user } = useAuth()
  const [panel, setPanel] = useState<Panel>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [wantSave, setWantSave] = useState(false)
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')
  const [listing, setListing] = useState<Listing>({ working: null, versions: [] })
  const lastSaved = useRef('')

  const refreshList = useCallback(async () => {
    const res = await fetch('/api/blueprints').catch(() => null)
    if (res?.ok) setListing(await res.json())
  }, [])

  useEffect(() => { if (user) void refreshList() }, [user, refreshList])

  const payload = useCallback(() => ({
    blueprint, extractedData, selectedPath,
  }), [blueprint, extractedData, selectedPath])

  // Debounced autosave of the working copy.
  useEffect(() => {
    if (!user || !blueprint) return
    const body = JSON.stringify(payload())
    if (body === lastSaved.current) return
    const t = setTimeout(async () => {
      const res = await fetch('/api/blueprints', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body,
      }).catch(() => null)
      if (res?.ok) lastSaved.current = body
    }, AUTOSAVE_MS)
    return () => clearTimeout(t)
  }, [user, blueprint, payload])

  const openSave = useCallback(() => {
    if (!user) { setWantSave(true); setShowAuth(true); return }
    setError(''); setPanel('save')
  }, [user])

  // The Resources step's Save button asks for the same flow.
  useEffect(() => {
    window.addEventListener(OPEN_SAVE_VERSION, openSave)
    return () => window.removeEventListener(OPEN_SAVE_VERSION, openSave)
  }, [openSave])

  // After sign-in, continue to the save panel.
  useEffect(() => {
    if (user && wantSave) { setWantSave(false); setError(''); setPanel('save') }
  }, [user, wantSave])

  async function save() {
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/blueprints', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload(), label }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? 'Could not save.'); return }
      setLabel(''); setPanel(null); setFlash('Version saved')
      setTimeout(() => setFlash(''), 2500)
      await refreshList()
    } finally { setBusy(false) }
  }

  async function open(id: string) {
    setBusy(true); setError('')
    try {
      const res = await fetch(`/api/blueprints/${id}`)
      if (!res.ok) { setError('Could not open that version.'); return }
      const row = await res.json() as { blueprint: Blueprint; extractedData: ExtractedCareerData | null; selectedPath: string | null }
      if (row.extractedData) dispatch({ type: 'SET_EXTRACTED_DATA', data: row.extractedData })
      dispatch({ type: 'SET_BLUEPRINT', blueprint: row.blueprint })
      if (row.selectedPath) dispatch({ type: 'SELECT_PATH', path: row.selectedPath })
      setPanel(null)
    } finally { setBusy(false) }
  }

  async function remove(id: string) {
    setBusy(true)
    try {
      await fetch(`/api/blueprints/${id}`, { method: 'DELETE' })
      await refreshList()
    } finally { setBusy(false) }
  }

  return (
    <div className="relative flex items-center gap-2">
      {flash && (
        <span className="flex items-center gap-1 text-[10px] text-[var(--neon)]"><Check size={11} />{flash}</span>
      )}
      {user && (
        <button onClick={() => { setError(''); setPanel(panel === 'versions' ? null : 'versions') }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-ws)]">
          <History size={11} />Versions{listing.versions.length > 0 ? ` (${listing.versions.length})` : ''}
        </button>
      )}
      <button onClick={openSave}
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold"
        style={{ background: '#B6FF2E', color: '#0d0d0d' }}>
        <Bookmark size={11} />Save version
      </button>

      <AnimatePresence>
        {panel && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-[var(--border-ws)] bg-[var(--surface)] p-4 shadow-xl z-50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                {panel === 'save' ? 'Save this version' : 'Saved versions'}
              </p>
              <button onClick={() => setPanel(null)} aria-label="Close"><X size={14} /></button>
            </div>
            {panel === 'save' ? (
              <>
                <p className="text-[11px] text-[var(--text-muted)] mb-2">
                  Your latest Blueprint is saved automatically. A saved version is kept even when you run a new analysis.
                </p>
                <input value={label} onChange={e => setLabel(e.target.value)} maxLength={80}
                  placeholder="Name it, e.g. After portfolio update"
                  className="w-full mb-3 px-3 py-2 rounded-lg text-xs bg-[var(--bg)] border border-[var(--border-ws)] text-[var(--text-primary)]" />
                <button onClick={save} disabled={busy}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold disabled:opacity-60"
                  style={{ background: '#B6FF2E', color: '#0d0d0d' }}>
                  {busy ? <Loader2 size={12} className="animate-spin" /> : <Bookmark size={12} />}Save version
                </button>
              </>
            ) : listing.versions.length === 0 ? (
              <p className="text-[11px] text-[var(--text-muted)]">Nothing saved yet.</p>
            ) : (
              <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {listing.versions.map(v => (
                  <li key={v.id} className="flex items-center gap-2">
                    <button onClick={() => open(v.id)} disabled={busy} className="flex-1 text-left min-w-0">
                      <span className="block text-xs text-[var(--text-primary)] truncate">{v.label ?? 'Untitled'}</span>
                      <span className="block text-[10px] text-[var(--text-muted)]">{new Date(v.savedAt).toLocaleDateString()}</span>
                    </button>
                    <button onClick={() => remove(v.id)} disabled={busy} aria-label="Delete version"
                      className="text-[var(--text-muted)] hover:text-red-400"><Trash2 size={13} /></button>
                  </li>
                ))}
              </ul>
            )}
            {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAuth && (
          <AuthModal onClose={() => { setShowAuth(false); setWantSave(false) }} onSuccess={() => setShowAuth(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
