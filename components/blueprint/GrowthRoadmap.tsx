// components/blueprint/GrowthRoadmap.tsx
'use client'
import { useState } from 'react'
import { Building2, Route, Signpost, Target } from 'lucide-react'
import { Blueprint, RoadmapMilestone } from '@/types/wingspan'
import { matchesPath } from '@/lib/path-match'
import { useWingspan } from '@/context/WingspanContext'
import { ActionsSection } from './ActionsSection'
import { SectionFrame, type SectionTab } from './shell/SectionFrame'
import { useShell } from './shell/ShellContext'
import { Badge, Block, Card, Chip, EmptyState, FieldLabel, INK, PrimaryButton } from './shell/ui'

type RoadmapTab = 'milestones' | 'actions'

function Positioning({ blueprint }: { blueprint: Blueprint }) {
  const p = blueprint.positioning
  if (!p) return null
  const companies = Array.isArray(p.targetCompanies) ? p.targetCompanies : []
  const identity = Array.isArray(p.targetIdentity) ? p.targetIdentity : []
  return (
    <Card className="p-6 sm:p-7 flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <span className={`shrink-0 w-10 h-10 rounded-[10px] bg-[var(--neon-surface)] border border-[var(--neon-border)] flex items-center justify-center ${INK}`}>
          <Target size={18} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] text-[var(--text-muted)]">Where you’re headed</p>
          <p className="text-[20px] font-semibold text-[var(--text-primary)] leading-snug mt-1" style={{ fontFamily: 'var(--font-sora)' }}>{p.targetRole}</p>
        </div>
      </div>
      {p.positioningStatement && (
        <blockquote className="border-l-2 border-[var(--neon)] pl-4 text-[15px] text-[var(--text-primary)] leading-[1.7] max-w-[64ch]">
          {p.positioningStatement}
        </blockquote>
      )}
      <div className="grid sm:grid-cols-2 gap-6">
        {companies.length > 0 && (
          <div>
            <FieldLabel><span className="inline-flex items-center gap-1.5"><Building2 size={13} aria-hidden />Companies to aim for</span></FieldLabel>
            <div className="flex flex-wrap gap-2">{companies.map(c => <Chip key={c}>{c}</Chip>)}</div>
          </div>
        )}
        {identity.length > 0 && (
          <div>
            <FieldLabel>How you’ll be known</FieldLabel>
            <div className="flex flex-wrap gap-2">{identity.map(c => <Chip key={c} accent>{c}</Chip>)}</div>
          </div>
        )}
      </div>
    </Card>
  )
}

function SkillList({ label, items, accent }: { label: string; items?: string[]; accent?: boolean }) {
  if (!items || items.length === 0) return null
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-wrap gap-2">{items.map(s => <Chip key={s} accent={accent}>{s}</Chip>)}</div>
    </div>
  )
}

function Milestone({ m, index, isLast }: { m: RoadmapMilestone; index: number; isLast: boolean }) {
  const actions = Array.isArray(m.actions) ? m.actions : []
  return (
    <li className="grid grid-cols-[28px_1fr] sm:grid-cols-[96px_28px_1fr] gap-x-4">
      <p className={`hidden sm:block pt-1 text-right text-[13px] font-semibold ${index === 0 ? INK : 'text-[var(--text-secondary)]'}`}>{m.phase}</p>
      <span className="flex flex-col items-center" aria-hidden>
        <span className={`mt-1 w-7 h-7 rounded-full border text-[12px] font-semibold flex items-center justify-center tabular-nums ${
          index === 0 ? 'bg-[var(--neon)] border-[var(--neon)] text-[#0a0a0a]' : 'bg-[var(--surface)] border-[var(--border-ws)] text-[var(--text-secondary)]'
        }`}>{index + 1}</span>
        {!isLast && <span className="w-px flex-1 bg-[var(--border-ws)] my-1.5" />}
      </span>
      <div className="pb-8 min-w-0">
        <p className={`sm:hidden text-[13px] font-semibold mb-2 ${index === 0 ? INK : 'text-[var(--text-secondary)]'}`}>{m.phase}</p>
        <Card className="p-5 flex flex-col gap-5">
          {actions.length > 0 && (
            <ul className="flex flex-col gap-2.5">
              {actions.map((a, i) => (
                <li key={i} className="flex gap-3 text-[14px] text-[var(--text-primary)] leading-relaxed">
                  <span className="mt-[8px] w-1.5 h-1.5 rounded-full bg-[var(--neon)] shrink-0" aria-hidden />{a}
                </li>
              ))}
            </ul>
          )}
          {(m.hardSkills?.length || m.softSkills?.length || m.positioningMoves?.length) ? (
            <div className="grid sm:grid-cols-3 gap-5 pt-5 border-t border-[var(--border-ws)]">
              <SkillList label="Hard skills" items={m.hardSkills} accent />
              <SkillList label="Soft skills" items={m.softSkills} />
              <SkillList label="Positioning" items={m.positioningMoves} />
            </div>
          ) : null}
        </Card>
      </div>
    </li>
  )
}

export function GrowthRoadmap({ blueprint }: { blueprint: Blueprint }) {
  const { state } = useWingspan()
  const { goTo } = useShell()
  const selectedPath = state.selectedPath
  const [tab, setTab] = useState<RoadmapTab>('milestones')

  if (!selectedPath) {
    return (
      <SectionFrame section="roadmap" tabs={[]} activeTab="" onTabChange={() => {}}>
        <EmptyState
          icon={Signpost}
          title="Choose a path to build your roadmap"
          body="The roadmap is sequenced for one direction. Pick it in Future Paths."
          action={<PrimaryButton onClick={() => goTo('path-selection')}>Go to Future Paths</PrimaryButton>}
        />
      </SectionFrame>
    )
  }

  const milestones = Array.isArray(blueprint.roadmapMilestones) ? blueprint.roadmapMilestones : []
  const a = blueprint.actions ?? { immediate: [], mediumTerm: [], longTerm: [], resources: [] }
  const actions = {
    immediate: (a.immediate ?? []).filter(x => matchesPath(x.pathway, selectedPath)),
    mediumTerm: (a.mediumTerm ?? []).filter(x => matchesPath(x.pathway, selectedPath)),
    longTerm: (a.longTerm ?? []).filter(x => matchesPath(x.pathway, selectedPath)),
  }
  const actionCount = actions.immediate.length + actions.mediumTerm.length + actions.longTerm.length

  const tabs: SectionTab[] = [
    { id: 'milestones', label: 'Milestones', count: milestones.length },
    { id: 'actions', label: 'Actions', count: actionCount },
  ]

  return (
    <SectionFrame
      section="roadmap"
      context={<Badge tone="accent">For {selectedPath}</Badge>}
      stat={actionCount ? { value: actionCount, label: actionCount === 1 ? 'action to take' : 'actions to take' } : null}
      tabs={tabs}
      activeTab={tab}
      onTabChange={id => setTab(id as RoadmapTab)}
    >
      {tab === 'milestones' && (
        <>
          <Positioning blueprint={blueprint} />
          {milestones.length === 0 ? (
            <EmptyState icon={Route} title="No milestones yet" body="Your concrete next steps are under Actions." />
          ) : (
            <Block title="Milestones" description="What to have done by each point, from today onward.">
              <ol className="flex flex-col">
                {milestones.map((m, i) => <Milestone key={`${m.phase}-${i}`} m={m} index={i} isLast={i === milestones.length - 1} />)}
              </ol>
            </Block>
          )}
        </>
      )}
      {tab === 'actions' && <ActionsSection actions={actions} />}
    </SectionFrame>
  )
}
