import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { Prisma } from '@/lib/generated/prisma/client'
import { FORMULA, WEIGHTS } from '@/lib/career-scoring'
import type { AgentName } from '@/lib/generated/prisma/enums'
import { mapPipelineResult, type PipelineResult } from '@/lib/analysis-mapping'

// Persistence for one run of the four-agent pipeline.
//
// Rules:
//  - A user has at most one working run. A new successful analysis replaces it (children cascade).
//    A failed analysis never touches the existing run.
//  - "Save as version" freezes the working run under a label. Saved versions are kept until deleted.
//  - Raw agent output is kept for RAW_RETENTION_DAYS, then purged. The structured tables are kept.

export const PIPELINE_VERSION = '0.2.1'
const id = () => randomUUID()
export const RAW_RETENTION_DAYS = 90
export const MAX_SAVED_VERSIONS = 20

export interface StageTiming {
  durationMs: number
}

export interface SaveRunMeta {
  durationMs?: number
  stageTimings?: Partial<Record<AgentName, StageTiming>>
  models?: Record<string, string>
}

// ---------------------------------------------------------------- writes

/**
 * Store a successful analysis as the user's working run, replacing the previous working run.
 * Everything happens in one transaction: if any insert fails, the old run is left untouched.
 */
export async function saveWorkingRun(userId: string, result: PipelineResult, meta: SaveRunMeta = {}) {
  const runId = id()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + RAW_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  const rows = mapPipelineResult(runId, result, expiresAt)

  await db.$transaction(
    async (tx) => {
      await tx.analysisRun.deleteMany({ where: { userId, isWorking: true } })
      await tx.analysisRun.create({
        data: {
          id: runId,
          userId,
          status: 'COMPLETE',
          isWorking: true,
          pipelineVersion: PIPELINE_VERSION,
          formulaVersion: FORMULA,
          weights: WEIGHTS,
          models: meta.models ?? undefined,
          durationMs: meta.durationMs ?? null,
          confidence: result.careerMap.confidence,
          validationNotes: result.careerMap.validation,
          completedAt: now,
        },
      })
      await tx.evidence.createMany({ data: rows.evidence })
      await tx.evidenceLink.createMany({ data: rows.links })
      await tx.capability.createMany({ data: rows.capabilities })
      await tx.capabilityEvidence.createMany({ data: rows.capabilityEvidence })
      await tx.careerDnaSnapshot.create({ data: rows.dna })
      await tx.dnaDimension.createMany({ data: rows.dimensions })
      await tx.dnaDimensionEvidence.createMany({ data: rows.dimensionEvidence })
      await tx.marketDirection.createMany({ data: rows.directions })
      await tx.marketSignal.createMany({ data: rows.signals })
      await tx.capabilityRequirement.createMany({ data: rows.requirements })
      await tx.careerCandidate.createMany({ data: rows.candidates })
      await tx.candidateEvidence.createMany({ data: rows.candidateEvidence })
      await tx.agentOutput.createMany({
        data: rows.agentOutputs.map((o) => ({
          id: id(),
          runId,
          agent: o.agent,
          raw: o.raw as never,
          valid: true,
          durationMs: meta.stageTimings?.[o.agent]?.durationMs ?? null,
          expiresAt: o.expiresAt,
        })),
      })
    },
    { timeout: 30_000, maxWait: 10_000 },
  )

  await purgeExpiredAgentOutput().catch((err) => console.error('Agent output purge failed:', err))
  return { runId }
}

/** Freeze the working run as a named version. Returns null if the run is not the user's working run. */
export async function saveAsVersion(userId: string, runId: string, label: string) {
  const versionLabel = label.trim().slice(0, 80) || `Version ${new Date().toISOString().slice(0, 10)}`
  return db.$transaction(async (tx) => {
    const saved = await tx.analysisRun.count({ where: { userId, isWorking: false, savedAt: { not: null } } })
    if (saved >= MAX_SAVED_VERSIONS) throw new VersionLimitError()
    const result = await tx.analysisRun.updateMany({
      where: { id: runId, userId, isWorking: true, status: 'COMPLETE' },
      data: { isWorking: false, savedAt: new Date(), versionLabel },
    })
    return result.count === 1 ? { runId, versionLabel } : null
  })
}

export class VersionLimitError extends Error {
  constructor() {
    super(`You can keep up to ${MAX_SAVED_VERSIONS} saved versions. Delete one to save another.`)
  }
}

/** Delete a saved version. The working run cannot be deleted this way. */
export async function deleteVersion(userId: string, runId: string) {
  const res = await db.analysisRun.deleteMany({ where: { id: runId, userId, isWorking: false, savedAt: { not: null } } })
  return res.count === 1
}

/** Raw agent output older than the retention window is removed; the structured tables stay. */
export async function purgeExpiredAgentOutput(now = new Date()) {
  const res = await db.agentOutput.deleteMany({ where: { expiresAt: { lt: now } } })
  const extractions = await db.extractionRun.updateMany({
    where: { expiresAt: { lt: now }, raw: { not: Prisma.DbNull } },
    data: { raw: Prisma.DbNull },
  })
  return { agentOutputs: res.count, extractionRuns: extractions.count }
}

// ---------------------------------------------------------------- reads

export async function listRuns(userId: string) {
  return db.analysisRun.findMany({
    where: { userId, status: 'COMPLETE' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      isWorking: true,
      versionLabel: true,
      savedAt: true,
      createdAt: true,
      confidence: true,
      pipelineVersion: true,
      candidates: {
        where: { archetype: { in: ['SAFE', 'GROWTH', 'BOLD'] } },
        orderBy: { rank: 'asc' },
        select: { direction: true, archetype: true, careerScore: true },
      },
    },
  })
}

export async function getRun(userId: string, runId: string) {
  return db.analysisRun.findFirst({
    where: { id: runId, userId },
    include: {
      dna: { include: { dimensions: { orderBy: [{ kind: 'asc' }, { score: 'desc' }] } } },
      candidates: { orderBy: { rank: 'asc' }, include: { evidence: { select: { evidenceId: true } } } },
      capabilities: { orderBy: { level: 'desc' } },
      marketDirections: { orderBy: { currentDemand: 'desc' }, include: { signals: true } },
      capabilityRequirements: true,
      evidence: true,
    },
  })
}
