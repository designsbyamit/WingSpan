'use client'
import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Download, ChevronDown, ChevronUp, X, Link2, ArrowRight, FileText, Cpu, Sparkles } from 'lucide-react'
import { useWingspan } from '@/context/WingspanContext'
import { NeonButton } from '@/components/ui/NeonButton'
import { GhostButton } from '@/components/ui/GhostButton'
import { runCareerPipeline } from '@/lib/pipeline'

// ── Extraction animation overlay ──────────────────────────────────────────
function ExtractionOverlay() {
  const steps = [
    { icon: FileText, label: 'Reading document structure', delay: 0 },
    { icon: Cpu, label: 'Extracting career signals', delay: 0.6 },
    { icon: Sparkles, label: 'Building your profile', delay: 1.2 },
  ]
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(13,13,13,0.96)', backdropFilter: 'blur(12px)' }}
    >
      {/* Document animation */}
      <div className="relative mb-12">
        <svg width="120" height="140" viewBox="0 0 120 140" fill="none">
          {/* Document base */}
          <motion.rect x="20" y="10" width="80" height="100" rx="6"
            stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" fill="none"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
          {/* Page fold corner */}
          <motion.path d="M80 10 L100 30 L80 30 Z"
            fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          />
          {/* Lines being extracted */}
          {[30, 45, 60, 75, 88].map((y, i) => (
            <motion.line key={i} x1="32" y1={y} x2="88" y2={y}
              stroke="#B6FF2E" strokeWidth="1.5" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 0.8, 0.4] }}
              transition={{ delay: 0.3 + i * 0.18, duration: 0.5, ease: 'easeOut' }}
            />
          ))}
          {/* Nodes flying out */}
          {[
            { cx: 32, cy: 30, tx: -40, ty: -20 },
            { cx: 60, cy: 45, tx: 45, ty: -30 },
            { cx: 45, cy: 60, tx: -50, ty: 10 },
            { cx: 75, cy: 75, tx: 40, ty: 20 },
            { cx: 35, cy: 88, tx: -35, ty: 30 },
          ].map((n, i) => (
            <motion.circle key={i} cx={n.cx} cy={n.cy} r="3"
              fill="#B6FF2E"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0], x: n.tx, y: n.ty }}
              transition={{ delay: 0.5 + i * 0.2, duration: 0.8, ease: [0.16,1,0.3,1] }}
            />
          ))}
        </svg>
        {/* Orbital ring */}
        <motion.div className="absolute inset-0 -m-4 rounded-full border"
          style={{ borderColor: 'rgba(182,255,46,0.15)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Step labels */}
      <div className="flex flex-col items-center gap-3">
        {steps.map(({ icon: Icon, label, delay }, i) => (
          <motion.div key={i} className="flex items-center gap-2.5"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + delay, duration: 0.6, ease: [0.16,1,0.3,1] }}>
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: delay }}>
              <Icon size={14} style={{ color: '#B6FF2E' }} />
            </motion.div>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

const INTEREST_CATEGORIES: { label: string; interests: string[] }[] = [
  {
    label: 'Design Craft & User Experience',
    interests: [
      'Product Design',
      'UX Research',
      'UI & Visual Design',
      'Interaction Design',
      'Information Architecture',
      'Design Systems',
      'Service Design',
      'Accessibility & Inclusive Design',
      'Content Design & UX Writing',
      'Motion Design & Micro-interactions',
      'Customer Journey Design',
      'Enterprise UX',
    ],
  },
  {
    label: 'AI, Technology & Innovation',
    interests: [
      'Agentic Experience Design',
      'Human-AI Collaboration',
      'Agent-Agent Collaboration',
      'AI Product Design',
      'Prompt Engineering',
      'AI-assisted Design',
      'AI Governance & Responsible AI',
      'Automation & No-code',
      'Emerging Technologies (AR/VR/XR, Spatial, IoT)',
      'Front-end Development',
      'Data & Analytics',
      'Innovation & Experimentation',
    ],
  },
  {
    label: 'Product, Business & Strategy',
    interests: [
      'Product Strategy',
      'Business Strategy',
      'Systems Thinking',
      'Platform & Ecosystem Design',
      'Design Operations',
      'Growth Design',
      'Experimentation & A/B Testing',
      'Digital Transformation',
      'Entrepreneurship & Startups',
      'Domain Expertise (Finance, Healthcare, Retail, etc.)',
      'Metrics & Decision Making',
      'Venture Building',
    ],
  },
  {
    label: 'Leadership, Growth & Influence',
    interests: [
      'Design Leadership',
      'People Management',
      'Coaching & Mentorship',
      'Community Building',
      'Executive Communication',
      'Facilitation & Workshop Design',
      'Stakeholder Management',
      'Organizational Design',
      'Change Management',
      'Thought Leadership',
      'Public Speaking & Personal Branding',
      'Future Foresight & Design Ethics',
    ],
  },
]

const URL_FIELDS = [
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/yourname' },
  { key: 'portfolio', label: 'Portfolio', placeholder: 'yourportfolio.com' },
  { key: 'github', label: 'GitHub', placeholder: 'github.com/yourname' },
  { key: 'behance', label: 'Behance', placeholder: 'behance.net/yourname' },
  { key: 'dribbble', label: 'Dribbble', placeholder: 'dribbble.com/yourname' },
  { key: 'medium', label: 'Medium', placeholder: 'medium.com/@yourname' },
]

type FootprintStep = 'upload' | 'interests'

export function FootprintScreen() {
  const { state, dispatch } = useWingspan()
  const [step, setStep] = useState<FootprintStep>('upload')
  const [dragOver, setDragOver] = useState(false)
  const [showExtraFiles, setShowExtraFiles] = useState(false)
  const [showMoreUrls, setShowMoreUrls] = useState(false)
  const [loading, setLoading] = useState(false)

  const primaryFile = state.files[0]
  const hasPortfolioLink = !!(state.urls['portfolio'] || state.urls['linkedin'])
  const canProceedStep1 = !!primaryFile || hasPortfolioLink
  const canBeginAnalysis = canProceedStep1 && state.interests.length >= 3
  const error = state.error

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
    dispatch({ type: 'SET_FILES', files: replace ? [files[0], ...state.files.slice(1)] : [...state.files, ...files] })
  }

  const handleBeginAnalysis = async () => {
    if (!canBeginAnalysis) return
    setLoading(true)
    try {
      const formData = new FormData()
      for (const file of state.files) formData.append('files', file)
      formData.append('urls', JSON.stringify(state.urls))

      const res = await fetch('/api/extract', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Extraction failed')
      const data = await res.json()

      dispatch({ type: 'SET_EXTRACTED_DATA', data })
      dispatch({ type: 'SET_BLUEPRINT_LOADING', loading: true })
      dispatch({ type: 'SET_PIPELINE_STAGE', stage: 'extract' })
      dispatch({ type: 'SET_SCREEN', screen: 'validating' })

      // Fire and forget — runs while user reviews timeline
      runCareerPipeline(data, state.interests, dispatch)
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: String(err) })
      dispatch({ type: 'SET_SCREEN', screen: 'footprint' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Extraction overlay */}
      <AnimatePresence>
        {loading && <ExtractionOverlay />}
      </AnimatePresence>

      <div className="max-w-2xl w-full flex flex-col gap-8">
        {/* Header */}
        <div>
          <span className="text-xs font-normal tracking-[0.2em] text-[var(--neon)]" style={{ fontFamily: 'var(--font-sora)' }}>
            Wingspan
          </span>
          <div className="flex items-center gap-4 mt-4">
            {(['upload', 'interests'] as FootprintStep[]).map((s, i) => (
              <button
                key={s}
                onClick={() => step === 'interests' && s === 'upload' ? setStep('upload') : undefined}
                className={`flex items-center gap-2 text-xs font-semibold transition-colors ${
                  step === s ? 'text-[var(--neon)]' : step === 'interests' && s === 'upload' ? 'text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-secondary)]' : 'text-[var(--text-dim)]'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                  step === s ? 'bg-[var(--neon)] text-[#0a0a0a] border-[var(--neon)]' :
                  step === 'interests' && s === 'upload' ? 'border-[var(--neon)] text-[var(--neon)]' :
                  'border-[var(--border-ws)] text-[var(--text-dim)]'
                }`}>{i + 1}</span>
                {s === 'upload' ? 'Your Footprint' : 'Your Interests'}
              </button>
            ))}
            <div className="flex-1 h-[1px] bg-[var(--border-ws)]" />
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Upload + Links ── */}
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] leading-tight mb-1" style={{ fontFamily: 'var(--font-sora)' }}>
                  Let's see what you've been building.
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Drop your resume here, or share a link to your portfolio. Both works great.
                </p>
              </div>

              {/* Upload zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                className={`
                  border-[1.5px] border-dashed rounded-[12px] p-8 text-center transition-all
                  ${dragOver ? 'border-[var(--neon)] bg-[var(--neon-surface)]' : 'border-[var(--border-ws)] bg-[var(--surface-dim)]'}
                `}
              >
                {primaryFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-[var(--neon-surface)] border border-[var(--neon-border)] flex items-center justify-center">
                      <Upload size={14} className="text-[var(--neon)]" />
                    </div>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{primaryFile.name}</span>
                    <button
                      onClick={() => dispatch({ type: 'SET_FILES', files: state.files.slice(1) })}
                      className="text-[var(--text-muted)] hover:text-[var(--neon)] transition-colors ml-auto"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[var(--surface)] border border-[var(--border-ws)] flex items-center justify-center">
                      <Upload size={20} className="text-[var(--text-muted)]" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-[var(--neon)] block">Upload Resume</span>
                    <span className="text-xs text-[var(--text-muted)]">PDF · DOCX · XLSX · TXT · Drag & drop</span>
                    </div>
                    <input type="file" accept=".pdf,.docx,.xlsx,.csv,.txt" className="hidden" onChange={(e) => handleFileInput(e, true)} />
                  </label>
                )}
              </div>

              {/* Portfolio URL — primary prompt */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Link2 size={13} className="text-[var(--neon)]" />
                  <span className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">Portfolio or Website</span>
                  <span className="text-[10px] text-[var(--text-dim)]">— helps us understand you better</span>
                </div>
                <input
                  type="url"
                  placeholder="yourportfolio.com or behance.net/yourname"
                  value={state.urls['portfolio'] ?? ''}
                  onChange={(e) => dispatch({ type: 'SET_URL', key: 'portfolio', value: e.target.value })}
                  className="bg-[var(--surface)] border border-[var(--border-ws)] rounded-[8px] px-4 py-3 text-sm text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon)] transition-colors"
                />
              </div>

              {/* More links collapsible */}
              <div>
                <button
                  onClick={() => setShowMoreUrls(!showMoreUrls)}
                  className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {showMoreUrls ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  Add more links (LinkedIn, GitHub, Behance, Dribbble, Medium)
                </button>
                <AnimatePresence>
                  {showMoreUrls && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto' as const, opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {URL_FIELDS.filter(f => f.key !== 'portfolio').map(({ key, label, placeholder }) => (
                          <input
                            key={key}
                            type="url"
                            placeholder={placeholder}
                            value={state.urls[key] ?? ''}
                            onChange={(e) => dispatch({ type: 'SET_URL', key, value: e.target.value })}
                            className="bg-[var(--surface)] border border-[var(--border-ws)] rounded-[8px] px-3 py-2 text-xs text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon)] transition-colors"
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Additional files */}
              <div>
                <button
                  onClick={() => setShowExtraFiles(!showExtraFiles)}
                  className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {showExtraFiles ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  Got case studies or project files? Add those too.
                </button>
                {showExtraFiles && (
                  <motion.label
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 flex items-center gap-2 text-xs text-[var(--neon)] cursor-pointer"
                  >
                    <Upload size={12} />
                    Choose additional files
                    <input type="file" multiple accept=".pdf,.docx,.xlsx,.csv,.txt,.pptx" className="hidden" onChange={(e) => handleFileInput(e, false)} />
                  </motion.label>
                )}
                {state.files.slice(1).map(f => (
                  <p key={f.name} className="text-xs text-[var(--text-muted)] mt-1">{f.name}</p>
                ))}
              </div>

              {/* CTA */}
              <NeonButton
                onClick={() => setStep('interests')}
                disabled={!canProceedStep1}
                fullWidth
              >
                Continue <ArrowRight size={14} />
              </NeonButton>

              {!canProceedStep1 && (
                <p className="text-[11px] text-center text-[var(--text-dim)]">Drop a resume or add a link to keep going.</p>
              )}
            </motion.div>
          )}

          {/* ── STEP 2: Interests ── */}
          {step === 'interests' && (
            <motion.div
              key="interests"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4"
            >
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] leading-tight mb-1" style={{ fontFamily: 'var(--font-sora)' }}>
                  What lights you up?
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Pick 3 to 5. These shape what your Blueprint focuses on.
                </p>
              </div>

              {/* Interest categories — scrollable */}
              <div className="flex flex-col gap-4 max-h-[45vh] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                {INTEREST_CATEGORIES.map(({ label, interests }) => {
                  const selectedInCategory = interests.filter(i => state.interests.includes(i)).length
                  return (
                    <div key={label} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold tracking-[2px] uppercase text-[var(--text-muted)]">
                          {label}
                        </span>
                        {selectedInCategory > 0 && (
                          <span className="text-[10px] font-semibold text-[var(--neon)]">
                            {selectedInCategory} selected
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {interests.map((interest) => {
                          const selected = state.interests.includes(interest)
                          const atMax = state.interests.length >= 5 && !selected
                          return (
                            <motion.button
                              key={interest}
                              whileTap={{ scale: 0.97 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                              onClick={() => {
                                if (atMax) return
                                dispatch({ type: 'TOGGLE_INTEREST', interest })
                              }}
                              disabled={atMax}
                              className={`
                                px-3 py-1.5 rounded-full border text-xs font-semibold transition-all
                                ${selected
                                  ? 'bg-[var(--neon-surface)] border-[var(--neon)] text-[var(--neon)]'
                                  : atMax
                                  ? 'bg-transparent border-[var(--border-ws)] text-[var(--text-dim)] opacity-40 cursor-not-allowed'
                                  : 'bg-transparent border-[var(--border-ws)] text-[var(--text-secondary)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                }
                              `}
                            >
                              {selected && <span className="mr-1">✓</span>}
                              {interest}
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Progress indicator */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-[var(--text-muted)]">
                  {state.interests.length === 0 && 'Pick at least 3 to keep going'}
                  {state.interests.length >= 1 && state.interests.length < 3 && `${3 - state.interests.length} more and we're good`}
                  {state.interests.length >= 3 && state.interests.length < 5 && `Nice. You can add ${5 - state.interests.length} more.`}
                  {state.interests.length === 5 && "That's five. That's enough."}
                </span>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => (
                    <div key={n} className={`w-5 h-1 rounded-full transition-all ${n <= state.interests.length ? 'bg-[var(--neon)]' : 'bg-[var(--border-ws)]'}`} />
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-[10px] bg-red-950/40 border border-red-800/50 p-3">
                  <p className="text-xs text-red-400 leading-relaxed">Analysis failed: {error}. Please try again.</p>
                </div>
              )}

              {/* Sticky CTA — always visible */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('upload')}
                  className="px-5 py-2.5 rounded-[10px] border border-[var(--border-ws)] text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  ← Back
                </button>
                <NeonButton
                  onClick={handleBeginAnalysis}
                  disabled={!canBeginAnalysis || loading}
                  fullWidth
                >
                  {loading ? "We're on it..." : 'Build My Blueprint →'}
                </NeonButton>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
