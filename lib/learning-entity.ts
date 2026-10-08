// Learning content is referenced through typed foreign keys (experienceId / conceptId / challengeId).
// The API and UI still speak in { entityType, entityId }, so this maps between the two.
export type EntityType = 'experience' | 'concept' | 'challenge'

export interface EntityRefColumns {
  experienceId: string | null
  conceptId: string | null
  challengeId: string | null
}

export function entityOf(row: EntityRefColumns): { entityType: EntityType; entityId: string } | null {
  if (row.experienceId) return { entityType: 'experience', entityId: row.experienceId }
  if (row.conceptId) return { entityType: 'concept', entityId: row.conceptId }
  if (row.challengeId) return { entityType: 'challenge', entityId: row.challengeId }
  return null
}

/** Foreign-key columns for creating a row that points at one piece of content. */
export function entityColumns(entityType: EntityType, entityId: string): EntityRefColumns {
  return {
    experienceId: entityType === 'experience' ? entityId : null,
    conceptId: entityType === 'concept' ? entityId : null,
    challengeId: entityType === 'challenge' ? entityId : null,
  }
}

/** JSON columns hold string arrays; tolerate anything else by returning []. */
export function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

const EXPERIENCE_TYPE_VALUES = {
  MODULE: 'module',
  PROJECT: 'project',
  EXERCISE: 'exercise',
  CASE_STUDY: 'case-study',
  OTHER: 'other',
} as const

/** The stored/API spelling of an ExperienceType (e.g. CASE_STUDY -> "case-study"). */
export function experienceTypeValue(type: keyof typeof EXPERIENCE_TYPE_VALUES): string {
  return EXPERIENCE_TYPE_VALUES[type]
}
