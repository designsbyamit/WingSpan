import type { ExtractedCareerData } from '@/types/wingspan'
import { factsOf, type ExperienceFacts } from '@/lib/experience'

// The interest taxonomy: five groups that don't overlap, each with interests named the way the
// industry names them. Suggestions are computed from the resume (skills, roles, projects) and the
// person's seniority, so a design leader sees leadership and strategy first and an early-career
// designer sees craft first. Pure functions: no AI, no network.

export type InterestGroupId = 'craft' | 'ai' | 'product' | 'leadership' | 'influence'

export interface Interest {
  id: string
  label: string
  group: InterestGroupId
  /** One line shown on hover / long-press so the meaning is unambiguous. */
  hint: string
  /** Lower-case phrases that signal this interest in a resume. */
  keywords: string[]
  /** How relevant this tends to be at each seniority band (0-1). */
  affinity: Record<ExperienceFacts['seniority'], number>
}

export interface InterestGroup { id: InterestGroupId; label: string; description: string }

export const INTEREST_GROUPS: InterestGroup[] = [
  { id: 'craft', label: 'Design craft', description: 'How products are researched, shaped and made usable' },
  { id: 'ai', label: 'AI & emerging tech', description: 'Designing with and for intelligent systems' },
  { id: 'product', label: 'Product & business', description: 'Where design meets strategy, growth and value' },
  { id: 'leadership', label: 'Leadership & organisation', description: 'Leading people, teams and design at scale' },
  { id: 'influence', label: 'Influence & visibility', description: 'Communicating, teaching and shaping the field' },
]

const A = (early: number, mid: number, senior: number, leader: number) => ({ early, mid, senior, leader })

