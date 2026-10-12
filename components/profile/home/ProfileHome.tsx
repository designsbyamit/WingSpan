'use client'
// The person's home: who they are, what is working for them, how far they have come and what is next.
// Opened from the avatar in the side navigation. Personal details live here, not on the Profile map.
import { useEffect, useMemo, useState } from 'react'
import { animate, motion, type Variants } from 'framer-motion'
import { ArrowLeft, ArrowRight, BadgeCheck, Briefcase, Check, ExternalLink, GraduationCap, Globe, Link2, LogOut, Mail, MapPin, Pencil, Phone, Rocket, Sparkles, Target, Trophy } from 'lucide-react'
import { useWingspan } from '@/context/WingspanContext'
import { useAuth } from '@/lib/use-auth'
import { firstNameOf } from '@/lib/student/name'
import { identityFrom } from '@/lib/profile/contact'
import { detectStudent } from '@/lib/student/detect'
import { greetingFor, milestonesFor, nextNudge, stageCopy, type HomeFacts } from '@/lib/profile/home'
import { TRACK_LABELS, proposeDetails } from '@/lib/profile/details'
import { Badge, Card, FOCUS_RING, INK, PrimaryButton, SecondaryButton } from '@/components/blueprint/shell/ui'
import { ProfileDetailsDialog, type DetailsDialogState } from '@/components/blueprint/ProfileDetailsDialog'
import type { useProfileDetails } from './useProfileDetails'
import type { BlueprintStep } from '@/types/wingspan'

type Details = ReturnType<typeof useProfileDetails>
interface JobRow { id: string; title: string; company: string; location: string | null; level: string; workMode: string | null; salaryText: string | null; applyUrl: string | null; sourceName: string | null; postedText: string | null; seenAt: string }

const ease = [0.22, 1, 0.36, 1] as const
const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } }
const rise: Variants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } } }
const pop: Variants = { hidden: { opacity: 0, scale: 0.85 }, show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 380, damping: 22 } } }

function CountUp({ to, decimals = 0 }: { to: number; decimals?: number }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const c = animate(0, to, { duration: 1.1, ease: 'easeOut', onUpdate: (n) => setV(n) })
    return () => c.stop()
  }, [to])
  return <>{v.toFixed(decimals)}</>
}

function Ring({ done, total }: { done: number; total: number }) {
  const r = 34, c = 2 * Math.PI * r
  return (
    <div className="relative w-[88px] h-[88px] shrink-0" role="img" aria-label={`${done} of ${total} milestones reached`}>
      <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--border-ws)" strokeWidth="8" />
        <motion.circle cx="44" cy="44" r={r} fill="none" stroke="var(--neon)" strokeWidth="8" strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - done / Math.max(1, total)) }} transition={{ duration: 1.2, ease, delay: 0.3 }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[18px] font-bold tabular-nums text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>{done}/{total}</span>
    </div>
  )
}

function readProgress(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem('wingspan-action-progress') ?? '{}') } catch { return {} }
}

