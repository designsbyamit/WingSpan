'use client'
// The Student Plan: Edge Card, where freshers are hired, two lanes and a bridge job, real openings, 14-day plan,
// and the full source list. Same sticky footer as the rest of the flow.
import { useState } from 'react'
import { MotionConfig } from 'framer-motion'
import { Check, ChevronDown, Download, ExternalLink } from 'lucide-react'
import { useWingspan } from '@/context/WingspanContext'
import { FlowFooter } from '@/components/onboarding/FlowFooter'
import { CancelFlowButton } from '@/components/onboarding/CancelFlow'
import { cx, focusRing, primaryButton, quietButton } from '@/components/onboarding/ui'
import { cancelCareerPipeline, runCareerPipeline } from '@/lib/pipeline'
import { downloadMarkdown } from '@/lib/export'
import { studentPlanToMarkdown } from '@/lib/student/export'
import { ClaimText } from './Cite'
import type { StudentPlan } from '@/lib/student/types'

const card = 'rounded-[14px] border border-[var(--border-ws)] bg-[var(--surface-dim)] p-5 sm:p-6'
const h2 = 'text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-dim)]'

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className={h2}>{title}</h2>
      {children}
    </section>
  )
}

const dateLabel = (d: string | null) => (d ? d : null)

function SourceList({ plan }: { plan: StudentPlan }) {
  const rows = [...plan.sources, ...plan.openings.filter((o) => !plan.sources.some((s) => s.id === o.sourceId)).map((o) => ({
    id: o.sourceId, label: o.title, publisher: o.company, url: o.url, publishedAt: null, retrievedAt: o.retrievedAt, reliability: null, kind: 'POSTING' as const,
  }))]
  return (
    <ol className="flex flex-col gap-2">
      {rows.map((s) => (
        <li key={s.id} id={`source-${s.id}`} className="rounded-[10px] border border-[var(--border-ws)] px-3 py-2.5 text-[13px] transition-shadow">
          <span className="mr-2 font-bold text-[var(--text-primary)]">{s.id}</span>
          <span className="text-[var(--text-primary)]">{s.label}</span>
          <span className="text-[var(--text-secondary)]"> · {s.publisher}</span>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--text-dim)]">
            {dateLabel(s.publishedAt) && <span>Published {s.publishedAt}</span>}
            {s.retrievedAt && <span>Read by WingSpan {s.retrievedAt}</span>}
            {s.reliability !== null && <span>Reliability {Math.round(s.reliability * 100)}%</span>}
            {s.url
              ? <a href={s.url} target="_blank" rel="noopener noreferrer" className={cx('inline-flex items-center gap-1 font-semibold text-[var(--text-secondary)] underline underline-offset-4 hover:text-[var(--text-primary)]', focusRing)}>Open source <ExternalLink size={12} aria-hidden /></a>
              : <span>No public link</span>}
          </div>
        </li>
      ))}
    </ol>
  )
}

