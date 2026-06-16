// components/blueprint/CareerIntelligence.tsx
import { Blueprint } from '@/types/wingspan'
import { InsightCard } from '@/components/ui/InsightCard'

export function CareerIntelligence({ blueprint }: { blueprint: Blueprint }) {
  const { strengths, interests, futurePaths } = blueprint

  const sizeCls = (freq: number) =>
    freq >= 8 ? 'text-base' : freq >= 5 ? 'text-sm' : 'text-xs'

  return (
    <div className="flex flex-col gap-8">
      {/* Strengths */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">Strength Landscape</h3>
        {strengths.map((s) => (
          <InsightCard
            key={s.name}
            name={s.name}
            confidence={s.confidence}
            evidence={s.evidence}
            rationale={s.rationale}
            projects={s.projects}
            projectCount={s.projectCount}
          />
        ))}
      </div>

      {/* Interests */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">Interest Landscape</h3>
        <div className="flex flex-wrap gap-2">
          {interests.map((i) => (
            <span
              key={i.name}
              title={i.evidence}
              className={`${sizeCls(i.frequency)} font-medium px-3 py-1.5 rounded-[8px] bg-[var(--neon-surface)] text-[var(--neon)] border border-[var(--neon-border)] cursor-default`}
            >
              {i.name}
            </span>
          ))}
        </div>
      </div>

      {/* Future Paths */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">Future Paths</h3>
        {futurePaths.map((path) => (
          <div key={path.title} className="rounded-[10px] bg-[var(--surface)] border border-[var(--border-ws)] p-4 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">{path.title}</h4>
              <span className="text-xs font-bold text-[var(--neon)] tabular-nums" style={{ textShadow: '0 0 8px var(--neon-glow)' }}>
                {path.confidence}%
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{path.whyItFits}</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--neon-surface)] text-[var(--neon)] border border-[var(--neon-border)] capitalize">
                {path.opportunitySize}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
