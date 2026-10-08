import { Project, TimelineEntry, ExtractedCareerData } from '@/types/wingspan'

export interface EvidenceSource {
  type: 'resume' | 'portfolio-page' | 'project-page' | 'sitemap' | 'profile-link' | 'screenshot'
  url?: string
  title?: string
  confidence: number
  excerpt?: string
}

export interface CareerEvidenceProject extends Project {
  sourceUrls: string[]
  evidence: string[]
  visualSignals: string[]
  methods: string[]
  responsibilities: string[]
  outcomes: string[]
  technologies: string[]
}

export interface CareerEvidence {
  schemaVersion: '1.0'
  person: {
    name?: string
    headline?: string
    location?: string
    summary?: string
  }
  timeline: TimelineEntry[]
  projects: CareerEvidenceProject[]
  skills: string[]
  education: Array<{ institution: string; degree: string; year?: string }>
  certifications: string[]
  publications: string[]
  communities: string[]
  domains: string[]
  methods: string[]
  technologies: string[]
  metrics: Array<{ label: string; value: string; source?: string }>
  interests: string[]
  geographySignals: string[]
  footprintSignals: string[]
  evidenceQuality: 'rich' | 'moderate' | 'sparse'
  sources: EvidenceSource[]
  pagesScanned: Array<{
    url: string
    title: string
    type: 'home' | 'about' | 'projects' | 'project' | 'resume' | 'contact' | 'other'
    textLength: number
    screenshotCaptured: boolean
  }>
  extractionNotes: string[]
}

export function careerEvidenceToCareerAlphaInput(
  evidence: CareerEvidence,
  interests: string[]
): ExtractedCareerData & { interests: string[] } {
  const rawText = [
    evidence.person.name ? `Name: ${evidence.person.name}` : '',
    evidence.person.headline ? `Headline: ${evidence.person.headline}` : '',
    evidence.person.summary ? `Summary: ${evidence.person.summary}` : '',
    ...evidence.timeline.map(t => `${t.role} at ${t.company} (${t.startDate}-${t.endDate}): ${t.description ?? ''}`),
    ...evidence.projects.map(p => `${p.name} | ${p.company} | ${p.summary ?? ''} | ${p.impact ?? ''}`),
    `Skills: ${evidence.skills.join(', ')}`,
    `Methods: ${evidence.methods.join(', ')}`,
    `Technologies: ${evidence.technologies.join(', ')}`,
    `Domains: ${evidence.domains.join(', ')}`,
  ].filter(Boolean).join('\n')

  return {
    timeline: evidence.timeline,
    projects: evidence.projects.map(p => ({
      id: p.id, name: p.name, company: p.company, year: p.year,
      industry: p.industry, platform: p.platform, audience: p.audience,
      summary: p.summary, impact: p.impact,
    })),
    skills: [...new Set([...evidence.skills, ...evidence.methods, ...evidence.technologies])],
    education: evidence.education,
    rawText: rawText.slice(0, 12000),
    careerStageSignals: [
      ...evidence.extractionNotes,
      evidence.person.headline ?? '',
      `${evidence.timeline.length} career roles detected`,
      `${evidence.projects.length} projects detected`,
    ].filter(Boolean),
    evidenceQuality: evidence.evidenceQuality,
    geographySignals: evidence.geographySignals,
    footprintSignals: evidence.footprintSignals,
    interests,
  }
}
