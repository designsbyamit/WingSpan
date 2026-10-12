import { bandOf, type Band } from '@/lib/profile/levels'
import type { CareerTrack } from '@/lib/student/detect'

// Words for the Profile home. Everything said about the person is drawn from facts on their own resume and
// progress; nothing is invented, and no comparison with other people is made.

export interface HomeFacts {
  firstName: string | null
  track: CareerTrack
  years: number | null
  projects: number
  roles: number
  skills: number
  topProject?: { name: string; impact?: string }
  currentRole?: string
  education?: string
  selectedPath: string | null
  actionsTotal: number
  actionsStarted: number
  actionsDone: number
  versions: number
  detailsConfirmed: boolean
  hasPlan: boolean
  hasBlueprint: boolean
}

export const BAND_LABEL: Record<Band, string> = { student: 'Rising designer', early: 'Early-career', mid: 'Established practitioner', senior: 'Senior practitioner', leader: 'Design leader' }

export function greetingFor(hour: number): string {
  return hour < 5 ? 'Still up' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 22 ? 'Good evening' : 'Hello'
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

export function stageCopy(f: HomeFacts): { band: Band; badge: string; headline: string; sub: string; praise: { title: string; body: string }[] } {
  const band = bandOf(f.track, f.years)
  const n = f.firstName
  const badge = f.track === 'BOTH' ? 'Studying and working' : BAND_LABEL[band]
  const praise: { title: string; body: string }[] = []

  if (f.topProject?.impact) praise.push({ title: 'Work with a result', body: `${f.topProject.name}: ${f.topProject.impact}. A concrete outcome is the strongest thing a profile can show.` })
  else if (f.topProject) praise.push({ title: 'Work you can point to', body: `${f.topProject.name} is on your resume. Add the result it achieved and it becomes your best proof.` })
  if (f.projects >= 2) praise.push({ title: `${plural(f.projects, 'project')} on record`, body: 'That is a body of work, not a single story. It gives you range to choose from for every conversation.' })
  if (f.skills >= 5) praise.push({ title: 'A wide toolkit', body: `${plural(f.skills, 'skill')} listed. Naming them clearly is half of getting found for them.` })
  if (f.track !== 'STUDENT' && f.years && f.years >= 1) praise.push({ title: `${f.years >= 10 ? 'A decade and more' : plural(Math.round(f.years), 'year')} of experience`, body: band === 'leader' ? 'Judgement like yours is built slowly. The next chapter is about leverage, not effort.' : band === 'senior' ? 'You have moved past learning the craft to shaping it. Your next step is about scope.' : band === 'mid' ? 'You are past the proving stage. This is where focus on a direction pays off most.' : 'You have started, and early years compound. Keep choosing work that stretches you.' })
  if (f.track === 'BOTH') praise.unshift({ title: 'Studying while working', body: 'Carrying both takes discipline most people never test. Use it: your classwork and your job can feed each other.' })
  if (f.track === 'STUDENT' && f.education) praise.unshift({ title: 'You are building this on purpose', body: `${f.education}. Everything you make from here is evidence for your first role.` })
  if (!praise.length) praise.push({ title: 'You are here', body: 'Showing up to plan your next move is the part most people put off. The rest is one step at a time.' })

  const headline =
    f.track === 'STUDENT' ? `${n ? `${n}, ` : ''}you are building from a real start.`
    : f.track === 'BOTH' ? `${n ? `${n}, ` : ''}you are doing two things at once. That counts.`
    : band === 'leader' ? `${n ? `${n}, ` : ''}you are playing the long game, and it shows.`
    : band === 'senior' ? `${n ? `${n}, ` : ''}your experience is an advantage. Let us aim it.`
    : band === 'mid' ? `${n ? `${n}, ` : ''}you have momentum. Let us point it somewhere good.`
    : `${n ? `${n}, ` : ''}early years are where direction is set. You are ahead for asking.`
  const sub = f.track === 'STUDENT' ? 'Your plan, your openings and your first 14 days live here.'
    : f.selectedPath ? `Your chosen direction: ${f.selectedPath}.`
    : 'Pick a direction in Future Paths and this page becomes your base for it.'
  return { band, badge, headline, sub, praise: praise.slice(0, 4) }
}

export interface Milestone { id: string; label: string; hint: string; done: boolean }

export function milestonesFor(f: HomeFacts): Milestone[] {
  const base: Milestone[] = [
    { id: 'details', label: 'Details confirmed', hint: 'Confirm what we read from your resume', done: f.detailsConfirmed },
    { id: 'blueprint', label: f.track === 'STUDENT' ? 'Plan built' : 'Blueprint built', hint: 'Upload a resume and run the analysis', done: f.hasBlueprint || f.hasPlan },
  ]
  if (f.track !== 'STUDENT') base.push({ id: 'path', label: 'Direction chosen', hint: 'Choose one path in Future Paths', done: !!f.selectedPath })
  base.push({ id: 'started', label: 'First step taken', hint: 'Mark one roadmap action as started', done: f.actionsStarted + f.actionsDone > 0 })
  base.push({ id: 'momentum', label: 'Three steps done', hint: 'Finish three actions', done: f.actionsDone >= 3 })
  base.push({ id: 'saved', label: 'Version saved', hint: 'Save a named version of your Blueprint', done: f.versions > 0 })
  return base
}

/** One line that says what is the next best thing, in the person's own progress order. */
export function nextNudge(f: HomeFacts): string {
  if (!f.detailsConfirmed) return 'Confirm your details so your profile is complete.'
  if (f.track !== 'STUDENT' && !f.selectedPath && f.hasBlueprint) return 'Choose a direction in Future Paths. Everything after it is tailored to that choice.'
  if (f.actionsTotal && f.actionsStarted + f.actionsDone === 0) return 'Start one roadmap action today. Small and finished beats big and planned.'
  if (f.actionsDone < 3 && f.actionsTotal) return `${f.actionsDone === 0 ? 'Finish your first action' : `${3 - f.actionsDone} more to reach three done`}. Momentum is built, not found.`
  return 'Come back after your next win and mark it. Progress you can see keeps you going.'
}
