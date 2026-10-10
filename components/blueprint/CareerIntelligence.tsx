// components/blueprint/CareerIntelligence.tsx
'use client'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Blueprint, Interest, Strength } from '@/types/wingspan'
import { StrengthRadar } from '@/components/ui/StrengthRadar'
import { CareerAlphaDashboard } from '@/components/blueprint/CareerAlphaDashboard'
import { useWingspan } from '@/context/WingspanContext'
import { SectionFrame, type SectionTab } from './shell/SectionFrame'
import { Badge, Bar, Block, Card, EmptyState, FieldLabel, FOCUS_RING, INK, PrimaryButton, TextButton } from './shell/ui'

type IntelTab = 'overview' | 'dimensions' | 'strengths' | 'interests'

const OUTLOOK_TONE: Record<string, 'accent' | 'positive' | 'warn' | 'neutral'> = {
  'Very High Growth': 'accent',
  'High Growth': 'positive',
  'Emerging': 'warn',
  'Stable': 'neutral',
}

const pct = (n: unknown) => {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : 0
  return Math.round(Math.max(0, Math.min(100, v > 0 && v <= 1 ? v * 100 : v)))
}

function RefineBox({ blueprint }: { blueprint: Blueprint }) {
  const { dispatch } = useWingspan()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!draft.trim()) return
    setError(''); setBusy(true)
    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'intelligence', blueprint, instruction: draft }),
      })
      const data = await res.json()
      if (!res.ok || !data.refined) { setError(data.error ?? 'Could not apply that. Try rephrasing.'); return }
      dispatch({ type: 'SET_BLUEPRINT', blueprint: { ...blueprint, ...data.refined } })
      setDraft('')
    } catch {
      setError('Could not apply that. Check your connection and try again.')
    } finally { setBusy(false) }
  }

  return (
    <Card tone="quiet" className="p-5 flex flex-col gap-3">
      <label htmlFor="intel-refine" className="text-[14px] font-semibold text-[var(--text-primary)]">Does this read right?</label>
      <p className="text-[13px] text-[var(--text-muted)] -mt-1">Tell the analysis what it missed and it will rebalance your strengths and interests.</p>
      <textarea
        id="intel-refine"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        placeholder="e.g. I’m not interested in people management. Give more weight to AI-native design."
        rows={3}
        className={`w-full bg-[var(--bg)] border border-[var(--border-ws)] rounded-[10px] px-3 py-2.5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none ${FOCUS_RING}`}
      />
      {error && <p role="alert" className="text-[13px] text-red-400">{error}</p>}
      <PrimaryButton onClick={submit} disabled={busy || !draft.trim()} className="self-start h-9">
        {busy && <Loader2 size={14} className="animate-spin" aria-hidden />}
        {busy ? 'Rebalancing' : 'Rebalance'}
      </PrimaryButton>
    </Card>
  )
}

