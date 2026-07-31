import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { seedStatic } from './seed-static'
import { seedExperiences } from './seed-experiences'
import { seedPaths } from './seed-paths'

function createPrisma(): PrismaClient {
  const url = process.env.DATABASE_URL ?? 'file:./prisma/dev.db'
  const adapter = new PrismaBetterSqlite3({ url })
  return new PrismaClient({ adapter } as any)
}

const prisma = createPrisma()

async function main() {
  console.log('Starting seed...\n')

  await seedStatic(prisma)
  await seedExperiences(prisma)
  await seedPaths(prisma)

  console.log('\nSeed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
