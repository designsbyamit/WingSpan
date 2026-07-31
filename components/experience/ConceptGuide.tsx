'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ChevronDown } from 'lucide-react'

interface ConceptGuideProps {
  concepts: Array<{ id: string; name: string; definition: string }>
}

export function ConceptGuide({ concepts }: ConceptGuideProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [guideOpen, setGuideOpen] = useState(false)

  if (concepts.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setGuideOpen(v => !v)}
        className="flex items-center gap-2 self-start text-xs text-white/40 hover:text-white/70 transition-colors"
      >
        <BookOpen size={13} className="text-[#B6FF2E]/60" />
        <span>{guideOpen ? 'Hide' : 'Show'} concept guide ({concepts.length})</span>
        <motion.div animate={{ rotate: guideOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={12} />
        </motion.div>
      </button>

      <AnimatePresence>
        {guideOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 pt-1">
              {concepts.map(concept => (
                <div
                  key={concept.id}
                  className="rounded-xl border border-[#353B45] bg-[#2D3139] overflow-hidden"
                >
                  <button
                    onClick={() => setExpanded(expanded === concept.id ? null : concept.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="text-sm font-medium text-white/80" style={{ fontFamily: 'var(--font-sora)' }}>
                      {concept.name}
                    </span>
                    <motion.div animate={{ rotate: expanded === concept.id ? 180 : 0 }} transition={{ duration: 0.15 }}>
                      <ChevronDown size={14} className="text-white/30" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {expanded === concept.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="px-4 pb-4 text-sm text-white/55 leading-relaxed border-t border-[#353B45] pt-3">
                          {concept.definition}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
