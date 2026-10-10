'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Bookmark, FolderOpen, Loader2, Trash2 } from 'lucide-react'
import { useWingspan } from '@/context/WingspanContext'
import type { Blueprint, ExtractedCareerData } from '@/types/wingspan'
import { Dialog } from '@/components/blueprint/shell/Dialog'
import { FOCUS_RING, PrimaryButton, SecondaryButton } from '@/components/blueprint/shell/ui'

export interface VersionRow { id: string; label: string | null; savedAt: string; selectedPath: string | null }
interface Listing { working: { id: string; updatedAt: string } | null; versions: VersionRow[] }

const AUTOSAVE_MS = 2500

/**
 * Saved-version logic for the Blueprint (used by the side nav).
 *  - Signed in: the current Blueprint autosaves as the working copy (overwritten each time);
 *    save() freezes it under a label; open()/remove() act on saved versions.
 *  - Signed out: nothing is persisted; the caller gates saving behind sign-in.
 */
export function useBlueprintVersions(signedIn: boolean) {
  const { state, dispatch } = useWingspan()
  const { blueprint, extractedData, selectedPath } = state
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [listing, setListing] = useState<Listing>({ working: null, versions: [] })
  const lastSaved = useRef('')

  const refreshList = useCallback(async () => {
    const res = await fetch('/api/blueprints').catch(() => null)
    if (res?.ok) setListing(await res.json())
  }, [])

  useEffect(() => {
    // State is only set after the fetch resolves, so this does not cascade renders.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (signedIn) void refreshList()
  }, [signedIn, refreshList])

  const payload = useCallback(() => ({
    blueprint, extractedData, selectedPath,
  }), [blueprint, extractedData, selectedPath])

  // Debounced autosave of the working copy.
  useEffect(() => {
    if (!signedIn || !blueprint) return
    const body = JSON.stringify(payload())
    if (body === lastSaved.current) return
    const t = setTimeout(async () => {
      const res = await fetch('/api/blueprints', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body,
      }).catch(() => null)
      if (res?.ok) lastSaved.current = body
    }, AUTOSAVE_MS)
    return () => clearTimeout(t)
  }, [signedIn, blueprint, payload])

  /** Returns true when the version was saved. */
  const save = useCallback(async (label: string) => {
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/blueprints', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload(), label }),
      }).catch(() => null)
      const data = await res?.json().catch(() => ({})) ?? {}
      if (!res?.ok) { setError(data.error ?? 'Could not save. Check your connection and try again.'); return false }
      await refreshList()
      return true
    } finally { setBusy(false) }
  }, [payload, refreshList])

  /** Returns true when the version was opened. */
  const open = useCallback(async (id: string) => {
    setBusy(true); setError('')
    try {
      const res = await fetch(`/api/blueprints/${id}`).catch(() => null)
      if (!res?.ok) { setError('Could not open that version. Try again.'); return false }
      const row = await res.json() as { blueprint: Blueprint; extractedData: ExtractedCareerData | null; selectedPath: string | null }
      if (row.extractedData) dispatch({ type: 'SET_EXTRACTED_DATA', data: row.extractedData })
      dispatch({ type: 'SET_BLUEPRINT', blueprint: row.blueprint })
      if (row.selectedPath) dispatch({ type: 'SELECT_PATH', path: row.selectedPath })
      return true
    } finally { setBusy(false) }
  }, [dispatch])

  const remove = useCallback(async (id: string) => {
    setBusy(true); setError('')
    try {
      await fetch(`/api/blueprints/${id}`, { method: 'DELETE' }).catch(() => null)
      await refreshList()
    } finally { setBusy(false) }
  }, [refreshList])

  return { versions: signedIn ? listing.versions : [], busy, error, setError, save, open, remove }
}

export type VersionsApi = ReturnType<typeof useBlueprintVersions>

export function SaveVersionDialog({ open, onClose, api, onSaved }: {
  open: boolean
  onClose: () => void
  api: VersionsApi
  onSaved: () => void
}) {
  const [label, setLabel] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (await api.save(label.trim())) { setLabel(''); onSaved() }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Save this version"
      description="Your latest Blueprint is saved automatically. A named version is kept even when you run a new analysis."
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Version name</span>
          <input
            data-autofocus
            value={label}
            onChange={e => setLabel(e.target.value)}
            maxLength={80}
            placeholder="e.g. After portfolio update"
            className={`h-11 px-3 rounded-[10px] text-[14px] bg-[var(--bg)] border border-[var(--border-ws)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] ${FOCUS_RING}`}
          />
        </label>
        {api.error && <p role="alert" className="text-[13px] text-red-400">{api.error}</p>}
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={api.busy}>
            {api.busy ? <Loader2 size={14} className="animate-spin" /> : <Bookmark size={14} />}
            Save version
          </PrimaryButton>
        </div>
      </form>
    </Dialog>
  )
}

export function VersionsDialog({ open, onClose, api, onOpened, onSaveNew }: {
  open: boolean
  onClose: () => void
  api: VersionsApi
  onOpened: () => void
  onSaveNew: () => void
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null)

  return (
    <Dialog
      open={open}
      onClose={() => { setConfirmId(null); onClose() }}
      title="Saved versions"
      description="Open a saved version to replace what is on screen. Your current Blueprint stays saved as the working copy."
      size="md"
    >
      {api.versions.length === 0 ? (
        <div className="flex flex-col items-start gap-3 py-2">
          <p className="text-[14px] text-[var(--text-secondary)]">No saved versions yet. Save one to keep a snapshot you can come back to.</p>
          <PrimaryButton onClick={onSaveNew}><Bookmark size={14} />Save version</PrimaryButton>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--border-ws)] -mx-2">
          {api.versions.map(v => (
            <li key={v.id} className="flex items-center gap-2 px-2 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[var(--text-primary)] truncate">{v.label || 'Untitled version'}</p>
                <p className="text-[12px] text-[var(--text-muted)] truncate">
                  Saved {new Date(v.savedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  {v.selectedPath ? `, path: ${v.selectedPath}` : ''}
                </p>
              </div>
              {confirmId === v.id ? (
                <>
                  <SecondaryButton onClick={() => setConfirmId(null)} className="h-9 px-3">Keep</SecondaryButton>
                  <button
                    type="button"
                    disabled={api.busy}
                    onClick={async () => { await api.remove(v.id); setConfirmId(null) }}
                    className={`h-9 px-3 rounded-[10px] text-[13px] font-semibold bg-red-500/15 text-red-400 hover:bg-red-500/25 ${FOCUS_RING}`}
                  >
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <SecondaryButton
                    className="h-9 px-3"
                    disabled={api.busy}
                    onClick={async () => { if (await api.open(v.id)) onOpened() }}
                  >
                    <FolderOpen size={14} />Open
                  </SecondaryButton>
                  <button
                    type="button"
                    onClick={() => setConfirmId(v.id)}
                    aria-label={`Delete ${v.label || 'untitled version'}`}
                    className={`w-9 h-9 rounded-[10px] inline-flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 hover:bg-[var(--surface-dim)] ${FOCUS_RING}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {api.error && <p role="alert" className="mt-3 text-[13px] text-red-400">{api.error}</p>}
    </Dialog>
  )
}
