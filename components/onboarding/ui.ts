// Shared class strings for the onboarding flow, so focus and surfaces look the same everywhere.

/** Visible keyboard focus that works on dark and light themes. */
export const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--neon)]'

/** Join class names, skipping falsy values. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Small text button used for secondary actions ("View details", "Show all"). */
export const linkButton = cx(
  'inline-flex items-center gap-1 rounded-[6px] text-[13px] font-semibold text-[var(--text-secondary)]',
  'underline decoration-[var(--border-ws)] underline-offset-4 transition-colors',
  'hover:text-[var(--text-primary)] hover:decoration-[var(--text-muted)]',
  focusRing,
)

/** Quiet bordered button, for "Back", "Try again" and similar. */
export const quietButton = cx(
  'inline-flex items-center justify-center gap-2 rounded-[10px] border border-[var(--border-ws)] px-4 py-2.5',
  'text-sm font-semibold text-[var(--text-secondary)] transition-colors',
  'hover:border-[var(--text-dim)] hover:text-[var(--text-primary)]',
  focusRing,
)

/** Primary action, matching NeonButton but with focus styles and native button props. */
export const primaryButton = cx(
  'inline-flex items-center justify-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-bold tracking-tight',
  'bg-[var(--neon)] text-[#0a0a0a] transition-[filter,opacity] hover:brightness-105',
  'disabled:cursor-not-allowed disabled:bg-[var(--surface-dim)] disabled:text-[var(--text-dim)] disabled:hover:brightness-100',
  focusRing,
)
