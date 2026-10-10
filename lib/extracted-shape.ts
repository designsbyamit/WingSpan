import type { ExtractedCareerData, ValidatedCareerData } from '@/types/wingspan'

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

/** The AI can return partial data. Every list the pipeline iterates must exist. */
export function normalizeExtracted<T extends Partial<ExtractedCareerData>>(d: T): T & ExtractedCareerData {
  return {
    ...d,
    timeline: arr(d.timeline),
    projects: arr(d.projects),
    skills: arr<string>(d.skills).filter((s) => typeof s === 'string'),
    education: arr(d.education),
    rawText: typeof d.rawText === 'string' ? d.rawText : '',
    careerStageSignals: arr<string>(d.careerStageSignals),
    geographySignals: arr<string>(d.geographySignals),
    footprintSignals: arr<string>(d.footprintSignals),
  } as T & ExtractedCareerData
}

export function normalizeValidated(d: Partial<ValidatedCareerData>): ValidatedCareerData {
  return { ...normalizeExtracted(d), interests: arr<string>(d.interests) }
}
