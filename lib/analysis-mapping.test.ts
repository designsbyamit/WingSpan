import test from 'node:test'
import assert from 'node:assert/strict'
import { mapPipelineResult, parseObservedAt, toHorizon, type PipelineResult } from '@/lib/analysis-mapping'

const ev = (id: string, extra: Record<string, unknown> = {}) => ({
  id, sourceType: 'resume', statement: `statement ${id}`, category: 'skill',
  strength: 80, recency: 70, specificity: 60, reliability: 90, confidence: 0.8, ...extra,
})

function result(over: { evidence?: unknown[]; capabilities?: unknown[]; directions?: unknown[]; candidates?: unknown[] } = {}): PipelineResult {
  return {
    evidenceGraph: {
      version: '0.2',
      evidence: over.evidence ?? [ev('e1'), ev('e2', { supports: ['e1'], contradicts: ['e1'] })],
      capabilities: over.capabilities ?? [
        { id: 'c1', name: 'Systems thinking', capabilityType: 'core', level: 4, evidenceIds: ['e1', 'e2', 'ghost'], recurrence: 3, confidence: 0.8, rationale: 'r' },
      ],
      patterns: [], uncertainties: [], contradictions: [], constraints: [], confidence: 0.7,
    } as never,
    careerDNA: {
      version: '0.2', currentIdentity: 'Design leader', emergingIdentity: ['x'], underlyingCapabilities: [],
      strongestCapabilities: [{ name: 'Facilitation', score: 88, evidenceIds: ['e1', 'nope'], confidence: 0.9, rationale: 'r' }],
      transferableCapabilities: [{ name: 'Storytelling', score: 0, evidenceIds: [], confidence: 0, rationale: '' }],
      distinctiveStrengths: [],
      workingPatterns: [], problemSolvingPatterns: [], leadershipPatterns: [], domainExpertise: [],
      strategicMaturity: 'high', creativePatterns: [], collaborationPatterns: [], careerTrajectory: 'up',
      capabilityMaturity: 'senior', deepInterestSignals: [], constraints: [], confidence: 0.8,
    } as never,
    marketGraph: {
      version: '0.2',
      directions: over.directions ?? [
        {
          name: 'AI design', currentDemand: 70, momentum: 80, futurePotential: 90, resilience: 60,
          adjacency: [], currentCapabilities: [], growingCapabilities: [], decliningCapabilities: [],
          futureThesis: 't', invalidationRisks: [], geography: ['IN'], horizon: '1-3_years', confidence: 0.6,
          evidence: [
            { id: 'm1', direction: 'AI design', signal: 's', source: 'src', sourceType: 'labour_market', geography: 'IN', observedAt: '2026-03-01', horizon: '3-5_years', directionality: 'positive', magnitude: 5, reliability: 0.7, supportingEvidence: [] },
            { id: 'm2', direction: 'AI design', signal: 's2', source: '', sourceType: 'weak_signal', geography: '', observedAt: 'last spring', horizon: 'current', directionality: 'uncertain', magnitude: 1, reliability: 0.2, supportingEvidence: [] },
          ],
        },
      ],
      capabilityRequirements: [{ capability: 'Facilitation', importance: 80, levelRequired: 4, futureImportance: 85, marketDemand: 70 }],
      confidence: 0.6,
    } as never,
    careerMap: {
      version: '0.2', formula: '0.40E + 0.40M + 0.20I, confidence-adjusted',
      candidates: (over.candidates ?? [
        { direction: 'Design Strategist', experienceScore: 80, marketScore: 70, interestScore: 60, confidence: 0.8, careerScore: 70, archetype: 'safe', whyThisPerson: 'a', whyNow: 'b', evidenceIds: ['e1', 'made-up'], capabilityDistance: 10, rationale: 'r' },
        { direction: 'Founder', experienceScore: 40, marketScore: 90, interestScore: 80, confidence: 0.6, careerScore: 60, archetype: 'bold', whyThisPerson: '', whyNow: '', evidenceIds: [], capabilityDistance: 70, rationale: '' },
      ]) as never,
      safe: {} as never, growth: {} as never, bold: {} as never, confidence: 0.75, validation: ['ok'],
    },
  }
}

