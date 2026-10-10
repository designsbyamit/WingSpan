'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, MotionConfig } from 'framer-motion'
import { ArrowRight, ChevronDown, ChevronUp, Link2, Upload } from 'lucide-react'
import { useWingspan } from '@/context/WingspanContext'
import { cancelCareerPipeline, runCareerPipeline } from '@/lib/pipeline'
import { MIN_INTERESTS, MAX_INTERESTS } from '@/lib/interests'
import type { ExtractedCareerData } from '@/types/wingspan'
import { ResumeDrop } from '@/components/onboarding/ResumeDrop'
import { FocusTabs, SelectedFocus, focusHelper } from '@/components/onboarding/InterestPicker'
import { FlowFooter, FOOTER_SPACE } from '@/components/onboarding/FlowFooter'
import { CancelFlowButton } from '@/components/onboarding/CancelFlow'
import { ReadingProgress } from '@/components/onboarding/ReadingProgress'
import { useResumeExtraction } from '@/components/onboarding/useResumeExtraction'
import { cx, focusRing, primaryButton, quietButton } from '@/components/onboarding/ui'

/**
 * Phase 2: portfolio / website URL, extra profile links and additional files.
 * Hidden for now so step 1 is resume-only; the inputs and their state handling stay below.
 */
const ENABLE_LINK_INPUTS = false

const URL_FIELDS = [
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/yourname' },
  { key: 'portfolio', label: 'Portfolio', placeholder: 'yourportfolio.com' },
  { key: 'github', label: 'GitHub', placeholder: 'github.com/yourname' },
  { key: 'behance', label: 'Behance', placeholder: 'behance.net/yourname' },
  { key: 'dribbble', label: 'Dribbble', placeholder: 'dribbble.com/yourname' },
  { key: 'medium', label: 'Medium', placeholder: 'medium.com/@yourname' },
]

type FootprintStep = 'upload' | 'interests'

const STEPS: { id: FootprintStep; label: string }[] = [
  { id: 'upload', label: 'Resume' },
  { id: 'interests', label: 'Focus areas' },
]

// ── Phase 2 link inputs (rendered only when ENABLE_LINK_INPUTS) ─────────────

function LinkInputs() {
  const { state, dispatch } = useWingspan()
  const [showMoreUrls, setShowMoreUrls] = useState(false)
  const [showExtraFiles, setShowExtraFiles] = useState(false)
  const inputClass = cx(
    'rounded-[8px] border border-[var(--border-ws)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-secondary)]',
    'placeholder:text-[var(--text-muted)] focus:border-[var(--neon)] focus:outline-none transition-colors',
  )
  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-[var(--text-secondary)]">
          <Link2 size={13} className="text-[var(--neon)]" aria-hidden /> Portfolio or website
        </span>
        <input
          type="url"
          placeholder="yourportfolio.com or behance.net/yourname"
          value={state.urls['portfolio'] ?? ''}
          onChange={(e) => dispatch({ type: 'SET_URL', key: 'portfolio', value: e.target.value })}
          className={inputClass}
        />
      </label>
      <div>
        <button type="button" aria-expanded={showMoreUrls} onClick={() => setShowMoreUrls(!showMoreUrls)}
          className={cx('flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]', focusRing)}>
          {showMoreUrls ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          Add more links (LinkedIn, GitHub, Behance, Dribbble, Medium)
        </button>
        {showMoreUrls && (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {URL_FIELDS.filter((f) => f.key !== 'portfolio').map(({ key, label, placeholder }) => (
              <input key={key} type="url" aria-label={label} placeholder={placeholder}
                value={state.urls[key] ?? ''}
                onChange={(e) => dispatch({ type: 'SET_URL', key, value: e.target.value })}
                className={cx(inputClass, 'px-3 py-2 text-xs')} />
            ))}
          </div>
        )}
      </div>
      <div>
        <button type="button" aria-expanded={showExtraFiles} onClick={() => setShowExtraFiles(!showExtraFiles)}
          className={cx('flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]', focusRing)}>
          {showExtraFiles ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          Got case studies or project files? Add those too.
        </button>
        {showExtraFiles && (
          <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-[var(--neon)]">
            <Upload size={12} aria-hidden /> Choose additional files
            <input type="file" multiple accept=".pdf,.docx,.xlsx,.xls,.csv,.txt" className="sr-only"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? [])
                if (files.length) dispatch({ type: 'SET_FILES', files: [...state.files, ...files] })
              }} />
          </label>
        )}
        {state.files.slice(1).map((f) => (
          <p key={f.name} className="mt-1 text-xs text-[var(--text-muted)]">{f.name}</p>
        ))}
      </div>
    </div>
  )
}

