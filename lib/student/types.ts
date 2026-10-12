// The Student Plan: what the student coach produces for an early-career design student.
// Every claim carries `sources` (ids into `sources`, or R-ids into the student's own resume facts).
// A claim with no valid source is kept but marked `general`, and the screen says so plainly.

export interface ResumeFact { id: string; kind: 'role' | 'project' | 'education' | 'skills'; text: string }

export interface SourceRef {
  id: string                  // S1.. (published evidence) or J1.. (an employer's own posting)
  kind: 'REPORT' | 'POSTING'
  label: string               // report title or posting title
  publisher: string
  url: string | null
  publishedAt: string | null
  retrievedAt: string | null
  reliability: number | null
  statement?: string          // the fact(s) this source supports, in our words
  region?: string
}

export interface Claim { text: string; sources: string[]; general?: boolean; unverifiedNumber?: boolean; unchecked?: boolean }

export interface Differentiator { title: string; whyHirersCare: string; evidence: string[]; strength: 'demonstrated' | 'indicated' }

export interface EdgeCard {
  headline: string
  differentiators: Differentiator[]
  alreadyProven: Array<{ text: string; evidence: string[] }>
  honestGaps: string[]
}

export interface Lane {
  name: string
  whyYou: string
  evidence: string[]          // resume fact ids
  demand: Claim
  whoHires: Array<{ name: string; kind: string; cities: string[]; fresherScore: number | null }>
  proofNeeded: string[]
  honestOdds: string
}

export interface BridgeJob { title: string; why: string; whereToLook: string[]; claim: Claim }

export interface Opening {
  title: string; company: string; location: string | null; url: string
  seniority: string; minYears: number | null; fresherFriendly: boolean; retrievedAt: string; sourceId: string
}

export type DayTheme = 'Position' | 'Proof' | 'Reach' | 'Apply' | 'Practice' | 'Skill' | 'Reflect'
export interface PlanDay { day: number; theme: DayTheme; action: string; why: string; minutes: number; guidance: string }

export interface StudentPlan {
  version: 1
  generatedAt: string
  detection: { reasons: string[] }
  edge: EdgeCard
  market: Claim[]
  lanes: Lane[]
  bridge: BridgeJob
  openings: Opening[]
  openingsNote: string
  days: PlanDay[]
  sources: SourceRef[]
  caveats: string[]
}
