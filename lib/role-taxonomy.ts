import type { ExperienceFacts } from '@/lib/experience'

// Canonical job titles. The Direction Generator must name every direction as one of these base
// titles, optionally followed by a focus ("Head of Design, AI Products"). Anything else is mapped to
// the nearest canonical title or dropped, so the app never recommends an invented role.

export type RoleLevel = 'early' | 'mid' | 'senior' | 'leader'
export type RoleFamily =
  | 'design-ic' | 'design-management' | 'research' | 'design-ops' | 'strategy-experience'
  | 'product' | 'ai' | 'innovation-venture' | 'consulting' | 'education' | 'data-engineering' | 'marketing-ops'

export interface RoleTitle { title: string; family: RoleFamily; levels: RoleLevel[]; aliases?: string[] }

const R = (title: string, family: RoleFamily, levels: RoleLevel[], aliases: string[] = []): RoleTitle => ({ title, family, levels, aliases })

export const ROLE_TITLES: RoleTitle[] = [
  // Design, individual contributor
  R('UX Designer', 'design-ic', ['early', 'mid']),
  R('UI Designer', 'design-ic', ['early', 'mid']),
  R('Product Designer', 'design-ic', ['early', 'mid'], ['ux/ui designer', 'ui/ux designer']),
  R('Senior Product Designer', 'design-ic', ['mid', 'senior'], ['senior ux designer']),
  R('Lead Product Designer', 'design-ic', ['senior'], ['lead designer', 'lead ux designer']),
  R('Staff Product Designer', 'design-ic', ['senior']),
  R('Principal Product Designer', 'design-ic', ['senior', 'leader'], ['principal designer', 'principal ux designer']),
  R('Interaction Designer', 'design-ic', ['early', 'mid']),
  R('Visual Designer', 'design-ic', ['early', 'mid']),
  R('Service Designer', 'design-ic', ['mid', 'senior']),
  R('Content Designer', 'design-ic', ['early', 'mid', 'senior'], ['ux writer']),
  R('Design Engineer', 'design-ic', ['mid', 'senior'], ['design technologist', 'ux engineer']),
  R('Accessibility Lead', 'design-ic', ['senior'], ['accessibility specialist']),
  // Design management
  R('Design Manager', 'design-management', ['senior']),
  R('Senior Design Manager', 'design-management', ['senior', 'leader']),
  R('Design Director', 'design-management', ['leader'], ['director of design', 'director, design']),
  R('Director of Product Design', 'design-management', ['leader'], ['product design director']),
  R('Director of UX', 'design-management', ['leader'], ['ux director', 'director of user experience']),
  R('Head of Design', 'design-management', ['leader']),
  R('Head of Product Design', 'design-management', ['leader']),
  R('Head of UX', 'design-management', ['leader'], ['head of user experience']),
  R('VP of Design', 'design-management', ['leader'], ['vice president of design', 'vp design', 'vp, design']),
  R('VP of User Experience', 'design-management', ['leader'], ['vp ux', 'vp of ux']),
  R('Chief Design Officer', 'design-management', ['leader'], ['cdo']),
  R('Creative Director', 'design-management', ['senior', 'leader']),
  R('Executive Creative Director', 'design-management', ['leader']),
  // Research
  R('UX Researcher', 'research', ['early', 'mid'], ['user researcher']),
  R('Senior UX Researcher', 'research', ['mid', 'senior']),
  R('Lead UX Researcher', 'research', ['senior'], ['principal ux researcher', 'research lead']),
  R('UX Research Manager', 'research', ['senior'], ['research manager']),
  R('Head of Research', 'research', ['leader'], ['head of ux research', 'director of ux research', 'director of research']),
  // Design operations and systems
  R('Design Systems Lead', 'design-ops', ['senior'], ['design system lead']),
  R('Design Systems Manager', 'design-ops', ['senior']),
  R('Design Operations Manager', 'design-ops', ['mid', 'senior'], ['designops manager', 'design ops manager']),
  R('Head of Design Operations', 'design-ops', ['leader'], ['director of design operations', 'head of designops']),
  // Strategy and experience
  R('Design Strategist', 'strategy-experience', ['mid', 'senior']),
  R('Design Strategy Director', 'strategy-experience', ['leader'], ['director of design strategy']),
  R('Experience Design Director', 'strategy-experience', ['leader'], ['director of experience design']),
  R('Head of Service Design', 'strategy-experience', ['leader']),
  R('Head of Customer Experience', 'strategy-experience', ['leader'], ['head of cx', 'director of customer experience']),
  R('VP of Customer Experience', 'strategy-experience', ['leader'], ['vp of cx', 'vp customer experience']),
  R('Chief Experience Officer', 'strategy-experience', ['leader'], ['cxo']),
  // Product
  R('Associate Product Manager', 'product', ['early']),
  R('Product Manager', 'product', ['mid']),
  R('Senior Product Manager', 'product', ['senior']),
  R('Group Product Manager', 'product', ['senior', 'leader']),
  R('Principal Product Manager', 'product', ['senior', 'leader']),
  R('Director of Product Management', 'product', ['leader'], ['director of product', 'product director']),
  R('Director of Product Strategy', 'product', ['leader'], ['product strategy director']),
  R('Head of Product', 'product', ['leader']),
  R('Head of Product Strategy', 'product', ['leader']),
  R('VP of Product', 'product', ['leader'], ['vp product', 'vice president of product']),
  R('Chief Product Officer', 'product', ['leader'], ['cpo']),
  // AI
  R('AI Product Designer', 'ai', ['mid', 'senior']),
  R('Conversation Designer', 'ai', ['early', 'mid', 'senior'], ['conversational designer', 'conversation design lead']),
  R('AI Product Manager', 'ai', ['mid', 'senior']),
  R('Responsible AI Lead', 'ai', ['senior', 'leader'], ['ai governance lead', 'head of responsible ai']),
  // Innovation, ventures, consulting
  R('Head of Innovation', 'innovation-venture', ['leader'], ['innovation director', 'director of innovation']),
  R('Venture Partner', 'innovation-venture', ['leader']),
  R('Founder', 'innovation-venture', ['mid', 'senior', 'leader'], ['co-founder', 'cofounder']),
  R('Design Consultant', 'consulting', ['mid', 'senior']),
  R('Principal Design Consultant', 'consulting', ['senior', 'leader']),
  R('Design Partner', 'consulting', ['leader'], ['partner, design']),
  R('Management Consultant', 'consulting', ['mid', 'senior']),
  // Education
  R('Design Educator', 'education', ['mid', 'senior'], ['design faculty', 'design instructor']),
  R('Professor of Design', 'education', ['leader'], ['design professor']),
  R('Head of Design School', 'education', ['leader'], ['dean of design', 'design school director', 'program director, design']),
  // Data and engineering
  R('Data Analyst', 'data-engineering', ['early', 'mid']),
  R('Data Scientist', 'data-engineering', ['mid', 'senior']),
  R('Machine Learning Engineer', 'data-engineering', ['mid', 'senior'], ['ml engineer']),
  R('Software Engineer', 'data-engineering', ['early', 'mid', 'senior']),
  R('Engineering Manager', 'data-engineering', ['senior', 'leader']),
  // Marketing and operations
  R('Brand Director', 'marketing-ops', ['leader'], ['head of brand']),
  R('Head of Marketing', 'marketing-ops', ['leader'], ['marketing director', 'vp of marketing']),
  R('Program Manager', 'marketing-ops', ['mid', 'senior']),
  R('Chief of Staff', 'marketing-ops', ['senior', 'leader']),
]

