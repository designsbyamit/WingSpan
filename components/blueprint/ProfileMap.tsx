// components/blueprint/ProfileMap.tsx
'use client'
import { Blueprint, ExtractedCareerData } from '@/types/wingspan'

const SKILL_DOMAINS = [
  'Experience Strategy', 'Design Leadership', 'UX Research',
  'Information Architecture', 'Design Systems', 'DesignOps',
  'Generative AI', 'Product Mindset', 'Service Design',
]

const DESIGN_TOOLS = [
  'Figma', 'Framer', 'Miro', 'FigJam', 'Adobe CC',
  'JIRA', 'Notion', 'Google Analytics',
]

interface ProfileMapProps {
  blueprint: Blueprint
  extractedData?: ExtractedCareerData
}

function Chip({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span className={`
      inline-block px-3 py-1.5 rounded-[8px] text-xs font-medium border
      ${accent
        ? 'bg-[var(--neon-surface)] text-[var(--neon)] border-[var(--neon-border)]'
        : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border-ws)]'
      }
    `}>
      {label}
    </span>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold tracking-[2.5px] uppercase text-[var(--text-muted)] mb-3">
      {children}
    </p>
  )
}

export function ProfileMap({ blueprint, extractedData }: ProfileMapProps) {
  const { profileMap } = blueprint

  const allSkills = extractedData?.skills ?? []
  const tools = allSkills.filter(s => DESIGN_TOOLS.includes(s)).length > 0
    ? allSkills.filter(s => DESIGN_TOOLS.includes(s))
    : DESIGN_TOOLS.filter(t => ['Figma', 'Framer', 'Miro', 'Adobe CC', 'JIRA', 'Notion'].includes(t))

  const skillDomains = allSkills.filter(s => !DESIGN_TOOLS.includes(s)).length > 0
    ? allSkills.filter(s => !DESIGN_TOOLS.includes(s)).slice(0, 12)
    : SKILL_DOMAINS

  const projects = extractedData?.projects ?? []
  const leadershipRoles = extractedData?.timeline?.filter(t =>
    t.role.toLowerCase().includes('lead') ||
    t.role.toLowerCase().includes('manager') ||
    t.role.toLowerCase().includes('director') ||
    t.role.toLowerCase().includes('head')
  ).length ?? 2

  const industryList = profileMap.industries

  return (
    <div className="flex flex-col gap-10">

      {/* Hero stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: profileMap.yearsOfExperience, label: 'Years Experience' },
          { value: industryList.length, label: 'Industries' },
          { value: profileMap.domains.length, label: 'Skill Domains' },
        ].map(({ value, label }) => (
          <div key={label} className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-4 text-center">
            <div
              className="text-3xl font-bold text-[var(--neon)]"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              {value}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Career Summary */}
      <div>
        <SectionLabel>Career Summary</SectionLabel>
        <p className="text-base text-[var(--text-secondary)] leading-relaxed" style={{ fontFamily: 'var(--font-jakarta)' }}>
          {profileMap.careerEvolution}
        </p>
      </div>

      {/* Experience Snapshot */}
      <div>
        <SectionLabel>Experience Snapshot</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: `${profileMap.yearsOfExperience}+`, label: 'Years of Experience' },
            { value: industryList.length, label: 'Industries Worked In' },
            { value: projects.length || '7+', label: 'Projects Completed' },
            { value: leadershipRoles, label: 'Leadership Roles' },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-[10px] bg-[var(--surface)] border border-[var(--border-ws)] p-3 flex items-center gap-3">
              <span className="text-lg font-bold text-[var(--neon)]" style={{ fontFamily: 'var(--font-sora)' }}>
                {value}
              </span>
              <span className="text-xs text-[var(--text-muted)] leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Industries */}
      <div>
        <SectionLabel>Industries</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {industryList.map(ind => <Chip key={ind} label={ind} />)}
        </div>
      </div>

      {/* Skill Domains */}
      <div>
        <SectionLabel>Skill Domains</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {skillDomains.map(skill => <Chip key={skill} label={skill} accent />)}
        </div>
      </div>

      {/* Tools */}
      <div>
        <SectionLabel>Tools</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {tools.map(tool => <Chip key={tool} label={tool} />)}
        </div>
      </div>

      {/* Projects */}
      {projects.length > 0 && (
        <div>
          <SectionLabel>Project Repository</SectionLabel>
          <div className="flex flex-col gap-3">
            {projects.map(p => (
              <div key={p.id || p.name} className="rounded-[10px] bg-[var(--surface)] border border-[var(--border-ws)] p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>
                    {p.name}
                  </span>
                  {p.audience && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border-ws)] text-[var(--text-muted)] flex-shrink-0">
                      {p.audience}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-muted)] mb-2">{p.company}{p.year ? ` · ${p.year}` : ''}{p.industry ? ` · ${p.industry}` : ''}</p>
                {p.summary && <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-2">{p.summary}</p>}
                {p.impact && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold tracking-[1px] uppercase text-[var(--text-muted)]">Impact</span>
                    <span className="text-xs font-semibold text-[var(--neon)]">{p.impact}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
