'use client'
import { useId, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { useWingspan } from '@/context/WingspanContext'
import type { ExtractedCareerData, TimelineEntry } from '@/types/wingspan'
import type { ExperienceFacts } from '@/lib/experience'
import { interestByLabel } from '@/lib/interests'
import { cx, focusRing, linkButton, primaryButton, quietButton } from './ui'

const sora = { fontFamily: 'var(--font-sora)' } as const

export function SectionHeading({ id, title, count }: { id: string; title: string; count?: number }) {
  return (
    <h2 id={id} className="flex items-baseline gap-2 text-[17px] font-semibold text-[var(--text-primary)]" style={sora}>
      {title}
      {typeof count === 'number' && <span className="text-sm font-normal text-[var(--text-muted)]">{count}</span>}
    </h2>
  )
}

// ── Identity + KPIs ─────────────────────────────────────────────────────────

export function IdentityHeader({ facts }: { facts: ExperienceFacts }) {
  const role = facts.latestRole?.trim()
  return (
    <header className="flex flex-col gap-2">
      <p className="text-[13px] text-[var(--text-muted)]">Read from your resume</p>
      <h1 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.01em] text-[var(--text-primary)] sm:text-[34px]" style={sora}>
        {role || 'Your career profile'}
      </h1>
      <p className="text-[15px] text-[var(--text-secondary)]">
        {facts.latestCompany && <span className="text-[var(--text-primary)]">{facts.latestCompany}</span>}
        {facts.latestCompany && facts.years > 0 && <span className="text-[var(--text-dim)]">{'  /  '}</span>}
        {facts.years > 0 && <span>{facts.years} {facts.years === 1 ? 'year' : 'years'} of experience</span>}
      </p>
      <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-[var(--text-muted)]">
        Check the timeline below while the analysis runs. Corrections make your Blueprint more accurate.
      </p>
    </header>
  )
}

export function KpiStrip({ data, years }: { data: ExtractedCareerData; years: number }) {
  const items = [
    { label: years === 1 ? 'Year of experience' : 'Years of experience', value: years },
    { label: (data.timeline?.length ?? 0) === 1 ? 'Role' : 'Roles', value: data.timeline?.length ?? 0 },
    { label: (data.projects?.length ?? 0) === 1 ? 'Project' : 'Projects', value: data.projects?.length ?? 0 },
    { label: (data.skills?.length ?? 0) === 1 ? 'Skill' : 'Skills', value: data.skills?.length ?? 0 },
  ]
  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-[14px] border border-[var(--border-ws)] bg-[var(--surface)] sm:grid-cols-4">
      {items.map((item, i) => (
        <div key={item.label}
          className={cx(
            'flex flex-col-reverse gap-1 px-4 py-4 sm:px-5',
            i % 2 === 1 && 'border-l border-[var(--border-ws)]',
            i >= 2 && 'border-t border-[var(--border-ws)] sm:border-t-0',
            i === 2 && 'sm:border-l',
          )}>
          <dt className="text-xs text-[var(--text-muted)]">{item.label}</dt>
          <dd className="text-[26px] font-semibold leading-none tabular-nums text-[var(--text-primary)]" style={sora}>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

// ── Career timeline (confirm / edit / remove) ──────────────────────────────

function iconButton(extra?: string) {
  return cx(
    'flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-dim)]',
    focusRing, extra,
  )
}

function TimelineEditForm({ entry, onSave, onCancel }: {
  entry: TimelineEntry
  onSave: (draft: Partial<TimelineEntry>) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState({ role: entry.role, company: entry.company, startDate: entry.startDate, endDate: entry.endDate })
  const uid = useId()
  const field = 'w-full rounded-[8px] border border-[var(--border-ws)] bg-[var(--surface-dim)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--neon)] focus:outline-none'
  const label = 'mb-1 block text-xs text-[var(--text-muted)]'
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave(draft) }}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); onCancel() } }}
      className="grid grid-cols-2 gap-3 rounded-[12px] border border-[var(--border-ws)] bg-[var(--surface)] p-4"
    >
      <div className="col-span-2">
        <label htmlFor={`${uid}-role`} className={label}>Role</label>
        <input id={`${uid}-role`} autoFocus className={field} value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
      </div>
      <div className="col-span-2">
        <label htmlFor={`${uid}-company`} className={label}>Company</label>
        <input id={`${uid}-company`} className={field} value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} />
      </div>
      <div>
        <label htmlFor={`${uid}-start`} className={label}>Start</label>
        <input id={`${uid}-start`} className={field} placeholder="2019" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
      </div>
      <div>
        <label htmlFor={`${uid}-end`} className={label}>End</label>
        <input id={`${uid}-end`} className={field} placeholder="Present" value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} />
      </div>
      <div className="col-span-2 flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className={cx(quietButton, 'py-2')}>Cancel</button>
        <button type="submit" className={cx(primaryButton, 'py-2')}>Save</button>
      </div>
    </form>
  )
}

