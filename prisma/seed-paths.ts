import { PrismaClient } from '../lib/generated/prisma/client'

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

interface PathSpec {
  title: string
  description: string
  careerLevelName: string | null   // null = spans multiple levels
  /** Which L-prefixed slug patterns to include, e.g. ['l1-', 'l2-'] */
  sourceLevelPrefixes: string[]
}

const PATH_SPECS: PathSpec[] = [
  {
    title: 'Foundation Journey',
    description: "Build your designer's eye. Core vocabulary, visual principles, and the habits of observation that underpin everything else.",
    careerLevelName: 'Beginner',
    sourceLevelPrefixes: ['l1-'],
  },
  {
    title: 'Craft Mastery',
    description: 'Sharpen your execution. Figma proficiency, design systems, component thinking, and the craft of professional-grade visual work.',
    careerLevelName: 'Intermediate',
    sourceLevelPrefixes: ['l2-'],
  },
  {
    title: 'Professional Practice',
    description: 'Navigate the real world of design. Collaboration, stakeholder management, research strategy, and design at scale inside organisations.',
    careerLevelName: 'Senior',
    sourceLevelPrefixes: ['l3-', 'l4-'],
  },
  {
    title: 'Expert Evolution',
    description: 'Shape the discipline. Design philosophy, teaching, culture-building, AI futures, and the practice of mastery-level design leadership.',
    careerLevelName: 'Expert',
    sourceLevelPrefixes: ['l5-'],
  },
  {
    title: 'Full Designer Evolution',
    description: 'The complete journey from first principles to mastery — all 68 modules in sequence.',
    careerLevelName: null,
    sourceLevelPrefixes: ['l1-', 'l2-', 'l3-', 'l4-', 'l5-'],
  },
]

export async function seedPaths(prisma: PrismaClient): Promise<void> {
  console.log('Seeding learning paths...')

  // Build careerLevel slug → id map
  const careerLevels = await prisma.careerLevel.findMany()
  const levelMap = new Map(careerLevels.map(l => [l.slug, l.id]))

  // Fetch all experiences
  const allExperiences = await prisma.experience.findMany({
    orderBy: [{ slug: 'asc' }],
  })

  for (const spec of PATH_SPECS) {
    const careerLevelId = spec.careerLevelName
      ? (levelMap.get(toSlug(spec.careerLevelName)) ?? null)
      : null

    const pathSlug = toSlug(spec.title)

    // Upsert the LearningPath
    const learningPath = await prisma.learningPath.upsert({
      where: { slug: pathSlug },
      update: {
        title: spec.title,
        description: spec.description,
        careerLevelId,
      },
      create: {
        slug: pathSlug,
        title: spec.title,
        description: spec.description,
        careerLevelId,
      },
    })

    // Filter experiences by slug prefix (sorted alphabetically = level then module order)
    const filtered = allExperiences.filter(exp =>
      spec.sourceLevelPrefixes.some(prefix => exp.slug.startsWith(prefix))
    )

    // Delete existing entries so we can re-insert with correct order (idempotent)
    await prisma.learningPathEntry.deleteMany({
      where: { learningPathId: learningPath.id },
    })

    // Insert LearningPathEntry join records with position
    for (let i = 0; i < filtered.length; i++) {
      await prisma.learningPathEntry.create({
        data: {
          learningPathId: learningPath.id,
          order: i + 1,
          entityType: 'experience',
          entityId: filtered[i].id,
        },
      })
    }

    console.log(`  ✓ "${spec.title}" — ${filtered.length} experiences`)
  }
}
