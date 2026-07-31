// app/onboarding/onboarding-client.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Palette,
  Users,
  Accessibility,
  Sparkles,
  Layers,
  Search,
  MousePointer,
  BookOpen,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// ── Types ──────────────────────────────────────────────────────────────────

interface CareerLevelOption {
  id: string
  name: string
  order: number
}

interface DomainOption {
  id: string
  name: string
  order: number
}

// ── Domain icon mapping ────────────────────────────────────────────────────

function DomainIcon({ name, className }: { name: string; className?: string }) {
  const normalized = name.toLowerCase()
  if (normalized.includes('visual')) return <Palette className={className} />
  if (normalized.includes('ux')) return <Users className={className} />
  if (normalized.includes('accessibility')) return <Accessibility className={className} />
  if (normalized.includes('ai')) return <Sparkles className={className} />
  if (normalized.includes('system')) return <Layers className={className} />
  if (normalized.includes('research')) return <Search className={className} />
  if (normalized.includes('interaction')) return <MousePointer className={className} />
  return <BookOpen className={className} />
}

// ── Career track descriptions ──────────────────────────────────────────────

const CAREER_DESCRIPTIONS: Record<string, string> = {
  Beginner: 'Just starting out. Learning to see like a designer.',
  Intermediate: 'Building craft. Making real things with real tools.',
  Senior: 'Shipping in teams. Navigating organizations.',
  Expert: 'Setting direction. Shaping the field.',
}

// ── Step indicators ────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={[
            'h-1.5 rounded-full transition-all duration-300',
            i === current
              ? 'w-5 bg-[#B6FF2E]'
              : i < current
              ? 'w-1.5 bg-[#B6FF2E]/50'
              : 'w-1.5 bg-[var(--border-ws)]',
          ].join(' ')}
        />
      ))}
    </div>
  )
}

// ── Main client component ──────────────────────────────────────────────────

export function OnboardingClient({ careerLevels }: { careerLevels: CareerLevelOption[] }) {
  const router = useRouter()
  const [step, setStep] = useState<0 | 1>(0)
  const [selectedCareerLevelId, setSelectedCareerLevelId] = useState<string | null>(null)
  const [domains, setDomains] = useState<DomainOption[]>([])
  const [selectedDomainIds, setSelectedDomainIds] = useState<string[]>([])
  const [domainsLoading, setDomainsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Pre-fetch domains when user reaches step 1
  useEffect(() => {
    if (step === 1 && domains.length === 0) {
      setDomainsLoading(true)
      fetch('/api/domains')
        .then((r) => r.json())
        .then((data: DomainOption[]) => {
          setDomains(data)
          setDomainsLoading(false)
        })
        .catch(() => setDomainsLoading(false))
    }
  }, [step, domains.length])

  function toggleDomain(id: string) {
    setSelectedDomainIds((prev) => {
      if (prev.includes(id)) return prev.filter((d) => d !== id)
      if (prev.length >= 3) return prev // max 3
      return [...prev, id]
    })
  }

  async function handleComplete() {
    if (!selectedCareerLevelId || selectedDomainIds.length === 0) return
    setSubmitting(true)
    setSubmitError('')

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          careerLevelId: selectedCareerLevelId,
          domainIds: selectedDomainIds,
        }),
      })

      const data = (await res.json()) as { success?: boolean; error?: string }

      if (!res.ok) {
        setSubmitError(data.error ?? 'Something went wrong.')
        setSubmitting(false)
        return
      }

      router.push('/')
    } catch {
      setSubmitError('Network error. Try again.')
      setSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#23262F' }}
    >
      <div className="w-full max-w-lg flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <StepDots current={step} total={2} />
          <AnimatePresence mode="wait">
            <motion.h2
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="text-xl font-semibold text-white font-sora text-center"
            >
              {step === 0
                ? 'Where are you in your design journey?'
                : 'What do you want to focus on?'}
            </motion.h2>
          </AnimatePresence>
          {step === 1 && (
            <p className="text-xs text-[var(--text-muted)] font-jakarta">
              Pick 1–3 areas
            </p>
          )}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <CareerTrackGrid
                careerLevels={careerLevels}
                selectedId={selectedCareerLevelId}
                onSelect={setSelectedCareerLevelId}
              />
            </motion.div>
          ) : (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {domainsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="size-6 text-[var(--text-muted)] animate-spin" />
                </div>
              ) : (
                <DomainChips
                  domains={domains}
                  selectedIds={selectedDomainIds}
                  onToggle={toggleDomain}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {submitError && (
            <p className="text-xs text-red-400 text-center font-jakarta">{submitError}</p>
          )}

          {step === 0 ? (
            <Button
              variant="indigo"
              size="lg"
              className="w-full h-11"
              disabled={!selectedCareerLevelId}
              onClick={() => setStep(1)}
            >
              Continue
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="lg"
                className="h-11 flex-1"
                onClick={() => setStep(0)}
                disabled={submitting}
              >
                Back
              </Button>
              <Button
                variant="indigo"
                size="lg"
                className="h-11 flex-[2]"
                disabled={selectedDomainIds.length === 0 || submitting}
                onClick={handleComplete}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Setting up…
                  </>
                ) : (
                  'Start learning'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Career track grid ──────────────────────────────────────────────────────

function CareerTrackGrid({
  careerLevels,
  selectedId,
  onSelect,
}: {
  careerLevels: CareerLevelOption[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {careerLevels.map((level) => {
        const isSelected = level.id === selectedId
        const description = CAREER_DESCRIPTIONS[level.name] ?? ''
        return (
          <motion.div
            key={level.id}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
          >
            <Card
              selected={isSelected}
              className="cursor-pointer h-full min-h-[120px] flex flex-col gap-2"
              onClick={() => onSelect(level.id)}
              role="button"
              aria-pressed={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelect(level.id)
              }}
            >
              <span
                className={[
                  'text-sm font-semibold font-sora transition-colors',
                  isSelected ? 'text-[#818cf8]' : 'text-[var(--text-primary)]',
                ].join(' ')}
              >
                {level.name}
              </span>
              <span className="text-xs text-[var(--text-muted)] font-jakarta leading-relaxed">
                {description}
              </span>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Domain chips ───────────────────────────────────────────────────────────

function DomainChips({
  domains,
  selectedIds,
  onToggle,
}: {
  domains: DomainOption[]
  selectedIds: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {domains.map((domain) => {
        const isSelected = selectedIds.includes(domain.id)
        const isDisabled = !isSelected && selectedIds.length >= 3
        return (
          <motion.button
            key={domain.id}
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => !isDisabled && onToggle(domain.id)}
            aria-pressed={isSelected}
            className={[
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5',
              'text-xs font-medium font-jakarta transition-all duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B6FF2E]/50',
              isSelected
                ? 'border-[#B6FF2E] bg-[#B6FF2E]/10 text-[#818cf8]'
                : isDisabled
                ? 'border-[var(--border-ws)] bg-transparent text-[var(--text-muted)] cursor-not-allowed opacity-40'
                : 'border-[var(--border-ws)] bg-transparent text-[var(--text-secondary)] hover:border-[#B6FF2E]/40 hover:text-[var(--text-primary)] cursor-pointer',
            ].join(' ')}
          >
            <DomainIcon name={domain.name} className="size-3" />
            {domain.name}
          </motion.button>
        )
      })}
    </div>
  )
}
