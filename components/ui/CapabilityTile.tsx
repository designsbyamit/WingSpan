// components/ui/CapabilityTile.tsx
'use client'

interface CapabilityTileProps {
  label: string
  accent?: boolean
}

export function CapabilityTile({ label, accent }: CapabilityTileProps) {
  return (
    <div className={`
      rounded-[8px] border px-3 py-2.5 text-xs font-semibold
      flex items-center justify-center text-center min-w-[90px]
      ${accent
        ? 'bg-[var(--neon-surface)] text-[var(--neon)] border-[var(--neon-border)]'
        : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border-ws)]'
      }
    `}>
      {label}
    </div>
  )
}