function StrengthCard({ s }: { s: Strength }) {
  const conf = pct(s.confidence)
  return (
    <Card as="li" className="p-5 flex flex-col gap-4">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <h4 className="text-[16px] font-semibold text-[var(--text-primary)] leading-snug" style={{ fontFamily: 'var(--font-sora)' }}>{s.name}</h4>
          <span className={`text-[14px] font-semibold tabular-nums ${INK}`}>{conf}%</span>
        </div>
        <div className="mt-3"><Bar value={conf} label={`Confidence ${conf} percent`} /></div>
      </div>
      {s.evidence && <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">{s.evidence}</p>}
      {s.careerAdvantage && (
        <div className="border-l-2 border-[var(--neon)] pl-3">
          <FieldLabel accent>Why it matters</FieldLabel>
          <p className="text-[14px] text-[var(--text-primary)] leading-relaxed">{s.careerAdvantage}</p>
        </div>
      )}
      {Array.isArray(s.projects) && s.projects.length > 0 && (
        <p className="text-[12px] text-[var(--text-muted)] mt-auto">Seen in {s.projects.slice(0, 3).join(', ')}{s.projects.length > 3 ? ` and ${s.projects.length - 3} more` : ''}</p>
      )}
    </Card>
  )
}

function InterestCard({ interest }: { interest: Interest }) {
  const reasons = Array.isArray(interest.whyItAppears) ? interest.whyItAppears : []
  return (
    <Card as="li" className="p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h4 className="text-[16px] font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>{interest.name}</h4>
        {interest.marketOutlook && <Badge tone={OUTLOOK_TONE[interest.marketOutlook] ?? 'neutral'}>{interest.marketOutlook}</Badge>}
      </div>
      {interest.evidence && <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed max-w-[68ch]">{interest.evidence}</p>}
      {reasons.length > 0 && (
        <div>
          <FieldLabel>Where we spotted it</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {reasons.map(r => (
              <span key={r} className="text-[12px] px-2.5 py-1 rounded-full bg-[var(--card-inner)] border border-[var(--border-ws)] text-[var(--text-secondary)]">{r}</span>
            ))}
          </div>
        </div>
      )}
      {interest.futureRelevance && (
        <div className="rounded-[10px] bg-[var(--card-inner)] border border-[var(--border-ws)] p-4">
          <FieldLabel>Why it’s worth your attention</FieldLabel>
          <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">{interest.futureRelevance}</p>
        </div>
      )}
    </Card>
  )
}

function OverviewTab({ blueprint, onOpen }: { blueprint: Blueprint; onOpen: (t: IntelTab) => void }) {
  const { careerAlpha } = blueprint
  const strengths = [...(blueprint.strengths ?? [])].sort((a, b) => pct(b.confidence) - pct(a.confidence))
  const interests = blueprint.interests ?? []
  const insights = (blueprint.insights ?? []).filter(Boolean)

  return (
    <>
      {careerAlpha && (
        <Card className="p-6 sm:p-8 grid gap-8 md:grid-cols-[200px_1fr]">
          <div className="flex flex-col gap-3">
            <p className="text-[13px] font-semibold text-[var(--text-muted)]">Career Alpha</p>
            <p className="leading-none tabular-nums text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>
              <span className="text-[56px] font-semibold tracking-[-0.03em]">{pct(careerAlpha.overallScore)}</span>
              <span className="text-[18px] text-[var(--text-muted)] ml-1">/100</span>
            </p>
            <Bar value={pct(careerAlpha.overallScore)} label={`Career Alpha ${pct(careerAlpha.overallScore)} out of 100`} />
          </div>
          <div className="flex flex-col gap-4 min-w-0">
            {careerAlpha.archetypeLabel && (
              <div>
                <p className="text-[13px] text-[var(--text-muted)]">Your archetype</p>
                <p className={`text-[22px] font-semibold leading-tight mt-1 ${INK}`} style={{ fontFamily: 'var(--font-sora)' }}>{careerAlpha.archetypeLabel}</p>
              </div>
            )}
            {careerAlpha.synthesis && <p className="text-[15px] text-[var(--text-secondary)] leading-[1.7] max-w-[64ch]">{careerAlpha.synthesis}</p>}
            <TextButton onClick={() => onOpen('dimensions')} className="self-start">See the five dimensions</TextButton>
          </div>
        </Card>
      )}

      {insights.length > 0 && (
        <Block title="What stands out">
          <ul className="flex flex-col gap-3 max-w-[68ch]">
            {insights.map((t, i) => (
              <li key={i} className="flex gap-3 text-[15px] text-[var(--text-secondary)] leading-relaxed">
                <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-[var(--neon)] shrink-0" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </Block>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>Top strengths</h3>
            {strengths.length > 0 && <TextButton onClick={() => onOpen('strengths')}>All {strengths.length}</TextButton>}
          </div>
          {strengths.length === 0 ? <p className="text-[14px] text-[var(--text-muted)]">No strengths identified yet.</p> : (
            <ul className="flex flex-col gap-4">
              {strengths.slice(0, 3).map(s => (
                <li key={s.name}>
                  <div className="flex justify-between gap-3 text-[14px] mb-2">
                    <span className="text-[var(--text-primary)] font-medium truncate">{s.name}</span>
                    <span className="text-[var(--text-muted)] tabular-nums">{pct(s.confidence)}%</span>
                  </div>
                  <Bar value={pct(s.confidence)} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>What draws you in</h3>
            {interests.length > 0 && <TextButton onClick={() => onOpen('interests')}>All {interests.length}</TextButton>}
          </div>
          {interests.length === 0 ? <p className="text-[14px] text-[var(--text-muted)]">No interests identified yet.</p> : (
            <ul className="flex flex-col divide-y divide-[var(--border-ws)]">
              {interests.slice(0, 4).map(i => (
                <li key={i.name} className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
                  <span className="text-[14px] text-[var(--text-primary)] font-medium truncate">{i.name}</span>
                  {i.marketOutlook && <span className="text-[12px] text-[var(--text-muted)] shrink-0">{i.marketOutlook}</span>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}

export function CareerIntelligence({ blueprint }: { blueprint: Blueprint }) {
  const { careerAlpha } = blueprint
  const strengths = blueprint.strengths ?? []
  const interests = blueprint.interests ?? []
  const [tab, setTab] = useState<IntelTab>('overview')

  const tabs: SectionTab[] = [
    { id: 'overview', label: 'Overview' },
    ...(careerAlpha ? [{ id: 'dimensions', label: 'Dimensions' }] : []),
    { id: 'strengths', label: 'Strengths', count: strengths.length },
    { id: 'interests', label: 'Interests', count: interests.length },
  ]

  // With Career Alpha the score leads the Overview tab, so the header doesn't repeat it.
  const stat = !careerAlpha && strengths.length ? { value: strengths.length, label: 'strengths identified' } : null

  return (
    <SectionFrame
      section="intelligence"
      stat={stat}
      tabs={tabs}
      activeTab={tab}
      onTabChange={id => setTab(id as IntelTab)}
    >
      {tab === 'overview' && <OverviewTab blueprint={blueprint} onOpen={setTab} />}

      {tab === 'dimensions' && careerAlpha && (
        <Block title="Five dimensions" description="Each dimension looks at your career from a different angle. Open one to see the signals behind it.">
          <CareerAlphaDashboard careerAlpha={careerAlpha} />
        </Block>
      )}

      {tab === 'strengths' && (
        strengths.length === 0 ? <EmptyState title="No strengths identified yet" body="Add more project detail and run the analysis again." /> : (
          <>
            <Block title="Strength profile" description="Confidence reflects how much evidence backs each strength.">
              <Card className="p-4"><StrengthRadar strengths={strengths} /></Card>
            </Block>
            <ul className="grid md:grid-cols-2 gap-4">
              {strengths.map(s => <StrengthCard key={s.name} s={s} />)}
            </ul>
            <RefineBox blueprint={blueprint} />
          </>
        )
      )}

      {tab === 'interests' && (
        interests.length === 0 ? <EmptyState title="No interests identified yet" body="Pick interests during onboarding and they will show up here." /> : (
          <>
            <ul className="flex flex-col gap-4">
              {interests.map(i => <InterestCard key={i.name} interest={i} />)}
            </ul>
            <RefineBox blueprint={blueprint} />
          </>
        )
      )}
    </SectionFrame>
  )
}
