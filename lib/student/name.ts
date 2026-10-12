// First name from the resume's printed name, for speaking to the student directly. Returns null when unsure,
// so the screen falls back to neutral wording instead of greeting someone with a wrong word.
const TITLES = new Set(['mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'er', 'shri', 'smt', 'kumari'])

export function firstNameOf(full: string | null | undefined): string | null {
  if (!full) return null
  const parts = full.replace(/[(),]/g, ' ').trim().split(/\s+/).filter((p) => p && !TITLES.has(p.toLowerCase().replace(/\./g, '')))
  const first = parts[0]?.replace(/\.$/, '')
  if (!first || first.length < 2 || first.length > 24) return null
  if (!/^[\p{L}][\p{L}'’-]*$/u.test(first)) return null // digits, emails, urls, initials with dots
  if (parts.length === 1 && /^(resume|curriculum|portfolio|cv)$/i.test(first)) return null
  // ALL CAPS printed names become Title Case; mixed case is left alone.
  return first === first.toUpperCase() ? first[0] + first.slice(1).toLowerCase() : first
}
