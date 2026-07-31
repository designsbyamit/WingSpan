// Types for GET /api/profile
//
// Note: schema adaptations from plan brief:
//   - User.xp (not totalXP), User.streak (not currentStreak/longestStreak)
//   - UserCompetency.level (not score)
//   - UserSkill.level (not score), Skill.domain is Domain model
//   - LearningSession has entityType/entityId (generic) — no xpEarned, no experience relation
//   - UserConceptMastery.lastSeenAt (not lastSeen), concept.title (not concept.name)

export interface ProfileResponse {
  user: {
    name: string
    email: string
    xp: number
    streak: number
    createdAt: string       // ISO date string
    careerLevel: string | null
  }
  competencies: Array<{
    competency: { id: string; name: string; description: string | null }
    level: number
  }>
  recentSessions: Array<{
    id: string
    completedAt: string     // ISO date string
    entityType: string
    entityId: string
    durationSec: number | null
  }>
  masteredConcepts: Array<{
    conceptId: string
    concept: { title: string }
    mastered: boolean
    lastSeenAt: string | null
  }>
  skills: Array<{
    skillId: string
    skill: { name: string; domain: { name: string } | null }
    level: number
  }>
  daysSinceJoined: number
}
