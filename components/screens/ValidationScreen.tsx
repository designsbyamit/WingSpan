'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Pencil, X } from 'lucide-react'
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
  const lowConfidence = scores && Object.values(scores).some((s) => s < 80)

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
    dispatch({
      type: 'SET_VALIDATED_DATA',
      data: { ...extractedData, interests: state.interests },
    })
    dispatch({ type: 'SET_SCREEN', screen: 'blueprint' })
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

        {/* Confidence scores */}
        {scores && (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">Analysis Confidence</span>
            {[
              { label: 'Career Timeline', value: scores.timeline },
              { label: 'Strength Analysis', value: scores.strengths },
              { label: 'Future Opportunities', value: scores.futurePaths },
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
          Show Me My Blueprint →
        </NeonButton>
      </div>
    </div>
  )
}
