import { experienceFacts } from '@/lib/experience'
import type { ExtractedCareerData, TimelineEntry } from '@/types/wingspan'

// Decides, from the resume alone, whether this is an early-career design student or recent graduate, so the app can
// switch to the student flow. Conservative on purpose: someone with real full-time experience stays on the
// professional flow even if they are studying, and non-design students stay there too (the student market evidence
// is design-specific). The person can always override the result on screen.

export type CareerTrack = 'STUDENT' | 'PROFESSIONAL' | 'BOTH'
export interface StudentDetection {
  isStudent: boolean; isDesign: boolean; mode: 'student' | 'professional'; reasons: string[]
  /** The person's situation read from the timelines: still studying, working, or doing both. */
  track: CareerTrack
  /** Years of full-time work (internships, freelance and part-time excluded). */
  fullTimeYears: number
  /** Months since the latest full-time role began, when it can be told. */
  monthsInLatestRole: number | null
  educationInProgress: boolean
}

const INTERNISH = /\b(intern|internship|trainee|apprentice|student|fellow|volunteer|freelanc|part[- ]time|summer|campus ambassador)\b/i
const DESIGN_DEGREE = /\b(b\.?\s?des|m\.?\s?des|bachelor of design|master of design|design|architecture|fine arts|bfa|mfa|visual communication|animation|interaction|human[- ]computer|hci)\b/i
const IN_PROGRESS = /(expected|pursuing|currently (?:enrolled|studying)|in progress|\b20\d{2}\s*[-–—]\s*(?:present|ongoing|current))/i
const yearIn = (s: string | undefined) => Number(String(s ?? '').match(/(19|20)\d{2}/)?.[0] ?? NaN)
const monthIn = (s: string | undefined) => { const m = String(s ?? '').match(/(?:19|20)\d{2}[-/ ](\d{1,2})/); return m ? Math.min(12, Math.max(1, Number(m[1]))) : null }
const IS_CURRENT = /(present|current|ongoing|now|till date|to date)/i

export function detectStudent(data: Pick<ExtractedCareerData, 'timeline' | 'education' | 'rawText' | 'skills'> | null | undefined, now = new Date().getFullYear()): StudentDetection {
  const reasons: string[] = []
  if (!data) return { isStudent: false, isDesign: false, mode: 'professional', reasons, track: 'PROFESSIONAL', fullTimeYears: 0, monthsInLatestRole: null, educationInProgress: false }
  const timeline: TimelineEntry[] = data.timeline ?? []
  const education = data.education ?? []

  const fullTime = timeline.filter((t) => !INTERNISH.test(`${t.role ?? ''} ${t.description ?? ''}`.slice(0, 200)))
  const fullTimeYears = experienceFacts(fullTime, now).years
  const eduYears = education.map((e) => yearIn(e.year)).filter((y) => y > 1950)
  const latestEdu = eduYears.length ? Math.max(...eduYears) : null
  const inProgress = (latestEdu !== null && latestEdu >= now) || education.some((e) => IN_PROGRESS.test(`${e.year ?? ''} ${e.degree ?? ''}`)) || IN_PROGRESS.test((data.rawText ?? '').slice(0, 6000))
  const recentGrad = latestEdu !== null && latestEdu >= now - 2

  // How long the latest full-time role has run. Months are used when the resume gives them, otherwise mid-year.
  const realNow = new Date()
  const nowMonth = now === realNow.getFullYear() ? realNow.getMonth() + 1 : 6
  const starts = fullTime.map((t) => ({ t, y: yearIn(t.startDate), m: monthIn(t.startDate) })).filter((r) => Number.isFinite(r.y))
  const latestStart = starts.sort((a, b) => b.y - a.y || (b.m ?? 6) - (a.m ?? 6))[0]
  const monthsInLatestRole = latestStart ? Math.max(0, (now - latestStart.y) * 12 + (nowMonth - (latestStart.m ?? 6))) : null

  const early = fullTime.length === 0 || fullTimeYears < 1.5
  if (fullTime.length === 0 && timeline.length > 0) reasons.push('Your roles so far are internships, freelance or student work')
  else if (fullTime.length === 0) reasons.push('No full-time roles on the resume')
  else if (early) reasons.push(`Under 18 months of full-time experience`)
  if (inProgress) reasons.push('Your degree is still in progress')
  else if (recentGrad) reasons.push(`You graduated in ${latestEdu}`)

  const designText = [...education.map((e) => `${e.degree ?? ''} ${e.institution ?? ''}`), ...(data.skills ?? []).slice(0, 30)].join(' ')
  const isDesign = DESIGN_DEGREE.test(designText)
  if (isDesign) reasons.push('Your education and skills point to design')

  // Track. Timelines decide: a degree that runs into the current year is the student journey, unless a full-time job
  // is running beside it ("both"), or the person is experienced enough (4+ years) that studying is a mid-career step.
  // A graduate of the last two years with little full-time work is also on the student journey.
  const endYear = (t: TimelineEntry) => yearIn(t.endDate)
  const currentJob = fullTime.some((t) => IS_CURRENT.test(String(t.endDate ?? '')) || endYear(t) >= now)
  const jobForReal = currentJob && (monthsInLatestRole ?? 0) >= 9
  let track: CareerTrack
  if (inProgress) track = jobForReal || fullTimeYears >= 4 ? 'BOTH' : 'STUDENT'
  else track = recentGrad && early ? 'STUDENT' : 'PROFESSIONAL'
  const isStudent = track === 'STUDENT'
  if (track === 'BOTH') reasons.push(jobForReal ? `You are studying and also working (in your current role for ${Math.round((monthsInLatestRole ?? 0) / 12 * 10) / 10} years)` : `You are studying after ${Math.round(fullTimeYears)}+ years of full-time work`)
  else if (track === 'PROFESSIONAL' && fullTime.length) reasons.push(monthsInLatestRole !== null && monthsInLatestRole < 12 ? 'You started your current role within the last year' : `${fullTimeYears} years of full-time experience`)
  else if (track === 'STUDENT' && fullTimeYears >= 1) reasons.push(`${Math.round(fullTimeYears * 10) / 10} years of work before your studies`)
  return { isStudent, isDesign, mode: isStudent && isDesign ? 'student' : 'professional', reasons, track, fullTimeYears, monthsInLatestRole, educationInProgress: inProgress }
}
