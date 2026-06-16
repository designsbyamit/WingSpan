'use client'
import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Download, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useWingspan } from '@/context/WingspanContext'
import { NeonButton } from '@/components/ui/NeonButton'
import { GhostButton } from '@/components/ui/GhostButton'

const INTERESTS = [
  'AI', 'Design Leadership', 'Product Strategy', 'Entrepreneurship',
  'Design Systems', 'Research', 'Community Building', 'Education',
  'Sustainability', 'Innovation', 'Emerging Technology', 'Management',
  'Writing', 'Public Speaking',
]

const URL_FIELDS = [
  { key: 'linkedin', label: 'LinkedIn URL' },
  { key: 'github', label: 'GitHub URL' },
  { key: 'portfolio', label: 'Portfolio URL' },
  { key: 'behance', label: 'Behance URL' },
  { key: 'dribbble', label: 'Dribbble URL' },
  { key: 'medium', label: 'Medium URL' },
]

export function FootprintScreen() {
  const { state, dispatch } = useWingspan()
  const [dragOver, setDragOver] = useState(false)
  const [showExtraFiles, setShowExtraFiles] = useState(false)
  const [loading, setLoading] = useState(false)

  const primaryFile = state.files[0]
  const canProceed = !!primaryFile && state.interests.length >= 3

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      dispatch({ type: 'SET_FILES', files: [files[0], ...state.files.slice(1)] })
    }
  }, [dispatch, state.files])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, replace = false) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    if (replace) {
      dispatch({ type: 'SET_FILES', files: [files[0], ...state.files.slice(1)] })
    } else {
      dispatch({ type: 'SET_FILES', files: [...state.files, ...files] })
    }
  }

  const handleBeginAnalysis = async () => {
    if (!canProceed) return
    setLoading(true)
    dispatch({ type: 'SET_SCREEN', screen: 'discovering' })

    try {
      const formData = new FormData()
      for (const file of state.files) {
        formData.append('files', file)
      }
      formData.append('urls', JSON.stringify(state.urls))

      const res = await fetch('/api/extract', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Extraction failed')
      const data = await res.json()
      dispatch({ type: 'SET_EXTRACTED_DATA', data })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: String(err) })
      dispatch({ type: 'SET_SCREEN', screen: 'footprint' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-xl w-full flex flex-col gap-6">
        <div>
          <span className="text-xs font-normal tracking-[0.2em] text-[var(--neon)]" style={{ textShadow: '0 0 12px var(--neon-glow)' }}>
            Wingspan
          </span>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-2 leading-tight">
            Your professional footprint
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Upload your resume to begin.
          </p>
        </div>

        {/* Primary upload */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          className={`
            border-[1.5px] border-dashed rounded-[10px] p-6 text-center transition-all
            ${dragOver ? 'border-[var(--neon)] bg-[var(--neon-surface)]' : 'border-[var(--border-ws)] bg-[var(--surface-dim)]'}
          `}
        >
          {primaryFile ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">{primaryFile.name}</span>
              <button
                onClick={() => dispatch({ type: 'SET_FILES', files: state.files.slice(1) })}
                className="text-[var(--text-muted)] hover:text-[var(--neon)] transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center gap-2">
              <Upload size={20} className="text-[var(--text-muted)]" />
              <span className="text-sm font-bold text-[var(--neon)]">Upload Resume</span>
              <span className="text-xs text-[var(--text-muted)]">PDF · DOCX · XLSX · TXT · Drag & drop</span>
              <input
                type="file"
                accept=".pdf,.docx,.xlsx,.csv,.txt"
                className="hidden"
                onChange={(e) => handleFileInput(e, true)}
              />
            </label>
          )}
        </div>

        {/* Template download */}
        <a href="/api/template" download>
          <GhostButton>
            <Download size={12} />
            Download Project Repository Template
          </GhostButton>
        </a>

        {/* Optional URLs */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">
            Optional links
          </span>
          <div className="grid grid-cols-1 gap-2">
            {URL_FIELDS.map(({ key, label }) => (
              <input
                key={key}
                type="url"
                placeholder={label}
                value={state.urls[key] ?? ''}
                onChange={(e) => dispatch({ type: 'SET_URL', key, value: e.target.value })}
                className="bg-[var(--surface)] border border-[var(--border-ws)] rounded-[6px] px-3 py-2 text-xs text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon)] transition-colors"
              />
            ))}
          </div>
        </div>

        {/* Additional files */}
        <div>
          <button
            onClick={() => setShowExtraFiles(!showExtraFiles)}
            className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            {showExtraFiles ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Add more files (case studies, reports, templates…)
          </button>
          {showExtraFiles && (
            <motion.label
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' as const }}
              className="mt-2 flex items-center gap-2 text-xs text-[var(--neon)] cursor-pointer"
            >
              <Upload size={12} />
              Choose additional files
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.xlsx,.csv,.txt,.pptx"
                className="hidden"
                onChange={(e) => handleFileInput(e, false)}
              />
            </motion.label>
          )}
          {state.files.slice(1).map((f) => (
            <div key={f.name} className="flex items-center justify-between mt-1">
              <span className="text-xs text-[var(--text-muted)]">{f.name}</span>
            </div>
          ))}
        </div>

        {/* Interests */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">
            What excites you next? <span className="text-[var(--text-dim)]">(pick 3–5)</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => {
              const selected = state.interests.includes(interest)
              return (
                <motion.button
                  key={interest}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  onClick={() => dispatch({ type: 'TOGGLE_INTEREST', interest })}
                  className={`
                    text-xs font-medium px-3 py-1.5 rounded-[6px] border transition-all
                    ${selected
                      ? 'bg-[var(--neon-surface)] text-[var(--neon)] border-[var(--neon-border)]'
                      : 'bg-[#222] text-[#888] border-[var(--border-ws)] hover:border-[var(--text-muted)]'
                    }
                  `}
                >
                  {selected ? `${interest} ✓` : interest}
                </motion.button>
              )
            })}
          </div>
        </div>

        <NeonButton
          onClick={handleBeginAnalysis}
          disabled={!canProceed || loading}
          fullWidth
        >
          {loading ? 'Starting analysis…' : 'Begin Analysis →'}
        </NeonButton>
      </div>
    </div>
  )
}
