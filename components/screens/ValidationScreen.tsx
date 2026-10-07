'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Pencil, X, AlertTriangle } from 'lucide-react'
import { useWingspan } from '@/context/WingspanContext'
import { NeonButton } from '@/components/ui/NeonButton'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { TimelineEntry } from '@/types/wingspan'

export function ValidationScreen() {
  const { state, dispatch } = useWingspan()
  const { extractedData, blueprint } = state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Partial<TimelineEntry>>({})

  const scores = blueprint?.confidenceScores
  const toPercent = (v: number) => v < 2 ? Math.round(v * 100) : Math.round(v)
  const lowConfidence = scores && Object.values(scores).some((s) => toPercent(s) < 80)

  const startEdit = (entry: TimelineEntry) => {
    setEditingId(entry.id)
    setEditDraft({ role: entry.role, company: entry.company, startDate: entry.startDate, endDate: entry.endDate })
  }

  const saveEdit = (entry: TimelineEntry) => {
    dispatch({ type: 'UPDATE_TIMELINE_ENTRY', entry: { ...entry, ...editDraft, confirmed: true } })
    setEditingId(null)
  }

  const confirmEntry = (entry: TimelineEntry) => {
    dispatch({ type: 'UPDATE_TIMELINE_ENTRY', entry: { ...entry, confirmed: true } })
  }

  const handleProceed = () => {
    if (!extractedData) return
    dispatch({ type: 'SET_VALIDATED_DATA', data: { ...extractedData, interests: state.interests } })
    if (state.blueprintReady) {
      dispatch({ type: 'SET_SCREEN', screen: 'blueprint' })
    } else {
      dispatch({ type: 'SET_SCREEN', screen: 'discovering' })
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-xl w-full flex flex-col gap-6">
        <div>
          <span className="text-xs font-normal tracking-[0.2em] text-[var(--neon)]">
            Wingspan
          </span>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-2">Quick check before we continue.</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">We pulled this from your resume. Fix anything that's off — it'll make your Blueprint more accurate.</p>
        </div>

        {/* Findings snapshot */}
        {extractedData && (
          <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">Findings Snapshot</span>
              <span className="text-[10px] text-[var(--text-dim)]">From your document</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Roles', value: extractedData.timeline?.length ?? 0 },
                { label: 'Projects', value: extractedData.projects?.length ?? 0 },
                { label: 'Skills', value: extractedData.skills?.length ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-[8px] bg-[var(--surface-dim)] border border-[var(--border-ws)] px-3 py-2.5">
                  <div className="text-lg font-semibold text-[var(--text-primary)]">{value}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{label} found</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {state.error && (
          <div className="rounded-[10px] border border-red-400/20 bg-red-400/5 px-4 py-3 flex items-start gap-3">
            <AlertTriangle size={15} className="text-red-300 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-red-200">We hit a snag</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{state.error}</p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">Career Timeline</span>
          {(extractedData?.timeline ?? []).map((entry) => (
            <motion.div
              key={entry.id}
              layout
              className="rounded-[10px] bg-[var(--surface)] border border-[var(--border-ws)] p-3"
            >
              {editingId === entry.id ? (
                <div className="flex flex-col gap-2">
                  <input
                    className="bg-[#2a2a2a] border border-[var(--border-ws)] rounded px-2 py-1 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--neon)]"
                    value={editDraft.role ?? ''}
                    onChange={(e) => setEditDraft({ ...editDraft, role: e.target.value })}
                    placeholder="Role"
                  />
                  <input
                    className="bg-[#2a2a2a] border border-[var(--border-ws)] rounded px-2 py-1 text-xs text-[var(--text-secondary)] focus:outline-none focus:border-[var(--neon)]"
                    value={editDraft.company ?? ''}
                    onChange={(e) => setEditDraft({ ...editDraft, company: e.target.value })}
                    placeholder="Company"
                  />
                  <div className="flex gap-2">
                    <input
                      className="bg-[#2a2a2a] border border-[var(--border-ws)] rounded px-2 py-1 text-xs text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon)] flex-1"
                      value={editDraft.startDate ?? ''}
                      onChange={(e) => setEditDraft({ ...editDraft, startDate: e.target.value })}
                      placeholder="Start"
                    />
                    <input
                      className="bg-[#2a2a2a] border border-[var(--border-ws)] rounded px-2 py-1 text-xs text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon)] flex-1"
                      value={editDraft.endDate ?? ''}
                      onChange={(e) => setEditDraft({ ...editDraft, endDate: e.target.value })}
                      placeholder="End"
                    />
                  </div>
                  <button
                    onClick={() => saveEdit(entry)}
                    className="text-xs text-[var(--neon)] font-semibold self-start"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{entry.role} · {entry.company}</p>
                    <p className="text-xs text-[var(--text-muted)]">{entry.startDate} – {entry.endDate}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => confirmEntry(entry)} aria-label="Confirm">
                      <Check
                        size={14}
                        className={entry.confirmed ? 'text-[var(--neon)]' : 'text-[var(--text-muted)] hover:text-[var(--neon)]'}
                        style={entry.confirmed ? {} : {}}
                      />
                    </button>
                    <button onClick={() => startEdit(entry)} aria-label="Edit">
                      <Pencil size={13} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]" />
                    </button>
                    <button onClick={() => dispatch({ type: 'REMOVE_TIMELINE_ENTRY', id: entry.id })} aria-label="Remove">
                      <X size={13} className="text-[var(--text-muted)] hover:text-red-400" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

          {(extractedData?.timeline ?? []).length === 0 && (
            <div className="rounded-[10px] border border-[var(--border-ws)] bg-[var(--surface-dim)] px-4 py-5">
              <p className="text-sm text-[var(--text-secondary)]">No career timeline could be confidently extracted yet.</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">We won't let an empty extraction silently pass into the next stage.</p>
            </div>
          )}

        {/* Confidence scores — skeleton while loading, real scores when ready */}
        {state.blueprintLoading && !state.blueprintReady && (
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-bold tracking-[2px] uppercase text-[var(--text-muted)]">Analysis Confidence</p>
            {['Career Timeline', 'Strength Analysis', 'Future Opportunities'].map(label => (
              <div key={label} className="flex flex-col gap-1">
                <div className="flex justify-between mb-0.5">
                  <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Analysing…</span>
                </div>
                <div className="h-[1.5px] rounded-full bg-[var(--border-ws)] overflow-hidden">
                  <motion.div
                    className="h-full bg-[var(--neon)] opacity-30 rounded-full"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ width: '40%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        {(!state.blueprintLoading || state.blueprintReady) && scores && (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">Analysis Confidence</span>
            {[
              { label: 'Career Timeline', value: toPercent(scores.timeline) },
              { label: 'Strength Analysis', value: toPercent(scores.strengths) },
              { label: 'Future Opportunities', value: toPercent(scores.futurePaths) },
            ].map(({ label, value }) => (
              <ProgressBar key={label} label={label} value={value} showLabel />
            ))}
          </div>
        )}

        {/* Low confidence tip */}
        {lowConfidence && (
          <div className="rounded-[10px] bg-[var(--surface)] border border-[var(--border-ws)] p-3">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Uploading a Project Repository Template gives us a lot more to work with.{' '}
              <a href="/api/template" download className="text-[var(--neon)] font-semibold">
                Download it here →
              </a>
            </p>
          </div>
        )}

        <NeonButton onClick={handleProceed} fullWidth>
          {state.blueprintLoading && !state.blueprintReady
            ? 'Analysing your career… (view progress →)'
            : 'Show Me My Blueprint →'}
        </NeonButton>
      </div>
    </div>
  )
}
