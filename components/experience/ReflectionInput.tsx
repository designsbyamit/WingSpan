// components/experience/ReflectionInput.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Loader } from 'lucide-react'
import type { CompleteSessionResponse } from '@/types/design-evolution'

interface ReflectionInputProps {
  sessionId: string
  experienceId: string
  onComplete?: (result: CompleteSessionResponse) => void
}

export function ReflectionInput({
  sessionId,
  onComplete,
}: ReflectionInputProps) {
  const [text, setText] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!text.trim() || status !== 'idle') return
    setStatus('loading')
    setError(null)
    try {
      const res = await fetch('/api/session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, reflectionText: text.trim() }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed to complete session')
      }
      const result: CompleteSessionResponse = await res.json()
      setStatus('done')
      if (onComplete) {
        onComplete(result)
      } else {
        // Default: redirect home after showing success state
        setTimeout(() => {
          window.location.href = '/'
        }, 1500)
      }
    } catch (err) {
      setStatus('idle')
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (status === 'done') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 rounded-xl border border-[#B6FF2E]/30 bg-[#B6FF2E]/5 px-5 py-4"
      >
        <CheckCircle size={18} className="text-[#B6FF2E] shrink-0" />
        <p className="text-sm text-white/70">Experience completed. Well done.</p>
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <label
        className="text-xs font-semibold uppercase tracking-widest text-white/30"
        style={{ fontFamily: 'var(--font-sora)' }}
      >
        Your reflection
      </label>
      <textarea
        className="w-full resize-none rounded-xl border border-[#353B45] bg-[#2D3139] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[#B6FF2E]/40 focus:outline-none transition-colors leading-relaxed"
        rows={4}
        placeholder="What did you discover in this experience? What surprised you?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={status === 'loading'}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={!text.trim() || status === 'loading'}
        className="flex items-center justify-center gap-2 self-end rounded-xl bg-[#B6FF2E] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? (
          <>
            <Loader size={14} className="animate-spin" />
            Completing…
          </>
        ) : (
          'Complete Experience'
        )}
      </button>
    </div>
  )
}
