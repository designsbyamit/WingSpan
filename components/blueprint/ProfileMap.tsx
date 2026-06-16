// components/blueprint/ProfileMap.tsx
import { Blueprint } from '@/types/wingspan'

export function ProfileMap({ blueprint }: { blueprint: Blueprint }) {
  const { profileMap } = blueprint
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic">
        "{profileMap.identityStatement}"
      </p>
      <div className="flex flex-wrap gap-2">
        {[...profileMap.industries, ...profileMap.platforms, ...profileMap.domains].map((tag) => (
          <span key={tag} className="text-xs px-2.5 py-1 rounded-md bg-[var(--surface)] border border-[var(--border-ws)] text-[var(--text-muted)]">
            {tag}
          </span>
        ))}
      </div>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
        {profileMap.careerEvolution}
      </p>
    </div>
  )
}
