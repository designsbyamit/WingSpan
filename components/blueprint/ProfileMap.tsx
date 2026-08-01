// components/blueprint/ProfileMap.tsx
'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pencil, LayoutGrid, Table2, BarChart3, Clock, AlertCircle, Link2, Download, ChevronDown } from 'lucide-react'
import { Blueprint, ExtractedCareerData, ProjectView } from '@/types/wingspan'
import { ToolLogo } from '@/components/ui/ToolLogo'
import { CapabilityTile } from '@/components/ui/CapabilityTile'
import { ProjectEditModal } from '@/components/blueprint/ProjectEditModal'
import { ProjectAnalytics } from '@/components/blueprint/ProjectAnalytics'
import { useWingspan } from '@/context/WingspanContext'

const DESIGN_TOOLS = [
  'Figma', 'Framer', 'Miro', 'FigJam', 'Adobe CC', 'JIRA', 'Notion', 'Google Analytics',
  'ChatGPT', 'Cursor', 'GitHub', 'Slack', 'Typeform',
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold tracking-[2.5px] uppercase text-[var(--text-muted)] mb-3">
      {children}
    </p>
  )
}

const VIEW_TABS: { id: ProjectView; label: string; icon: React.ReactNode }[] = [
  { id: 'card',      label: 'Cards',     icon: <LayoutGrid size={13} /> },
  { id: 'grid',      label: 'Grid',      icon: <Table2 size={13} /> },
  { id: 'timeline',  label: 'Timeline',  icon: <Clock size={13} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={13} /> },
]

interface ProfileMapProps {
  blueprint: Blueprint
  extractedData?: ExtractedCareerData
}

const URL_NUDGES = [
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/yourname' },
  { key: 'portfolio', label: 'Portfolio', placeholder: 'yourportfolio.com' },
  { key: 'github', label: 'GitHub', placeholder: 'github.com/yourname' },
  { key: 'behance', label: 'Behance', placeholder: 'behance.net/yourname' },
]