function Jobs({ track, years, student }: { track: string; years: number | null; student: boolean }) {
  const [jobs, setJobs] = useState<JobRow[] | null>(null)
  const [total, setTotal] = useState(0)
  useEffect(() => {
    let live = true
    fetch(`/api/jobs?track=${track}&years=${years ?? ''}`).then((r) => (r.ok ? r.json() : null)).then((d) => { if (live) { setJobs(d?.jobs ?? []); setTotal(d?.total ?? 0) } }).catch(() => { if (live) setJobs([]) })
    return () => { live = false }
  }, [track, years])

  return (
    <Card className="p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className={`shrink-0 w-9 h-9 rounded-[10px] bg-[var(--surface-dim)] flex items-center justify-center ${INK}`}><Briefcase size={16} aria-hidden /></span>
        <div>
          <h3 className="text-[16px] font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>{student ? 'Roles for freshers, picked for you' : 'Roles at your level'}</h3>
          <p className="text-[13px] text-[var(--text-muted)] mt-0.5">{student ? 'Internships, fresher and junior roles your mentor has found.' : 'Hand-picked by your mentor, matched to your years of experience.'}</p>
        </div>
      </div>
      {jobs === null ? (
        <div className="flex flex-col gap-2" aria-hidden>{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-[10px] bg-[var(--surface-dim)] animate-pulse" />)}</div>
      ) : jobs.length === 0 ? (
        <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">New roles are added most days{total ? `, and ${total} are open right now at other levels` : ''}. Nothing matches your level at this moment. Check back soon.</p>
      ) : (
        <motion.ul variants={container} initial="hidden" animate="show" className="flex flex-col gap-2">
          {jobs.map((j) => (
            <motion.li key={j.id} variants={rise} className="rounded-[12px] border border-[var(--border-ws)] p-3.5 flex flex-wrap items-center justify-between gap-3 hover:border-[var(--neon-border)] transition-colors">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[var(--text-primary)] truncate">{j.title}</p>
                <p className="text-[13px] text-[var(--text-secondary)] truncate">{j.company}{j.location ? ` · ${j.location}` : ''}{j.workMode ? ` · ${j.workMode.toLowerCase()}` : ''}</p>
                <p className="text-[12px] text-[var(--text-muted)] mt-0.5">{[j.level[0] + j.level.slice(1).toLowerCase(), j.salaryText, j.sourceName ? `seen on ${j.sourceName}` : null, j.postedText ?? `added ${j.seenAt}`].filter(Boolean).join(' · ')}</p>
              </div>
              {j.applyUrl
                ? <a href={j.applyUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[10px] border border-[var(--border-ws)] text-[13px] font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-dim)] ${FOCUS_RING}`}>View role <ExternalLink size={13} aria-hidden /><span className="sr-only"> (opens in a new tab)</span></a>
                : <span className="text-[12px] text-[var(--text-muted)]">Ask your mentor for the link</span>}
            </motion.li>
          ))}
        </motion.ul>
      )}
      {student && (
        <p className="text-[13px] text-[var(--text-muted)]">Also search by hand:{' '}
          <a href="https://internshala.com/" target="_blank" rel="noopener noreferrer" className={`underline underline-offset-4 hover:text-[var(--text-primary)] rounded-[4px] ${FOCUS_RING}`}>Internshala</a>{' and '}
          <a href="https://unstop.com/" target="_blank" rel="noopener noreferrer" className={`underline underline-offset-4 hover:text-[var(--text-primary)] rounded-[4px] ${FOCUS_RING}`}>Unstop</a>.
        </p>
      )}
    </Card>
  )
}

function Row({ icon: Icon, label, value, href }: { icon: typeof Mail; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon size={15} className="mt-0.5 shrink-0 text-[var(--text-muted)]" aria-hidden />
      <div className="min-w-0">
        <p className="text-[12px] text-[var(--text-muted)]">{label}</p>
        {!value ? <p className="text-[14px] text-[var(--text-muted)]">Not added</p>
          : href ? <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className={`text-[14px] ${INK} underline decoration-[var(--neon-border)] underline-offset-4 hover:decoration-current break-all rounded-[4px] ${FOCUS_RING}`}>{value}</a>
          : <p className="text-[14px] text-[var(--text-primary)] break-words">{value}</p>}
      </div>
    </div>
  )
}

export function ProfileHome({ details, versionCount, onClose, onSignOut, goTo }: {
  details: Details
  versionCount: number
  onClose: () => void
  onSignOut: () => void
  goTo: (s: BlueprintStep) => void
}) {
  const { state } = useWingspan()
  const { user } = useAuth()
  const { profile, loaded, reload } = details
  const [dialog, setDialog] = useState<DetailsDialogState | null>(null)
  const [progress] = useState(readProgress)
  const [now] = useState(() => new Date())

  const data = state.extractedData
  const detected = useMemo(() => (data ? detectStudent(data) : null), [data])
  const track = profile?.track ?? detected?.track ?? 'PROFESSIONAL'
  const years = profile?.experienceYears ?? (detected ? detected.fullTimeYears : null)
  const name = profile?.fullName ?? identityFrom(data).name
  const firstName = firstNameOf(name) ?? firstNameOf(user?.email?.split('@')[0])
  const student = track === 'STUDENT'

  const actions = state.blueprint?.actions
  const all = [...(actions?.immediate ?? []), ...(actions?.mediumTerm ?? []), ...(actions?.longTerm ?? [])]
  const topProject = [...(data?.projects ?? [])].sort((a, b) => Number(!!b.impact) - Number(!!a.impact))[0]
  const facts: HomeFacts = {
    firstName, track, years, projects: data?.projects?.length ?? 0, roles: data?.timeline?.length ?? 0, skills: data?.skills?.length ?? 0,
    topProject: topProject ? { name: topProject.name, impact: topProject.impact?.replace(/\.$/, '') || undefined } : undefined,
    currentRole: profile?.currentRole, education: profile?.education || data?.education?.[0] && `${data.education[0].degree}, ${data.education[0].institution}`,
    selectedPath: state.selectedPath, actionsTotal: all.length,
    actionsStarted: all.filter((a) => progress[a.title] === 'in-progress').length, actionsDone: all.filter((a) => progress[a.title] === 'done').length,
    versions: versionCount, detailsConfirmed: !!profile, hasPlan: !!state.studentPlan, hasBlueprint: !!state.blueprint,
  }
  const copy = stageCopy(facts)
  const miles = milestonesFor(facts)
  const doneCount = miles.filter((m) => m.done).length
  const nowActions = (actions?.immediate ?? []).filter((a) => progress[a.title] !== 'done').slice(0, 3)

  const openConfirm = () => { if (data) setDialog({ kind: 'new', proposed: proposeDetails(data, state.urls) }) }
  const email = profile?.email || user?.email || ''

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-8">
      {/* Hero */}
      <motion.section variants={rise} className="relative overflow-hidden rounded-[20px] border border-[var(--neon-border)] bg-[var(--surface)] p-6 sm:p-8">
        <motion.div aria-hidden className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-[var(--neon)] opacity-[0.10] blur-3xl" animate={{ x: [0, -30, 0], y: [0, 24, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div aria-hidden className="pointer-events-none absolute -bottom-28 left-10 h-64 w-64 rounded-full bg-[var(--neon)] opacity-[0.06] blur-3xl" animate={{ x: [0, 26, 0], y: [0, -18, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }} />
        <div className="relative flex flex-col gap-5">
          <button type="button" onClick={onClose} className={`self-start inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[6px] ${FOCUS_RING}`}><ArrowLeft size={14} aria-hidden />Back to your Blueprint</button>
          <div className="flex items-center gap-4">
            <motion.span initial={{ scale: 0.6, rotate: -8, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
              className="shrink-0 w-16 h-16 rounded-full bg-[var(--neon)] text-[#0a0a0a] text-[26px] font-bold inline-flex items-center justify-center uppercase" style={{ fontFamily: 'var(--font-sora)' }} aria-hidden>
              {(firstName ?? email ?? 'W').charAt(0)}
            </motion.span>
            <div className="min-w-0">
              <p className="text-[13px] text-[var(--text-muted)]">{greetingFor(now.getHours())}{firstName ? `, ${firstName}` : ''}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2"><Badge tone="accent">{copy.badge}</Badge>{profile?.currentRole && <span className="text-[13px] text-[var(--text-secondary)] truncate">{profile.currentRole}{profile.currentOrg ? ` · ${profile.currentOrg}` : ''}</span>}</div>
            </div>
          </div>
          <h2 className="text-[26px] sm:text-[32px] font-semibold leading-tight text-[var(--text-primary)] max-w-[28ch]" style={{ fontFamily: 'var(--font-sora)' }}>{copy.headline}</h2>
          <p className="text-[15px] text-[var(--text-secondary)] max-w-[60ch]">{copy.sub}</p>
          <motion.div variants={container} className="flex flex-wrap gap-3">
            {[
              { label: student ? 'Projects' : 'Years of experience', value: student ? facts.projects : (years ?? 0), dec: student ? 0 : (years && years % 1 ? 1 : 0) },
              ...(student ? [] : [{ label: 'Projects', value: facts.projects, dec: 0 }]),
              { label: 'Skills', value: facts.skills, dec: 0 },
              { label: 'Actions done', value: facts.actionsDone, dec: 0 },
            ].map((s) => (
              <motion.div key={s.label} variants={pop} className="rounded-[14px] border border-[var(--border-ws)] bg-[var(--bg)]/60 px-4 py-2.5 min-w-[96px]">
                <p className="text-[24px] font-semibold tabular-nums text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}><CountUp to={s.value} decimals={s.dec} /></p>
                <p className="text-[12px] text-[var(--text-muted)]">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Confirm banner */}
      {loaded && !profile && data && (
        <motion.div variants={rise} className="rounded-[14px] border border-[var(--neon-border)] bg-[var(--neon-surface)] p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <BadgeCheck size={18} className={`shrink-0 ${INK}`} aria-hidden />
          <p className="flex-1 text-[14px] text-[var(--text-primary)]">We read your details from your resume. Confirm them to complete your profile.</p>
          <PrimaryButton onClick={openConfirm}>Review details</PrimaryButton>
        </motion.div>
      )}

      {/* Praise */}
      <motion.section variants={container} aria-labelledby="home-praise" className="flex flex-col gap-3">
        <motion.h3 variants={rise} id="home-praise" className="text-[18px] font-semibold text-[var(--text-primary)] flex items-center gap-2" style={{ fontFamily: 'var(--font-sora)' }}><Sparkles size={17} className={INK} aria-hidden />What is already working for you</motion.h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {copy.praise.map((p) => (
            <motion.div key={p.title} variants={rise} whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
              <Card className="p-4 h-full">
                <p className="flex items-center gap-2 text-[14px] font-semibold text-[var(--text-primary)]"><Check size={14} className={INK} aria-hidden />{p.title}</p>
                <p className="mt-1.5 text-[13px] text-[var(--text-secondary)] leading-relaxed">{p.body}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Journey */}
      <motion.section variants={rise} aria-labelledby="home-journey">
        <Card className="p-5 sm:p-6 flex flex-col gap-5">
          <div className="flex items-center gap-5">
            <Ring done={doneCount} total={miles.length} />
            <div className="min-w-0">
              <h3 id="home-journey" className="text-[18px] font-semibold text-[var(--text-primary)] flex items-center gap-2" style={{ fontFamily: 'var(--font-sora)' }}><Trophy size={17} className={INK} aria-hidden />Your journey</h3>
              <p className="text-[14px] text-[var(--text-secondary)] mt-1">{nextNudge(facts)}</p>
            </div>
          </div>
          <motion.ul variants={container} className="grid sm:grid-cols-2 gap-2">
            {miles.map((m) => (
              <motion.li key={m.id} variants={pop} className={`flex items-center gap-3 rounded-[12px] border p-3 ${m.done ? 'border-[var(--neon-border)] bg-[var(--neon-surface)]' : 'border-[var(--border-ws)]'}`}>
                <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${m.done ? 'bg-[var(--neon)] text-[#0a0a0a]' : 'border border-[var(--border-ws)] text-[var(--text-muted)]'}`}>{m.done ? <Check size={14} strokeWidth={3} aria-hidden /> : <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden />}</span>
                <span className="min-w-0"><span className={`block text-[13px] font-semibold ${m.done ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{m.label}</span>{!m.done && <span className="block text-[12px] text-[var(--text-muted)]">{m.hint}</span>}</span>
              </motion.li>
            ))}
          </motion.ul>
        </Card>
      </motion.section>

      {/* Track-specific */}
      {student ? (
        <motion.section variants={rise} className="flex flex-col gap-4" aria-labelledby="home-student">
          <h3 id="home-student" className="text-[18px] font-semibold text-[var(--text-primary)] flex items-center gap-2" style={{ fontFamily: 'var(--font-sora)' }}><GraduationCap size={17} className={INK} aria-hidden />Your student track</h3>
          {state.studentPlan && (
            <Card className="p-5 sm:p-6 flex flex-col gap-3">
              <p className="text-[12px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Your edge</p>
              <p className="text-[15px] text-[var(--text-primary)] leading-relaxed">{state.studentPlan.edge.headline}</p>
              <p className="text-[12px] font-bold uppercase tracking-wide text-[var(--text-muted)] mt-1">First days of your plan</p>
              <ol className="flex flex-col gap-1.5">{state.studentPlan.days.slice(0, 3).map((d) => <li key={d.day} className="flex gap-3 text-[14px] text-[var(--text-secondary)]"><span className="shrink-0 w-6 h-6 rounded-full border border-[var(--border-ws)] text-[11px] font-bold text-[var(--text-primary)] inline-flex items-center justify-center">{d.day}</span>{d.action}</li>)}</ol>
              <SecondaryButton onClick={() => goTo('profile')} className="self-start">Open your plan <ArrowRight size={14} aria-hidden /></SecondaryButton>
            </Card>
          )}
          <Jobs track={track} years={years} student />
        </motion.section>
      ) : (
        <motion.section variants={rise} className="flex flex-col gap-4" aria-labelledby="home-pro">
          <h3 id="home-pro" className="text-[18px] font-semibold text-[var(--text-primary)] flex items-center gap-2" style={{ fontFamily: 'var(--font-sora)' }}><Target size={17} className={INK} aria-hidden />Your next move{track === 'BOTH' ? ', alongside your studies' : ''}</h3>
          <Card className="p-5 sm:p-6 flex flex-col gap-3">
            {state.selectedPath ? <p className="text-[15px] text-[var(--text-primary)]">Heading toward <span className={`font-semibold ${INK}`}>{state.selectedPath}</span></p>
              : <p className="text-[14px] text-[var(--text-secondary)]">You have not chosen a direction yet.</p>}
            {nowActions.length > 0 && (
              <ul className="flex flex-col gap-1.5">{nowActions.map((a) => <li key={a.title} className="flex gap-2 text-[14px] text-[var(--text-secondary)]"><Rocket size={14} className={`mt-0.5 shrink-0 ${INK}`} aria-hidden />{a.title}</li>)}</ul>
            )}
            <SecondaryButton onClick={() => goTo(state.selectedPath ? 'roadmap' : 'path-selection')} className="self-start">{state.selectedPath ? 'Open your roadmap' : 'Choose a direction'} <ArrowRight size={14} aria-hidden /></SecondaryButton>
          </Card>
          <Jobs track={track} years={years} student={false} />
        </motion.section>
      )}

      {/* Details */}
      <motion.section variants={rise} aria-labelledby="home-details">
        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 id="home-details" className="text-[18px] font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>{profile?.fullName ?? name ?? 'Your details'}</h3>
              <p className="text-[13px] text-[var(--text-muted)] mt-0.5">{profile ? `${TRACK_LABELS[profile.track]}${profile.experienceYears ? ` · ${profile.experienceYears} years of experience` : ''}` : 'Not confirmed yet'}</p>
            </div>
            {profile ? <SecondaryButton onClick={() => setDialog({ kind: 'edit', saved: profile })}><Pencil size={13} aria-hidden />Edit</SecondaryButton>
              : data ? <PrimaryButton onClick={openConfirm}>Review and confirm</PrimaryButton> : null}
          </div>
          <div className="mt-3 grid sm:grid-cols-2 sm:gap-x-8 divide-y sm:divide-y-0 divide-[var(--border-ws)]">
            <Row icon={Mail} label="Email" value={email} href={email ? `mailto:${email}` : undefined} />
            <Row icon={Phone} label="Phone" value={profile?.phone ?? ''} href={profile?.phone ? `tel:${profile.phone.replace(/[^\d+]/g, '')}` : undefined} />
            <Row icon={MapPin} label="Location" value={profile?.location ?? ''} />
            <Row icon={GraduationCap} label="Education" value={profile?.education ?? ''} />
            <Row icon={Link2} label="LinkedIn" value={(profile?.linkedinUrl ?? '').replace(/^https?:\/\/(www\.)?/, '')} href={profile?.linkedinUrl || undefined} />
            <Row icon={Globe} label="Portfolio" value={(profile?.portfolioUrl ?? '').replace(/^https?:\/\/(www\.)?/, '')} href={profile?.portfolioUrl || undefined} />
            <Row icon={Link2} label="GitHub" value={(profile?.githubUrl ?? '').replace(/^https?:\/\/(www\.)?/, '')} href={profile?.githubUrl || undefined} />
            <Row icon={Briefcase} label="Latest role" value={[profile?.currentRole, profile?.currentOrg].filter(Boolean).join(' at ')} />
          </div>
        </Card>
      </motion.section>

      <motion.div variants={rise} className="flex justify-end pb-6">
        <SecondaryButton onClick={onSignOut}><LogOut size={14} aria-hidden />Sign out</SecondaryButton>
      </motion.div>

      <ProfileDetailsDialog state={dialog} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); void reload() }} />
    </motion.div>
  )
}
