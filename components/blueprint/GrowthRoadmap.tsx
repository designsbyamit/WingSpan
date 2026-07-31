// components/blueprint/GrowthRoadmap.tsx
'use client'
import { Blueprint, RoadmapMilestone } from '@/types/wingspan'
import { useWingspan } from '@/context/WingspanContext'
import { ActionsSection } from './ActionsSection'
import { Target, Building2, User, ArrowDown } from 'lucide-react'

const PHASE_COLORS: Record<string, string> = {
  'Today':      'bg-[var(--neon)] text-[#0a0a0a]',
  '30 Days':    'bg-[var(--neon-surface)] text-[var(--neon)] border border-[var(--neon-border)]',
  '90 Days':    'bg-[var(--neon-surface)] text-[var(--neon)] border border-[var(--neon-border)]',
  '6 Months':   'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-ws)]',
  '12 Months':  'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-ws)]',
  '18 Months':  'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-ws)]',
}

function PositioningSection({ blueprint }: { blueprint: Blueprint }) {
  const { positioning } = blueprint
  if (!positioning) return null

  return (
    <div className="rounded-[16px] bg-[var(--card-inner)] border border-[var(--border-ws)] p-5 flex flex-col gap-4">
      <p className="text-[10px] font-bold tracking-[2.5px] uppercase text-[var(--text-muted)]">Where you're headed</p>

      <div className="flex gap-3">
        <div className="flex-shrink-0 w-7 h-7 rounded-[8px] bg-[var(--neon-surface)] border border-[var(--neon-border)] flex items-center justify-center text-[var(--neon)]">
          <Target size={13} />
        </div>
        <div>
          <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">Aiming for</p>
          <p className="text-sm font-bold text-[var(--neon)]" style={{ fontFamily: 'var(--font-sora)' }}>
            {positioning.targetRole}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-shrink-0 w-7 h-7 rounded-[8px] bg-[var(--surface)] border border-[var(--border-ws)] flex items-center justify-center text-[var(--text-muted)]">
          <Building2 size={13} />
        </div>
        <div>
          <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-2">Target Companies</p>
          <div className="flex flex-wrap gap-1.5">
            {positioning.targetCompanies.map(c => (
              <span key={c} className="text-xs px-2.5 py-1 rounded-[6px] bg-[var(--surface)] border border-[var(--border-ws)] text-[var(--text-secondary)]">{c}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-shrink-0 w-7 h-7 rounded-[8px] bg-[var(--surface)] border border-[var(--border-ws)] flex items-center justify-center text-[var(--text-muted)]">
          <User size={13} />
        </div>
        <div>
          <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-2">Target Identity</p>
          <div className="flex flex-wrap gap-1.5">
            {positioning.targetIdentity.map(id => (
              <span key={id} className="text-xs px-2.5 py-1 rounded-[6px] bg-[var(--neon-surface)] border border-[var(--neon-border)] text-[var(--neon)]">{id}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[10px] bg-[var(--surface)] border border-[var(--border-ws)] p-3">
        <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">Positioning Statement</p>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic">"{positioning.positioningStatement}"</p>
      </div>
    </div>
  )
}

function MilestoneCard({ milestone, isLast }: { milestone: RoadmapMilestone; isLast: boolean }) {
  const phaseCls = PHASE_COLORS[milestone.phase] ?? PHASE_COLORS['6 Months']

  return (
    <div className="flex gap-4">
      {/* Spine */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${phaseCls}`}>
          {milestone.phase}
        </div>
        {!isLast && (
          <div className="flex flex-col items-center gap-1 py-2">
            <div className="w-[1px] h-4 bg-[var(--border-ws)]" />
            <ArrowDown size={10} className="text-[var(--border-ws)]" />
            <div className="w-[1px] h-4 bg-[var(--border-ws)]" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-2">
        <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-4 flex flex-col gap-3 mb-2">
          <div>
            <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-2">Actions</p>
            <ul className="flex flex-col gap-1.5">
              {milestone.actions.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                  <span className="text-[var(--neon)] mt-0.5 flex-shrink-0">→</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>

          {milestone.hardSkills && milestone.hardSkills.length > 0 && (
            <div>
              <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1.5">Hard Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {milestone.hardSkills.map(s => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-[5px] bg-[var(--neon-surface)] border border-[var(--neon-border)] text-[var(--neon)]">{s}</span>
                ))}
              </div>
            </div>
          )}

          {milestone.softSkills && milestone.softSkills.length > 0 && (
            <div>
              <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1.5">Soft Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {milestone.softSkills.map(s => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-[5px] bg-[var(--surface)] border border-[var(--border-ws)] text-[var(--text-muted)]">{s}</span>
                ))}
              </div>
            </div>
          )}

          {milestone.positioningMoves && milestone.positioningMoves.length > 0 && (
            <div>
              <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1.5">Positioning</p>
              <div className="flex flex-wrap gap-1.5">
                {milestone.positioningMoves.map(m => (
                  <span key={m} className="text-[10px] px-2 py-0.5 rounded-[5px] bg-blue-950/30 border border-blue-800/50 text-blue-400">{m}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function GrowthRoadmap({ blueprint }: { blueprint: Blueprint }) {
  const { state } = useWingspan()
  const selectedPath = state.selectedPath

  if (!selectedPath) {
    return (
      <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-8 text-center">
        <p className="text-sm text-[var(--text-muted)]">Pick a direction first and we'll build your roadmap.</p>
      </div>
    )
  }

  const milestones = blueprint.roadmapMilestones
  const { actions } = blueprint
  const filteredBlueprint = {
    ...blueprint,
    actions: {
      ...actions,
      immediate: actions.immediate.filter(a => a.pathway === selectedPath || a.pathway.includes(selectedPath.split('/')[0].trim())),
      mediumTerm: actions.mediumTerm.filter(a => a.pathway === selectedPath || a.pathway.includes(selectedPath.split('/')[0].trim())),
      longTerm: actions.longTerm.filter(a => a.pathway === selectedPath || a.pathway.includes(selectedPath.split('/')[0].trim())),
      resources: actions.resources.filter(r => r.pathway === selectedPath || r.pathway.includes(selectedPath.split('/')[0].trim())),
    },
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Path label */}
      <div>
        <p className="text-[10px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">Your roadmap toward</p>
        <p className="text-base font-bold text-[var(--neon)]" style={{ fontFamily: 'var(--font-sora)' }}>
          {selectedPath}
        </p>
      </div>

      {/* Positioning strategy */}
      <PositioningSection blueprint={blueprint} />

      {/* Visual milestone timeline */}
      {milestones && milestones.length > 0 && (
        <div>
          <p className="text-[10px] font-bold tracking-[2.5px] uppercase text-[var(--text-muted)] mb-4">Timeline</p>
          <div className="flex flex-col">
            {milestones.map((milestone, idx) => (
              <MilestoneCard key={milestone.phase} milestone={milestone} isLast={idx === milestones.length - 1} />
            ))}
          </div>
        </div>
      )}

      {/* Detailed actions */}
      {(filteredBlueprint.actions.immediate.length > 0 ||
        filteredBlueprint.actions.mediumTerm.length > 0 ||
        filteredBlueprint.actions.longTerm.length > 0) && (
        <div>
          <p className="text-[10px] font-bold tracking-[2.5px] uppercase text-[var(--text-muted)] mb-4">The actual steps</p>
          <ActionsSection blueprint={filteredBlueprint} />
        </div>
      )}
    </div>
  )
}
