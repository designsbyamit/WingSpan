import { experienceFacts } from '@/lib/experience'
import type { ExtractedCareerData, TimelineEntry } from '@/types/wingspan'

// Decides, from the resume alone, whether this is an early-career design student or recent graduate, so the app can
// switch to the student flow. Conservative on purpose: someone with real full-time experience stays on the
// professional flow even if they are studying, and non-design students stay there too (the student market evidence
// is design-specific). The person can always override the result on screen.

export interface StudentDetection { isStudent: boolean; isDesign: boolean; mode: 'student' | 'professional'; reasons: string[] }

const INTERNISH = /\b(intern|internship|trainee|apprentice|student|fellow|volunteer|freelanc|part[- ]time|summer|campus ambassador)\b/i
const DESIGN_DEGREE = /\b(b\.?\s?des|m\.?\s?des|bachelor of design|master of design|design|architecture|fine arts|bfa|mfa|visual communication|animation|interaction|human[- ]computer|hci)\b/i
const IN_PROGRESS = /(expected|pursuing|currently (?:enrolled|studying)|in progress|\b20\d{2}\s*[-–—]\s*(?:present|ongoing|current))/i
const yearIn = (s: string | undefined) => Number(String(s ?? '').match(/(19|20)\d{2}/)?.[0] ?? NaN)

export function detectStudent(data: Pick<ExtractedCareerData, 'timeline' | 'education' | 'rawText' | 'skills'> | null | undefined, now = new Date().getFullYear()): StudentDetection {
  const reasons: string[] = []
  if (!data) return { isStudent: false, isDesign: false, mode: 'professional', reasons }
  const timeline: TimelineEntry[] = data.timeline ?? []
  const education = data.education ?? []

  const fullTime = timeline.filter((t) => !INTERNISH.test(`${t.role ?? ''} ${t.description ?? ''}`.slice(0, 200)))
  const fullTimeYears = experienceFacts(fullTime, now).years
  const eduYears = education.map((e) => yearIn(e.year)).filter((y) => y > 1950)
  const latestEdu = eduYears.length ? Math.max(...eduYears) : null
  const inProgress = (latestEdu !== null && latestEdu >= now) || education.some((e) => IN_PROGRESS.test(`${e.year ?? ''} ${e.degree ?? ''}`)) || IN_PROGRESS.test((data.rawText ?? '').slice(0, 6000))
  const recentGrad = latestEdu !== null && latestEdu >= now - 2

  const early = fullTime.length === 0 || fullTimeYears < 1.5
  if (fullTime.length === 0 && timeline.length > 0) reasons.push('Your roles so far are internships, freelance or student work')
  else if (fullTime.length === 0) reasons.push('No full-time roles on the resume')
  else if (early) reasons.push(`Under 18 months of full-time experience`)
  if (inProgress) reasons.push('Your degree is still in progress')
  else if (recentGrad) reasons.push(`You graduated in ${latestEdu}`)

  const designText = [...education.map((e) => `${e.degree ?? ''} ${e.institution ?? ''}`), ...(data.skills ?? []).slice(0, 30)].join(' ')
  const isDesign = DESIGN_DEGREE.test(designText)
  if (isDesign) reasons.push('Your education and skills point to design')

  const isStudent = early && (inProgress || recentGrad)
  return { isStudent, isDesign, mode: isStudent && isDesign ? 'student' : 'professional', reasons }
}
