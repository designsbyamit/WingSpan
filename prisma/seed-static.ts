import { PrismaClient } from '../lib/generated/prisma/client'

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function seedStatic(prisma: PrismaClient): Promise<void> {
  // ── CareerLevels ───────────────────────────────────────────────────────────
  console.log('Seeding career levels...')

  const careerLevels = [
    { name: 'Beginner',      order: 1, description: 'Just starting out — building foundational design literacy' },
    { name: 'Intermediate',  order: 2, description: 'Applying skills with growing confidence and craft' },
    { name: 'Senior',        order: 3, description: 'Leading work within teams and organisations' },
    { name: 'Expert',        order: 4, description: 'Shaping the discipline and teaching others' },
  ]

  for (const level of careerLevels) {
    await prisma.careerLevel.upsert({
      where: { slug: toSlug(level.name) },
      update: { name: level.name, order: level.order, description: level.description },
      create: { slug: toSlug(level.name), name: level.name, order: level.order, description: level.description },
    })
  }

  console.log(`  ✓ ${careerLevels.length} career levels`)

  // ── Domains ────────────────────────────────────────────────────────────────
  console.log('Seeding domains...')

  const domainNames = [
    'Design Foundations',
    'Design History',
    'Design Thinking',
    'Visual Design',
    'Visual Communication',
    'UX Design',
    'UI Design',
    'Interaction Design',
    'Information Architecture',
    'User Research',
    'Usability',
    'Accessibility',
    'Service Design',
    'Design Systems',
    'Content Design',
    'Motion Design',
    'AI Design',
    'Conversational Design',
    'Agentic Experience Design',
    'Business & Product Thinking',
    'Design Leadership',
  ]

  for (const name of domainNames) {
    await prisma.domain.upsert({
      where: { slug: toSlug(name) },
      update: { name },
      create: { slug: toSlug(name), name },
    })
  }

  console.log(`  ✓ ${domainNames.length} domains`)

  // ── Competencies ───────────────────────────────────────────────────────────
  // Each competency belongs to a domain. We map by affinity.
  console.log('Seeding competencies...')

  const competencyData: Array<{ name: string; domainName: string; level: number }> = [
    { name: 'Observation',          domainName: 'Design Foundations',      level: 1 },
    { name: 'Critical Thinking',    domainName: 'Design Thinking',         level: 1 },
    { name: 'Visual Communication', domainName: 'Visual Communication',    level: 1 },
    { name: 'Creativity',           domainName: 'Design Foundations',      level: 2 },
    { name: 'Problem Framing',      domainName: 'Design Thinking',         level: 2 },
    { name: 'User Empathy',         domainName: 'UX Design',               level: 2 },
    { name: 'Interaction Thinking', domainName: 'Interaction Design',      level: 2 },
    { name: 'Systems Thinking',     domainName: 'Design Systems',          level: 3 },
    { name: 'Accessibility',        domainName: 'Accessibility',           level: 2 },
    { name: 'AI Fluency',           domainName: 'AI Design',               level: 4 },
    { name: 'Design Judgment',      domainName: 'Design Foundations',      level: 3 },
    { name: 'Storytelling',         domainName: 'Visual Communication',    level: 2 },
    { name: 'Collaboration',        domainName: 'Design Leadership',       level: 3 },
    { name: 'Business Thinking',    domainName: 'Business & Product Thinking', level: 4 },
    { name: 'Leadership',           domainName: 'Design Leadership',       level: 4 },
  ]

  // Build domain slug → id map
  const allDomains = await prisma.domain.findMany()
  const domainMap = new Map(allDomains.map(d => [d.slug, d.id]))

  for (const comp of competencyData) {
    const domainId = domainMap.get(toSlug(comp.domainName))
    if (!domainId) {
      console.warn(`  ! Domain not found for competency ${comp.name}: ${comp.domainName}`)
      continue
    }
    await prisma.competency.upsert({
      where: { slug: toSlug(comp.name) },
      update: { name: comp.name, domainId, level: comp.level },
      create: { slug: toSlug(comp.name), name: comp.name, domainId, level: comp.level },
    })
  }

  console.log(`  ✓ ${competencyData.length} competencies`)

  // ── HumanPatterns ──────────────────────────────────────────────────────────
  console.log('Seeding human patterns...')

  const patterns = [
    'People notice contrast',
    'People scan before reading',
    'People dislike uncertainty',
    'People recognize before recalling',
    'People trust consistency',
    'People ignore clutter',
    'People avoid difficult decisions',
    'People remember stories',
    'People follow visual patterns',
    'People seek feedback after actions',
  ]

  for (const name of patterns) {
    await prisma.humanPattern.upsert({
      where: { slug: toSlug(name) },
      update: { name },
      create: { slug: toSlug(name), name },
    })
  }

  console.log(`  ✓ ${patterns.length} human patterns`)

  // ── Principles ─────────────────────────────────────────────────────────────
  console.log('Seeding principles...')

  const principleNames = [
    'Form Follows Function',
    'Less is More',
    'Progressive Disclosure',
    'Consistency',
    'Affordance',
    'Feedback',
    'Visibility of System Status',
    'Error Prevention',
    'Accessibility First',
    'Inclusive Design',
  ]

  for (const name of principleNames) {
    await prisma.principle.upsert({
      where: { slug: toSlug(name) },
      update: { name },
      create: { slug: toSlug(name), name },
    })
  }

  console.log(`  ✓ ${principleNames.length} principles`)
}
