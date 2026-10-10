import type { Resource } from '@/types/wingspan'

// Curated, real resources. The Growth Planner may only recommend items from this list (by id), so
// every link in a Blueprint points somewhere real. Links are checked by the staging diagnostics
// (/api/health/pipeline?flow=resources). Tags describe what the resource helps with.

export interface CatalogItem {
  id: string
  title: string
  type: Resource['type']
  provider: string
  url: string
  cost: 'free' | 'paid' | 'mixed'
  tags: string[]
  /** What it's good for, shown to the model when choosing. */
  about: string
}

const C = (id: string, title: string, type: Resource['type'], provider: string, url: string, cost: CatalogItem['cost'], tags: string[], about: string): CatalogItem =>
  ({ id, title, type, provider, url, cost, tags, about })

export const CATALOG: CatalogItem[] = [
  // Leadership, management and organisation
  C('org-design-design-orgs', 'Org Design for Design Orgs', 'book', 'Peter Merholz & Kristin Skinner (O’Reilly)', 'https://www.oreilly.com/library/view/org-design-for/9781491938393/', 'paid', ['leadership', 'org-design', 'design-ops', 'scaling'], 'Structuring, hiring for and scaling in-house design teams'),
  C('making-of-a-manager', 'The Making of a Manager', 'book', 'Julie Zhuo', 'https://www.juliezhuo.com/book/manager.html', 'paid', ['leadership', 'management', 'people'], 'Practical people management from a former Facebook VP of Design'),
  C('design-leadership-banfield', 'Design Leadership', 'book', 'Richard Banfield (O’Reilly)', 'https://www.oreilly.com/library/view/design-leadership/9781491929193/', 'paid', ['leadership', 'org-design'], 'How design leaders build and grow design organisations'),
  C('radical-candor', 'Radical Candor', 'book', 'Kim Scott', 'https://www.radicalcandor.com/the-book/', 'paid', ['management', 'people', 'communication'], 'Giving feedback and building trust as a manager'),
  C('leading-design', 'Leading Design', 'event', 'Clearleft', 'https://leadingdesign.com/', 'paid', ['leadership', 'community', 'executive'], 'Conferences and community for design leaders'),
  C('designops-assembly', 'DesignOps Assembly', 'community', 'DesignOps Assembly', 'https://www.designopsassembly.com/', 'mixed', ['design-ops', 'community', 'scaling'], 'Global community for design operations practitioners'),
  C('rosenfeld-conferences', 'Rosenfeld Media conferences (DesignOps, Enterprise Experience)', 'event', 'Rosenfeld Media', 'https://rosenfeldmedia.com/', 'paid', ['design-ops', 'enterprise', 'leadership', 'research'], 'Conferences on DesignOps, enterprise UX and research'),
  C('icf-coaching', 'ICF coaching credentials', 'certification', 'International Coaching Federation', 'https://coachingfederation.org/', 'paid', ['coaching', 'people', 'leadership'], 'Recognised credentials for coaching and mentoring'),
  C('adplist', 'ADPList mentorship', 'community', 'ADPList', 'https://adplist.org/', 'free', ['coaching', 'community', 'visibility', 'mentorship'], 'Free mentoring network for designers and product people; mentor or be mentored'),
  C('hbr', 'Harvard Business Review', 'article', 'Harvard Business Review', 'https://hbr.org/', 'mixed', ['executive', 'strategy', 'leadership', 'communication'], 'Management and strategy thinking for executives'),

  // Strategy and product
  C('good-strategy-bad-strategy', 'Good Strategy / Bad Strategy', 'book', 'Richard Rumelt', 'https://openlibrary.org/search?q=Good+Strategy+Bad+Strategy+Rumelt', 'paid', ['strategy', 'executive', 'business'], 'What real strategy is: diagnosis, guiding policy, coherent action'),
  C('playing-to-win', 'Playing to Win', 'book', 'A.G. Lafley & Roger Martin', 'https://openlibrary.org/search?q=Playing+to+Win+Lafley+Martin', 'paid', ['strategy', 'business', 'executive'], 'A practical strategy-choice framework used by large companies'),
  C('inspired', 'Inspired', 'book', 'Marty Cagan (SVPG)', 'https://www.svpg.com/books/', 'paid', ['product', 'strategy', 'product-management'], 'How strong product organisations discover and deliver'),
  C('escaping-build-trap', 'Escaping the Build Trap', 'book', 'Melissa Perri', 'https://melissaperri.com/book', 'paid', ['product', 'strategy', 'outcomes'], 'Moving organisations from output to outcomes'),
  C('continuous-discovery', 'Continuous Discovery Habits', 'book', 'Teresa Torres', 'https://www.producttalk.org/continuous-discovery-habits/', 'paid', ['product', 'research', 'discovery'], 'Weekly discovery practice with opportunity solution trees'),
  C('lean-ux', 'Lean UX', 'book', 'Jeff Gothelf & Josh Seiden', 'https://jeffgothelf.com/lean-ux-book/', 'paid', ['product', 'outcomes', 'agile'], 'Outcome-focused, collaborative product design'),
  C('reforge', 'Reforge programs', 'course', 'Reforge', 'https://www.reforge.com/', 'paid', ['product', 'growth', 'strategy', 'product-management'], 'Advanced programmes in product strategy, growth and leadership'),
  C('lennys-newsletter', 'Lenny’s Newsletter', 'newsletter', 'Lenny Rachitsky', 'https://www.lennysnewsletter.com/', 'mixed', ['product', 'growth', 'career', 'leadership'], 'Product, growth and career advice with operator interviews'),
  C('mind-the-product', 'Mind the Product', 'community', 'Mind the Product', 'https://www.mindtheproduct.com/', 'mixed', ['product', 'community', 'events'], 'Global product community, articles and conferences'),
  C('product-school', 'Product School certifications', 'certification', 'Product School', 'https://productschool.com/', 'paid', ['product', 'product-management', 'ai'], 'Product management and AI product certifications'),
  C('strategyzer', 'Business Model and Value Proposition Canvas', 'framework', 'Strategyzer', 'https://www.strategyzer.com/', 'mixed', ['strategy', 'business', 'venture'], 'Tools for designing business models and value propositions'),
  C('yc-startup-school', 'Startup School', 'course', 'Y Combinator', 'https://www.startupschool.org/', 'free', ['venture', 'entrepreneurship', 'founder'], 'Free course on starting and growing a company'),

  // AI, agents and responsible AI
  C('pair-guidebook', 'People + AI Guidebook', 'framework', 'Google PAIR', 'https://pair.withgoogle.com/guidebook/', 'free', ['ai', 'ai-product-design', 'trust'], 'Patterns for designing human-centred AI products'),
  C('hax-toolkit', 'HAX Toolkit (Guidelines for Human-AI Interaction)', 'framework', 'Microsoft Research', 'https://www.microsoft.com/en-us/haxtoolkit/', 'free', ['ai', 'ai-product-design', 'trust', 'agentic'], '18 research-backed guidelines and a workbook for human-AI interaction'),
  C('shape-of-ai', 'Shape of AI', 'framework', 'Emily Campbell', 'https://www.shapeof.ai/', 'free', ['ai', 'ai-product-design', 'patterns', 'agentic'], 'A pattern library of AI interaction patterns'),
  C('apple-hig-ml', 'Human Interface Guidelines: Machine learning', 'framework', 'Apple', 'https://developer.apple.com/design/human-interface-guidelines/machine-learning', 'free', ['ai', 'ai-product-design'], 'Apple’s guidance for designing ML-powered features'),
  C('anthropic-building-agents', 'Building effective agents', 'article', 'Anthropic', 'https://www.anthropic.com/engineering/building-effective-agents', 'free', ['ai', 'agentic', 'architecture'], 'How production agent systems are structured, and when not to use agents'),
  C('designing-agentive-tech', 'Designing Agentive Technology', 'book', 'Christopher Noessel (Rosenfeld Media)', 'https://rosenfeldmedia.com/books/designing-agentive-technology/', 'paid', ['ai', 'agentic', 'ai-product-design'], 'Designing systems that act on behalf of people'),
  C('conversations-with-things', 'Conversations with Things', 'book', 'Diana Deibel & Rebecca Evanhoe (Rosenfeld Media)', 'https://rosenfeldmedia.com/books/conversations-with-things/', 'paid', ['ai', 'conversational', 'content'], 'Conversation design for chat and voice'),
  C('cdi', 'Conversation Design Institute certification', 'certification', 'Conversation Design Institute', 'https://www.conversationdesigninstitute.com/', 'paid', ['ai', 'conversational', 'agentic'], 'Certification in conversation and AI agent design'),
  C('genai-for-everyone', 'Generative AI for Everyone', 'course', 'DeepLearning.AI', 'https://www.deeplearning.ai/courses/generative-ai-for-everyone/', 'mixed', ['ai', 'ai-literacy', 'executive'], 'Non-technical course on what generative AI can and can’t do'),
  C('ai-for-everyone', 'AI For Everyone', 'course', 'DeepLearning.AI', 'https://www.deeplearning.ai/courses/ai-for-everyone/', 'mixed', ['ai', 'ai-literacy', 'strategy', 'executive'], 'AI strategy and literacy for leaders, by Andrew Ng'),
  C('nist-ai-rmf', 'AI Risk Management Framework', 'framework', 'NIST', 'https://www.nist.gov/itl/ai-risk-management-framework', 'free', ['ai', 'governance', 'responsible-ai', 'risk'], 'The reference framework for managing AI risk'),
  C('oecd-ai-principles', 'OECD AI Principles', 'framework', 'OECD.AI', 'https://oecd.ai/en/ai-principles', 'free', ['ai', 'governance', 'responsible-ai', 'policy'], 'Intergovernmental principles for trustworthy AI'),
  C('nngroup-ai', 'AI articles and research', 'article', 'Nielsen Norman Group', 'https://www.nngroup.com/topic/ai/', 'free', ['ai', 'research', 'ai-product-design'], 'Research-based articles on AI user experience'),
  C('anthropic-economic-index', 'Anthropic Economic Index', 'article', 'Anthropic', 'https://www.anthropic.com/economic-index', 'free', ['ai', 'market', 'future-of-work'], 'Data on how AI is being used across occupations and tasks'),
  C('wef-future-of-jobs', 'Future of Jobs Report 2025', 'article', 'World Economic Forum', 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/', 'free', ['market', 'future-of-work', 'skills', 'strategy'], 'Global employer survey on skills and jobs to 2030'),

  // Craft, research, systems, accessibility
  C('nngroup-ux-cert', 'UX Certification', 'certification', 'Nielsen Norman Group', 'https://www.nngroup.com/ux-certification/', 'paid', ['research', 'craft', 'management', 'ux'], 'Research-based UX courses with an optional specialisation in management'),
  C('ideo-u', 'IDEO U courses', 'course', 'IDEO U', 'https://www.ideou.com/', 'paid', ['design-thinking', 'leadership', 'innovation', 'facilitation'], 'Online courses on design thinking, creative leadership and innovation'),
  C('idf', 'Interaction Design Foundation courses', 'course', 'Interaction Design Foundation', 'https://www.interaction-design.org/', 'mixed', ['craft', 'ux', 'research', 'ai-product-design'], 'Self-paced UX courses, including AI and leadership topics'),
  C('dschool', 'Stanford d.school resources', 'course', 'Stanford d.school', 'https://dschool.stanford.edu/', 'mixed', ['design-thinking', 'innovation', 'education', 'facilitation'], 'Methods, courses and teaching resources in design thinking'),
  C('atomic-design', 'Atomic Design', 'book', 'Brad Frost', 'https://atomicdesign.bradfrost.com/', 'free', ['design-systems', 'craft'], 'The methodology behind modern design systems; free to read online'),
  C('design-systems-book', 'Design Systems', 'book', 'Alla Kholmatova (Smashing)', 'https://www.smashingmagazine.com/design-systems-book/', 'paid', ['design-systems', 'scaling'], 'How to build systems that teams actually adopt'),
  C('into-design-systems', 'Into Design Systems', 'event', 'Into Design Systems', 'https://www.intodesignsystems.com/', 'mixed', ['design-systems', 'community'], 'Conference and courses on design systems'),
  C('w3c-wai', 'Web Accessibility Initiative resources', 'framework', 'W3C', 'https://www.w3.org/WAI/', 'free', ['accessibility', 'craft'], 'Standards and guides for accessible products (WCAG)'),
  C('iaap', 'IAAP accessibility certification', 'certification', 'International Association of Accessibility Professionals', 'https://www.accessibilityassociation.org/', 'paid', ['accessibility'], 'CPACC and WAS accessibility certifications'),
  C('mismatch', 'Mismatch: How Inclusion Shapes Design', 'book', 'Kat Holmes (MIT Press)', 'https://mitpress.mit.edu/9780262539487/mismatch/', 'paid', ['accessibility', 'inclusive', 'strategy'], 'Inclusive design as a source of innovation'),
  C('service-design-network', 'Service Design Network', 'community', 'Service Design Network', 'https://www.service-design-network.org/', 'mixed', ['service-design', 'community', 'cx'], 'Global community, events and certification in service design'),
  C('researchops', 'ResearchOps Community', 'community', 'ResearchOps Community', 'https://researchops.community/', 'free', ['research', 'design-ops', 'community'], 'Community for scaling research operations'),
  C('storytelling-with-data', 'Storytelling with Data', 'book', 'Cole Nussbaumer Knaflic', 'https://www.storytellingwithdata.com/', 'mixed', ['data', 'communication', 'executive'], 'Communicating clearly with data'),
  C('smashing', 'Smashing Magazine', 'article', 'Smashing Magazine', 'https://www.smashingmagazine.com/', 'free', ['craft', 'design-systems', 'ux', 'accessibility'], 'In-depth articles on UX, front-end and design systems'),

  // Visibility, communities and events
  C('ixda', 'IxDA (Interaction Design Association)', 'community', 'IxDA', 'https://ixda.org/', 'mixed', ['community', 'visibility', 'craft', 'speaking'], 'Global interaction design community with local chapters and Interaction conference'),
  C('config', 'Config', 'event', 'Figma', 'https://config.figma.com/', 'mixed', ['community', 'craft', 'design-systems', 'ai'], 'Figma’s annual conference on product design and AI'),
  C('ux-india', 'UXINDIA conference', 'event', 'UXINDIA', 'https://www.ux-india.org/', 'paid', ['community', 'india', 'visibility', 'speaking'], 'India’s long-running UX conference; a stage for speaking'),
  C('hexagon-ux', 'Hexagon UX', 'community', 'Hexagon UX', 'https://www.hexagonux.com/', 'free', ['community', 'visibility', 'mentorship'], 'Community for women and non-binary people in UX'),
  C('toastmasters', 'Toastmasters International', 'community', 'Toastmasters International', 'https://www.toastmasters.org/', 'paid', ['speaking', 'communication', 'executive'], 'Structured practice for public speaking and leadership'),
]

export const catalogById = new Map(CATALOG.map((c) => [c.id, c]))

const words = (s: string) => new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2))

