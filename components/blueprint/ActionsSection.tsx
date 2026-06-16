// components/blueprint/ActionsSection.tsx
import { Blueprint, Action } from '@/types/wingspan'
import { ExternalLink } from 'lucide-react'

function ActionGroup({ title, actions }: { title: string; actions: Action[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">{title}</h3>
      {actions.map((action) => (
        <div key={action.title} className="rounded-[10px] bg-[var(--surface)] border border-[var(--border-ws)] p-3 flex flex-col gap-1">
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-[var(--text-primary)]">{action.title}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
              action.priority === 'high'
                ? 'bg-[var(--neon-surface)] text-[var(--neon)] border border-[var(--neon-border)]'
                : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border-ws)]'
            }`}>
              {action.priority}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{action.description}</p>
          <p className="text-xs text-[var(--text-muted)] italic">Outcome: {action.measurable}</p>
        </div>
      ))}
    </div>
  )
}

export function ActionsSection({ blueprint }: { blueprint: Blueprint }) {
  const { actions } = blueprint

  return (
    <div className="flex flex-col gap-8">
      <ActionGroup title="Immediate Actions" actions={actions.immediate} />
      <ActionGroup title="Medium-Term Actions" actions={actions.mediumTerm} />
      <ActionGroup title="Long-Term Actions" actions={actions.longTerm} />

      {actions.resources.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">Resources</h3>
          {actions.resources.map((resource) => (
            <div key={resource.title} className="rounded-[10px] bg-[var(--surface)] border border-[var(--border-ws)] p-3 flex justify-between items-center">
              <div>
                <span className="text-xs text-[#888] capitalize">{resource.type} · </span>
                <span className="text-sm text-[var(--text-primary)]">{resource.title}</span>
              </div>
              {resource.url && (
                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-[var(--neon)] hover:opacity-80">
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
