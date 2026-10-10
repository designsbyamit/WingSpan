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
  evidence = normalizeCareerEvidence(evidence)
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

const list = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])
const strings = (v: unknown): string[] => list<unknown>(v).filter((x): x is string => typeof x === 'string')

/** Models omit fields. Fill every list and object the pipeline relies on, so partial replies never crash it. */
export function normalizeCareerEvidence(raw: Partial<CareerEvidence> | null | undefined): CareerEvidence {
  const e = (raw && typeof raw === 'object' ? raw : {}) as Partial<CareerEvidence>
  const quality = e.evidenceQuality === 'rich' || e.evidenceQuality === 'moderate' ? e.evidenceQuality : 'sparse'
  return {
    ...e,
    schemaVersion: '1.0',
    person: e.person && typeof e.person === 'object' ? e.person : {},
    timeline: list<TimelineEntry>(e.timeline).filter((t) => t && typeof t === 'object'),
    projects: list<CareerEvidenceProject>(e.projects).filter((p) => p && typeof p === 'object').map((p, i) => ({
      ...p,
      id: p.id ?? `project-${i + 1}`,
      name: p.name ?? 'Untitled project',
      company: p.company ?? '',
      sourceUrls: strings(p.sourceUrls),
      evidence: strings(p.evidence),
      visualSignals: strings(p.visualSignals),
      methods: strings(p.methods),
      responsibilities: strings(p.responsibilities),
      outcomes: strings(p.outcomes),
      technologies: strings(p.technologies),
    })),
    skills: strings(e.skills),
    education: list<CareerEvidence['education'][number]>(e.education).filter((x) => x && typeof x === 'object'),
    certifications: strings(e.certifications),
    publications: strings(e.publications),
    communities: strings(e.communities),
    domains: strings(e.domains),
    methods: strings(e.methods),
    technologies: strings(e.technologies),
    metrics: list<CareerEvidence['metrics'][number]>(e.metrics).filter((x) => x && typeof x === 'object'),
    interests: strings(e.interests),
    geographySignals: strings(e.geographySignals),
    footprintSignals: strings(e.footprintSignals),
    evidenceQuality: quality,
    sources: list<EvidenceSource>(e.sources),
    pagesScanned: list<CareerEvidence['pagesScanned'][number]>(e.pagesScanned),
    extractionNotes: strings(e.extractionNotes),
  }
}
