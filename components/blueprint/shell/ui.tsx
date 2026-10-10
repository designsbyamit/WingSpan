'use client'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

/**
 * Shared building blocks for the Blueprint sections, so every section uses the same
 * spacing scale (4 / 8 / 12 / 16 / 24 / 40), radii (14 card, 10 inset, 999 chip) and type ramp.
 */

export const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]'

/** Accent colour for text. Neon in dark mode, a deeper olive in light mode so it stays legible on white. */
export const INK = 'text-[var(--ws-ink)]'

export function Card({ children, className = '', as: Tag = 'div', tone = 'default' }: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article' | 'li'
  tone?: 'default' | 'accent' | 'quiet'
}) {
  const toneCls = tone === 'accent'
    ? 'bg-[var(--neon-surface)] border-[var(--neon-border)]'
    : tone === 'quiet'
    ? 'bg-[var(--card-inner)] border-[var(--border-ws)]'
    : 'bg-[var(--surface)] border-[var(--border-ws)]'
  return <Tag className={`rounded-[14px] border ${toneCls} ${className}`}>{children}</Tag>
}

/** A titled block inside a tab panel. */
export function Block({ title, description, action, children, className = '' }: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`flex flex-col gap-4 ${className}`}>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-[var(--text-primary)] leading-snug" style={{ fontFamily: 'var(--font-sora)' }}>
            {title}
          </h3>
          {description && <p className="text-[13px] text-[var(--text-muted)] mt-1 leading-relaxed">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  )
}

/** Small sentence-case label above a value or a short paragraph. */
export function FieldLabel({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  return (
    <p className={`text-[12px] font-semibold mb-1.5 ${accent ? INK : 'text-[var(--text-muted)]'}`}>{children}</p>
  )
}

type BadgeTone = 'accent' | 'neutral' | 'warn' | 'danger' | 'positive' | 'solid'
const BADGE: Record<BadgeTone, string> = {
  accent:   `bg-[var(--neon-surface)] border-[var(--neon-border)] ${INK}`,
  neutral:  'bg-transparent border-[var(--border-ws)] text-[var(--text-secondary)]',
  warn:     'bg-amber-500/10 border-amber-500/30 text-amber-500',
  danger:   'bg-red-500/10 border-red-500/30 text-red-400',
  positive: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
  solid:    'bg-[var(--neon)] border-[var(--neon)] text-[#0a0a0a]',
}

export function Badge({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: BadgeTone; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 h-6 px-2.5 rounded-full border text-[11px] font-semibold whitespace-nowrap ${BADGE[tone]} ${className}`}>
      {children}
    </span>
  )
}

export function Chip({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-[8px] border text-[12px] leading-tight ${
      accent
        ? `bg-[var(--neon-surface)] border-[var(--neon-border)] ${INK}`
        : 'bg-[var(--card-inner)] border-[var(--border-ws)] text-[var(--text-secondary)]'
    }`}>
      {children}
    </span>
  )
}

export function EmptyState({ icon: Icon, title, body, action }: {
  icon?: LucideIcon
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-[14px] border border-dashed border-[var(--border-ws)] px-6 py-10 flex flex-col items-center text-center gap-3">
      {Icon && (
        <div className="w-10 h-10 rounded-full bg-[var(--surface-dim)] flex items-center justify-center text-[var(--text-muted)]">
          <Icon size={18} aria-hidden />
        </div>
      )}
      <div className="max-w-sm">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
        {body && <p className="text-[13px] text-[var(--text-muted)] mt-1 leading-relaxed">{body}</p>}
      </div>
      {action}
    </div>
  )
}

export function PrimaryButton({ children, onClick, disabled, type = 'button', className = '' }: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 h-10 px-4 rounded-[10px] bg-[var(--neon)] text-[#0a0a0a] text-[13px] font-bold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed ${FOCUS_RING} ${className}`}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({ children, onClick, disabled, className = '', ariaLabel }: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 h-10 px-4 rounded-[10px] border border-[var(--border-ws)] text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-dim)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${FOCUS_RING} ${className}`}
    >
      {children}
    </button>
  )
}

/** Inline text button, e.g. "View details". */
export function TextButton({ children, onClick, className = '' }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-[6px] text-[13px] font-semibold ${INK} hover:underline underline-offset-4 ${FOCUS_RING} ${className}`}
    >
      {children}
    </button>
  )
}

/** Horizontal 0-100 bar. */
export function Bar({ value, tone = 'accent', label }: { value: number; tone?: 'accent' | 'muted'; label?: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div
      className="h-1.5 w-full rounded-full bg-[var(--surface-dim)] overflow-hidden"
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <div
        className={`h-full rounded-full ${tone === 'accent' ? 'bg-[var(--neon)]' : 'bg-[var(--text-muted)]'}`}
        style={{ width: `${v}%` }}
      />
    </div>
  )
}

/** A compact key figure: value above a label. Used for KPIs and comparisons. */
export function Figure({ value, label, accent = false }: { value: ReactNode; label: string; accent?: boolean }) {
  return (
    <div className="min-w-0">
      <div className={`text-[22px] font-semibold leading-none tabular-nums ${accent ? INK : 'text-[var(--text-primary)]'}`} style={{ fontFamily: 'var(--font-sora)' }}>
        {value}
      </div>
      <div className="text-[12px] text-[var(--text-muted)] mt-2 leading-snug">{label}</div>
    </div>
  )
}
