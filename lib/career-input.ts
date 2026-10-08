import { CareerEvidence, careerEvidenceToCareerAlphaInput } from '@/lib/career-evidence'
import { ExtractedCareerData } from '@/types/wingspan'

export type CareerSourceKind = 'resume' | 'portfolio' | 'projects-spreadsheet' | 'supporting-document' | 'profile-link'

export interface CareerInputSource {
  kind: CareerSourceKind
  name: string
  text?: string
  url?: string
}

export interface CareerInputBundle {
  sources: CareerInputSource[]
  evidence: CareerEvidence
  careerAlpha: ExtractedCareerData & {
    interests: string[]
    sourceSummary: {
      resume: boolean
      portfolio: boolean
      projectsSpreadsheet: boolean
      supportingDocuments: number
      profileLinks: number
    }
  }
}

/**
 * The single boundary between ingestion and Career Alpha.
 *
 * Any combination is valid:
 * - resume only
 * - portfolio only
 * - projects spreadsheet only
 * - resume + portfolio
 * - resume + spreadsheet
 * - portfolio + spreadsheet
 * - resume + portfolio + spreadsheet
 * - any of the above plus supporting documents/profile links
 *
 * All sources are normalized into CareerEvidence first. Career Alpha never
 * needs to know which source produced a signal.
 */
export function buildCareerInputBundle(
  evidence: CareerEvidence,
  sources: CareerInputSource[],
  interests: string[] = []
): CareerInputBundle {
  const careerAlpha = careerEvidenceToCareerAlphaInput(evidence, interests)

  const sourceSummary = {
    resume: sources.some(s => s.kind === 'resume'),
    portfolio: sources.some(s => s.kind === 'portfolio'),
    projectsSpreadsheet: sources.some(s => s.kind === 'projects-spreadsheet'),
    supportingDocuments: sources.filter(s => s.kind === 'supporting-document').length,
    profileLinks: sources.filter(s => s.kind === 'profile-link').length,
  }

  return {
    sources,
    evidence,
    careerAlpha: {
      ...careerAlpha,
      sourceSummary,
    },
  }
}
