// Reads a job posting's title/location/text and decides: is it a design role, how senior, and could a fresher apply.
// Deliberately rule-based and conservative: an unclear posting is never called fresher-friendly.

const NON_DESIGN = /verification|silicon|\bchip\b|vlsi|asic|\brtl\b|analog|mechanical|civil|structural|network design|database design|solution design|system design engineer|software engineer|backend|data engineer|sales|account executive|recruit/i
const DESIGN = /\bdesign(er|ers)?\b|\bux\b|\bui\b|ui\/ux|ux\/ui|user experience|user interface|interaction|visual|brand|motion|illustrat|creative|art director|design system|content design|ux writer|ux research|user research|design ops|figma|product design|graphic|3d artist|animator|researcher.*(ux|user)/i

export function isDesignRole(title: string): boolean {
  if (NON_DESIGN.test(title) && !/ux|\bui\b|product design|visual|graphic|brand/i.test(title)) return false
  return DESIGN.test(title)
}

export type Seniority = 'INTERN' | 'FRESHER' | 'JUNIOR' | 'MID' | 'SENIOR' | 'UNKNOWN'

const INDIA = /india|bengaluru|bangalore|mumbai|delhi|gurgaon|gurugram|noida|hyderabad|pune|chennai|kolkata|ahmedabad|jaipur|kochi|coimbatore|chandigarh|indore|thiruvananthapuram|remote.{0,6}india/i

export function inIndia(location: string | null | undefined): boolean {
  return INDIA.test(location ?? '')
}
export function isRemote(location: string | null | undefined, text = ''): boolean {
  return /remote|work from home|anywhere/i.test(location ?? '') || /fully remote/i.test(text.slice(0, 600))
}

/** The lowest number of years of experience the text asks for, e.g. "2-4 years" -> 2, "5+ years" -> 5. */
export function minYears(text: string): number | null {
  const m = text.match(/(\d{1,2})\s*(?:\+|\s*(?:-|–|to)\s*\d{1,2})?\s*\+?\s*years?/i)
  if (!m) return null
  const n = Number(m[1])
  return n >= 0 && n <= 25 ? n : null
}

export function seniorityOf(title: string, text: string): { seniority: Seniority; minYears: number | null } {
  const years = minYears(text.slice(0, 3000))
  if (/\bintern(ship)?\b|trainee|apprentice/i.test(title)) return { seniority: 'INTERN', minYears: years }
  if (/\b(senior|sr\.?|lead|principal|staff|head|director|vp|manager|architect|\bIII\b|\bIV\b)\b/i.test(title)) return { seniority: 'SENIOR', minYears: years }
  if (/fresher|new grad|graduate|entry[- ]level|campus/i.test(title)) return { seniority: 'FRESHER', minYears: years }
  if (/\bjunior\b|\bjr\.?\b|\bassociate\b|\bI\b|level 1|\bdesigner 1\b/i.test(title)) return { seniority: 'JUNIOR', minYears: years }
  if (/\bII\b/.test(title)) return { seniority: 'MID', minYears: years }
  if (years !== null) return { seniority: years <= 1 ? 'JUNIOR' : years <= 5 ? 'MID' : 'SENIOR', minYears: years }
  return { seniority: 'UNKNOWN', minYears: null }
}

/** A fresher could reasonably apply: intern/fresher/junior titles asking for at most a year, or an explicit welcome. */
export function fresherOk(title: string, text: string): boolean {
  const { seniority, minYears: yrs } = seniorityOf(title, text)
  if (seniority === 'SENIOR' || seniority === 'MID') return false
  if (seniority === 'INTERN' || seniority === 'FRESHER') return yrs === null || yrs <= 1
  if (/freshers? (are )?welcome|0\s*[-–to]+\s*1\s*years?|recent graduates?|no prior experience|entry[- ]level/i.test(text.slice(0, 3000))) return (yrs ?? 0) <= 1
  if (seniority === 'JUNIOR') return yrs !== null && yrs <= 1
  return false
}
