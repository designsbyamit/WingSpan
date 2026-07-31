import fs from 'fs'
import path from 'path'
import { PrismaClient } from '../lib/generated/prisma/client'
import { parseModuleFile } from './seed-parser'

const MODULES_DIR =
  '/Users/I752155/Library/CloudStorage/OneDrive-SAPSE/Work/HolyExperiments/HHE/Documents/DesignBooks/modules'

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Competency slugs to assign per source level */
const LEVEL_COMPETENCIES: Record<number, string[]> = {
  1: ['observation', 'critical-thinking', 'visual-communication'],
  2: ['visual-communication', 'design-judgment', 'systems-thinking'],
  3: ['collaboration', 'problem-framing', 'user-empathy'],
  4: ['leadership', 'business-thinking', 'systems-thinking'],
  5: ['design-judgment', 'leadership', 'ai-fluency'],
}

/** Experience type by level */
const LEVEL_TYPE: Record<number, string> = {
  1: 'module',
  2: 'module',
  3: 'module',
  4: 'module',
  5: 'module',
}

export async function seedExperiences(prisma: PrismaClient): Promise<void> {
  console.log('Seeding experiences from module files...')

  // Build competency slug → id map
  const allCompetencies = await prisma.competency.findMany()
  const competencyMap = new Map(allCompetencies.map(c => [c.slug, c.id]))

  // Enumerate module files
  const files = fs
    .readdirSync(MODULES_DIR)
    .filter(f => /^L[1-5]-M\d{2}-.*\.md$/.test(f))
    .sort()

  console.log(`  Found ${files.length} module files`)

  let experienceCount = 0
  let conceptCount = 0
  let linkCount = 0

  for (const filename of files) {
    const filePath = path.join(MODULES_DIR, filename)
    const parsed = parseModuleFile(filePath)

    // Upsert Experience — stable key: slug derived from filename (e.g. l1-m01-what-is-design)
    const experience = await prisma.experience.upsert({
      where: { slug: parsed.slug },
      update: {
        title: parsed.title,
        description: parsed.story || "",
        narrativeText: parsed.story || "",
        scenarioText: parsed.scenario || "",
        type: LEVEL_TYPE[parsed.sourceLevel] ?? 'module',
        durationMins: parsed.estimatedMins,
      },
      create: {
        slug: parsed.slug,
        title: parsed.title,
        description: parsed.story || "",
        narrativeText: parsed.story || "",
        scenarioText: parsed.scenario || "",
        type: LEVEL_TYPE[parsed.sourceLevel] ?? 'module',
        durationMins: parsed.estimatedMins,
      },
    })

    experienceCount++

    // Upsert Concepts and link to Experience
    for (const parsedConcept of parsed.concepts) {
      const conceptSlug = toSlug(parsedConcept.name)
      if (!conceptSlug) continue

      const conceptRecord = await prisma.concept.upsert({
        where: { slug: conceptSlug },
        update: { title: parsedConcept.name, body: parsedConcept.body || '' },
        create: {
          slug: conceptSlug,
          title: parsedConcept.name,
          body: parsedConcept.body || '',
          estimatedMins: 5,
        },
      })

      conceptCount++

      // Upsert the join record (composite PK: conceptId + experienceId)
      await prisma.conceptOnExperience.upsert({
        where: {
          conceptId_experienceId: {
            conceptId: conceptRecord.id,
            experienceId: experience.id,
          },
        },
        update: {},
        create: {
          conceptId: conceptRecord.id,
          experienceId: experience.id,
        },
      })

      linkCount++
    }

    // Assign competencies by source level
    const competencySlugs = LEVEL_COMPETENCIES[parsed.sourceLevel] ?? []
    for (const competencySlug of competencySlugs) {
      const competencyId = competencyMap.get(competencySlug)
      if (!competencyId) continue

      await prisma.experienceOnCompetency.upsert({
        where: {
          experienceId_competencyId: {
            experienceId: experience.id,
            competencyId,
          },
        },
        update: {},
        create: {
          experienceId: experience.id,
          competencyId,
        },
      })
    }
  }

  console.log(`  ✓ ${experienceCount} experiences upserted`)
  console.log(`  ✓ ${conceptCount} concept upserts`)
  console.log(`  ✓ ${linkCount} concept-experience links`)
}
