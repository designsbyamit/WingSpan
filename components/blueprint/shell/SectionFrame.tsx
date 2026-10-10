'use client'
import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { BlueprintStep } from '@/types/wingspan'
import { SECTIONS, sectionIndex, sectionMeta } from './sections'
import { FOCUS_RING, INK } from './ui'

export interface SectionTab {
  id: string
  label: string
  /** Optional count shown after the label. */
  count?: number
}

export interface SectionStat {
  value: ReactNode
  label: string
}

/**
 * Page header (eyebrow, title, purpose, key stat) + sticky sub-section tabs + the active panel.
 * Tabs follow the WAI-ARIA tabs pattern: roving tabindex, arrow keys, Home/End.
 */
export function SectionFrame({
  section, context, stat, tabs, activeTab, onTabChange, children,
}: {
  section: BlueprintStep
  /** Short context shown next to the eyebrow, e.g. the chosen path. */
  context?: ReactNode
  stat?: SectionStat | null
  tabs: SectionTab[]
  activeTab: string
  onTabChange: (id: string) => void
  children: ReactNode
}) {
  const meta = sectionMeta(section)
  const idx = sectionIndex(section)
  const baseId = useId()
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const sentinel = useRef<HTMLDivElement>(null)
  const current = tabs.some(t => t.id === activeTab) ? activeTab : tabs[0]?.id

  const select = (id: string, focus = false) => {
    onTabChange(id)
    if (focus) tabRefs.current[id]?.focus()
    // If the reader has scrolled past the tab bar, bring the new panel's top into view.
    const el = sentinel.current
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - (window.innerWidth < 768 ? 56 : 0)
      if (window.scrollY > top) {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' })
      }
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.findIndex(t => t.id === current)
    if (i < 0) return
    let next = -1
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length
    else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    if (next >= 0) { e.preventDefault(); select(tabs[next].id, true) }
  }

  return (
    <div>
      {/* Header */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between pb-6">
        <div className="min-w-0 max-w-2xl">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
            <p className={`text-[13px] font-semibold ${INK}`}>
              Step {idx + 1} of {SECTIONS.length}
            </p>
            {context}
          </div>
          <h1
            id={`${baseId}-title`}
            data-section-title
            tabIndex={-1}
            className="text-[28px] sm:text-[32px] font-semibold tracking-[-0.02em] leading-[1.1] text-[var(--text-primary)] outline-none"
            style={{ fontFamily: 'var(--font-sora)' }}
          >
            {meta.title}
          </h1>
          <p className="text-[15px] text-[var(--text-secondary)] mt-3 leading-relaxed">{meta.purpose}</p>
        </div>
        {stat && (
          <div className="shrink-0 flex items-baseline gap-2 sm:block sm:text-right sm:pl-6 sm:border-l border-[var(--border-ws)]">
            <div className="text-[22px] sm:text-[26px] font-semibold leading-none tabular-nums text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>
              {stat.value}
            </div>
            <div className="text-[13px] sm:text-[12px] text-[var(--text-muted)] sm:mt-2">{stat.label}</div>
          </div>
        )}
      </header>

      <div ref={sentinel} aria-hidden />

      {/* Sub-section tabs */}
      {tabs.length > 1 && (
        <div className="sticky top-14 md:top-0 z-20 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 bg-[var(--bg)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg)]/80 border-b border-[var(--border-ws)]">
          <div
            role="tablist"
            aria-labelledby={`${baseId}-title`}
            onKeyDown={onKeyDown}
            className="flex gap-1 overflow-x-auto -mb-px"
            style={{ scrollbarWidth: 'none' }}
          >
            {tabs.map(tab => {
              const selected = tab.id === current
              return (
                <button
                  key={tab.id}
                  ref={el => { tabRefs.current[tab.id] = el }}
                  role="tab"
                  type="button"
                  id={`${baseId}-tab-${tab.id}`}
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => select(tab.id)}
                  className={`relative shrink-0 h-12 px-3 inline-flex items-center gap-2 text-[14px] whitespace-nowrap transition-colors rounded-t-[8px] ${FOCUS_RING} focus-visible:ring-offset-0 ${
                    selected
                      ? 'text-[var(--text-primary)] font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
                  }`}
                >
                  {tab.label}
                  {typeof tab.count === 'number' && (
                    <span className={`min-w-5 h-5 px-1.5 rounded-full text-[11px] font-semibold inline-flex items-center justify-center tabular-nums ${
                      selected ? 'bg-[var(--neon)] text-[#0a0a0a]' : 'bg-[var(--surface-dim)] text-[var(--text-muted)]'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                  {selected && (
                    <motion.span
                      layoutId={`${baseId}-tab-underline`}
                      className="absolute left-2 right-2 bottom-0 h-[2px] rounded-full bg-[var(--neon)]"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <motion.div
        key={current}
        id={`${baseId}-panel`}
        role={tabs.length > 1 ? 'tabpanel' : undefined}
        aria-labelledby={tabs.length > 1 ? `${baseId}-tab-${current}` : undefined}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18 }}
        className="pt-8 flex flex-col gap-10"
      >
        {children}
      </motion.div>
    </div>
  )
}
