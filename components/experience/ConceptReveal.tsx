// components/experience/ConceptReveal.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, ChevronDown } from 'lucide-react'
import type { ConceptData } from '@/types/design-evolution'

interface ConceptRevealProps {
  concepts: ConceptData[]
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: 'easeOut' as const,
    },
  }),
}

export function ConceptReveal({ concepts }: ConceptRevealProps) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => setRevealed(true)}
        disabled={revealed}
        className="flex items-center gap-2 self-start rounded-xl border border-[#353B45] bg-[#2D3139] px-5 py-2.5 text-sm font-medium text-white/70 transition-colors hover:border-[#B6FF2E]/40 hover:text-white disabled:cursor-default disabled:opacity-50"
      >
        <Lightbulb size={15} className="text-[#B6FF2E]" />
        {revealed ? 'Concepts revealed' : 'Reveal concepts'}
        {!revealed && <ChevronDown size={14} className="ml-1 opacity-60" />}
      </button>

      <AnimatePresence>
        {revealed && (
          <div className="flex flex-col gap-3">
            {concepts.map((concept, i) => (
              <motion.div
                key={concept.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="rounded-xl border border-[#353B45] bg-[#2D3139] p-5 flex flex-col gap-2"
              >
                <h4
                  className="text-sm font-semibold text-white"
                  style={{ fontFamily: 'var(--font-sora)' }}
                >
                  {concept.name}
                </h4>
                <p className="text-sm text-white/60 leading-relaxed">
                  {concept.definition}
                </p>
                {concept.whyItMatters && (
                  <div className="mt-1 rounded-lg bg-[#B6FF2E]/5 border border-[#B6FF2E]/10 px-4 py-3">
                    <p className="text-xs text-[#B6FF2E]/80 leading-relaxed">
                      <span className="font-semibold text-[#B6FF2E]">
                        Why it matters ·{' '}
                      </span>
                      {concept.whyItMatters}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