/** Focus qualifiers that may follow a base title ("Head of Design, AI Products"). */
export const FOCUS_AREAS = [
  'AI Products', 'Agentic AI', 'Enterprise Software', 'B2B SaaS', 'Platforms', 'Developer Tools', 'Data & Analytics',
  'Fintech', 'Healthcare', 'E-commerce', 'Consumer Apps', 'Public Sector', 'Mobility', 'Retail', 'Education',
  'Sustainability', 'Emerging Tech', 'Growth', 'Design Systems', 'Customer Experience', 'Global Capability Centres',
]

const norm = (s: string) => s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim()
const words = (s: string) => new Set(norm(s).split(' ').filter((w) => w.length > 1 && !['of', 'and', 'the', 'for'].includes(w)))

function overlap(a: string, b: string): number {
  const A = words(a), B = words(b)
  if (!A.size || !B.size) return 0
  let n = 0
  A.forEach((w) => { if (B.has(w)) n++ })
  return n / Math.max(A.size, B.size)
}

export interface CanonicalTitle { direction: string; base: RoleTitle; focus: string | null; mapped: boolean }

const findExact = (s: string) => {
  const key = norm(s)
  return ROLE_TITLES.find((r) => norm(r.title) === key || (r.aliases ?? []).some((a) => norm(a) === key))
}

