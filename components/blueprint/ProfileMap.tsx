// components/blueprint/ProfileMap.tsx
'use client'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Pencil, LayoutGrid, Table2, BarChart3, Clock, Link2, Download, ChevronDown, FolderOpen, GraduationCap, Loader2 } from 'lucide-react'
import { Blueprint, ExtractedCareerData, ProjectView, Project } from '@/types/wingspan'
import { ToolLogo } from '@/components/ui/ToolLogo'
import { ProjectEditModal } from '@/components/blueprint/ProjectEditModal'
import { ProjectAnalytics } from '@/components/blueprint/ProjectAnalytics'
import { useWingspan } from '@/context/WingspanContext'
import { SectionFrame, type SectionTab } from './shell/SectionFrame'
import { Block, Card, Chip, EmptyState, Figure, FOCUS_RING, INK, PrimaryButton, SecondaryButton } from './shell/ui'

const DESIGN_TOOLS = [
  'Figma', 'Framer', 'Miro', 'FigJam', 'Adobe CC', 'JIRA', 'Notion', 'Google Analytics',
  'ChatGPT', 'Cursor', 'GitHub', 'Slack', 'Typeform',
]

const VIEW_TABS: { id: ProjectView; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'card',      label: 'Cards',     icon: LayoutGrid },
  { id: 'grid',      label: 'Table',     icon: Table2 },
  { id: 'timeline',  label: 'Timeline',  icon: Clock },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
]

const URL_NUDGES = [
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/yourname' },
  { key: 'portfolio', label: 'Portfolio', placeholder: 'yourportfolio.com' },
  { key: 'github', label: 'GitHub', placeholder: 'github.com/yourname' },
  { key: 'behance', label: 'Behance', placeholder: 'behance.net/yourname' },
]

const inputCls = `w-full h-10 bg-[var(--bg)] border border-[var(--border-ws)] rounded-[10px] px-3 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] ${FOCUS_RING}`

type ProfileTab = 'summary' | 'skills' | 'projects' | 'education'

interface ProfileMapProps {
  blueprint: Blueprint
  extractedData?: ExtractedCareerData
}

/** Splits long prose into short paragraphs of ~2 sentences. */
function paragraphs(text: string): string[] {
  return (text ?? '')
    .split(/(?<=[.!?])\s+/)
    .reduce<string[][]>((acc, sentence) => {
      const last = acc[acc.length - 1]
      if (!last || last.join(' ').length > 160) acc.push([sentence]); else last.push(sentence)
      return acc
    }, [])
    .map(s => s.join(' '))
    .filter(Boolean)
}

// ── Summary ─────────────────────────────────────────────────────────────────

