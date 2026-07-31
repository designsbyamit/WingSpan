import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// Maps experience domains/keywords → Unsplash search queries
// Chosen for editorial, design-adjacent, high-quality results
const QUERY_MAP: Record<string, string> = {
  'what-is-design':          'everyday design objects minimal',
  'history-of-design':       'bauhaus architecture minimal',
  'design-mindset':          'creative thinking workspace',
  'fundamentals-of-design':  'geometric shapes composition',
  'elements-of-design':      'abstract color texture',
  'visual-communication':    'typography poster design',
  'gestalt-psychology':      'pattern perception abstract',
  'visual-hierarchy':        'editorial layout design',
  'typography':              'typography letterpress letters',
  'color':                   'color palette gradient abstract',
  'user-interface-design':   'mobile app interface dark',
  'user-experience-design':  'user research whiteboard',
  'design-disciplines':      'design studio workspace',
  'design-critique':         'design review presentation',
  'ethics-responsibility':   'inclusive design accessibility',
  'becoming-a-designer':     'designer portfolio creative',
  'figma-tools':             'design tools workspace',
  'component-design':        'modular design system',
  'design-system':           'design system components',
  'motion-design':           'motion blur light trails',
  'content-design':          'writing words editorial',
  'responsive-design':       'devices screens responsive',
  'data-visualization':      'data charts infographic',
  'complex-forms':           'form interface clean',
  'iconography':             'icons symbols minimal',
  'photography':             'photography camera light',
  'design-presentation':     'presentation storytelling',
  'handoff':                 'collaboration teamwork',
  'design-qa':               'quality detail craftsmanship',
  'portfolio-advanced':      'portfolio creative work',
  'design-process-orgs':     'team collaboration office',
  'working-with-pms':        'meeting collaboration whiteboard',
  'working-with-engineers':  'code development laptop',
  'stakeholder-management':  'business meeting strategy',
  'advanced-user-research':  'research interview observation',
  'usability-testing':       'usability testing mobile',
  'measuring-impact':        'analytics data growth',
  'design-sprints':          'sprint workshop sticky notes',
  'design-in-agile':         'agile sprint board',
  'writing-specs':           'documentation writing notes',
  'design-reviews-scale':    'design review team',
  'cross-functional-comms':  'communication collaboration',
  'navigating-feedback':     'feedback conversation',
  'career-development':      'career growth path',
  'product-strategy':        'strategy planning roadmap',
  'design-vision':           'vision direction horizon',
  'design-principles':       'principles values minimal',
  'enterprise-scale':        'enterprise architecture scale',
  'design-operations':       'operations system process',
  'research-strategy':       'research strategy planning',
  'design-leadership':       'leadership team direction',
  'managing-up-across-down': 'leadership management team',
  'business-acumen':         'business strategy growth',
  'innovation-frameworks':   'innovation creative thinking',
  'speculative-design':      'future concept abstract',
  'scaling-design-systems':  'system scale architecture',
  'design-philosophy':       'philosophy thinking minimal',
  'teaching-mentoring':      'teaching mentoring learning',
  'design-culture':          'culture community creative',
  'civilizational-scale':    'city infrastructure scale',
  'ai-future':               'artificial intelligence future',
  'agentic-systems':         'autonomous robot technology',
  'spatial-design':          'spatial architecture space',
  'design-research':         'research inquiry discovery',
  'ethics-at-scale':         'ethics responsibility global',
  'writing-speaking':        'writing speaking public',
  'design-practice':         'design studio creative space',
  'legacy':                  'legacy time reflection',
}

function getQueryForSlug(slug: string): string {
  // Try exact match first
  const key = Object.keys(QUERY_MAP).find(k => slug.includes(k))
  if (key) return QUERY_MAP[key]

  // Fallback by level
  if (slug.startsWith('l1-')) return 'creative design minimal'
  if (slug.startsWith('l2-')) return 'design craft tools'
  if (slug.startsWith('l3-')) return 'team collaboration work'
  if (slug.startsWith('l4-')) return 'strategy leadership vision'
  if (slug.startsWith('l5-')) return 'mastery expertise wisdom'
  return 'design creative minimal'
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const experienceId = searchParams.get('id')
  if (!experienceId) return Response.json({ error: 'Missing id' }, { status: 400 })

  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if image URL already cached on the experience
  const experience = await db.experience.findUnique({
    where: { id: experienceId },
    select: { slug: true, imageUrl: true, imageAttribution: true }
  })
  if (!experience) return Response.json({ error: 'Not found' }, { status: 404 })

  // Return cached image if available
  if (experience.imageUrl) {
    return Response.json({
      url: experience.imageUrl,
      attribution: experience.imageAttribution
    })
  }

  // Fetch from Unsplash
  const query = getQueryForSlug(experience.slug)
  const res = await fetch(
    `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape`,
    { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
  )
  if (!res.ok) return Response.json({ error: 'Unsplash error' }, { status: 502 })

  const photo = await res.json()
  const imageUrl = photo.urls.regular
  const attribution = `Photo by ${photo.user.name} on Unsplash`
  const attributionLink = photo.links.html

  // Trigger download event (Unsplash API requirement)
  fetch(photo.links.download_location, {
    headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` }
  }).catch(() => {})

  // Cache on experience
  await db.experience.update({
    where: { id: experienceId },
    data: { imageUrl, imageAttribution: attribution }
  })

  return Response.json({ url: imageUrl, attribution, attributionLink })
}