function Days({ plan }: { plan: StudentPlan }) {
  const [open, setOpen] = useState<number | null>(1)
  return (
    <ol className="flex flex-col gap-2">
      {plan.days.map((d) => {
        const expanded = open === d.day
        return (
          <li key={d.day} className="rounded-[12px] border border-[var(--border-ws)]">
            <button type="button" onClick={() => setOpen(expanded ? null : d.day)} aria-expanded={expanded}
              className={cx('flex w-full items-center gap-3 rounded-[12px] px-4 py-3 text-left', focusRing)}>
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-[var(--border-ws)] text-xs font-bold text-[var(--text-primary)]">{d.day}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold uppercase tracking-wide text-[var(--text-dim)]">{d.theme} · {d.minutes} min</span>
                <span className="block text-sm font-semibold text-[var(--text-primary)]">{d.action}</span>
              </span>
              <ChevronDown size={16} aria-hidden className={cx('flex-shrink-0 text-[var(--text-dim)] transition-transform', expanded && 'rotate-180')} />
            </button>
            {expanded && (
              <div className="border-t border-[var(--border-ws)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                <p><span className="font-semibold text-[var(--text-primary)]">Why:</span> {d.why}</p>
                <p className="mt-1.5"><span className="font-semibold text-[var(--text-primary)]">How:</span> {d.guidance}</p>
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export function StudentPlanScreen() {
  const { state, dispatch } = useWingspan()
  const plan = state.studentPlan
  if (!plan) return null
  const name = plan.firstName ?? null

  const startOver = () => { cancelCareerPipeline(); dispatch({ type: 'RESET_FLOW' }) }
  const useFull = () => {
    if (!state.extractedData) return
    dispatch({ type: 'SET_SCREEN', screen: 'validating' })
    void runCareerPipeline(state.extractedData, state.interests, dispatch, { mode: 'professional' })
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto w-full max-w-4xl px-4 pb-48 pt-10 sm:px-6 sm:pb-40 md:pt-14">
        <header className="mb-10">
          <p className={h2}>{name ? `${name}, here is your Student Plan` : 'Your Student Plan'}</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-[var(--text-primary)] sm:text-4xl" style={{ fontFamily: 'var(--font-sora)' }}>{plan.edge.headline}</h1>
          <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">
            {name ? `${name}, I read through your work and checked it against what employers are saying about freshers right now. ` : 'Built from your own work and from dated, cited evidence about who is hiring freshers. '}Every statement shows where it came from, so you can check me.
          </p>
        </header>

        <div className="flex flex-col gap-12">
          <Section id="edge" title={name ? `What sets you apart, ${name}` : 'Your edge'}>
            <div className="grid gap-3 sm:grid-cols-3">
              {plan.edge.differentiators.map((d) => (
                <div key={d.title} className={card}>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--neon)]">{d.strength === 'demonstrated' ? 'Demonstrated' : 'Indicated'}</p>
                  <h3 className="mt-1 text-base font-semibold text-[var(--text-primary)]">{d.title}</h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{d.whyHirersCare}</p>
                </div>
              ))}
            </div>
            {plan.edge.alreadyProven.length > 0 && (
              <div className={card}>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Already proven</h3>
                <ul className="mt-2 flex flex-col gap-1.5 text-sm text-[var(--text-secondary)]">
                  {plan.edge.alreadyProven.map((p) => <li key={p.text} className="flex gap-2"><Check size={15} className="mt-0.5 flex-shrink-0 text-[var(--neon)]" aria-hidden />{p.text}</li>)}
                </ul>
              </div>
            )}
            {plan.edge.honestGaps.length > 0 && (
              <p className="text-sm text-[var(--text-secondary)]"><span className="font-semibold text-[var(--text-primary)]">What hirers may still want to see:</span> {plan.edge.honestGaps.join(' · ')}</p>
            )}
          </Section>

          <Section id="market" title="Where freshers are being hired">
            <ul className="flex flex-col gap-2 text-sm text-[var(--text-secondary)]">
              {plan.market.map((m) => <li key={m.text} className="rounded-[10px] border border-[var(--border-ws)] px-4 py-3"><ClaimText claim={m} /></li>)}
              {!plan.market.length && <li>No market statements could be backed by our sources this time.</li>}
            </ul>
          </Section>

          <Section id="lanes" title="Your two target lanes">
            <div className="grid gap-4 md:grid-cols-2">
              {plan.lanes.map((l) => (
                <div key={l.name} className={card}>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">{l.name}</h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{l.whyYou}</p>
                  <p className="mt-3 text-sm text-[var(--text-secondary)]"><span className="font-semibold text-[var(--text-primary)]">Demand:</span> <ClaimText claim={l.demand} /></p>
                  {l.whoHires.length > 0 && <p className="mt-3 text-sm text-[var(--text-secondary)]"><span className="font-semibold text-[var(--text-primary)]">Employers to watch:</span> {l.whoHires.map((w) => w.name).join(', ')}</p>}
                  {l.proofNeeded.length > 0 && (
                    <div className="mt-3 text-sm text-[var(--text-secondary)]"><span className="font-semibold text-[var(--text-primary)]">Proof this lane expects</span>
                      <ul className="mt-1 list-disc pl-5">{l.proofNeeded.map((x) => <li key={x}>{x}</li>)}</ul>
                    </div>
                  )}
                  {l.honestOdds && <p className="mt-3 text-sm text-[var(--text-secondary)]"><span className="font-semibold text-[var(--text-primary)]">Honest odds:</span> {l.honestOdds}</p>}
                </div>
              ))}
            </div>
            <div className={card}>
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--neon)]">Bridge job</p>
              <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{plan.bridge.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]"><ClaimText claim={{ ...plan.bridge.claim, text: plan.bridge.why }} /></p>
              {plan.bridge.whereToLook.length > 0 && <ul className="mt-2 list-disc pl-5 text-sm text-[var(--text-secondary)]">{plan.bridge.whereToLook.map((x) => <li key={x}>{x}</li>)}</ul>}
            </div>
          </Section>

          <Section id="openings" title="Openings we found">
            <p className="text-sm text-[var(--text-secondary)]">{plan.openingsNote}</p>
            {plan.openings.length > 0 && (
              <ul className="flex flex-col gap-2">
                {plan.openings.map((o) => (
                  <li key={o.sourceId} className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-[var(--border-ws)] px-4 py-3 text-sm">
                    <span>
                      <span className="font-semibold text-[var(--text-primary)]">{o.title}</span>
                      <span className="text-[var(--text-secondary)]"> · {o.company}{o.location ? ` · ${o.location}` : ''}</span>
                      <span className="block text-[12px] text-[var(--text-dim)]">{o.fresherFriendly ? 'Open to freshers' : `${o.seniority.toLowerCase()}${o.minYears !== null ? `, asks ${o.minYears}+ years` : ''}`} · {o.origin === 'MENTOR' ? `shared by your mentor${o.via ? `, seen on ${o.via}` : ''}` : 'read'} {o.retrievedAt} · {o.sourceId}</span>
                    </span>
                    {o.url
                      ? <a href={o.url} target="_blank" rel="noopener noreferrer" className={cx(quietButton, 'px-3 py-1.5 text-[13px]')}>View posting <ExternalLink size={13} aria-hidden /></a>
                      : <span className="text-[12px] text-[var(--text-dim)]">Ask your mentor for the link</span>}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[13px] text-[var(--text-dim)]">Also search by hand: Internshala and Unstop list many fresher design roles; we do not read them automatically.</p>
          </Section>

          <Section id="days" title={name ? `Your first 14 days, ${name}` : 'Your first 14 days'}>
            <p className="text-sm text-[var(--text-secondary)]">One action a day, up to 20 minutes. Your coach guides and nudges; applications and mock interviews are done with your mentor.</p>
            <Days plan={plan} />
          </Section>

          <Section id="caveats" title="Keep in mind">
            <ul className="list-disc pl-5 text-sm text-[var(--text-secondary)]">{plan.caveats.map((c) => <li key={c}>{c}</li>)}</ul>
          </Section>

          <Section id="sources" title="Sources">
            <SourceList plan={plan} />
            <button type="button" onClick={useFull} className={cx(quietButton, 'self-start text-[13px]')}>Not a student? Use the full career analysis instead</button>
          </Section>
        </div>
      </main>

      <FlowFooter
        tone="ready"
        message={name ? `${name}, your plan is ready` : 'Your plan is ready'}
        hint="Daily nudges and progress tracking are coming soon."
        actions={<>
          <CancelFlowButton onConfirm={startOver} label="Start over" />
          <button type="button" className={quietButton} onClick={() => downloadMarkdown(studentPlanToMarkdown(plan), 'wingspan-student-plan.md')}><Download size={15} aria-hidden /> Download plan</button>
          <button type="button" disabled className={primaryButton}>Start Day 1 <span className="ml-1 rounded-[6px] bg-[var(--surface-dim)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--text-dim)]">Coming soon</span></button>
        </>}
      />
    </MotionConfig>
  )
}