function Disclosure({ icon: Icon, title, body, children }: { icon: typeof Link2; title: string; body: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-4 p-4 sm:p-5 text-left rounded-[14px] ${FOCUS_RING} focus-visible:ring-offset-0`}
      >
        <span className={`shrink-0 w-9 h-9 rounded-[10px] bg-[var(--surface-dim)] flex items-center justify-center ${INK}`}>
          <Icon size={16} aria-hidden />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[14px] font-semibold text-[var(--text-primary)]">{title}</span>
          <span className="block text-[13px] text-[var(--text-muted)] mt-0.5">{body}</span>
        </span>
        <ChevronDown size={16} className={`shrink-0 text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[var(--border-ws)]"
          >
            <div className="p-4 sm:p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

function LinksNudge() {
  const { state, dispatch } = useWingspan()
  if (Object.values(state.urls).some(v => v)) return null
  return (
    <Disclosure icon={Link2} title="Add your online presence" body="LinkedIn, portfolio or GitHub give the analysis a fuller picture next time you run it.">
      <div className="grid sm:grid-cols-2 gap-4">
        {URL_NUDGES.map(({ key, label, placeholder }) => (
          <label key={key} className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-[var(--text-muted)]">{label}</span>
            <input
              type="url"
              placeholder={placeholder}
              value={state.urls[key] ?? ''}
              onChange={(e) => dispatch({ type: 'SET_URL', key, value: e.target.value })}
              className={inputCls}
            />
          </label>
        ))}
      </div>
    </Disclosure>
  )
}

function TemplateNudge({ count }: { count: number }) {
  return (
    <Disclosure
      icon={Download}
      title={`We found ${count} project${count === 1 ? '' : 's'} in your resume`}
      body="More projects make the Blueprint sharper. Use the template to document them."
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <a
          href="/api/template"
          download
          className={`inline-flex items-center justify-center gap-2 h-10 px-4 rounded-[10px] bg-[var(--neon)] text-[#0a0a0a] text-[13px] font-bold ${FOCUS_RING}`}
        >
          <Download size={14} aria-hidden />
          Download template
        </a>
        <p className="text-[13px] text-[var(--text-muted)]">Fill it in and upload it on the Footprint screen.</p>
      </div>
    </Disclosure>
  )
}

function SummaryTab({ blueprint, projects, timeline }: { blueprint: Blueprint; projects: Project[]; timeline: ExtractedCareerData['timeline'] }) {
  const { state, dispatch } = useWingspan()
  const { profileMap } = blueprint
  const [refineOpen, setRefineOpen] = useState(false)
  const [refineDraft, setRefineDraft] = useState('')
  const [refining, setRefining] = useState(false)
  const [refineError, setRefineError] = useState('')

  const metrics = (profileMap.metrics && profileMap.metrics.length > 0 ? profileMap.metrics : [
    { label: 'Years of experience', value: profileMap.yearsOfExperience, highlight: true },
    { label: 'Industries', value: profileMap.industries?.length ?? 0 },
    { label: 'Skill domains', value: profileMap.domains?.length ?? 0 },
    ...(projects.length ? [{ label: 'Projects', value: projects.length }] : []),
  ]).slice(0, 4)

  const handleRefine = async () => {
    if (!refineDraft.trim()) return
    setRefineError(''); setRefining(true)
    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'profile', blueprint, instruction: refineDraft, careerAlpha: state.careerAlpha }),
      })
      const data = await res.json()
      if (!res.ok || !data.refined) { setRefineError(data.error ?? 'Could not update the summary. Try again.'); return }
      dispatch({ type: 'SET_BLUEPRINT', blueprint: { ...blueprint, profileMap: { ...blueprint.profileMap, ...data.refined } } })
      setRefineDraft(''); setRefineOpen(false)
    } catch {
      setRefineError('Could not update the summary. Check your connection and try again.')
    } finally { setRefining(false) }
  }

  return (
    <>
      {/* KPIs */}
      <Card className="grid grid-cols-2 sm:grid-cols-4 divide-[var(--border-ws)] overflow-hidden">
        {metrics.map((m, i) => (
          <div key={m.label} className={`p-5 border-[var(--border-ws)] ${i % 2 === 1 ? 'border-l' : ''} ${i >= 2 ? 'border-t sm:border-t-0' : ''} ${i === 2 ? 'sm:border-l' : ''}`}>
            <Figure value={m.value} label={m.label} accent={!!m.highlight && i === 0} />
          </div>
        ))}
      </Card>

      {/* Identity + career summary */}
      <Block
        title="Career summary"
        action={
          <SecondaryButton onClick={() => setRefineOpen(o => !o)} className="h-9 px-3">
            <Pencil size={13} aria-hidden />{refineOpen ? 'Close' : 'Add context'}
          </SecondaryButton>
        }
      >
        {profileMap.identityStatement && (
          <p className="text-[19px] sm:text-[21px] leading-[1.45] text-[var(--text-primary)] max-w-[60ch]" style={{ fontFamily: 'var(--font-sora)' }}>
            {profileMap.identityStatement}
          </p>
        )}
        <div className="flex flex-col gap-3 max-w-[68ch]">
          {paragraphs(profileMap.careerEvolution).map((p, i) => (
            <p key={i} className="text-[15px] text-[var(--text-secondary)] leading-[1.7]">{p}</p>
          ))}
        </div>
        <AnimatePresence initial={false}>
          {refineOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <Card tone="quiet" className="p-4 flex flex-col gap-3">
                <label htmlFor="profile-refine" className="text-[13px] font-semibold text-[var(--text-secondary)]">What should the summary also reflect?</label>
                <textarea
                  id="profile-refine"
                  value={refineDraft}
                  onChange={e => setRefineDraft(e.target.value)}
                  placeholder="e.g. I also led a team of 8. My main focus has been healthcare UX."
                  rows={3}
                  className={`w-full bg-[var(--bg)] border border-[var(--border-ws)] rounded-[10px] px-3 py-2.5 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none ${FOCUS_RING}`}
                />
                {refineError && <p role="alert" className="text-[13px] text-red-400">{refineError}</p>}
                <div className="flex gap-2">
                  <PrimaryButton onClick={handleRefine} disabled={refining || !refineDraft.trim()} className="h-9">
                    {refining && <Loader2 size={14} className="animate-spin" aria-hidden />}
                    {refining ? 'Updating summary' : 'Update summary'}
                  </PrimaryButton>
                  <SecondaryButton onClick={() => { setRefineOpen(false); setRefineDraft('') }} className="h-9">Cancel</SecondaryButton>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </Block>

      {timeline && timeline.length > 0 && (
        <Block title="Experience" description="Roles we read from your resume.">
          <ol className="flex flex-col">
            {timeline.map((t, i) => (
              <li key={t.id ?? i} className="grid grid-cols-[16px_1fr] gap-4">
                <span className="flex flex-col items-center pt-1.5" aria-hidden>
                  <span className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-[var(--neon)]' : 'border border-[var(--text-muted)]'}`} />
                  {i < timeline.length - 1 && <span className="w-px flex-1 bg-[var(--border-ws)] mt-1.5" />}
                </span>
                <div className="pb-6 min-w-0">
                  <p className="text-[15px] font-semibold text-[var(--text-primary)]">{t.role}</p>
                  <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
                    {[t.company, [t.startDate, t.endDate].filter(Boolean).join(' to ')].filter(Boolean).join(', ')}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Block>
      )}

      <LinksNudge />
    </>
  )
}

// ── Skills ──────────────────────────────────────────────────────────────────

function SkillsTab({ blueprint, skills }: { blueprint: Blueprint; skills: string[] }) {
  const { profileMap } = blueprint
  const tools = skills.filter(s => DESIGN_TOOLS.includes(s))
  const domainsFromResume = skills.filter(s => !DESIGN_TOOLS.includes(s))
  const domains = domainsFromResume.length > 0 ? domainsFromResume : (profileMap.domains ?? [])
  const industries = profileMap.industries ?? []
  const platforms = profileMap.platforms ?? []

  if (!domains.length && !industries.length && !platforms.length && !tools.length) {
    return <EmptyState title="No skills found yet" body="Upload a resume or portfolio with your skills listed and they will show up here." />
  }

  return (
    <>
      {domains.length > 0 && (
        <Block title="Skill domains" description="What you do, as evidenced by your work.">
          <div className="flex flex-wrap gap-2">{domains.map(s => <Chip key={s} accent>{s}</Chip>)}</div>
        </Block>
      )}
      <div className="grid md:grid-cols-2 gap-10">
        {industries.length > 0 && (
          <Block title="Industries">
            <div className="flex flex-wrap gap-2">{industries.map(s => <Chip key={s}>{s}</Chip>)}</div>
          </Block>
        )}
        {platforms.length > 0 && (
          <Block title="Platforms">
            <div className="flex flex-wrap gap-2">{platforms.map(s => <Chip key={s}>{s}</Chip>)}</div>
          </Block>
        )}
      </div>
      {tools.length > 0 && (
        <Block title="Tools">
          <div className="flex flex-wrap gap-2">
            {tools.map(tool => (
              <span key={tool} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[var(--card-inner)] border border-[var(--border-ws)] text-[13px] text-[var(--text-secondary)]">
                <ToolLogo name={tool} size={14} />{tool}
              </span>
            ))}
          </div>
        </Block>
      )}
    </>
  )
}

// ── Projects ────────────────────────────────────────────────────────────────

function EditButton({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Edit ${name}`}
      className={`shrink-0 w-8 h-8 rounded-[8px] inline-flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-dim)] ${FOCUS_RING}`}
    >
      <Pencil size={14} aria-hidden />
    </button>
  )
}

function ProjectsTab({ projects }: { projects: Project[] }) {
  const { state, dispatch } = useWingspan()
  const [editing, setEditing] = useState<string | null>(null)
  const activeView = state.activeProjectView
  const editingProject = projects.find(p => p.id === editing)

  if (projects.length === 0) {
    return (
      <>
        <EmptyState icon={FolderOpen} title="No projects found" body="Your resume gave us enough to start. Adding projects makes every later section sharper." />
        <TemplateNudge count={0} />
      </>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Project view" className="inline-flex p-1 rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)]">
          {VIEW_TABS.map(v => {
            const Icon = v.icon
            const on = activeView === v.id
            return (
              <button
                key={v.id}
                type="button"
                aria-pressed={on}
                onClick={() => dispatch({ type: 'SET_PROJECT_VIEW', view: v.id })}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[13px] font-semibold transition-colors ${FOCUS_RING} focus-visible:ring-offset-0 ${
                  on ? 'bg-[var(--surface-dim)] text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon size={14} aria-hidden /><span className="hidden sm:inline">{v.label}</span><span className="sm:hidden sr-only">{v.label}</span>
              </button>
            )
          })}
        </div>
        {projects.length < 8 && <p className="text-[13px] text-[var(--text-muted)]">More projects give sharper insights.</p>}
      </div>

      {activeView === 'card' && (
        <ul className="grid sm:grid-cols-2 gap-4">
          {projects.map(p => (
            <Card as="li" key={p.id} className="p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-[var(--text-primary)] leading-snug" style={{ fontFamily: 'var(--font-sora)' }}>{p.name}</p>
                  <p className="text-[13px] text-[var(--text-muted)] mt-1">{[p.company, p.year, p.industry].filter(Boolean).join(', ')}</p>
                </div>
                <EditButton name={p.name} onClick={() => setEditing(p.id)} />
              </div>
              {p.summary && <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed line-clamp-4">{p.summary}</p>}
              {(p.impact || p.audience) && (
                <div className="mt-auto pt-3 border-t border-[var(--border-ws)] flex flex-col gap-1">
                  {p.impact && <p className={`text-[13px] font-semibold ${INK}`}>{p.impact}</p>}
                  {p.audience && <p className="text-[12px] text-[var(--text-muted)]">For {p.audience}</p>}
                </div>
              )}
            </Card>
          ))}
        </ul>
      )}

      {activeView === 'grid' && (
        <Card className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[640px]">
            <thead>
              <tr className="border-b border-[var(--border-ws)] text-left">
                {['Project', 'Company', 'Industry', 'Year', 'Impact'].map(h => (
                  <th key={h} scope="col" className="px-4 py-3 text-[12px] font-semibold text-[var(--text-muted)]">{h}</th>
                ))}
                <th scope="col" className="px-4 py-3"><span className="sr-only">Edit</span></th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id} className="border-b last:border-b-0 border-[var(--border-ws)]">
                  <td className="px-4 py-3 font-semibold text-[var(--text-primary)] max-w-[200px] truncate">{p.name}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{p.company}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{p.industry ?? '—'}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)] tabular-nums">{p.year ?? '—'}</td>
                  <td className={`px-4 py-3 max-w-[200px] truncate ${p.impact ? INK : 'text-[var(--text-muted)]'}`}>{p.impact ?? '—'}</td>
                  <td className="px-2 py-1.5 text-right"><EditButton name={p.name} onClick={() => setEditing(p.id)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeView === 'timeline' && (
        <ol className="flex flex-col">
          {[...projects].sort((a, b) => parseInt(b.year ?? '0') - parseInt(a.year ?? '0')).map((p, i, arr) => (
            <li key={p.id} className="grid grid-cols-[56px_16px_1fr] gap-3">
              <span className="text-[13px] font-semibold tabular-nums text-[var(--text-muted)] pt-0.5">{p.year ?? '—'}</span>
              <span className="flex flex-col items-center pt-1.5" aria-hidden>
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--neon)]" />
                {i < arr.length - 1 && <span className="w-px flex-1 bg-[var(--border-ws)] mt-1.5" />}
              </span>
              <div className="pb-6 min-w-0 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-[var(--text-primary)]">{p.name}</p>
                  <p className="text-[13px] text-[var(--text-muted)] mt-0.5">{[p.company, p.industry].filter(Boolean).join(', ')}</p>
                  {p.impact && <p className={`text-[13px] mt-1 ${INK}`}>{p.impact}</p>}
                </div>
                <EditButton name={p.name} onClick={() => setEditing(p.id)} />
              </div>
            </li>
          ))}
        </ol>
      )}

      {activeView === 'analytics' && <ProjectAnalytics projects={projects} />}

      {projects.length < 5 && <TemplateNudge count={projects.length} />}

      <AnimatePresence>
        {editing && editingProject && (
          <ProjectEditModal project={editingProject} onClose={() => setEditing(null)} />
        )}
      </AnimatePresence>
    </>
  )
}

// ── Education ───────────────────────────────────────────────────────────────

function EducationTab({ education }: { education: ExtractedCareerData['education'] }) {
  if (education.length === 0) {
    return <EmptyState icon={GraduationCap} title="No education found" body="Nothing to worry about. If you'd like it included, add it to your resume and run the analysis again." />
  }
  return (
    <ul className="grid sm:grid-cols-2 gap-4">
      {education.map((e, i) => (
        <Card as="li" key={`${e.institution}-${i}`} className="p-5 flex gap-4">
          <span className="shrink-0 w-10 h-10 rounded-[10px] bg-[var(--surface-dim)] flex items-center justify-center text-[var(--text-muted)]">
            <GraduationCap size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-[var(--text-primary)] leading-snug">{e.degree || 'Programme'}</p>
            <p className="text-[13px] text-[var(--text-secondary)] mt-1">{e.institution}</p>
            {e.year && <p className="text-[12px] text-[var(--text-muted)] mt-1 tabular-nums">{e.year}</p>}
          </div>
        </Card>
      ))}
    </ul>
  )
}

// ── Section ─────────────────────────────────────────────────────────────────

export function ProfileMap({ blueprint, extractedData }: ProfileMapProps) {
  const [tab, setTab] = useState<ProfileTab>('summary')
  const projects = extractedData?.projects ?? []
  const education = extractedData?.education ?? []
  const skills = extractedData?.skills ?? []
  const years = Number(blueprint.profileMap.yearsOfExperience)

  const tabs: SectionTab[] = [
    { id: 'summary', label: 'Summary & KPIs' },
    { id: 'skills', label: 'Skills' },
    { id: 'projects', label: 'Projects', count: projects.length },
    { id: 'education', label: 'Education', count: education.length },
  ]

  return (
    <SectionFrame
      section="profile"
      stat={Number.isFinite(years) && years > 0 ? { value: years, label: years === 1 ? 'year of experience' : 'years of experience' } : null}
      tabs={tabs}
      activeTab={tab}
      onTabChange={id => setTab(id as ProfileTab)}
    >
      {tab === 'summary' && <SummaryTab blueprint={blueprint} projects={projects} timeline={extractedData?.timeline ?? []} />}
      {tab === 'skills' && <SkillsTab blueprint={blueprint} skills={skills} />}
      {tab === 'projects' && <ProjectsTab projects={projects} />}
      {tab === 'education' && <EducationTab education={education} />}
    </SectionFrame>
  )
}