export const INTERESTS: Interest[] = [
  // Design craft
  { id: 'product-design', label: 'Product Design', group: 'craft', hint: 'End-to-end design of digital products', keywords: ['product design', 'product designer', 'ux/ui', 'ui/ux', 'end-to-end'], affinity: A(1, 0.9, 0.6, 0.4) },
  { id: 'ux-research', label: 'UX Research', group: 'craft', hint: 'Understanding users through qualitative and quantitative research', keywords: ['research', 'usability', 'interviews', 'user testing', 'ethnograph', 'survey'], affinity: A(0.9, 0.8, 0.6, 0.4) },
  { id: 'interaction-design', label: 'Interaction Design', group: 'craft', hint: 'Flows, behaviours and micro-interactions', keywords: ['interaction', 'prototyp', 'micro-interaction', 'motion', 'flows'], affinity: A(1, 0.8, 0.5, 0.3) },
  { id: 'visual-ui', label: 'Visual & UI Design', group: 'craft', hint: 'Visual language, typography, layout and UI', keywords: ['visual design', 'ui design', 'typography', 'branding', 'illustration', 'graphic'], affinity: A(1, 0.7, 0.4, 0.2) },
  { id: 'design-systems', label: 'Design Systems', group: 'craft', hint: 'Shared components, tokens and standards at scale', keywords: ['design system', 'component library', 'tokens', 'pattern library', 'storybook'], affinity: A(0.6, 0.9, 0.8, 0.6) },
  { id: 'service-design', label: 'Service Design', group: 'craft', hint: 'Whole services across channels, people and operations', keywords: ['service design', 'blueprint', 'omnichannel', 'journey map', 'customer journey'], affinity: A(0.6, 0.8, 0.8, 0.7) },
  { id: 'accessibility', label: 'Accessibility & Inclusive Design', group: 'craft', hint: 'Products everyone can use', keywords: ['accessib', 'wcag', 'inclusive', 'a11y'], affinity: A(0.8, 0.8, 0.7, 0.5) },
  { id: 'content-design', label: 'Content Design', group: 'craft', hint: 'Words, information architecture and UX writing', keywords: ['content design', 'ux writing', 'copy', 'information architecture', 'taxonomy'], affinity: A(0.8, 0.7, 0.5, 0.3) },

  // AI & emerging tech
  { id: 'ai-product-design', label: 'AI Product Design', group: 'ai', hint: 'Designing products powered by machine learning and generative AI', keywords: ['ai', 'machine learning', 'ml', 'generative', 'genai', 'llm', 'gpt', 'copilot'], affinity: A(0.9, 1, 0.9, 0.8) },
  { id: 'agentic-experience', label: 'Agentic Experience Design', group: 'ai', hint: 'Experiences where AI agents act on behalf of people, alone or together', keywords: ['agent', 'agentic', 'autonomous', 'multi-agent', 'orchestrat'], affinity: A(0.7, 0.9, 0.9, 0.9) },
  { id: 'conversational-design', label: 'Conversational & Voice Design', group: 'ai', hint: 'Chat, voice and natural-language interfaces', keywords: ['conversational', 'chatbot', 'voice', 'assistant', 'nlu', 'dialog'], affinity: A(0.8, 0.8, 0.6, 0.4) },
  { id: 'responsible-ai', label: 'Responsible AI & Governance', group: 'ai', hint: 'Trust, safety, ethics and policy for AI products', keywords: ['responsible ai', 'governance', 'ethic', 'trust', 'compliance', 'risk', 'policy'], affinity: A(0.4, 0.6, 0.8, 0.9) },
  { id: 'ai-workflows', label: 'AI-assisted Design Workflows', group: 'ai', hint: 'Using AI tools to change how design work gets done', keywords: ['ai tools', 'midjourney', 'figma ai', 'automation', 'workflow', 'prompt'], affinity: A(1, 0.9, 0.7, 0.6) },
  { id: 'data-analytics', label: 'Data & Analytics', group: 'ai', hint: 'Product analytics, metrics and data-informed design', keywords: ['data', 'analytics', 'dashboard', 'metrics', 'sql', 'visualization', 'visualisation'], affinity: A(0.7, 0.8, 0.7, 0.6) },
  { id: 'spatial-xr', label: 'Spatial & Immersive (AR/VR/XR)', group: 'ai', hint: 'Spatial computing, AR/VR and connected devices', keywords: ['ar', 'vr', 'xr', 'spatial', 'immersive', 'iot', '3d'], affinity: A(0.8, 0.6, 0.4, 0.3) },
  { id: 'design-engineering', label: 'Design Engineering', group: 'ai', hint: 'Prototyping and building in code', keywords: ['front-end', 'frontend', 'react', 'javascript', 'html', 'css', 'code', 'swift'], affinity: A(0.9, 0.7, 0.5, 0.3) },

  // Product & business
  { id: 'product-strategy', label: 'Product Strategy', group: 'product', hint: 'Deciding what to build and why', keywords: ['product strategy', 'roadmap', 'vision', 'prioriti', 'okr'], affinity: A(0.5, 0.8, 1, 1) },
  { id: 'product-management', label: 'Product Management', group: 'product', hint: 'Owning outcomes for a product or platform', keywords: ['product manag', 'product owner', 'backlog', 'requirements', 'go-to-market'], affinity: A(0.5, 0.7, 0.8, 0.7) },
  { id: 'growth-experimentation', label: 'Growth & Experimentation', group: 'product', hint: 'Activation, retention and A/B testing', keywords: ['growth', 'conversion', 'a/b', 'experiment', 'retention', 'funnel'], affinity: A(0.7, 0.8, 0.7, 0.5) },
  { id: 'business-strategy', label: 'Business Strategy', group: 'product', hint: 'Markets, business models and competitive position', keywords: ['business strategy', 'business model', 'p&l', 'revenue', 'market', 'commercial'], affinity: A(0.3, 0.6, 0.9, 1) },
  { id: 'platforms-ecosystems', label: 'Platforms & Ecosystems', group: 'product', hint: 'Multi-product platforms, APIs and partner ecosystems', keywords: ['platform', 'ecosystem', 'saas', 'enterprise', 'api', 'marketplace'], affinity: A(0.4, 0.7, 0.9, 0.9) },
  { id: 'digital-transformation', label: 'Digital Transformation', group: 'product', hint: 'Modernising how large organisations work and serve customers', keywords: ['transformation', 'modernis', 'moderniz', 'legacy', 'consulting', 'change programme'], affinity: A(0.3, 0.6, 0.9, 1) },
  { id: 'foresight', label: 'Strategic Foresight', group: 'product', hint: 'Futures thinking, scenarios and emerging signals', keywords: ['foresight', 'futures', 'scenario', 'trend', 'innovation'], affinity: A(0.4, 0.6, 0.8, 0.9) },
  { id: 'entrepreneurship', label: 'Entrepreneurship & Ventures', group: 'product', hint: 'Starting, incubating and scaling new ventures', keywords: ['founder', 'startup', 'venture', 'incubat', 'co-founder', 'entrepreneur'], affinity: A(0.6, 0.7, 0.8, 0.8) },

  // Leadership & organisation
  { id: 'design-leadership', label: 'Design Leadership', group: 'leadership', hint: 'Setting direction for design across products or a company', keywords: ['head of design', 'design director', 'design lead', 'vp design', 'leadership', 'led design'], affinity: A(0.3, 0.7, 1, 1) },
  { id: 'people-management', label: 'People Management', group: 'leadership', hint: 'Hiring, growing and managing designers', keywords: ['manager', 'managed', 'team of', 'hiring', 'reports', 'performance'], affinity: A(0.2, 0.6, 0.9, 1) },
  { id: 'design-operations', label: 'Design Operations', group: 'leadership', hint: 'Processes, tooling and rituals that let design teams scale', keywords: ['designops', 'design ops', 'operations', 'process', 'tooling', 'governance'], affinity: A(0.3, 0.6, 0.9, 0.9) },
  { id: 'org-design', label: 'Org Design & Scaling Teams', group: 'leadership', hint: 'Structuring and scaling design organisations', keywords: ['scaled', 'scaling', 'org', 'organization', 'organisation', 'structure', 'built team', 'grew team'], affinity: A(0.1, 0.4, 0.8, 1) },
  { id: 'coaching', label: 'Coaching & Mentorship', group: 'leadership', hint: 'Developing other designers', keywords: ['mentor', 'coach', 'career development', 'onboarding'], affinity: A(0.4, 0.7, 0.9, 0.9) },
  { id: 'change-management', label: 'Change Management', group: 'leadership', hint: 'Leading people and organisations through change', keywords: ['change management', 'adoption', 'culture', 'maturity'], affinity: A(0.2, 0.4, 0.8, 0.9) },

  // Influence & visibility
  { id: 'executive-communication', label: 'Executive Communication', group: 'influence', hint: 'Storytelling and influence with senior leaders', keywords: ['executive', 'c-suite', 'board', 'storytelling', 'presentation'], affinity: A(0.3, 0.6, 0.9, 1) },
  { id: 'stakeholder-management', label: 'Stakeholder Management', group: 'influence', hint: 'Aligning partners across functions', keywords: ['stakeholder', 'cross-functional', 'alignment', 'partner'], affinity: A(0.5, 0.8, 0.9, 0.9) },
  { id: 'facilitation', label: 'Facilitation & Workshops', group: 'influence', hint: 'Running workshops, design sprints and co-creation', keywords: ['workshop', 'facilitat', 'design sprint', 'co-creation', 'design thinking'], affinity: A(0.6, 0.8, 0.8, 0.7) },
  { id: 'thought-leadership', label: 'Thought Leadership & Writing', group: 'influence', hint: 'Writing, publishing and shaping opinion in the field', keywords: ['author', 'published', 'article', 'blog', 'patent', 'paper'], affinity: A(0.3, 0.5, 0.8, 0.9) },
  { id: 'public-speaking', label: 'Public Speaking', group: 'influence', hint: 'Talks, panels and conferences', keywords: ['speaker', 'talk', 'conference', 'keynote', 'panel'], affinity: A(0.3, 0.5, 0.8, 0.9) },
  { id: 'community-building', label: 'Community Building', group: 'influence', hint: 'Building and running practitioner communities', keywords: ['community', 'meetup', 'chapter', 'volunteer'], affinity: A(0.5, 0.6, 0.7, 0.8) },
  { id: 'design-education', label: 'Design Education & Teaching', group: 'influence', hint: 'Teaching design in academia, bootcamps or companies', keywords: ['teach', 'faculty', 'lecturer', 'curriculum', 'course', 'education', 'institute'], affinity: A(0.3, 0.5, 0.7, 0.9) },
]

