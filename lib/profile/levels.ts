import type { CareerTrack } from '@/lib/student/detect'

// Which job-board levels suit a person, and the experience band used to speak to them.
export type JobLevel = 'INTERN' | 'FRESHER' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD'

export function levelsFor(track: CareerTrack, years: number | null): JobLevel[] {
  const y = years ?? 0
  if (track === 'STUDENT') return ['INTERN', 'FRESHER', 'JUNIOR']
  if (track === 'BOTH') return y >= 3 ? ['MID', 'SENIOR', 'INTERN'] : ['JUNIOR', 'MID', 'INTERN']
  if (y < 2) return ['FRESHER', 'JUNIOR', 'MID']
  if (y < 4) return ['JUNIOR', 'MID', 'SENIOR']
  if (y < 8) return ['MID', 'SENIOR', 'LEAD']
  return ['SENIOR', 'LEAD']
}

export type Band = 'student' | 'early' | 'mid' | 'senior' | 'leader'
export function bandOf(track: CareerTrack, years: number | null): Band {
  const y = years ?? 0
  if (track === 'STUDENT') return 'student'
  if (y < 3) return 'early'
  if (y < 7) return 'mid'
  if (y < 12) return 'senior'
  return 'leader'
}
