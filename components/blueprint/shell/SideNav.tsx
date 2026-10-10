'use client'
import type { ReactNode } from 'react'
import { Bookmark, Download, History, LogIn, LogOut, ScanSearch, SlidersHorizontal, Loader2, type LucideIcon } from 'lucide-react'
import type { BlueprintStep } from '@/types/wingspan'
import { StepNav } from '@/components/ui/StepNav'
import { FOCUS_RING } from './ui'

export interface SideNavProps {
  variant: 'full' | 'rail'
  currentStep: BlueprintStep
  completedSteps: BlueprintStep[]
  isLocked: (s: BlueprintStep) => boolean
  onStepClick: (s: BlueprintStep) => void
  selectedPath: string | null
  user: { email: string } | null
  authLoading: boolean
  versionCount: number
  exporting: boolean
  onSave: () => void
  onVersions: () => void
  onDeepAnalysis: (() => void) | null
  onExport: () => void
  onPreferences: () => void
  onSignIn: () => void
  onAccount: () => void
  onSignOut: () => void
}

function Brand({ rail }: { rail: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${rail ? 'justify-center' : ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/WingSpanLogo_Symbol.svg" alt={rail ? 'WingSpan' : ''} width={32} height={32} className="w-8 h-8 shrink-0" />
      {!rail && (
        <div className="min-w-0">
          <p className="text-[16px] font-semibold leading-tight text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>WingSpan</p>
          <p className="text-[12px] leading-tight text-[var(--text-muted)] mt-0.5">Future Self Blueprint</p>
        </div>
      )}
    </div>
  )
}

function UtilityButton({ icon: Icon, label, onClick, rail, trailing, busy }: {
  icon: LucideIcon
  label: string
  onClick: () => void
  rail: boolean
  trailing?: ReactNode
  busy?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rail ? label : undefined}
      className={`group relative w-full flex items-center gap-3 h-10 rounded-[10px] text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-dim)] transition-colors ${FOCUS_RING} focus-visible:ring-offset-0 ${
        rail ? 'justify-center' : 'px-3'
      }`}
    >
      {busy ? <Loader2 size={16} className="shrink-0 animate-spin" aria-hidden /> : <Icon size={16} className="shrink-0" aria-hidden />}
      {!rail && <span className="flex-1 text-left truncate">{label}</span>}
      {!rail && trailing}
      {rail && (
        <span aria-hidden className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-[8px] border border-[var(--border-ws)] bg-[var(--surface)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--text-primary)] shadow-lg opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
          {label}
        </span>
      )}
    </button>
  )
}

export function SideNav(p: SideNavProps) {
  const rail = p.variant === 'rail'
  const signedIn = !!p.user

  return (
    <div className="h-full flex flex-col">
      <div className={rail ? 'px-2 pt-5 pb-5' : 'px-5 pt-6 pb-6'}>
        <Brand rail={rail} />
      </div>

      <nav aria-label="Blueprint sections" className={`flex-1 min-h-0 ${rail ? 'px-2' : 'px-3 overflow-y-auto'}`}>
        <StepNav
          variant={p.variant}
          currentStep={p.currentStep}
          completedSteps={p.completedSteps}
          isLocked={p.isLocked}
          onStepClick={p.onStepClick}
          selectedPath={p.selectedPath}
        />
      </nav>

      {/* Guest nudge to keep the Blueprint */}
      {!rail && !p.authLoading && !signedIn && (
        <div className="mx-3 mb-3 rounded-[12px] border border-[var(--neon-border)] bg-[var(--neon-surface)] p-4">
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">Save your Blueprint</p>
          <p className="text-[12px] text-[var(--text-secondary)] mt-1 leading-snug">Create a free account to keep it and pick up where you left off.</p>
          <button
            type="button"
            onClick={p.onSave}
            className={`mt-3 w-full h-9 rounded-[8px] bg-[var(--neon)] text-[#0a0a0a] text-[13px] font-bold hover:opacity-90 ${FOCUS_RING}`}
          >
            Create account
          </button>
        </div>
      )}

      <div role="group" aria-label="Blueprint tools" className={`border-t border-[var(--border-ws)] py-3 flex flex-col gap-0.5 ${rail ? 'px-2' : 'px-3'}`}>
        <UtilityButton rail={rail} icon={Bookmark} label="Save version" onClick={p.onSave} />
        {signedIn && (
          <UtilityButton
            rail={rail}
            icon={History}
            label="Versions"
            onClick={p.onVersions}
            trailing={p.versionCount > 0 ? <span className="text-[12px] tabular-nums text-[var(--text-muted)]">{p.versionCount}</span> : undefined}
          />
        )}
        {p.onDeepAnalysis && <UtilityButton rail={rail} icon={ScanSearch} label="Deep analysis" onClick={p.onDeepAnalysis} />}
        <UtilityButton
          rail={rail}
          icon={Download}
          label="Export to Notion"
          onClick={p.onExport}
          busy={p.exporting}
          trailing={!signedIn ? <span className="text-[11px] text-[var(--text-muted)]">Sign in</span> : undefined}
        />
        <UtilityButton rail={rail} icon={SlidersHorizontal} label="Preferences" onClick={p.onPreferences} />
      </div>

      {/* Account */}
      <div className={`border-t border-[var(--border-ws)] py-3 ${rail ? 'px-2' : 'px-3'}`}>
        {p.authLoading ? (
          <div className={`h-10 flex items-center ${rail ? 'justify-center' : 'px-3'}`}>
            <span className="w-7 h-7 rounded-full bg-[var(--surface-dim)] animate-pulse" aria-hidden />
            <span className="sr-only">Checking your account</span>
          </div>
        ) : signedIn ? (
          rail ? (
            <button
              type="button"
              onClick={p.onAccount}
              aria-label={`Account: ${p.user!.email}`}
              className={`w-full h-10 flex items-center justify-center rounded-[10px] hover:bg-[var(--surface-dim)] ${FOCUS_RING}`}
            >
              <Avatar email={p.user!.email} />
            </button>
          ) : (
            <div className="flex items-center gap-3 px-3 h-10">
              <Avatar email={p.user!.email} />
              <span className="flex-1 min-w-0 text-[13px] text-[var(--text-secondary)] truncate" title={p.user!.email}>{p.user!.email}</span>
              <button
                type="button"
                onClick={p.onSignOut}
                aria-label="Sign out"
                title="Sign out"
                className={`shrink-0 w-8 h-8 rounded-[8px] inline-flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-dim)] ${FOCUS_RING}`}
              >
                <LogOut size={15} aria-hidden />
              </button>
            </div>
          )
        ) : (
          <UtilityButton rail={rail} icon={LogIn} label="Sign in" onClick={p.onSignIn} />
        )}
      </div>
    </div>
  )
}

export function Avatar({ email }: { email: string }) {
  return (
    <span aria-hidden className="shrink-0 w-7 h-7 rounded-full bg-[var(--neon-surface)] border border-[var(--neon-border)] text-[var(--ws-ink)] text-[12px] font-bold inline-flex items-center justify-center uppercase">
      {email.charAt(0)}
    </span>
  )
}
