// types/wingspan.ts

export type Screen = 'welcome' | 'footprint' | 'discovering' | 'validating' | 'blueprint'

export type BlueprintStep = 'profile' | 'intelligence' | 'path-selection' | 'gap-analysis' | 'roadmap' | 'resources'

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
  careerAdvantage: string
  projectCount: number
  projects: string[]
  rationale: string
}

export interface Interest {
  name: string
  frequency: number
  evidence: string
  whyItAppears: string[]
  marketOutlook: 'Very High Growth' | 'High Growth' | 'Emerging' | 'Stable'
  futureRelevance: string
}

export interface FuturePath {
  title: string
  whyItFits: string
  evidence: string[]
  opportunitySize: 'emerging' | 'growing' | 'established'
  confidence: number
  recommendationStatus: 'Recommended' | 'Strongly Recommended' | 'Emerging Opportunity'
  timeline: string
  marketDemand: 'Very High' | 'High' | 'Moderate' | 'Emerging'
  growthPotential: 'Excellent' | 'Strong' | 'Good' | 'Moderate'
  keyTransitionAreas: string[]
}

export type GapType = 'Skills Gap' | 'Positioning Gap' | 'Leadership Gap' | 'Visibility Gap' | 'Domain Gap'

export interface Gap {
  pathway: string
  gapType: GapType
  currentReadiness: number
  futureReadiness: number
  currentState: string
  desiredState: string
  requiredCapabilities: string[]
  gapSize: 'small' | 'medium' | 'large'
  whyItMatters: string
  timeline: string
  effort: string
  howToClose: string
}

export type ActionType = 'project' | 'link' | 'book' | 'course' | 'community' | 'publish' | 'connect' | 'general'

export interface Action {
  title: string
  description: string
  measurable: string
  pathway: string
  priority: 'high' | 'medium' | 'low'
  actionType: ActionType
  howToStart: string       // specific first step — "Open X, click Y, do Z"
  link?: string            // working URL for link/course/community/book actions
  linkLabel?: string       // CTA label e.g. "Open Course", "Buy on Amazon", "Join Community"
  whereToStart?: string    // for projects: platform or context (e.g. "Figma Community", "GitHub")
  timeEstimate?: string    // e.g. "2 hours", "1 week", "ongoing"
}

export interface Resource {
  type: 'book' | 'course' | 'community' | 'event' | 'article' | 'framework'
  title: string
  url?: string
  pathway: string
  whereToStart?: string
  firstStep?: string
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
  selectedPath: string | null
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
  | { type: 'SELECT_PATH'; path: string }
