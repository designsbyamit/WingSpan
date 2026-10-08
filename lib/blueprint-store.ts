import { db } from '@/lib/db'
import type { Prisma } from '@/lib/generated/prisma/client'

// Blueprint snapshots: what the user sees in the UI, stored so it survives a reload.
//  - One working snapshot per user, overwritten on every change.
//  - "Save version" freezes the working snapshot under a label (max MAX_VERSIONS).

export const MAX_VERSIONS = 20
export const MAX_PAYLOAD_BYTES = 1_000_000

export class VersionLimitError extends Error {
  constructor() {
    super(`You can keep up to ${MAX_VERSIONS} saved versions. Delete one to save another.`)
  }
}
export class PayloadTooLargeError extends Error {
  constructor() {
    super('This Blueprint is too large to save.')
  }
}

export interface SnapshotInput {
  blueprint: unknown
  extractedData?: unknown
  selectedPath?: string | null
  analysisRunId?: string | null
}

function checkSize(input: SnapshotInput) {
  const size = JSON.stringify([input.blueprint, input.extractedData ?? null]).length
  if (size > MAX_PAYLOAD_BYTES) throw new PayloadTooLargeError()
}

const json = (v: unknown) => v as Prisma.InputJsonValue

export async function upsertWorking(userId: string, input: SnapshotInput) {
  checkSize(input)
  const data = {
    blueprint: json(input.blueprint),
    extractedData: input.extractedData == null ? undefined : json(input.extractedData),
    selectedPath: input.selectedPath ?? null,
    analysisRunId: input.analysisRunId ?? null,
  }
  const existing = await db.blueprintSnapshot.findFirst({ where: { userId, isWorking: true }, select: { id: true } })
  if (existing) {
    return db.blueprintSnapshot.update({ where: { id: existing.id }, data, select: { id: true, updatedAt: true } })
  }
  try {
    return await db.blueprintSnapshot.create({ data: { userId, isWorking: true, ...data }, select: { id: true, updatedAt: true } })
  } catch {
    // Lost a race with a concurrent save: the partial unique index allows only one working row.
    const row = await db.blueprintSnapshot.findFirstOrThrow({ where: { userId, isWorking: true }, select: { id: true } })
    return db.blueprintSnapshot.update({ where: { id: row.id }, data, select: { id: true, updatedAt: true } })
  }
}

/** Freeze the given state as a named version. The working snapshot is kept as is. */
export async function saveVersion(userId: string, input: SnapshotInput, label: string) {
  checkSize(input)
  const name = label.trim().slice(0, 80) || `Version ${new Date().toISOString().slice(0, 10)}`
  return db.$transaction(async (tx) => {
    const count = await tx.blueprintSnapshot.count({ where: { userId, isWorking: false, savedAt: { not: null } } })
    if (count >= MAX_VERSIONS) throw new VersionLimitError()
    return tx.blueprintSnapshot.create({
      data: {
        userId,
        isWorking: false,
        label: name,
        savedAt: new Date(),
        blueprint: json(input.blueprint),
        extractedData: input.extractedData == null ? undefined : json(input.extractedData),
        selectedPath: input.selectedPath ?? null,
        analysisRunId: input.analysisRunId ?? null,
      },
      select: { id: true, label: true, savedAt: true },
    })
  })
}

export async function listSnapshots(userId: string) {
  const [working, versions] = await Promise.all([
    db.blueprintSnapshot.findFirst({ where: { userId, isWorking: true }, select: { id: true, updatedAt: true } }),
    db.blueprintSnapshot.findMany({
      where: { userId, isWorking: false, savedAt: { not: null } },
      orderBy: { savedAt: 'desc' },
      select: { id: true, label: true, savedAt: true, selectedPath: true },
    }),
  ])
  return { working, versions }
}

export async function getSnapshot(userId: string, id: string) {
  return db.blueprintSnapshot.findFirst({ where: { id, userId } })
}

export async function getWorking(userId: string) {
  return db.blueprintSnapshot.findFirst({ where: { userId, isWorking: true } })
}

export async function deleteVersion(userId: string, id: string) {
  const res = await db.blueprintSnapshot.deleteMany({ where: { id, userId, isWorking: false, savedAt: { not: null } } })
  return res.count === 1
}
