'use client'
import { useCallback, useEffect, useState } from 'react'
import { Check, Moon, Sun } from 'lucide-react'
import { Dialog } from './Dialog'
import { FOCUS_RING, INK } from './ui'

type Theme = 'dark' | 'light'
// v2: an earlier build stored an accidental 'light' for some people. Only an explicit choice here is kept now.
const STORAGE_KEY = 'wingspan-theme-v2'

function readStored(): Theme {
  try { return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark' } catch { return 'dark' }
}

/** The app's theme mechanism: a `light` class on <html>, persisted in localStorage. */
export function useThemePreference() {
  const [theme, setThemeState] = useState<Theme>(() => (typeof window === 'undefined' ? 'dark' : readStored()))

  // Apply the stored theme when the Blueprint mounts (the class may not be set yet on this page).
  useEffect(() => {
    document.documentElement.classList.toggle('light', readStored() === 'light')
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    document.documentElement.classList.toggle('light', next === 'light')
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* private mode: still applies for this visit */ }
  }, [])

  return { theme, setTheme }
}

const OPTIONS: { id: Theme; label: string; hint: string; icon: typeof Moon }[] = [
  { id: 'dark',  label: 'Dark',  hint: 'Default. Easier on the eyes in low light.', icon: Moon },
  { id: 'light', label: 'Light', hint: 'Better in bright rooms and for printing.', icon: Sun },
]

export function PreferencesDialog({ open, onClose, theme, setTheme }: {
  open: boolean
  onClose: () => void
  theme: Theme
  setTheme: (t: Theme) => void
}) {
  return (
    <Dialog open={open} onClose={onClose} title="Preferences" description="Saved on this device.">
      <fieldset>
        <legend className="text-[13px] font-semibold text-[var(--text-secondary)] mb-3">Appearance</legend>
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 gap-3">
          {OPTIONS.map(o => {
            const selected = theme === o.id
            const Icon = o.icon
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={selected}
                data-autofocus={selected ? '' : undefined}
                onClick={() => setTheme(o.id)}
                onKeyDown={(e) => {
                  if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                    e.preventDefault()
                    setTheme(o.id === 'dark' ? 'light' : 'dark')
                    const sib = (e.currentTarget.parentElement?.querySelector(`[role="radio"]:not([aria-checked="true"])`) as HTMLElement | null)
                    sib?.focus()
                  }
                }}
                tabIndex={selected ? 0 : -1}
                className={`relative text-left rounded-[12px] border p-4 flex flex-col gap-2 transition-colors ${FOCUS_RING} ${
                  selected
                    ? 'border-[var(--neon)] bg-[var(--neon-surface)]'
                    : 'border-[var(--border-ws)] hover:bg-[var(--surface-dim)]'
                }`}
              >
                <span className="flex items-center justify-between">
                  <Icon size={18} className={selected ? INK : 'text-[var(--text-muted)]'} aria-hidden />
                  {selected && <Check size={16} className={INK} aria-hidden />}
                </span>
                <span className="text-[14px] font-semibold text-[var(--text-primary)]">{o.label}</span>
                <span className="text-[12px] text-[var(--text-muted)] leading-snug">{o.hint}</span>
              </button>
            )
          })}
        </div>
      </fieldset>
    </Dialog>
  )
}
