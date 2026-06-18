'use client'
import { Blueprint } from '@/types/wingspan'
import { useWingspan } from '@/context/WingspanContext'
import { ActionsSection } from './ActionsSection'

export function GrowthRoadmap({ blueprint }: { blueprint: Blueprint }) {
  const { state } = useWingspan()
  const selectedPath = state.selectedPath

  if (!selectedPath) {
    return (
      <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-8 text-center">
        <p className="text-sm text-[var(--text-muted)]">Select a future path first to see your personalised roadmap.</p>
      </div>
    )
  }

  const { actions } = blueprint
  const filteredBlueprint = {
    ...blueprint,
    actions: {
      ...actions,
      immediate: actions.immediate.filter(a =>
        !a.pathway || a.pathway === selectedPath || a.pathway.includes(selectedPath.split('/')[0].trim())
      ),
      mediumTerm: actions.mediumTerm.filter(a =>
        !a.pathway || a.pathway === selectedPath || a.pathway.includes(selectedPath.split('/')[0].trim())
      ),
      longTerm: actions.longTerm.filter(a =>
        !a.pathway || a.pathway === selectedPath || a.pathway.includes(selectedPath.split('/')[0].trim())
      ),
      resources: actions.resources.filter(r =>
        !r.pathway || r.pathway === selectedPath || r.pathway.includes(selectedPath.split('/')[0].trim())
      ),
    },
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-[10px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">Roadmap for</p>
        <p className="text-base font-bold text-[var(--neon)]" style={{ fontFamily: 'var(--font-sora)' }}>
          {selectedPath}
        </p>
      </div>
      <ActionsSection blueprint={filteredBlueprint} />
    </div>
  )
}