const rows = (over?: Parameters<typeof result>[0]) => mapPipelineResult('run1', result(over), new Date('2027-01-01'))

test('evidence ids the agent invented are dropped from every join table', () => {
  const r = rows()
  assert.equal(r.capabilityEvidence.length, 2) // e1, e2 — "ghost" is dropped
  assert.equal(r.dimensionEvidence.length, 1) // e1 — "nope" is dropped
  assert.equal(r.candidateEvidence.length, 1) // e1 — "made-up" is dropped
})

test('every join row points at a real evidence row of this run', () => {
  const r = rows()
  const ids = new Set(r.evidence.map((e) => e.id))
  for (const j of [...r.capabilityEvidence, ...r.dimensionEvidence, ...r.candidateEvidence]) assert.ok(ids.has(j.evidenceId))
  for (const l of r.links) assert.ok(ids.has(l.fromId) && ids.has(l.toId))
})

test('duplicate agent keys keep the first entry so unique constraints cannot fail', () => {
  const r = rows({ evidence: [ev('e1'), ev('e1', { statement: 'dupe' }), ev('e2')] })
  assert.equal(r.evidence.length, 2)
  assert.equal(r.evidence[0].statement, 'statement e1')
})

test('supports and contradicts become typed links, never self-links', () => {
  const r = rows({ evidence: [ev('e1', { supports: ['e1'] }), ev('e2', { supports: ['e1'], contradicts: ['e1'] })] })
  assert.deepEqual(r.links.map((l) => l.relation).sort(), ['CONTRADICTS', 'SUPPORTS'])
})

test('unknown labels fall back to the lowest-claim enum values', () => {
  const r = rows({ evidence: [ev('e1', { sourceType: 'rumour', category: 'vibes' })] })
  assert.equal(r.evidence[0].sourceType, 'CONVERSATION')
  assert.equal(r.evidence[0].category, 'CAPABILITY')
})

test('horizon labels map to the enum, unknown means CURRENT', () => {
  assert.equal(toHorizon('1-3_years'), 'ONE_TO_THREE_YEARS')
  assert.equal(toHorizon('3-5_years'), 'THREE_TO_FIVE_YEARS')
  assert.equal(toHorizon('5-10_years'), 'FIVE_TO_TEN_YEARS')
  assert.equal(toHorizon('someday'), 'CURRENT')
})

test('market signals keep real dates and null out unparseable ones', () => {
  const r = rows()
  assert.equal(r.signals.length, 2)
  assert.equal(r.signals[0].observedAt?.toISOString().slice(0, 10), '2026-03-01')
  assert.equal(r.signals[1].observedAt, null)
  assert.equal(parseObservedAt(''), null)
  assert.equal(parseObservedAt(undefined), null)
})

test('market signals are attached to their direction', () => {
  const r = rows()
  assert.equal(r.directions.length, 1)
  assert.ok(r.signals.every((s) => s.directionId === r.directions[0].id))
})

test('DNA dimensions keep their kind, and a bare-name capability stays at zero', () => {
  const r = rows()
  assert.deepEqual(r.dimensions.map((d) => d.kind), ['STRONGEST', 'TRANSFERABLE'])
  assert.equal(r.dimensions[1].score, 0)
  assert.equal(r.dimensions[1].confidence, 0)
})

test('candidates are ranked in order with archetypes mapped', () => {
  const r = rows()
  assert.deepEqual(r.candidates.map((c) => [c.rank, c.archetype]), [[1, 'SAFE'], [2, 'BOLD']])
  assert.equal(r.candidates[1].whyThisPerson, null)
})

test('internal key lists never leak into the rows that get inserted', () => {
  const r = rows()
  for (const c of r.candidates) assert.ok(!('evidenceKeys' in c))
  for (const c of r.capabilities) assert.ok(!('evidenceKeys' in c))
  for (const d of r.directions) assert.ok(!('signals' in d))
})

test('all four agent outputs are kept with the retention date', () => {
  const r = rows()
  assert.deepEqual(r.agentOutputs.map((o) => o.agent), ['AGGREGATOR', 'CAREER_ALPHA', 'MARKET_INTELLIGENCE', 'DIRECTION_GENERATOR'])
  assert.ok(r.agentOutputs.every((o) => o.expiresAt.toISOString().startsWith('2027-01-01')))
})
