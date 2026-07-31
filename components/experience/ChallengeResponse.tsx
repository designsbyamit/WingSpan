'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { detectChallengeType, getChallengeFields } from '@/lib/challenge-type'
import type { ChallengeField } from '@/lib/challenge-type'
import { CheckCircle2, Loader2 } from 'lucide-react'

interface ChallengeResponseProps {
  sessionId: string
  experienceId: string
  scenarioText: string
  onComplete?: () => void
  disabled?: boolean
}

export function ChallengeResponse({ sessionId, scenarioText, onComplete, disabled }: ChallengeResponseProps) {
  const challengeType = detectChallengeType(scenarioText)
  const fields = getChallengeFields(challengeType, scenarioText)
  const [values, setValues] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const requiredFields = fields.filter(f => !f.id.includes('link'))
  const allFilled = requiredFields.every(f => (values[f.id] ?? '').trim().length > 10)

  const handleSubmit = async () => {
    if (!allFilled || submitting || submitted) return
    setSubmitting(true)
    try {
      await fetch('/api/session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionId, reflectionText: JSON.stringify(values) }),
      })
      setSubmitted(true)
      onComplete?.()
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[#B6FF2E]/20 bg-[#B6FF2E]/5 px-6 py-5 flex items-center gap-3"
      >
        <CheckCircle2 size={18} className="text-[#B6FF2E] shrink-0" />
        <p className="text-sm text-white/70">Response saved. Experience complete.</p>
      </motion.div>
    )
  }

  const isObservation = challengeType === 'observation'
  const exampleCount = isObservation ? Math.floor(fields.length / 3) : 0

  return (
    <div className="flex flex-col gap-5">
      {isObservation ? (
        Array.from({ length: exampleCount }, (_, i) => {
          const exFields = fields.slice(i * 3, i * 3 + 3)
          return (
            <div key={i} className="flex flex-col gap-3 rounded-2xl border border-[#353B45] bg-[#2D3139] p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#B6FF2E]/60" style={{ fontFamily: 'var(--font-sora)' }}>
                Example {i + 1}
              </p>
              {exFields.map(field => (
                <FieldInput
                  key={field.id}
                  field={field}
                  value={values[field.id] ?? ''}
                  onChange={v => setValues(prev => ({ ...prev, [field.id]: v }))}
                  disabled={disabled}
                />
              ))}
            </div>
          )
        })
      ) : (
        <div className="flex flex-col gap-4 rounded-2xl border border-[#353B45] bg-[#2D3139] p-5">
          {fields.map(field => (
            <FieldInput
              key={field.id}
              field={field}
              value={values[field.id] ?? ''}
              onChange={v => setValues(prev => ({ ...prev, [field.id]: v }))}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!allFilled || submitting || !!disabled}
        className="self-start flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold bg-[#B6FF2E] text-[#23262F] hover:bg-[#9EE020] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        style={{ fontFamily: 'var(--font-sora)' }}
      >
        {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
        {submitting ? 'Saving...' : 'Complete Experience'}
      </button>
    </div>
  )
}

function FieldInput({ field, value, onChange, disabled }: {
  field: ChallengeField
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-white/50" style={{ fontFamily: 'var(--font-sora)' }}>
        {field.label}
      </label>
      {field.multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          rows={3}
          className="w-full rounded-xl bg-[#23262F] border border-[#353B45] px-4 py-3 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-[#B6FF2E]/40 resize-none transition-colors disabled:opacity-50"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          className="w-full rounded-xl bg-[#23262F] border border-[#353B45] px-4 py-3 text-sm text-white/80 placeholder:text-white/25 focus:outline-none focus:border-[#B6FF2E]/40 transition-colors disabled:opacity-50"
        />
      )}
    </div>
  )
}