// ── Step rail ───────────────────────────────────────────────────────────────

function StepRail({ step, onGoTo }: { step: FootprintStep; onGoTo: (s: FootprintStep) => void }) {
  const current = STEPS.findIndex((s) => s.id === step)
  return (
    <nav aria-label="Onboarding steps">
      <ol className="flex gap-3">
        {STEPS.map((s, i) => {
          const isCurrent = i === current
          const isPast = i < current
          const content = (
            <>
              <span className={cx('block h-[3px] w-full rounded-full transition-colors',
                isCurrent || isPast ? 'bg-[var(--neon)]' : 'bg-[var(--border-ws)]')} aria-hidden />
              <span className={cx('mt-2 block text-xs',
                isCurrent ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-muted)]')}>
                <span className="text-[var(--text-dim)]">Step {i + 1} </span>{s.label}
              </span>
            </>
          )
          return (
            <li key={s.id} className="flex-1">
              {isPast ? (
                <button type="button" onClick={() => onGoTo(s.id)} className={cx('block w-full rounded-[4px] text-left hover:opacity-80', focusRing)}>
                  {content}
                </button>
              ) : (
                <div aria-current={isCurrent ? 'step' : undefined}>{content}</div>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// ── Screen ──────────────────────────────────────────────────────────────────

export function FootprintScreen() {
  const { state, dispatch } = useWingspan()
  const [step, setStep] = useState<FootprintStep>('upload')
  const [waiting, setWaiting] = useState(false)
  const extraction = useResumeExtraction()
  const launched = useRef(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const primaryFile = state.files[0]
  const hasPortfolioLink = ENABLE_LINK_INPUTS && !!state.urls['portfolio']?.trim()
  const canContinue = !!primaryFile || hasPortfolioLink
  const enoughInterests = state.interests.length >= MIN_INTERESTS
  const extractionFailed = extraction.status === 'error'

  // After a step change, move focus to the new heading so keyboard and screen-reader users land in context.
  const focusHeading = () => requestAnimationFrame(() => headingRef.current?.focus())

  const goTo = (s: FootprintStep) => { setWaiting(false); setStep(s) }

  const handleContinue = () => {
    if (!canContinue) return
    extraction.start(state.files, ENABLE_LINK_INPUTS ? state.urls : {})
    setStep('interests')
  }

  const launch = useCallback((data: ExtractedCareerData) => {
    if (launched.current) return
    launched.current = true
    const interests = [...state.interests]
    dispatch({ type: 'SET_SCREEN', screen: 'validating' })
    void runCareerPipeline(data, interests, dispatch)
  }, [dispatch, state.interests])

  const handleBuild = () => {
    if (!enoughInterests || extractionFailed) return
    if (extraction.status === 'done' && extraction.data) launch(extraction.data)
    else setWaiting(true)
  }

  // The person already asked for the Blueprint: carry on as soon as the resume is read.
  useEffect(() => {
    if (waiting && extraction.status === 'done' && extraction.data) launch(extraction.data)
  }, [waiting, extraction.status, extraction.data, launch])

  // If reading fails while waiting, fall back to the interests step where the error and retry live.
  const showWaiting = waiting && extraction.status !== 'error'
  const retryExtraction = () => { setWaiting(false); extraction.retry() }

  const transition = { duration: 0.22, ease: [0.2, 0, 0, 1] as const }

  const startOver = () => {
    cancelCareerPipeline()
    extraction.cancel()
    launched.current = false
    setWaiting(false)
    dispatch({ type: 'RESET_FLOW' })
    setStep('upload')
  }
  const cancelButton = (
    <CancelFlowButton
      onConfirm={startOver}
      body="This stops reading your resume and takes you back to the start, where you can upload a different one."
    />
  )

  const n = state.interests.length

  return (
    <MotionConfig reducedMotion="user">
      <main className={cx('flex min-h-screen justify-center px-4 pt-24 sm:px-6 sm:pt-28', FOOTER_SPACE)}>
        <div className="flex w-full max-w-2xl flex-col gap-8">
          {!showWaiting && <StepRail step={step} onGoTo={goTo} />}

          <AnimatePresence mode="wait" initial={false} onExitComplete={focusHeading}>
            {showWaiting ? (
              <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition}>
                <h1 ref={headingRef} tabIndex={-1} className="sr-only">Preparing your analysis</h1>
                <ReadingProgress
                  fileName={primaryFile?.name}
                  interests={state.interests}
                  startedAt={extraction.startedAt}
                />
              </motion.div>
            ) : step === 'upload' ? (
              <motion.div key="upload" className="flex flex-col gap-7"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={transition}>
                <div>
                  <h1 ref={headingRef} tabIndex={-1}
                    className="text-2xl font-semibold leading-tight text-[var(--text-primary)] outline-none sm:text-[28px]"
                    style={{ fontFamily: 'var(--font-sora)' }}>
                    Start with your resume
                  </h1>
                  <p className="mt-2 max-w-[56ch] text-[15px] leading-relaxed text-[var(--text-secondary)]">
                    We read your roles, projects and skills to build your Blueprint. The more detail it has, the sharper the result.
                  </p>
                </div>

                <ResumeDrop
                  file={primaryFile}
                  onFile={(f) => dispatch({ type: 'SET_FILES', files: [f, ...state.files.slice(1)] })}
                  onRemove={() => dispatch({ type: 'SET_FILES', files: state.files.slice(1) })}
                />

                {ENABLE_LINK_INPUTS && <LinkInputs />}
              </motion.div>
            ) : (
              <motion.div key="interests" className="flex flex-col gap-7"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={transition}>
                <div>
                  <h1 ref={headingRef} tabIndex={-1}
                    className="text-2xl font-semibold leading-tight text-[var(--text-primary)] outline-none sm:text-[28px]"
                    style={{ fontFamily: 'var(--font-sora)' }}>
                    Choose where you want to grow
                  </h1>
                  <p className="mt-2 max-w-[56ch] text-[15px] leading-relaxed text-[var(--text-secondary)]">
                    Pick {MIN_INTERESTS} to {MAX_INTERESTS} focus areas. Your Blueprint weighs its directions and learning toward them.
                  </p>
                </div>

                <FocusTabs
                  status={extraction.status}
                  data={extraction.status === 'done' ? extraction.data : null}
                  error={extraction.error}
                  onRetry={retryExtraction}
                  onReupload={() => goTo('upload')}
                />
                <SelectedFocus />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {showWaiting ? (
        <FlowFooter
          progress="sweep"
          message="Finishing reading your resume"
          hint="Your analysis starts the moment this is done. It usually takes under a minute."
          actions={<>
            <button type="button" onClick={() => setWaiting(false)} className={quietButton}>Change focus areas</button>
            {cancelButton}
          </>}
        />
      ) : step === 'upload' ? (
        <FlowFooter
          message={canContinue ? 'Reading starts when you continue.' : 'Add your resume to continue.'}
          hint={primaryFile ? primaryFile.name : 'PDF or Word document, up to a few pages.'}
          actions={
            <button type="button" onClick={handleContinue} disabled={!canContinue} className={primaryButton}>
              Continue <ArrowRight size={15} aria-hidden />
            </button>
          }
        />
      ) : (
        <FlowFooter
          progress={extraction.status === 'reading' ? 'sweep' : undefined}
          tone={extractionFailed ? 'error' : 'default'}
          role="status"
          message={`${n} of ${MAX_INTERESTS} focus areas chosen`}
          hint={
            extractionFailed ? 'We could not read your resume. Try again or upload a different file.'
            : extraction.status === 'reading' ? `${focusHelper(n)} Reading your resume in the background…`
            : focusHelper(n)
          }
          actions={<>
            <button type="button" onClick={() => goTo('upload')} className={quietButton}>Back</button>
            {cancelButton}
            <button type="button" onClick={handleBuild} disabled={!enoughInterests || extractionFailed} className={primaryButton}>
              Build my Blueprint
            </button>
          </>}
        />
      )}
    </MotionConfig>
  )
}
