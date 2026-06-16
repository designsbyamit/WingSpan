// types/wingspan.ts

export type Screen = 'welcome' | 'footprint' | 'discovering' | 'validating' | 'blueprint'

export interface TimelineEntry {
  id: string
  role: string
  company: string
  startDate: string
  endDate: string
  description?: string
  confirmed: boolean
}

export interface Project {
  id: string
  name: string
  company: string
  year?: string
  industry?: string
  platform?: string
  audience?: string
  summary?: string
  impact?: string
}

export interface ExtractedCareerData {
  timeline: TimelineEntry[]
  projects: Project[]
  skills: string[]
  education: Array<{ institution: string; degree: string; year?: string }>
  rawText: string
}

export interface ValidatedCareerData extends ExtractedCareerData {
  interests: string[]
}

export interface Strength {
  name: string
  confidence: number
  evidence: string
  projectCount: number
  projects: string[]
  rationale: string
}

export interface Interest {
  name: string
  frequency: number
  evidence: string
}

export interface FuturePath {
  title: string
  whyItFits: string
  evidence: string[]
  opportunitySize: 'emerging' | 'growing' | 'established'
  confidence: number
}

export interface Gap {
  pathway: string
  currentReadiness: number
  futureReadiness: number
  requiredCapabilities: string[]
  gapSize: 'small' | 'medium' | 'large'
  timeline: string
  effort: string
  howToClose: string
}

export interface Action {
  title: string
  description: string
  measurable: string
  pathway: string
  priority: 'high' | 'medium' | 'low'
}

export interface Resource {
  type: 'book' | 'course' | 'community' | 'event' | 'article' | 'framework'
  title: string
  url?: string
  pathway: string
}

export interface Blueprint {
  profileMap: {
    identityStatement: string
    yearsOfExperience: number
    industries: string[]
    platforms: string[]
    domains: string[]
    careerEvolution: string
  }
  strengths: Strength[]
  interests: Interest[]
  futurePaths: FuturePath[]
  gaps: Gap[]
  actions: {
    immediate: Action[]
    mediumTerm: Action[]
    longTerm: Action[]
    resources: Resource[]
  }
  confidenceScores: {
    timeline: number
    projects: number
    strengths: number
    futurePaths: number
  }
  insights: string[]
  rationale: Record<string, string>
}

export type DiscoveryStep =
  | 'parsing'
  | 'structuring'
  | 'timeline'
  | 'strengths'
  | 'paths'
  | 'gaps'
  | 'actions'
  | 'complete'

export interface DiscoveryProgress {
  currentStep: DiscoveryStep | null
  completedSteps: DiscoveryStep[]
  observations: string[]
  percentage: number
}

export interface WingspanState {
  screen: Screen
  files: File[]
  urls: Record<string, string>
  interests: string[]
  extractedData: ExtractedCareerData | null
  discoveryProgress: DiscoveryProgress
  validatedData: ValidatedCareerData | null
  blueprint: Blueprint | null
  error: string | null
}

export type WingspanAction =
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'SET_FILES'; files: File[] }
  | { type: 'SET_URL'; key: string; value: string }
  | { type: 'TOGGLE_INTEREST'; interest: string }
  | { type: 'SET_EXTRACTED_DATA'; data: ExtractedCareerData }
  | { type: 'SET_DISCOVERY_STEP'; step: DiscoveryStep; percentage: number }
  | { type: 'ADD_OBSERVATION'; text: string }
  | { type: 'COMPLETE_STEP'; step: DiscoveryStep }
  | { type: 'SET_VALIDATED_DATA'; data: ValidatedCareerData }
  | { type: 'UPDATE_TIMELINE_ENTRY'; entry: TimelineEntry }
  | { type: 'REMOVE_TIMELINE_ENTRY'; id: string }
  | { type: 'SET_BLUEPRINT'; blueprint: Blueprint }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