export const MAX_INTERESTS = 5
export const MIN_INTERESTS = 3

export const interestByLabel = (label: string) => INTERESTS.find((i) => i.label === label)

export interface InterestSuggestion { interest: Interest; score: number; reason: string }

function haystack(data: Partial<ExtractedCareerData>): { text: string; roles: string } {
  const roles = (data.timeline ?? []).map((t) => `${t.role ?? ''} ${t.description ?? ''}`).join(' ')
  const projects = (data.projects ?? []).map((p) => `${p.name ?? ''} ${p.summary ?? ''} ${p.impact ?? ''} ${p.industry ?? ''} ${p.platform ?? ''}`).join(' ')
  const skills = (data.skills ?? []).join(' ')
  return { text: ` ${roles} ${projects} ${skills} `.toLowerCase(), roles: roles.toLowerCase() }
}

const hits = (text: string, kw: string) => {
  // Short keywords (ai, ar, vr, ml) must match as whole words; longer ones may be prefixes ("prototyp").
  const re = kw.length <= 3 ? new RegExp(`[^a-z]${kw}[^a-z]`, 'g') : new RegExp(kw.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'), 'g')
  return (text.match(re) ?? []).length
}

/**
 * Rank interests for this person. Resume evidence counts most; seniority decides ties and fills
 * the list when the resume is thin. Returns at most `limit` suggestions with a short reason each.
 */
export function suggestInterests(data: Partial<ExtractedCareerData> | null | undefined, limit = 6): InterestSuggestion[] {
  const facts = factsOf(data)
  const band = (data?.timeline?.length ?? 0) === 0 ? 'early' : facts.seniority
  const { text, roles } = haystack(data ?? {})
  const scored = INTERESTS.map((interest) => {
    let evidence = 0
    let best = ''
    for (const kw of interest.keywords) {
      const n = hits(text, kw)
      if (n > 0) { evidence += Math.min(n, 4); if (!best) best = kw }
      if (hits(roles, kw) > 0) evidence += 1 // in a job title or role description: stronger
    }
    const score = Math.min(evidence, 8) / 8 * 0.7 + interest.affinity[band] * 0.3
    const reason = evidence > 0
      ? `Your resume mentions “${best}”`
      : `Common next focus at the ${band === 'leader' ? 'leadership' : band} stage`
    return { interest, score, reason, evidence }
  })
  return scored
    .filter((s) => s.evidence > 0 || s.interest.affinity[band] >= 0.9)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ interest, score, reason }) => ({ interest, score: Math.round(score * 100) / 100, reason }))
}

/** Groups in the order most relevant to this seniority band (leaders see leadership first). */
export function orderedGroups(seniority: ExperienceFacts['seniority'] | 'student'): InterestGroup[] {
  const order: Record<string, InterestGroupId[]> = {
    student: ['craft', 'ai', 'product', 'influence', 'leadership'],
    early: ['craft', 'ai', 'product', 'influence', 'leadership'],
    mid: ['craft', 'ai', 'product', 'leadership', 'influence'],
    senior: ['product', 'leadership', 'ai', 'craft', 'influence'],
    leader: ['leadership', 'product', 'ai', 'influence', 'craft'],
  }
  return (order[seniority] ?? order.mid).map((id) => INTEREST_GROUPS.find((g) => g.id === id)!)
}
