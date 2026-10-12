'use client'
import { useState } from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'
import { Dialog } from '@/components/blueprint/shell/Dialog'
import { FOCUS_RING, PrimaryButton, SecondaryButton } from '@/components/blueprint/shell/ui'
import { FIELD_LABELS, TRACK_LABELS, type FieldChange, type ProfileDetails } from '@/lib/profile/details'
import type { CareerTrack } from '@/lib/student/detect'

export type DetailsDialogState =
  | { kind: 'new'; proposed: ProfileDetails }
  | { kind: 'update'; proposed: ProfileDetails; changes: FieldChange[] }
  | { kind: 'edit'; saved: ProfileDetails }

const input = `w-full h-10 px-3 rounded-[10px] text-[14px] bg-[var(--bg)] border border-[var(--border-ws)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] ${FOCUS_RING}`

const TEXT_FIELDS: { key: keyof ProfileDetails; type?: string; placeholder?: string }[] = [
  { key: 'email', type: 'email', placeholder: 'you@example.com' },
  { key: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
  { key: 'location', placeholder: 'City, country' },
  { key: 'linkedinUrl', type: 'url', placeholder: 'linkedin.com/in/you' },
  { key: 'portfolioUrl', type: 'url', placeholder: 'yourportfolio.com' },
  { key: 'githubUrl', type: 'url', placeholder: 'github.com/you' },
  { key: 'currentRole', placeholder: 'e.g. Product Designer' },
  { key: 'currentOrg', placeholder: 'e.g. Acme' },
  { key: 'education', placeholder: 'e.g. M.Des, IDC IIT Bombay (2027)' },
]

/** Confirm details read from the resume (first time), approve changes from a newer resume, or edit saved details. */
export function ProfileDetailsDialog({ state, onClose, onSaved, extracted, urls }: {
  state: DetailsDialogState | null
  onClose: () => void
  onSaved: () => void
  extracted?: unknown
  urls?: Record<string, string>
}) {
  const [draft, setDraft] = useState<ProfileDetails | null>(null)
  const [accept, setAccept] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Reset the form whenever a different dialog opens.
  const [seen, setSeen] = useState<DetailsDialogState | null>(null)
  if (state !== seen) {
    setSeen(state)
    setError('')
    if (state?.kind === 'new') setDraft(state.proposed)
    else if (state?.kind === 'edit') setDraft(state.saved)
    else setDraft(null)
    setAccept(state?.kind === 'update' ? Object.fromEntries(state.changes.map((c) => [c.field, true])) : {})
  }

  if (!state) return null
  const set = <K extends keyof ProfileDetails>(k: K, v: ProfileDetails[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!state) return
    setBusy(true); setError('')
    try {
      const body = state.kind === 'new' ? { details: draft }
        : state.kind === 'edit' ? { edit: draft }
        : { extracted, urls, accept: Object.entries(accept).filter(([, v]) => v).map(([k]) => k) }
      const res = await fetch('/api/profile-details', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null)
      const data = await res?.json().catch(() => ({})) as { error?: string } | undefined
      if (!res?.ok) { setError(data?.error ?? 'Could not save. Check your connection and try again.'); return }
      onSaved()
    } finally { setBusy(false) }
  }

  const title = state.kind === 'new' ? 'Is this you?' : state.kind === 'update' ? 'Your new resume has updates' : 'Edit your details'
  const description = state.kind === 'new'
    ? 'We read these from your resume. Check them and fix anything that is off. Once confirmed, they live on your profile.'
    : state.kind === 'update'
      ? 'Same name, so we only ask about what changed. Choose what to update. Your name stays as it is.'
      : 'Your name is fixed once confirmed. Everything else you can change any time.'

  return (
    <Dialog open onClose={onClose} title={title} description={description} size="md">
      <form onSubmit={submit} className="flex flex-col gap-4">
        {state.kind === 'update' ? (
          <ul className="flex flex-col gap-2">
            {state.changes.map((c) => (
              <li key={c.field}>
                <label className="flex items-start gap-3 rounded-[12px] border border-[var(--border-ws)] p-3.5 cursor-pointer has-[:checked]:border-[var(--neon-border)] has-[:checked]:bg-[var(--neon-surface)] transition-colors">
                  <input type="checkbox" checked={!!accept[c.field]} onChange={(e) => setAccept((a) => ({ ...a, [c.field]: e.target.checked }))} className="mt-1 h-4 w-4 accent-[var(--neon)]" />
                  <span className="min-w-0 text-[14px]">
                    <span className="block text-[12px] font-semibold text-[var(--text-muted)]">{c.label}</span>
                    <span className="block text-[var(--text-muted)] line-through break-words">{c.from || 'Not set'}</span>
                    <span className="block text-[var(--text-primary)] font-medium break-words">{c.to}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        ) : draft && (
          <div className="grid sm:grid-cols-2 gap-3.5 max-h-[55vh] overflow-y-auto pr-1">
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[12px] font-semibold text-[var(--text-muted)]">{FIELD_LABELS.fullName}{state.kind === 'edit' ? ' (fixed)' : ''}</span>
              <input data-autofocus={state.kind === 'new' || undefined} value={draft.fullName} readOnly={state.kind === 'edit'} onChange={(e) => set('fullName', e.target.value)} maxLength={80} required placeholder="Your full name"
                className={`${input} ${state.kind === 'edit' ? 'opacity-70' : ''}`} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-[var(--text-muted)]">{FIELD_LABELS.track}</span>
              <select value={draft.track} onChange={(e) => set('track', e.target.value as CareerTrack)} className={input}>
                {(Object.keys(TRACK_LABELS) as CareerTrack[]).map((t) => <option key={t} value={t}>{TRACK_LABELS[t]}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-[var(--text-muted)]">{FIELD_LABELS.experienceYears}</span>
              <input type="number" min={0} max={60} step={0.5} value={draft.experienceYears ?? ''} onChange={(e) => set('experienceYears', e.target.value === '' ? null : Number(e.target.value))} className={input} />
            </label>
            {TEXT_FIELDS.map((f) => (
              <label key={f.key} className="flex flex-col gap-1.5">
                <span className="text-[12px] font-semibold text-[var(--text-muted)]">{FIELD_LABELS[f.key]}</span>
                <input type={f.type ?? 'text'} value={String(draft[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value as never)} placeholder={f.placeholder} className={input} />
              </label>
            ))}
          </div>
        )}
        {error && <p role="alert" className="text-[13px] text-red-400">{error}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]"><ShieldCheck size={13} aria-hidden />Nothing is saved until you confirm.</p>
          <div className="flex gap-2">
            <SecondaryButton onClick={onClose}>{state.kind === 'edit' ? 'Cancel' : 'Not now'}</SecondaryButton>
            <PrimaryButton type="submit" disabled={busy || (state.kind === 'update' && !Object.values(accept).some(Boolean))}>
              {busy && <Loader2 size={14} className="animate-spin" aria-hidden />}
              {state.kind === 'new' ? 'Yes, this is me' : state.kind === 'update' ? 'Update selected' : 'Save changes'}
            </PrimaryButton>
          </div>
        </div>
      </form>
    </Dialog>
  )
}
