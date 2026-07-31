'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Project } from '@/types/wingspan'
import { useWingspan } from '@/context/WingspanContext'

const INDUSTRIES = ['Data & AI', 'Aviation', 'Cloud', 'Telecom', 'Insurance', 'FinTech', 'E-commerce', 'Healthcare', 'Education', 'Retail', 'Media', 'Government']
const PLATFORMS = ['Web', 'Mobile', 'Enterprise SaaS', 'Design Systems', 'API / Platform', 'Physical / IoT']
const AUDIENCES = ['B2B', 'B2C', 'Internal', 'B2B2C']

interface ProjectEditModalProps {
  project: Project
  onClose: () => void
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold tracking-[2px] uppercase text-[var(--text-muted)]">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "bg-[var(--surface-dim)] border border-[var(--border-ws)] rounded-[8px] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--neon)] transition-colors"

export function ProjectEditModal({ project, onClose }: ProjectEditModalProps) {
  const { dispatch } = useWingspan()
  const [draft, setDraft] = useState<Project>({ ...project })

  const handleSave = () => {
    dispatch({ type: 'UPDATE_PROJECT', project: draft })
    onClose()
  }

  const set = (field: keyof Project) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setDraft(prev => ({ ...prev, [field]: e.target.value }))
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.25 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg bg-[var(--card-inner)] border border-[var(--border-ws)] rounded-[16px] p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>
              Edit Project
            </h3>
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
              <X size={16} />
            </button>
          </div>

          <Field label="Project Name">
            <input className={inputCls} value={draft.name} onChange={set('name')} placeholder="Project name" />
          </Field>

          <Field label="Company">
            <input className={inputCls} value={draft.company} onChange={set('company')} placeholder="Company" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Year">
              <input className={inputCls} value={draft.year ?? ''} onChange={set('year')} placeholder="2024" />
            </Field>
            <Field label="Audience">
              <select className={inputCls} value={draft.audience ?? ''} onChange={set('audience')}>
                <option value="">Select…</option>
                {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Industry">
              <select className={inputCls} value={draft.industry ?? ''} onChange={set('industry')}>
                <option value="">Select…</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </Field>
            <Field label="Platform">
              <select className={inputCls} value={draft.platform ?? ''} onChange={set('platform')}>
                <option value="">Select…</option>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Summary">
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={draft.summary ?? ''}
              onChange={set('summary')}
              placeholder="What was the project?"
            />
          </Field>

          <Field label="Impact">
            <input className={inputCls} value={draft.impact ?? ''} onChange={set('impact')} placeholder="e.g. 92% engagement boost, $446K savings" />
          </Field>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-[10px] bg-[var(--neon)] text-[#0a0a0a] text-sm font-bold"
            >
              Save Changes
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-[10px] border border-[var(--border-ws)] text-sm text-[var(--text-muted)]"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
