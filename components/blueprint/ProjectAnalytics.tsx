'use client'
import { Project } from '@/types/wingspan'

interface AnalyticsStat {
  label: string
  value: string | number
  sub?: string
}

function StatCard({ stat }: { stat: AnalyticsStat }) {
  return (
    <div className="rounded-[10px] bg-[var(--surface)] border border-[var(--border-ws)] p-3 flex flex-col gap-1">
      <span className="text-xl font-bold text-[var(--neon)]" style={{ fontFamily: 'var(--font-sora)' }}>
        {stat.value}
      </span>
      <span className="text-xs text-[var(--text-secondary)]">{stat.label}</span>
      {stat.sub && <span className="text-[10px] text-[var(--text-muted)]">{stat.sub}</span>}
    </div>
  )
}

function BarChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="flex flex-col gap-2">
      {data.map(({ label, count }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-[11px] text-[var(--text-muted)] w-32 flex-shrink-0 truncate">{label}</span>
          <div className="flex-1 h-[6px] rounded-full bg-[var(--border-ws)]">
            <div
              className="h-full rounded-full bg-[var(--neon)] transition-all duration-700"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] tabular-nums w-4 text-right">{count}</span>
        </div>
      ))}
    </div>
  )
}

function countBy<T>(items: T[], key: (item: T) => string | undefined): { label: string; count: number }[] {
  const counts: Record<string, number> = {}
  items.forEach(item => {
    const val = key(item) ?? 'Unknown'
    counts[val] = (counts[val] ?? 0) + 1
  })
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
}

interface ProjectAnalyticsProps {
  projects: Project[]
}

export function ProjectAnalytics({ projects }: ProjectAnalyticsProps) {
  if (projects.length === 0) {
    return (
      <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-8 text-center">
        <p className="text-sm text-[var(--text-muted)]">No projects to analyse yet.</p>
      </div>
    )
  }

  const b2bCount = projects.filter(p => p.audience === 'B2B').length
  const b2cCount = projects.filter(p => p.audience === 'B2C').length
  const leadershipCount = projects.filter(p =>
    (p.summary ?? '').toLowerCase().includes('lead') ||
    (p.impact ?? '').toLowerCase().includes('lead')
  ).length
  const aiCount = projects.filter(p =>
    (p.industry ?? '').toLowerCase().includes('ai') ||
    (p.summary ?? '').toLowerCase().includes('ai') ||
    (p.summary ?? '').toLowerCase().includes('machine learning')
  ).length
  const dsCount = projects.filter(p =>
    (p.industry ?? '').toLowerCase().includes('design system') ||
    (p.platform ?? '').toLowerCase().includes('design system') ||
    (p.summary ?? '').toLowerCase().includes('design system')
  ).length

  const stats: AnalyticsStat[] = [
    { label: 'Total Projects', value: projects.length },
    { label: 'B2B Projects', value: b2bCount, sub: `${Math.round((b2bCount / projects.length) * 100)}% of total` },
    { label: 'B2C Projects', value: b2cCount, sub: `${Math.round((b2cCount / projects.length) * 100)}% of total` },
    { label: 'AI Projects', value: aiCount },
    { label: 'Design System Work', value: dsCount },
    { label: 'Leadership Projects', value: leadershipCount },
  ]

  const industryDist = countBy(projects, p => p.industry)
  const companyDist = countBy(projects, p => p.company)
  const platformDist = countBy(projects, p => p.platform)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[10px] font-bold tracking-[2.5px] uppercase text-[var(--text-muted)] mb-3">Overview</p>
        <div className="grid grid-cols-3 gap-2">
          {stats.map(stat => <StatCard key={stat.label} stat={stat} />)}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold tracking-[2.5px] uppercase text-[var(--text-muted)] mb-3">By Industry</p>
        <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-4">
          <BarChart data={industryDist} />
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold tracking-[2.5px] uppercase text-[var(--text-muted)] mb-3">By Platform</p>
        <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-4">
          <BarChart data={platformDist} />
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold tracking-[2.5px] uppercase text-[var(--text-muted)] mb-3">By Company</p>
        <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-4">
          <BarChart data={companyDist} />
        </div>
      </div>
    </div>
  )
}