function ProfileNudges({ extractedData }: { extractedData?: ExtractedCareerData }) {
  const { state, dispatch } = useWingspan()
  const [showLinks, setShowLinks] = useState(false)
  const [showTemplate, setShowTemplate] = useState(false)

  const hasNoUrls = !Object.values(state.urls).some(v => v)
  const fewProjects = (extractedData?.projects ?? []).length < 5
  const showNudges = hasNoUrls || fewProjects
  if (!showNudges) return null

  return (
    <div className="flex flex-col gap-3">
      {/* Links nudge */}
      {hasNoUrls && (
        <div className="rounded-[12px] bg-[var(--card-inner)] border border-[var(--border-ws)] overflow-hidden">
          <button
            onClick={() => setShowLinks(!showLinks)}
            className="w-full flex items-center gap-3 p-4 text-left"
          >
            <div className="w-7 h-7 rounded-[8px] bg-[var(--neon-surface)] border border-[var(--neon-border)] flex items-center justify-center text-[var(--neon)] flex-shrink-0">
              <Link2 size={13} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-[var(--text-primary)]">Add your online presence</p>
              <p className="text-[11px] text-[var(--text-muted)]">LinkedIn, portfolio, GitHub — helps us understand the fuller picture</p>
            </div>
            <motion.div animate={{ rotate: showLinks ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={14} className="text-[var(--text-muted)]" />
            </motion.div>
          </button>
          <AnimatePresence>
            {showLinks && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto' as const, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-[var(--border-ws)]"
              >
                <div className="p-4 grid grid-cols-2 gap-2">
                  {URL_NUDGES.map(({ key, label, placeholder }) => (
                    <div key={key} className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold tracking-[1.5px] uppercase text-[var(--text-muted)]">{label}</span>
                      <input
                        type="url"
                        placeholder={placeholder}
                        value={state.urls[key] ?? ''}
                        onChange={(e) => dispatch({ type: 'SET_URL', key, value: e.target.value })}
                        className="bg-[var(--surface)] border border-[var(--border-ws)] rounded-[8px] px-3 py-2 text-xs text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon)] transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Project template nudge */}
      {fewProjects && (
        <div className="rounded-[12px] bg-[var(--card-inner)] border border-[var(--border-ws)] overflow-hidden">
          <button
            onClick={() => setShowTemplate(!showTemplate)}
            className="w-full flex items-center gap-3 p-4 text-left"
          >
            <div className="w-7 h-7 rounded-[8px] bg-[var(--surface)] border border-[var(--border-ws)] flex items-center justify-center text-yellow-400 flex-shrink-0">
              <AlertCircle size={13} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                We only found {(extractedData?.projects ?? []).length} project{(extractedData?.projects ?? []).length !== 1 ? 's' : ''} in your resume
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">Adding more projects makes the Blueprint much more accurate — here's a template to fill out.</p>
            </div>
            <motion.div animate={{ rotate: showTemplate ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={14} className="text-[var(--text-muted)]" />
            </motion.div>
          </button>
          <AnimatePresence>
            {showTemplate && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto' as const, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-[var(--border-ws)]"
              >
                <div className="p-4 flex flex-col gap-3">
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    The Project Repository Template lets you document all your projects with industry, platform, audience, and impact — giving Wingspan much richer data to work with.
                  </p>
                  <div className="flex gap-2">
                    <a
                      href="/api/template"
                      download
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[var(--neon)] text-[#0a0a0a] text-xs font-bold"
                    >
                      <Download size={12} />
                      Download Template
                    </a>
                    <p className="text-[11px] text-[var(--text-muted)] self-center">Fill it out and upload on the Footprint screen</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export function ProfileMap({ blueprint, extractedData }: ProfileMapProps) {
  const { state, dispatch } = useWingspan()
  const { profileMap } = blueprint
  const [editingProject, setEditingProject] = useState<string | null>(null)
  const [backgroundExpanded, setBackgroundExpanded] = useState(false)
  const activeView = state.activeProjectView
  const [refineOpen, setRefineOpen] = useState(false)
  const [refineDraft, setRefineDraft] = useState('')
  const [refining, setRefining] = useState(false)

  const allSkills = extractedData?.skills ?? []
  const tools = allSkills.filter(s => DESIGN_TOOLS.includes(s)).length > 0
    ? allSkills.filter(s => DESIGN_TOOLS.includes(s))
    : ['Figma', 'Framer', 'Miro', 'Adobe CC', 'JIRA', 'Notion']

  const skillDomains = allSkills.filter(s => !DESIGN_TOOLS.includes(s)).length > 0
    ? allSkills.filter(s => !DESIGN_TOOLS.includes(s)).slice(0, 12)
    : profileMap.domains

  // Use live projects from extractedData (editable) if available, fallback to empty
  const projects = extractedData?.projects ?? []
  const editingProjectData = projects.find(p => p.id === editingProject)

  // Dynamic metrics: use blueprint.profileMap.metrics if available, else derive defaults
  const metrics = profileMap.metrics ?? [
    { label: 'Years Experience', value: profileMap.yearsOfExperience, highlight: true },
    { label: 'Industries', value: profileMap.industries.length, highlight: true },
    { label: 'Skill Domains', value: profileMap.domains.length, highlight: true },
    { label: 'Projects', value: projects.length || '7+', highlight: false },
  ]

  const handleProfileRefine = async () => {
    if (!refineDraft.trim()) return
    setRefining(true)
    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'profile',
          blueprint,
          instruction: refineDraft,
          careerAlpha: state.careerAlpha,
        }),
      })
      const data = await res.json()
      if (data.refined) {
        dispatch({
          type: 'SET_BLUEPRINT',
          blueprint: { ...blueprint, profileMap: { ...blueprint.profileMap, ...data.refined } },
        })
        setRefineDraft('')
        setRefineOpen(false)
      }
    } finally {
      setRefining(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">

      {/* Dynamic metrics grid — more breathing room */}
      <div className="grid grid-cols-3 gap-3">
        {metrics.slice(0, 6).map(m => (
          <div key={m.label} className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-4 text-center">
            <div
              className={`text-3xl font-bold ${m.highlight ? 'text-[var(--neon)]' : 'text-[var(--text-primary)]'}`}
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              {m.value}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1 leading-tight">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Career Summary — break into short paragraphs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Career Summary</SectionLabel>
          <button
            onClick={() => setRefineOpen(o => !o)}
            className="text-[10px] font-semibold text-[var(--text-muted)] hover:text-[var(--neon)] transition-colors flex items-center gap-1"
          >
            <Pencil size={10} />
            Edit context
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {profileMap.careerEvolution
            .split(/(?<=[.!?])\s+/)
            .reduce<string[][]>((acc, sentence) => {
              const last = acc[acc.length - 1]
              if (!last || last.join(' ').length > 120) {
                acc.push([sentence])
              } else {
                last.push(sentence)
              }
              return acc
            }, [])
            .map((sentences, i) => (
              <p key={i} className="text-sm text-[var(--text-secondary)] leading-relaxed" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {sentences.join(' ')}
              </p>
            ))
          }
        </div>
        <AnimatePresence>
          {refineOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 flex flex-col gap-2">
                <textarea
                  value={refineDraft}
                  onChange={e => setRefineDraft(e.target.value)}
                  placeholder="Add context to refine your profile summary… (e.g. 'I also led a team of 8', 'My main focus has been healthcare UX')"
                  rows={3}
                  className="w-full bg-[var(--surface)] border border-[var(--border-ws)] rounded-[8px] px-3 py-2 text-xs text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon)] transition-colors resize-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleProfileRefine}
                    disabled={refining || !refineDraft.trim()}
                    className="px-4 py-1.5 rounded-[7px] bg-[var(--neon)] text-[#0a0a0a] text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {refining ? 'Refining…' : 'Refine →'}
                  </button>
                  <button
                    onClick={() => { setRefineOpen(false); setRefineDraft('') }}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile enrichment nudges */}
      <ProfileNudges extractedData={extractedData} />

      {/* Skills & Background — collapsed by default to reduce scroll */}
      <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] overflow-hidden">
        <button
          onClick={() => setBackgroundExpanded(e => !e)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <span className="text-[10px] font-bold tracking-[2.5px] uppercase text-[var(--text-muted)]">
            Skills &amp; Background
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-muted)]">
              {profileMap.industries.slice(0, 2).join(', ')}{profileMap.industries.length > 2 ? ` +${profileMap.industries.length - 2}` : ''}
            </span>
            <motion.div animate={{ rotate: backgroundExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={13} className="text-[var(--text-muted)]" />
            </motion.div>
          </div>
        </button>
        <AnimatePresence>
          {backgroundExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden border-t border-[var(--border-ws)] px-4 pb-4"
            >
              <div className="flex flex-col gap-5 pt-4">
                {/* Industries */}
                <div>
                  <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-2">Industries</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profileMap.industries.map(ind => (
                      <span key={ind} className="inline-block px-2.5 py-1 rounded-[6px] text-[11px] font-medium border bg-[var(--card-inner)] text-[var(--text-secondary)] border-[var(--border-ws)]">
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Skill Domains */}
                <div>
                  <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-2">Skill Domains</p>
                  <div className="flex flex-wrap gap-1.5">
                    {skillDomains.slice(0, 10).map(skill => (
                      <CapabilityTile key={skill} label={skill} accent />
                    ))}
                  </div>
                </div>
                {/* Tools */}
                <div>
                  <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-2">Tools</p>
                  <div className="flex flex-wrap gap-2">
                    {tools.map(tool => (
                      <div key={tool} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] bg-[var(--card-inner)] border border-[var(--border-ws)]">
                        <ToolLogo name={tool} size={13} />
                        <span className="text-[11px] text-[var(--text-secondary)]">{tool}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Project Repository */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Project Repository</SectionLabel>
          {projects.length < 8 && projects.length > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] text-yellow-400">
              <AlertCircle size={11} />
              <span>Add more projects — the more detail we have, the sharper the insights.</span>
            </div>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-6 text-center">
            <p className="text-sm text-[var(--text-muted)]">We didn't find specific projects. That's okay — your resume gave us enough to start.</p>
          </div>
        ) : (
          <>
            {/* View switcher */}
            <div className="flex gap-1 mb-4 p-1 rounded-[10px] bg-[var(--surface)] border border-[var(--border-ws)] w-fit">
              {VIEW_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => dispatch({ type: 'SET_PROJECT_VIEW', view: tab.id })}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-xs font-semibold transition-all
                    ${activeView === tab.id
                      ? 'bg-[var(--neon)] text-[#0a0a0a]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }
                  `}
                >
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>

            {/* Card view */}
            {activeView === 'card' && (
              <div className="flex flex-col gap-3">
                {projects.map(p => (
                  <motion.div key={p.id} layout className="rounded-[10px] bg-[var(--surface)] border border-[var(--border-ws)] p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>
                        {p.name}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {p.audience && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border-ws)] text-[var(--text-muted)]">
                            {p.audience}
                          </span>
                        )}
                        <button
                          onClick={() => setEditingProject(p.id)}
                          className="text-[var(--text-muted)] hover:text-[var(--neon)] transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mb-2">
                      {p.company}{p.year ? ` · ${p.year}` : ''}{p.industry ? ` · ${p.industry}` : ''}
                    </p>
                    {p.summary && <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-2">{p.summary}</p>}
                    {p.impact && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold tracking-[1px] uppercase text-[var(--text-muted)]">Impact</span>
                        <span className="text-xs font-semibold text-[var(--neon)]">{p.impact}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Grid view */}
            {activeView === 'grid' && (
              <div className="rounded-[12px] border border-[var(--border-ws)] overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[var(--surface-dim)] border-b border-[var(--border-ws)]">
                      {['Project', 'Company', 'Industry', 'Year', 'Type', 'Impact', ''].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 text-[10px] font-bold tracking-[1.5px] uppercase text-[var(--text-muted)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p, i) => (
                      <tr key={p.id} className={`border-b border-[var(--border-ws)] ${i % 2 === 0 ? 'bg-[var(--surface)]' : 'bg-[var(--card-inner)]'}`}>
                        <td className="px-3 py-2.5 font-semibold text-[var(--text-primary)] max-w-[150px] truncate">{p.name}</td>
                        <td className="px-3 py-2.5 text-[var(--text-secondary)]">{p.company}</td>
                        <td className="px-3 py-2.5 text-[var(--text-secondary)]">{p.industry ?? '—'}</td>
                        <td className="px-3 py-2.5 text-[var(--text-muted)]">{p.year ?? '—'}</td>
                        <td className="px-3 py-2.5 text-[var(--text-muted)]">{p.audience ?? '—'}</td>
                        <td className="px-3 py-2.5 text-[var(--neon)] max-w-[160px] truncate">{p.impact ?? '—'}</td>
                        <td className="px-3 py-2.5">
                          <button onClick={() => setEditingProject(p.id)} className="text-[var(--text-muted)] hover:text-[var(--neon)] transition-colors">
                            <Pencil size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Timeline view */}
            {activeView === 'timeline' && (
              <div className="flex flex-col gap-0">
                {[...projects]
                  .sort((a, b) => parseInt(b.year ?? '0') - parseInt(a.year ?? '0'))
                  .map((p, i) => (
                    <div key={p.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--neon)] mt-1.5 flex-shrink-0" />
                        {i < projects.length - 1 && <div className="w-[1px] flex-1 bg-[var(--border-ws)] mt-1" />}
                      </div>
                      <div className="pb-5 flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>
                              {p.name}
                            </span>
                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                              {p.company} · {p.year ?? 'Unknown'}{p.industry ? ` · ${p.industry}` : ''}
                            </p>
                          </div>
                          <button onClick={() => setEditingProject(p.id)} className="text-[var(--text-muted)] hover:text-[var(--neon)] transition-colors flex-shrink-0 mt-0.5">
                            <Pencil size={12} />
                          </button>
                        </div>
                        {p.impact && (
                          <span className="text-xs text-[var(--neon)] mt-1 inline-block">{p.impact}</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Analytics view */}
            {activeView === 'analytics' && (
              <ProjectAnalytics projects={projects} />
            )}
          </>
        )}
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editingProject && editingProjectData && (
          <ProjectEditModal
            project={editingProjectData}
            onClose={() => setEditingProject(null)}
          />
        )}
      </AnimatePresence>

    </div>
  )
}
