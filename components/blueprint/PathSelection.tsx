// components/blueprint/PathSelection.tsx
'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Info } from 'lucide-react'
import { Blueprint } from '@/types/wingspan'
import { useWingspan } from '@/context/WingspanContext'

const BET_STYLE: Record<string, string> = {
  'safe':   'bg-amber-950/30 text-amber-400 border-amber-800/50',
  'growth': 'bg-emerald-950/30 text-emerald-400 border-emerald-800/50',
  'bold':   'bg-[var(--neon-surface)] text-[var(--neon)] border-[var(--neon-border)]',
}

const BET_LABEL: Record<string, string> = {
  'safe':   'Safe Bet',
  'growth': 'Growth Bet',
  'bold':   'Bold Bet',
}

// Tooltip explaining why Career Alpha scores differ per path
function CareerAlphaTooltip() {
  const [show, setShow] = useState(false)
  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        aria-label="What is Career Alpha?"
      >
        <Info size={11} />
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 z-50"
          >
            <div className="rounded-[10px] bg-[var(--surface)] border border-[var(--border-ws)] p-3 shadow-xl">
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                Career Alpha measures how well this specific path fits your unique profile — evidence, market signals, future resilience, and learning investment. Each bet is scored independently, so scores naturally differ.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function PathSelection({ blueprint }: { blueprint: Blueprint }) {
  const { state, dispatch } = useWingspan()
  const { futurePaths } = blueprint
  const [expandedPath, setExpandedPath] = useState<string | null>(null)
  const [adjustOpenFor, setAdjustOpenFor] = useState<string | null>(null)
  const [refineDrafts, setRefineDrafts] = useState<Record<string, string>>({})
  const [refiningFor, setRefiningFor] = useState<string | null>(null)
  const [refineErrors, setRefineErrors] = useState<Record<string, string>>({})
  const bottomRef = useRef<HTMLDivElement>(null)

  const recommendedTitle = futurePaths.reduce((best, p) =>
    (p.careerAlphaScore ?? p.confidence) > (best.careerAlphaScore ?? best.confidence) ? p : best
  , futurePaths[0])?.title

  const handleSelectPath = (pathTitle: string) => {
    dispatch({ type: 'SELECT_PATH', path: pathTitle })
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 400)
  }

  const handlePathRefine = async (pathTitle: string) => {
    const draft = refineDrafts[pathTitle] ?? ''
    if (!draft.trim()) return
    setRefineErrors(prev => ({ ...prev, [pathTitle]: '' }))
    setRefiningFor(pathTitle)
    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'paths',
          blueprint,
          instruction: `For the path '${pathTitle}': ${draft}`,
          careerAlpha: state.careerAlpha,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.refined?.futurePaths) {
        setRefineErrors(prev => ({ ...prev, [pathTitle]: data.error ?? 'Refinement failed.' }))
        return
      }
      dispatch({
        type: 'SET_BLUEPRINT',
        blueprint: { ...blueprint, futurePaths: data.refined.futurePaths },
      })
      setRefineDrafts(prev => ({ ...prev, [pathTitle]: '' }))
      setAdjustOpenFor(null)
    } catch {
      setRefineErrors(prev => ({ ...prev, [pathTitle]: 'Refinement failed. Please try again.' }))
    } finally {
      setRefiningFor(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">

      <div className="mb-2">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Three evidence-backed directions for your next chapter. Pick the one that resonates most.
        </p>
      </div>

      {futurePaths.map((path, idx) => {
        const isSelected = state.selectedPath === path.title

        return (
          <motion.div
            key={path.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.4 }}
            className={`
              rounded-[16px] border p-5 flex flex-col gap-4 transition-all
              ${isSelected ? 'border-[var(--neon)]' : 'border-[var(--border-ws)]'}
              bg-[var(--surface)]
            `}
          >
            {/* Header */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className="text-base font-bold text-[var(--text-primary)]"
                  style={{ fontFamily: 'var(--font-sora)' }}
                >
                  {path.title}
                </span>
                {path.title === recommendedTitle && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-[var(--neon-surface)] text-[var(--neon)] border-[var(--neon-border)]">
                    Recommended
                  </span>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${BET_STYLE[path.betArchetype] ?? BET_STYLE['growth']}`}>
                  {BET_LABEL[path.betArchetype] ?? 'Growth Bet'}
                </span>
              </div>
              {/* Short, punchy rationale — truncated to 2 lines */}
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                {path.betRationale ?? path.whyItFits}
              </p>
            </div>

            {/* Metadata row with CA tooltip */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-[8px] bg-[var(--card-inner)] border border-[var(--border-ws)] p-2 text-center">
                <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-[var(--text-muted)] mb-0.5">Timeline</p>
                <p className="text-xs font-semibold text-[var(--text-primary)]">{path.timeline}</p>
              </div>
              <div className="rounded-[8px] bg-[var(--card-inner)] border border-[var(--border-ws)] p-2 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-[var(--text-muted)]">Career Alpha</p>
                  <CareerAlphaTooltip />
                </div>
                <p className="text-xs font-semibold text-[var(--neon)]">{path.careerAlphaScore ?? path.confidence}</p>
              </div>
              <div className="rounded-[8px] bg-[var(--card-inner)] border border-[var(--border-ws)] p-2 text-center">
                <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-[var(--text-muted)] mb-0.5">Career ROI</p>
                <p className="text-xs font-semibold text-[var(--text-primary)]">{path.careerROIScore ?? '—'}</p>
              </div>
            </div>

            {/* Key transition areas — as bullet list, higher contrast */}
            {path.keyTransitionAreas && path.keyTransitionAreas.length > 0 && (
              <div>
                <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-2">To get there</p>
                <ul className="flex flex-col gap-1">
                  {path.keyTransitionAreas.map(area => (
                    <li key={area} className="flex items-center gap-2 text-xs text-[var(--text-primary)]">
                      <span className="w-1 h-1 rounded-full bg-[var(--neon)] flex-shrink-0" />
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Why not the other paths? */}
            {path.whyNotOtherPaths && (
              <div>
                <button
                  onClick={() => setExpandedPath(expandedPath === path.title ? null : path.title)}
                  className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  <span>Why not the other paths?</span>
                  <motion.div animate={{ rotate: expandedPath === path.title ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={10} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {expandedPath === path.title && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden text-xs text-[var(--text-muted)] leading-relaxed mt-2"
                    >
                      {path.whyNotOtherPaths}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Adjust this path */}
            <div>
              <button
                onClick={() => setAdjustOpenFor(adjustOpenFor === path.title ? null : path.title)}
                className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                <span>Adjust this path</span>
                <motion.div animate={{ rotate: adjustOpenFor === path.title ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={10} />
                </motion.div>
              </button>
              <AnimatePresence>
                {adjustOpenFor === path.title && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 flex flex-col gap-2">
                      <textarea
                        value={refineDrafts[path.title] ?? ''}
                        onChange={e => setRefineDrafts(prev => ({ ...prev, [path.title]: e.target.value }))}
                        placeholder={`Make this path more focused on AI-native product design…`}
                        rows={2}
                        className="w-full bg-[var(--card-inner)] border border-[var(--border-ws)] rounded-[8px] px-3 py-2 text-xs text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon)] transition-colors resize-none"
                      />
                      {refineErrors[path.title] && <p className="text-xs text-red-400 mt-1">{refineErrors[path.title]}</p>}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePathRefine(path.title)}
                          disabled={refiningFor === path.title || !(refineDrafts[path.title] ?? '').trim()}
                          className="px-4 py-1.5 rounded-[7px] bg-[var(--neon)] text-[#0a0a0a] text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                        >
                          {refiningFor === path.title ? 'Refining…' : 'Refine →'}
                        </button>
                        <button
                          onClick={() => { setAdjustOpenFor(null); setRefineDrafts(prev => ({ ...prev, [path.title]: '' })) }}
                          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* CTA */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectPath(path.title)}
              className={`
                w-full py-3 rounded-[10px] text-sm font-bold transition-all border
                ${isSelected
                  ? 'bg-[var(--neon)] text-[#0a0a0a] border-[var(--neon)]'
                  : 'bg-transparent text-[var(--neon)] border-[var(--neon-border)] hover:bg-[var(--neon-surface)]'
                }
              `}
            >
              {isSelected ? 'This is the one' : 'Explore this path'}
            </motion.button>

          </motion.div>
        )
      })}

      {/* Anchor for auto-scroll after selection */}
      <div ref={bottomRef} />

      {/* Nudge to continue once a path is selected */}
      <AnimatePresence>
        {state.selectedPath && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-[var(--text-muted)] text-center"
          >
            Great choice. Hit Next to see your personalised Gap Analysis.
          </motion.p>
        )}
      </AnimatePresence>

    </div>
  )
}
