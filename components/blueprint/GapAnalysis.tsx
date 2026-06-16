// components/blueprint/GapAnalysis.tsx
import { Blueprint } from '@/types/wingspan'
import { ProgressBar } from '@/components/ui/ProgressBar'

export function GapAnalysis({ blueprint }: { blueprint: Blueprint }) {
  const { gaps } = blueprint

  const gapColor = (size: 'small' | 'medium' | 'large') =>
    size === 'small' ? 'text-[var(--neon)]' : size === 'medium' ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="flex flex-col gap-6">
      {gaps.map((gap) => (
        <div key={gap.pathway} className="rounded-[10px] bg-[var(--surface)] border border-[var(--border-ws)] p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">{gap.pathway}</h4>
            <span className={`text-xs font-bold capitalize ${gapColor(gap.gapSize)}`}>
              {gap.gapSize} gap
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <ProgressBar value={gap.currentReadiness} label="Current readiness" showLabel />
            <ProgressBar value={gap.futureReadiness} label="Required readiness" showLabel />
          </div>
          <div className="flex gap-4 text-xs text-[var(--text-muted)]">
            <span>Timeline: <span className="text-[var(--text-secondary)]">{gap.timeline}</span></span>
            <span>Effort: <span className="text-[var(--text-secondary)]">{gap.effort}</span></span>
          </div>
          <div className="flex flex-wrap gap-1">
            {gap.requiredCapabilities.map((cap) => (
              <span key={cap} className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border-ws)] text-[var(--text-muted)]">
                {cap}
              </span>
            ))}
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{gap.howToClose}</p>
        </div>
      ))}
    </div>
  )
}
