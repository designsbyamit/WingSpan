// components/screens/BlueprintScreen.tsx
'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Lock, LogOut, Menu, X } from 'lucide-react'
import { useWingspan } from '@/context/WingspanContext'
import { StepErrorBoundary } from '@/components/ui/StepErrorBoundary'
import { ProfileMap } from '@/components/blueprint/ProfileMap'
import { CareerIntelligence } from '@/components/blueprint/CareerIntelligence'
import { PathSelection } from '@/components/blueprint/PathSelection'
import { GapAnalysis } from '@/components/blueprint/GapAnalysis'
import { GrowthRoadmap } from '@/components/blueprint/GrowthRoadmap'
import { Resources } from '@/components/blueprint/Resources'
import { AuthModal } from '@/components/blueprint/AuthModal'
import { DeepAnalysisDialog } from '@/components/blueprint/DeepAnalysisPanel'
import { SaveVersionDialog, VersionsDialog, useBlueprintVersions } from '@/components/blueprint/BlueprintVersions'
import { SideNav, Avatar } from '@/components/blueprint/shell/SideNav'
import { Dialog, useModalBehaviour } from '@/components/blueprint/shell/Dialog'
import { FlowFooter } from '@/components/onboarding/FlowFooter'
import { cx, primaryButton, quietButton } from '@/components/onboarding/ui'
import { PreferencesDialog, useThemePreference } from '@/components/blueprint/shell/PreferencesDialog'
import { ShellContext, type ShellActions } from '@/components/blueprint/shell/ShellContext'
import { SECTIONS, sectionIndex } from '@/components/blueprint/shell/sections'
import { FOCUS_RING, SecondaryButton } from '@/components/blueprint/shell/ui'
import { useAuth, notifyAuthChanged } from '@/lib/use-auth'
import { OPEN_SAVE_VERSION } from '@/lib/blueprint-events'
import { exportToNotionMarkdown, downloadMarkdown } from '@/lib/export'
import { Blueprint, BlueprintStep, ExtractedCareerData } from '@/types/wingspan'

function StepContent({ step, blueprint, extractedData }: {
  step: BlueprintStep
  blueprint: Blueprint
  extractedData: ExtractedCareerData | null
}) {
  switch (step) {
    case 'profile':        return <ProfileMap blueprint={blueprint} extractedData={extractedData ?? undefined} />
    case 'intelligence':   return <CareerIntelligence blueprint={blueprint} />
    case 'path-selection': return <PathSelection blueprint={blueprint} />
    case 'gap-analysis':   return <GapAnalysis blueprint={blueprint} />
    case 'roadmap':        return <GrowthRoadmap blueprint={blueprint} />
    case 'resources':      return <Resources blueprint={blueprint} />
    default:               return null
  }
}