// Map common words in titles and gaps to catalog tags.
const TAG_HINTS: Record<string, string[]> = {
  leadership: ['head', 'director', 'vp', 'chief', 'leader', 'leadership', 'executive', 'manager', 'management'],
  'org-design': ['org', 'organisation', 'organization', 'scaling', 'scale', 'structure'],
  management: ['manager', 'management', 'people', 'team', 'hiring'],
  strategy: ['strategy', 'strategic', 'business', 'vision', 'roadmap', 'portfolio'],
  product: ['product', 'roadmap', 'discovery', 'outcomes'],
  ai: ['ai', 'agentic', 'agent', 'agents', 'llm', 'machine', 'generative', 'intelligence', 'conversational'],
  agentic: ['agentic', 'agent', 'agents', 'autonomous', 'orchestration'],
  governance: ['governance', 'responsible', 'trust', 'ethics', 'risk', 'compliance'],
  'design-ops': ['operations', 'designops', 'ops', 'process', 'tooling'],
  'design-systems': ['systems', 'system', 'components', 'tokens'],
  research: ['research', 'researcher', 'insights', 'evidence'],
  communication: ['communication', 'storytelling', 'influence', 'executive', 'stakeholder', 'narrative'],
  visibility: ['visibility', 'brand', 'speaking', 'thought', 'community', 'positioning'],
  venture: ['venture', 'founder', 'startup', 'innovation', 'incubator'],
  accessibility: ['accessibility', 'inclusive', 'inclusion'],
  'service-design': ['service', 'experience', 'cx', 'customer', 'journey'],
  data: ['data', 'analytics', 'metrics', 'measurement', 'kpi', 'kpis'],
  coaching: ['coaching', 'mentoring', 'mentor', 'coach'],
  education: ['education', 'teaching', 'professor', 'school', 'faculty'],
}

/** Deterministic fallback: catalog items whose tags best match a direction and its gaps. */
export function matchCatalog(text: string, limit = 6, exclude: Set<string> = new Set()): CatalogItem[] {
  const w = words(text)
  const tags = new Set<string>()
  for (const [tag, hints] of Object.entries(TAG_HINTS)) if (hints.some((h) => w.has(h))) tags.add(tag)
  const scored = CATALOG.filter((c) => !exclude.has(c.id)).map((c) => ({
    c, s: c.tags.filter((t) => tags.has(t)).length + c.tags.filter((t) => w.has(t)).length * 0.5,
  })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s)
  // Keep a mix of types: no more than two of any one type.
  const perType = new Map<string, number>()
  const out: CatalogItem[] = []
  for (const { c } of scored) {
    const n = perType.get(c.type) ?? 0
    if (n >= 2) continue
    perType.set(c.type, n + 1)
    out.push(c)
    if (out.length >= limit) break
  }
  return out
}

/** Prompt block listing the catalog compactly. */
export function catalogPrompt(): string {
  return CATALOG.map((c) => `${c.id} | ${c.type} | ${c.title} — ${c.provider} | ${c.about} | tags: ${c.tags.join(', ')}`).join('\n')
}
