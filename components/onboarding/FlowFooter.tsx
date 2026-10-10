'use client'
// One sticky footer for the whole journey: upload, focus areas, reading, processed data and the Blueprint.
// Structure never changes: [status / instruction] on the left, [actions] on the right, optional
// progress line along the top edge. Screens only change what goes inside.
import type { ReactNode } from 'react'
import { cx } from './ui'

export function FlowFooter({
  message, hint, actions, progress, tone = 'default', inset, role,
}: {
  message?: ReactNode
  hint?: ReactNode
  actions?: ReactNode
  /** 0-100 for a filling line, 'sweep' for an indeterminate one, undefined for none. */
  progress?: number | 'sweep'
  tone?: 'default' | 'error' | 'ready'
  /** Left offset classes when a side navigation occupies the left edge (e.g. the Blueprint). */
  inset?: string
  role?: 'status' | 'alert'
}) {
  return (
    <footer
      className={cx(
        'fixed bottom-0 right-0 z-40 border-t backdrop-blur-md',
        'bg-[color-mix(in_srgb,var(--bg)_90%,transparent)]',
        tone === 'error' ? 'border-red-400/30' : tone === 'ready' ? 'border-[var(--neon-border)]' : 'border-[var(--border-ws)]',
        inset ?? 'left-0',
      )}
      style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
    >
      {progress !== undefined && (
        <div className="absolute inset-x-0 top-0 h-[2px] overflow-hidden bg-[var(--border-ws)]" aria-hidden>
          {typeof progress === 'number' ? (
            <div className="h-full bg-[var(--neon)] transition-[width] duration-1000 ease-linear" style={{ width: `${progress}%` }} />
          ) : (
            <div className="h-full w-1/3 bg-[var(--neon)] opacity-80 motion-safe:animate-[ws-footer-sweep_2.4s_ease-in-out_infinite]" />
          )}
          {typeof progress === 'number' && (
            <div className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/70 to-transparent motion-safe:animate-[ws-footer-sweep2_2.2s_ease-in-out_infinite]" />
          )}
        </div>
      )}
      <div className="mx-auto flex min-h-[72px] w-full max-w-5xl flex-col gap-3 px-4 pt-5 sm:min-h-[88px] sm:flex-row sm:items-center sm:gap-6 sm:px-6">
        <div className="min-w-0 flex-1" role={role}>
          {message && <div className="text-sm font-medium leading-snug text-[var(--text-primary)]">{message}</div>}
          {hint && <div className="mt-1 text-xs leading-snug text-[var(--text-muted)]">{hint}</div>}
        </div>
        {actions && <div className="flex flex-shrink-0 items-center gap-3 [&>*]:flex-1 sm:[&>*]:flex-none">{actions}</div>}
      </div>
      <style>{`
        @keyframes ws-footer-sweep { 0% { transform: translateX(-110%) } 100% { transform: translateX(310%) } }
        @keyframes ws-fade { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
        @keyframes ws-footer-sweep2 { 0% { left: -6rem } 100% { left: 100% } }
      `}</style>
    </footer>
  )
}

/** Page bottom padding so content is never hidden behind the footer. */
export const FOOTER_SPACE = 'pb-48 sm:pb-40'