function cleanFocus(raw: string | null): string | null {
  if (!raw) return null
  const f = raw.replace(/\([^)]*\)/g, ' ').replace(/[)(]/g, ' ').trim()
  if (!f) return null
  const known = FOCUS_AREAS.map((a) => ({ a, s: overlap(a, f) })).sort((x, y) => y.s - x.s)[0]
  if (known && known.s >= 0.5) return known.a
  // A free-form focus must read as a short domain, not another title or jargon.
  if (!/^[A-Za-z&' ]+$/.test(f) || f.split(/\s+/).length > 3) return null
  if (ROLE_TITLES.some((r) => overlap(f, r.title) >= 0.6)) return null
  return f.replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Split "Base, Focus" / "Base (Focus)" / "Base - Focus" and match the base title against the catalog.
 * strict: exact title or alias only. Lenient: also the closest title sharing at least 75% of its words.
 * Returns null when the base isn't a real title.
 */
export function canonicalizeTitle(raw: string, opts: { strict?: boolean } = {}): CanonicalTitle | null {
  const text = String(raw ?? '').trim()
  if (!text) return null
  const m = text.match(/^(.*?)\s*(?:,|\(|\s[-–—]\s|:)\s*(.+)$/)
  const basePart = (m ? m[1] : text).trim()
  let base = findExact(basePart) ?? findExact(text.replace(/\([^)]*\)/g, '').trim())
  let mapped = false
  if (!base && !opts.strict) {
    let best: RoleTitle | undefined
    let bestScore = 0
    for (const r of ROLE_TITLES) {
      for (const cand of [r.title, ...(r.aliases ?? [])]) {
        const A = words(basePart), B = words(cand)
        let n = 0
        A.forEach((w) => { if (B.has(w)) n++ })
        const s = A.size && B.size ? n / (A.size + B.size - n) : 0 // Jaccard: penalises extra words both ways
        if (s > bestScore) { bestScore = s; best = r }
      }
    }
    if (best && bestScore >= 0.75) { base = best; mapped = true }
  }
  if (!base) return null
  const focus = m && findExact(basePart) ? cleanFocus(m[2]) : null
  const direction = focus ? `${base.title}, ${focus}` : base.title
  return { direction, base, focus, mapped: mapped || norm(direction) !== norm(text) }
}

const ORDER: RoleLevel[] = ['early', 'mid', 'senior', 'leader']

/** A title fits when its levels reach the person's band (or one below, for a deliberate IC track). */
export function fitsSeniority(base: RoleTitle, seniority: ExperienceFacts['seniority']): boolean {
  const idx = ORDER.indexOf(seniority)
  const top = Math.max(...base.levels.map((l) => ORDER.indexOf(l)))
  return top >= idx || (seniority === 'leader' && base.levels.includes('senior') && /principal|staff|partner|founder/i.test(base.title))
}

/** Prompt block listing the allowed titles for this seniority. */
export function titleCatalogPrompt(seniority: ExperienceFacts['seniority']): string {
  const allowed = ROLE_TITLES.filter((r) => fitsSeniority(r, seniority))
  const byFamily = new Map<string, string[]>()
  for (const r of allowed) byFamily.set(r.family, [...(byFamily.get(r.family) ?? []), r.title])
  return `ALLOWED JOB TITLES (real titles companies hire for; use these exact base titles):
${[...byFamily.entries()].map(([f, t]) => `- ${f}: ${t.join('; ')}`).join('\n')}
A direction is "<Base title>" or "<Base title>, <Focus>" where Focus is a short domain such as: ${FOCUS_AREAS.join(', ')}.
Never invent titles, never combine two titles, never use jargon ("orchestrated systems", "experience alchemist").`
}

export const FAMILY_LABELS: Record<RoleFamily, string> = {
  'design-ic': 'product and UX design', 'design-management': 'design leadership', research: 'UX research',
  'design-ops': 'design operations and systems', 'strategy-experience': 'design strategy and customer experience',
  product: 'product management and strategy', ai: 'AI product and conversation design', 'innovation-venture': 'innovation and ventures',
  consulting: 'design and strategy consulting', education: 'design education', 'data-engineering': 'data and engineering',
  'marketing-ops': 'marketing and operations',
}

/** The field a market scan should cover: the families of the person's roles, then their stated interests. */
export function fieldsFor(roles: string[], interests: string[]): string[] {
  const fams = new Set<string>()
  for (const r of roles) {
    const c = canonicalizeTitle(r)
    if (c) fams.add(FAMILY_LABELS[c.base.family])
    else if (/design|ux|ui/i.test(r)) fams.add(FAMILY_LABELS['design-ic'])
    else if (/product/i.test(r)) fams.add(FAMILY_LABELS.product)
  }
  return [...fams, ...interests].slice(0, 10)
}
