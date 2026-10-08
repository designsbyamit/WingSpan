import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { RAW_RETENTION_DAYS } from '@/lib/analysis-store'
import { contentHashOf, mapIngestion, sourceKindOf, type IngestData, type IngestSource } from '@/lib/ingestion-mapping'

/**
 * Store what extraction found for a signed-in user.
 * Sources dedupe on (userId, contentHash). The parsed rows (roles, projects, education, skills)
 * are replaced as a set, since each extraction describes the user's whole history.
 * All in one transaction; the caller treats failure as non-fatal.
 */
export async function saveIngestion(userId: string, sources: IngestSource[], data: IngestData, raw?: unknown) {
  const mapped = mapIngestion(data)
  const expiresAt = new Date(Date.now() + RAW_RETENTION_DAYS * 24 * 60 * 60 * 1000)

  return db.$transaction(async (tx) => {
    const docIds: string[] = []
    for (const s of sources) {
      const contentHash = contentHashOf(s)
      const doc = await tx.sourceDocument.upsert({
        where: { userId_contentHash: { userId, contentHash } },
        create: {
          id: randomUUID(), userId, contentHash, kind: sourceKindOf(s.kind),
          filename: s.url ? null : s.name, url: s.url ?? null, mimeType: s.mimeType ?? null,
          sizeBytes: s.sizeBytes ?? null, extractedText: s.text?.slice(0, 200_000) ?? null, status: 'PARSED',
        },
        update: { status: 'PARSED', deletedAt: null, error: null },
        select: { id: true },
      })
      docIds.push(doc.id)
    }
    const primary = sources.findIndex((s) => s.kind === 'resume')
    const primaryId = docIds[primary >= 0 ? primary : 0] ?? null

    if (primaryId) {
      await tx.extractionRun.create({
        data: { id: randomUUID(), sourceDocumentId: primaryId, status: 'PARSED', raw: raw == null ? undefined : (raw as never), expiresAt },
      })
    }

    await Promise.all([
      tx.role.deleteMany({ where: { userId } }),
      tx.project.deleteMany({ where: { userId } }),
      tx.education.deleteMany({ where: { userId } }),
      tx.skillClaim.deleteMany({ where: { userId } }),
    ])
    const base = { userId, sourceDocumentId: primaryId }
    await tx.role.createMany({ data: mapped.roles.map((r) => ({ id: randomUUID(), ...base, ...r })) })
    await tx.project.createMany({ data: mapped.projects.map((p) => ({ id: randomUUID(), ...base, ...p })) })
    await tx.education.createMany({ data: mapped.education.map((e) => ({ id: randomUUID(), ...base, ...e })) })
    await tx.skillClaim.createMany({ data: mapped.skills.map((name) => ({ id: randomUUID(), ...base, name })), skipDuplicates: true })

    return { sources: docIds.length, ...Object.fromEntries(Object.entries(mapped).map(([k, v]) => [k, v.length])) }
  }, { timeout: 20_000 })
}