type Modal = null | 'save' | 'versions' | 'preferences' | 'account' | 'deep'
type Pending = null | 'save' | 'export'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function BlueprintScreen() {
  const { state } = useWingspan()
  const { blueprint, selectedPath, extractedData } = state
  const [currentStep, setCurrentStep] = useState<BlueprintStep>('profile')
  const [visited, setVisited] = useState<BlueprintStep[]>([])
  const [nudgeVisible, setNudgeVisible] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modal, setModal] = useState<Modal>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [pending, setPending] = useState<Pending>(null)
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState('')
  const nudgeTimer = useRef<number | undefined>(undefined)
  const toastTimer = useRef<number | undefined>(undefined)
  const firstRender = useRef(true)

  const { user, loading: authLoading } = useAuth()
  const signedIn = !!user
  const versions = useBlueprintVersions(signedIn)
  const { theme, setTheme } = useThemePreference()

  const isLocked = useCallback(
    (step: BlueprintStep) => !selectedPath && !!SECTIONS[sectionIndex(step)]?.needsPath,
    [selectedPath],
  )

  const completedSteps = useMemo<BlueprintStep[]>(() => {
    const done = new Set(visited)
    if (selectedPath) done.add('path-selection')
    return [...done]
  }, [visited, selectedPath])

  const flash = useCallback((msg: string) => {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 3000)
  }, [])

  // ── Section navigation ────────────────────────────────────────────────
  const showNudge = useCallback(() => {
    setNudgeVisible(true)
    window.clearTimeout(nudgeTimer.current)
    nudgeTimer.current = window.setTimeout(() => setNudgeVisible(false), 6000)
  }, [])

  const goTo = useCallback((step: BlueprintStep) => {
    setDrawerOpen(false)
    if (isLocked(step)) { showNudge(); return }
    setNudgeVisible(false)
    if (step === currentStep) return
    setVisited(prev => prev.includes(currentStep) ? prev : [...prev, currentStep])
    setCurrentStep(step)
  }, [currentStep, isLocked, showNudge])

  // Scroll to top and move focus to the new section's title on every section change.
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    const id = window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('[data-section-title]')?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(id)
  }, [currentStep])

  useEffect(() => () => { window.clearTimeout(nudgeTimer.current); window.clearTimeout(toastTimer.current) }, [])

  // ── Utilities ─────────────────────────────────────────────────────────
  const doExport = useCallback(() => {
    if (!blueprint) return
    setExporting(true)
    const md = exportToNotionMarkdown(blueprint, selectedPath)
    downloadMarkdown(md, `wingspan-blueprint-${new Date().toISOString().split('T')[0]}.md`)
    window.setTimeout(() => { setExporting(false); flash('Blueprint exported') }, 800)
  }, [blueprint, selectedPath, flash])

  const openSave = useCallback(() => {
    setDrawerOpen(false)
    if (!signedIn) { setPending('save'); setShowAuth(true); return }
    versions.setError('')
    setModal('save')
  }, [signedIn, versions])

  const exportMarkdown = useCallback(() => {
    setDrawerOpen(false)
    if (signedIn) { doExport(); return }
    setPending('export'); setShowAuth(true)
  }, [signedIn, doExport])

  const openSignIn = useCallback(() => {
    setDrawerOpen(false); setPending(null); setShowAuth(true)
  }, [])

  const signOut = useCallback(async () => {
    setModal(null); setDrawerOpen(false)
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null)
    notifyAuthChanged()
    flash('Signed out')
  }, [flash])

  // Other surfaces (older code paths) can still ask for the save flow by event.
  useEffect(() => {
    window.addEventListener(OPEN_SAVE_VERSION, openSave)
    return () => window.removeEventListener(OPEN_SAVE_VERSION, openSave)
  }, [openSave])

  // After sign-in, continue to whatever the guest was trying to do.
  const onAuthSuccess = () => {
    setShowAuth(false)
    if (pending === 'save') { versions.setError(''); setModal('save') }
    if (pending === 'export') doExport()
    setPending(null)
  }

  const hasDeep = !!blueprint?.deepAnalysis && Array.isArray(blueprint.deepAnalysis.agents)
  const openDeepAnalysis = useMemo(
    () => (hasDeep ? () => { setDrawerOpen(false); setModal('deep') } : null),
    [hasDeep],
  )

  const shell = useMemo<ShellActions>(() => ({
    goTo, openSave, openVersions: () => setModal('versions'), exportMarkdown, exporting,
    openDeepAnalysis, openSignIn, signedIn, authLoading,
  }), [goTo, openSave, exportMarkdown, exporting, openDeepAnalysis, openSignIn, signedIn, authLoading])

  if (!blueprint) return null

  const idx = sectionIndex(currentStep)
  const prev = SECTIONS[idx - 1]
  const next = SECTIONS[idx + 1]
  const nextLocked = !!next && isLocked(next.id)
  const current = SECTIONS[idx]

  const navProps = {
    currentStep, completedSteps, isLocked, onStepClick: goTo, selectedPath,
    user: user ?? null, authLoading, versionCount: versions.versions.length, exporting,
    onSave: openSave,
    onVersions: () => { setDrawerOpen(false); versions.setError(''); setModal('versions') },
    onDeepAnalysis: openDeepAnalysis,
    onExport: exportMarkdown,
    onPreferences: () => { setDrawerOpen(false); setModal('preferences') },
    onSignIn: openSignIn,
    onAccount: () => setModal('account'),
    onSignOut: signOut,
  }

  return (
    <MotionConfig reducedMotion="user">
      <ShellContext.Provider value={shell}>
        <div className="min-h-screen [--ws-ink:#b6ff2e] [.light_&]:[--ws-ink:#3f6a00]">

          {/* Desktop sidebar (lg+) and tablet icon rail (md) */}
          <aside className="hidden md:block fixed inset-y-0 left-0 z-30 w-[72px] lg:w-[264px] border-r border-[var(--border-ws)] bg-[var(--surface)]">
            <div className="hidden lg:block h-full"><SideNav variant="full" {...navProps} /></div>
            <div className="lg:hidden h-full"><SideNav variant="rail" {...navProps} /></div>
          </aside>

          {/* Phone top bar */}
          <header className="md:hidden sticky top-0 z-30 h-14 flex items-center gap-3 px-4 border-b border-[var(--border-ws)] bg-[var(--bg)]/95 backdrop-blur">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              aria-expanded={drawerOpen}
              aria-controls="blueprint-drawer"
              className={`-ml-2 w-10 h-10 rounded-[10px] inline-flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--surface-dim)] ${FOCUS_RING}`}
            >
              <Menu size={20} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/WingSpanLogo_Symbol.svg" alt="" width={24} height={24} className="w-6 h-6" />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-[var(--text-primary)] truncate leading-tight" style={{ fontFamily: 'var(--font-sora)' }}>
                {current.label}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] leading-tight">Step {idx + 1} of {SECTIONS.length}</p>
            </div>
          </header>

          <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
            <SideNav variant="full" {...navProps} />
          </MobileDrawer>

          {/* Main column */}
          <main className="md:pl-[72px] lg:pl-[264px]">
            <div className="max-w-[920px] px-4 sm:px-6 lg:px-10 pt-8 pb-48 sm:pb-40 lg:pt-12">

              <AnimatePresence>
                {nudgeVisible && (
                  <motion.div
                    role="status"
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className="mb-8 rounded-[12px] border border-[var(--neon-border)] bg-[var(--neon-surface)] p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <Lock size={16} className="shrink-0 text-[var(--ws-ink)]" aria-hidden />
                    <p className="flex-1 text-[13px] text-[var(--text-primary)] leading-relaxed">
                      Choose a path first. Gap Analysis, Roadmap and Resources are tailored to the path you pick.
                    </p>
                    {currentStep !== 'path-selection' && (
                      <SecondaryButton onClick={() => goTo('path-selection')} className="h-9 shrink-0">Go to Future Paths</SecondaryButton>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <StepErrorBoundary key={currentStep} label={currentStep}>
                  <StepContent step={currentStep} blueprint={blueprint} extractedData={extractedData} />
                </StepErrorBoundary>
              </motion.div>

            </div>
          </main>

          {/* Same sticky footer as the rest of the journey, carrying Previous / Next */}
          <FlowFooter
            inset="left-0 md:left-[72px] lg:left-[264px]"
            progress={Math.round(((idx + 1) / SECTIONS.length) * 100)}
            message={<>Step {idx + 1} of {SECTIONS.length} · {current.label}</>}
            hint={nextLocked ? 'Choose a path in Future Paths to unlock the next steps.' : next ? `Next: ${next.label}` : 'You have reached the last step.'}
            actions={<>
              {prev && (
                <button type="button" onClick={() => goTo(prev.id)} className={quietButton}>
                  <ArrowLeft size={15} aria-hidden /> <span className="hidden sm:inline">{prev.label}</span><span className="sm:hidden">Back</span>
                </button>
              )}
              {next && (nextLocked ? (
                <button type="button" onClick={showNudge} aria-disabled="true" className={cx(quietButton, 'cursor-not-allowed text-[var(--text-muted)]')}>
                  <Lock size={14} aria-hidden /> Choose a path to continue
                </button>
              ) : (
                <button type="button" onClick={() => goTo(next.id)} className={primaryButton}>
                  {next.label} <ArrowRight size={15} aria-hidden />
                </button>
              ))}
            </>}
          />

          {/* Dialogs */}
          <SaveVersionDialog
            open={modal === 'save'}
            onClose={() => setModal(null)}
            api={versions}
            onSaved={() => { setModal(null); flash('Version saved') }}
          />
          <VersionsDialog
            open={modal === 'versions'}
            onClose={() => setModal(null)}
            api={versions}
            onOpened={() => { setModal(null); flash('Version opened') }}
            onSaveNew={() => { versions.setError(''); setModal('save') }}
          />
          <PreferencesDialog open={modal === 'preferences'} onClose={() => setModal(null)} theme={theme} setTheme={setTheme} />
          <Dialog open={modal === 'account' && !!user} onClose={() => setModal(null)} title="Account">
            {user && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <Avatar email={user.email} />
                  <p className="text-[14px] text-[var(--text-primary)] truncate">{user.email}</p>
                </div>
                <SecondaryButton onClick={signOut} className="self-start"><LogOut size={14} />Sign out</SecondaryButton>
              </div>
            )}
          </Dialog>
          <DeepAnalysisDialog analysis={blueprint.deepAnalysis} open={modal === 'deep'} onClose={() => setModal(null)} />

          <AnimatePresence>
            {showAuth && (
              <AuthModal
                onClose={() => { setShowAuth(false); setPending(null) }}
                onSuccess={onAuthSuccess}
              />
            )}
          </AnimatePresence>

          {/* Confirmation toast */}
          <div aria-live="polite" className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-[80] pointer-events-none">
            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  className="rounded-full border border-[var(--border-ws)] bg-[var(--surface)] px-4 h-10 inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--text-primary)] shadow-xl"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--neon)]" aria-hidden />
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </ShellContext.Provider>
    </MotionConfig>
  )
}

function MobileDrawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useModalBehaviour(open, onClose, ref)
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="md:hidden fixed inset-0 z-[60] bg-black/60"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            ref={ref}
            id="blueprint-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Blueprint navigation"
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative h-full w-[300px] max-w-[86vw] bg-[var(--surface)] border-r border-[var(--border-ws)] shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className={`absolute right-3 top-5 z-10 w-9 h-9 rounded-full inline-flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-dim)] ${FOCUS_RING}`}
            >
              <X size={18} />
            </button>
            <div className="h-full overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
