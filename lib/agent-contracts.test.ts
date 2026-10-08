import test from 'node:test'
import assert from 'node:assert/strict'
import {
  candidateDraftSchema,
  careerDNASchema,
  evidenceGraphSchema,
  marketDirectionSchema,
} from '@/lib/agent-contracts'

const dna = (overrides: Record<string, unknown> = {}) => ({
  version: '0.2',
  currentIdentity: 'Design leader',
  emergingIdentity: [],
  underlyingCapabilities: [],
  strongestCapabilities: [],
  transferableCapabilities: [],
  distinctiveStrengths: [],
  workingPatterns: [],
  problemSolvingPatterns: [],
  leadershipPatterns: [],
  domainExpertise: [],
  strategicMaturity: 'high',
  creativePatterns: [],
  collaborationPatterns: [],
  careerTrajectory: 'up',
  capabilityMaturity: 'senior',
  deepInterestSignals: [],
  constraints: [],
  confidence: 0.8,
  ...overrides,
})

const graph = (capabilities: unknown[]) => ({
  version: '0.2',
  evidence: [],
  capabilities,
  patterns: [],
  uncertainties: [],
  contradictions: [],
  constraints: [],
  confidence: 0.7,
})

test('evidence graph: accepts a well-formed capability', () => {
  const out = evidenceGraphSchema.parse(
    graph([{ id: 'c1', name: 'Systems thinking', capabilityType: 'core', level: 4, evidenceIds: ['e1'], recurrence: 3, confidence: 0.8, rationale: 'x' }]),
  )
  assert.equal(out.capabilities[0].name, 'Systems thinking')
})

test('evidence graph: rejects a capability that has no name', () => {
  assert.throws(() => evidenceGraphSchema.parse(graph([{ id: 'c1', level: 4 }])))
})

test('evidence graph: unknown capability type falls back to core', () => {
  const out = evidenceGraphSchema.parse(
    graph([{ id: 'c1', name: 'N', capabilityType: 'wizardry', level: 1, recurrence: 1, confidence: 0.5 }]),
  )
  assert.equal(out.capabilities[0].capabilityType, 'core')
})

test('numeric strings are accepted, null and text are not', () => {
  const ok = evidenceGraphSchema.parse(graph([{ id: 'c', name: 'N', level: '4', recurrence: '2', confidence: '0.5' }]))
  assert.equal(ok.capabilities[0].level, 4)
  assert.throws(() => evidenceGraphSchema.parse(graph([{ id: 'c', name: 'N', level: null, recurrence: 1, confidence: 0.5 }])))
  assert.throws(() => evidenceGraphSchema.parse(graph([{ id: 'c', name: 'N', level: 'high', recurrence: 1, confidence: 0.5 }])))
})

test('career DNA: scored dimensions pass through', () => {
  const out = careerDNASchema.parse(
    dna({ strongestCapabilities: [{ name: 'Facilitation', score: 88, evidenceIds: ['e1'], confidence: 0.9, rationale: 'r' }] }),
  )
  const first = out.strongestCapabilities[0]
  assert.equal(first.name, 'Facilitation')
  assert.equal(first.score, 88)
})

test('career DNA: a bare capability name is kept with an honest zero score and zero confidence', () => {
  const out = careerDNASchema.parse(dna({ strongestCapabilities: ['Storytelling'] }))
  const first = out.strongestCapabilities[0]
  assert.equal(first.name, 'Storytelling')
  assert.equal(first.score, 0)
  assert.equal(first.confidence, 0)
})

test('market direction: unknown evidence labels fall back to the lowest-claim values', () => {
  const out = marketDirectionSchema.parse({
    name: 'AI design',
    currentDemand: 70, momentum: 80, futurePotential: 90, resilience: 60, confidence: 0.6,
    evidence: [{ id: 'm1', signal: 's', sourceType: 'rumour', horizon: 'someday', directionality: 'sideways', magnitude: 5, reliability: 0.4 }],
  })
  const e = out.evidence[0]
  assert.equal(e.sourceType, 'weak_signal')
  assert.equal(e.horizon, 'current')
  assert.equal(e.directionality, 'uncertain')
})

test('market direction: scores are clamped to 0-100', () => {
  const out = marketDirectionSchema.parse({
    name: 'X', currentDemand: 140, momentum: -5, futurePotential: 50, resilience: 50, confidence: 3,
  })
  assert.equal(out.currentDemand, 100)
  assert.equal(out.momentum, 0)
  assert.equal(out.confidence, 1)
})

test('candidate draft: requires sub-scores and clamps them', () => {
  const base = {
    direction: 'Design Strategist',
    experience: { capability: 120, project: 50, transferable: 50, context: 50, recency: 50 },
    market: { demand: 50, growth: 50, future: 50, adjacency: 50, relevance: 50 },
    interest: { direct: 50, behavioural: 50, stated: 50, curiosity: 50, adjacency: 50 },
    capabilityDistance: 30,
  }
  const out = candidateDraftSchema.parse(base)
  assert.equal(out.experience.capability, 100)
  assert.deepEqual(out.evidenceIds, [])
  assert.throws(() => candidateDraftSchema.parse({ ...base, market: undefined }))
  assert.throws(() => candidateDraftSchema.parse({ ...base, direction: '  ' }))
})