export function CareerTimeline({ entries }: { entries: TimelineEntry[] }) {
  const { dispatch } = useWingspan()
  const [editingId, setEditingId] = useState<string | null>(null)
  const headingId = useId()

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <SectionHeading id={headingId} title="Career timeline" count={entries.length} />
      </div>

      {entries.length === 0 ? (
        <p className="rounded-[12px] border border-[var(--border-ws)] bg-[var(--surface)] px-4 py-4 text-sm leading-relaxed text-[var(--text-secondary)]">
          No dated roles were found in your resume. Your Blueprint will lean on projects and skills; a resume with roles and dates gives a sharper result.
        </p>
      ) : (
        <ol className="flex flex-col">
          <AnimatePresence initial={false}>
            {entries.map((entry, i) => (
              <motion.li
                key={entry.id}
                layout="position"
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="relative flex gap-4 pb-5 last:pb-0"
              >
                {i < entries.length - 1 && <span className="absolute bottom-0 left-[5.5px] top-5 w-px bg-[var(--border-ws)]" aria-hidden />}
                <span className="relative mt-[7px] h-3 w-3 flex-shrink-0 rounded-full border-2 border-[var(--text-dim)] bg-[var(--bg)]" aria-hidden />
                <div className="min-w-0 flex-1">
                  {editingId === entry.id ? (
                    <TimelineEditForm
                      entry={entry}
                      onCancel={() => setEditingId(null)}
                      onSave={(draft) => {
                        dispatch({ type: 'UPDATE_TIMELINE_ENTRY', entry: { ...entry, ...draft } })
                        setEditingId(null)
                      }}
                    />
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold leading-snug text-[var(--text-primary)]">{entry.role || 'Untitled role'}</p>
                        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                          {entry.company}
                          {(entry.startDate || entry.endDate) && (
                            <span className="tabular-nums text-[var(--text-muted)]">
                              {entry.company ? ', ' : ''}{entry.startDate}{entry.endDate ? ` – ${entry.endDate}` : ''}
                            </span>
                          )}
                        </p>
                        {entry.description && (
                          <p className="mt-1.5 line-clamp-2 max-w-[70ch] text-[13px] leading-relaxed text-[var(--text-muted)]">{entry.description}</p>
                        )}
                      </div>
                      <div className="-mr-1 flex flex-shrink-0 items-center">
                        <button type="button" aria-label={`Edit ${entry.role}`} title="Edit" onClick={() => setEditingId(entry.id)}
                          className={iconButton('hover:text-[var(--text-primary)]')}>
                          <Pencil size={14} aria-hidden />
                        </button>
                        <button type="button" aria-label={`Remove ${entry.role}`} title="Remove"
                          onClick={() => dispatch({ type: 'REMOVE_TIMELINE_ENTRY', id: entry.id })}
                          className={iconButton('hover:text-red-300')}>
                          <Trash2 size={14} aria-hidden />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}
    </section>
  )
}

// ── Projects, skills, education, focus ─────────────────────────────────────

export function ProjectsList({ projects }: { projects: ExtractedCareerData['projects'] }) {
  const [showAll, setShowAll] = useState(false)
  const headingId = useId()
  const LIMIT = 5
  const visible = showAll ? projects : projects.slice(0, LIMIT)
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <SectionHeading id={headingId} title="Projects" count={projects.length} />
      {projects.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No projects were found in your resume.</p>
      ) : (
        <ul className="divide-y divide-[var(--border-ws)] border-y border-[var(--border-ws)]">
          {visible.map((p) => (
            <li key={p.id} className="py-3.5">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{p.name}</p>
              {(p.company || p.year || p.industry) && (
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">{[p.company, p.industry, p.year].filter(Boolean).join(', ')}</p>
              )}
              {(p.summary || p.impact) && (
                <p className="mt-1.5 line-clamp-2 max-w-[70ch] text-[13px] leading-relaxed text-[var(--text-secondary)]">{p.summary || p.impact}</p>
              )}
            </li>
          ))}
        </ul>
      )}
      {projects.length > LIMIT && (
        <button type="button" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll} className={cx(linkButton, 'self-start')}>
          {showAll ? 'Show fewer' : `Show all ${projects.length} projects`}
        </button>
      )}
    </section>
  )
}

export function SkillsList({ skills }: { skills: string[] }) {
  const [showAll, setShowAll] = useState(false)
  const headingId = useId()
  const LIMIT = 18
  const visible = showAll ? skills : skills.slice(0, LIMIT)
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <SectionHeading id={headingId} title="Skills" count={skills.length} />
      {skills.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No skills were listed.</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {visible.map((s) => (
            <li key={s} className="rounded-[6px] border border-[var(--border-ws)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--text-secondary)]">{s}</li>
          ))}
        </ul>
      )}
      {skills.length > LIMIT && (
        <button type="button" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll} className={cx(linkButton, 'self-start')}>
          {showAll ? 'Show fewer' : `Show all ${skills.length}`}
        </button>
      )}
    </section>
  )
}

export function EducationList({ education }: { education: ExtractedCareerData['education'] }) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <SectionHeading id={headingId} title="Education" count={education.length || undefined} />
      {education.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No education was listed.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {education.map((e, i) => (
            <li key={`${e.institution}-${i}`}>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{e.degree || e.institution}</p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">{[e.degree ? e.institution : null, e.year].filter(Boolean).join(', ')}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function FocusList({ interests }: { interests: string[] }) {
  const headingId = useId()
  if (!interests.length) return null
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <SectionHeading id={headingId} title="Your focus" />
      <ul className="flex flex-wrap gap-1.5">
        {interests.map((label) => (
          <li key={label} title={interestByLabel(label)?.hint}
            className="rounded-full border border-[var(--neon-border)] bg-[var(--neon-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)]">
            {label}
          </li>
        ))}
      </ul>
    </section>
  )
}
