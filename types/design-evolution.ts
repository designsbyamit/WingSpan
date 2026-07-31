// types/design-evolution.ts
// Shared types for the Design Evolution learning platform (Plan 4)

export interface Session {
  userId: string
  name: string
  email: string
}

export interface ConceptData {
  id: string
  name: string        // maps to Concept.title in DB
  definition: string  // maps to Concept.body in DB
  whyItMatters: string // maps to Concept.summary in DB
}

export interface CompetencyData {
  id: string
  name: string
  description: string
  weight: number
}

export interface ExperienceData {
  id: string
  title: string
  description: string
  narrativeText: string
  scenarioText: string
  estimatedMinutes: number
  xpReward: number
  concepts: ConceptData[]
  competencies: CompetencyData[]
}

export interface LearningSessionData {
  id: string
  experienceId: string
  startedAt: string
  completedAt: string | null
  reflectionText: string | null
  aiMessages: Array<{ role: 'user' | 'assistant'; content: string }>
}

export interface TodaySessionResponse {
  experience: ExperienceData
  session: LearningSessionData
}

export interface CompleteSessionRequest {
  sessionId: string
  reflectionText: string
}

export interface CompleteSessionResponse {
  xpEarned: number
  competenciesUpdated: Array<{ name: string; newScore: number }>
  newStreak: number
}

export interface MentorMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface MentorRequest {
  sessionId: string
  experienceId: string
  messages: MentorMessage[]
}

export interface CompetencyBarData {
  id: string
  name: string
  score: number // 0–100
}
