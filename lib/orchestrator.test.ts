import test from 'node:test'
import assert from 'node:assert/strict'
import { enforceBets, betsInstruction, type Bet } from './bets'
import { buildCareerMap } from './career-scoring'
import { buildDeepAnalysis, toCareerAlpha, orchestratorSchema, type AgentRun } from './orchestrator'
import type { Blueprint } from '@/types/wingspan'

const sub = (v: number) => ({ capability: v, project: v, transferable: v, context: v, recency: v })
const mk = (direction: string, e: number, m: number, i: number, distance: number) => ({
  direction, experience: sub(e), market: { demand: m, growth: m, future: m, adjacency: m, relevance: m },
  interest: { direct: i, behavioural: i, stated: i, curiosity: i, adjacency: i },
  capabilityDistance: distance, confidence: 0.8, whyThisPerson: 'w', whyNow: 'n', evidenceIds: [], rationale: 'r',
})
const map = buildCareerMap({ candidates: [
  mk('Head of Product Design', 90, 70, 60, 10),
  mk('Design Director, AI Products', 75, 85, 80, 40),
  mk('Chief Design Officer', 55, 80, 70, 65),
  mk('Strategy Consultant', 40, 60, 50, 80),
] } as never, 0.7)

const run = {
  evidenceGraph: { version: '0.2', evidence: [{}, {}], capabilities: [{ name: 'Design leadership', level: 90 }], patterns: ['p'], uncertainties: ['u'], contradictions: [], constraints: [], confidence: 0.8 },
  careerDNA: { version: '0.2', currentIdentity: 'Design leader', emergingIdentity: ['AI design'], strongestCapabilities: [{ name: 'Leadership', score: 90, confidence: 0.8 }], distinctiveStrengths: [{ name: 'Systems', score: 80, confidence: 0.7 }], careerTrajectory: 't', capabilityMaturity: 'm', strategicMaturity: 's', deepInterestSignals: [], confidence: 0.8 },
  marketGraph: { version: '0.2', directions: [{ name: 'Design Director, AI Products', currentDemand: 80, momentum: 85, futurePotential: 90, resilience: 77, futureThesis: 'x', invalidationRisks: ['r'] }], capabilityRequirements: [], confidence: 0.6 },
  careerMap: map, timings: { aggregator: 3000 },
} as unknown as AgentRun
const out = orchestratorSchema.parse({
  archetypeLabel: 'Design Leader', synthesis: 'You lead design at scale and the market is moving to AI products.', weightingRationale: 'Experience and market weigh equally.',
  dimensions: Object.fromEntries(['intrinsicSignal', 'marketIntelligence', 'futuresAnalysis', 'humanAdvantageIndex', 'careerROI'].map((k) => [k, { insight: 'i', signals: ['s'] }])),
})

test('deep analysis shows the weights and the arithmetic for each pick', () => {
  const d = buildDeepAnalysis(run, out, 1200)
  assert.equal(d.agents.length, 5)
  assert.deepEqual(d.orchestration.weights.map((w) => w.value), ['40%', '40%', '20%'])
  const picks = d.candidates.filter((c) => c.archetype !== 'reserve')
  assert.equal(picks.length, 3)
  assert.match(picks[0].calc, /0\.4×.*\+ 0\.4×.*\+ 0\.2×.*=/)
  assert.equal(JSON.stringify(d).includes('simulation'), false)
})

test('career alpha view takes stage from computed seniority and confidence from agents', () => {
  const data = { timeline: [{ id: '1', role: 'Head of Design', company: 'X', startDate: '2010', endDate: 'Present', confirmed: true }], projects: [], skills: [], education: [] }
  const ca = toCareerAlpha(out, run, data as never, [])
  assert.equal(ca.careerStage, 'leader')
  assert.equal(ca.dimensions.intrinsicSignal.confidenceScore, 80)
  assert.equal(ca.dimensions.marketIntelligence.confidenceScore, 60)
})

test('enforceBets fixes titles, scores and pathway links', () => {
  const bets: Bet[] = ['safe', 'growth', 'bold'].map((a, i) => ({
    archetype: a as Bet['archetype'], direction: `Dir ${i}`, careerScore: 70 + i, experienceScore: 1, marketScore: 60, interestScore: 1,
    resilience: null, whyThisPerson: 'w', whyNow: 'n', rationale: 'r',
  }))
  const bp = {
    futurePaths: [{ title: 'Wrong A', betArchetype: 'safe' }, { title: 'Wrong B', betArchetype: 'growth' }],
    gaps: [{ pathway: 'wrong a' }, { pathway: 'Wrong B' }],
    actions: { immediate: [], mediumTerm: [], longTerm: [], resources: [{ pathway: 'Wrong B' }] },
  } as unknown as Blueprint
  const r = enforceBets(bp, bets)
  assert.deepEqual(r.futurePaths.map((p) => p.title), ['Dir 0', 'Dir 1', 'Dir 2'])
  assert.deepEqual(r.futurePaths.map((p) => p.betArchetype), ['safe', 'growth', 'bold'])
  assert.equal(r.futurePaths[0].careerAlphaScore, 70)
  assert.deepEqual(r.gaps.map((g) => g.pathway), ['Dir 0', 'Dir 1'])
  assert.equal(r.actions.resources[0].pathway, 'Dir 1')
  assert.match(betsInstruction(bets), /exactly "Dir 2"/)
})

test('growth levels are grounded in evidence and experience', async () => {
  const { groundLevel } = await import('./growth-agent')
  const ctx = { evidenced: [{ name: 'Design Operations', level: 82 }], years: 16, seniority: 'leader' }
  assert.equal(groundLevel('Scaling design operations', 35, ctx).level, 82)
  assert.equal(groundLevel('Interaction Design', 35, ctx).level, 70)
  assert.equal(groundLevel('AI governance', 30, ctx).level, 30)
})

test('directions never step down from the current role', async () => {
  const { canonicalizeDrafts } = await import('./v02-agents')
  const c = (direction: string) => ({ direction, experience: { capability: 80, project: 80, transferable: 80, context: 80, recency: 80 }, market: { demand: 70, growth: 70, future: 70, adjacency: 70, relevance: 70 }, interest: { direct: 70, behavioural: 70, stated: 70, curiosity: 70, adjacency: 70 }, capabilityDistance: 10, evidenceIds: [], whyThisPerson: '', whyNow: '', rationale: '' })
  const r = canonicalizeDrafts({ candidates: [c('Senior Design Manager'), c('VP of Design'), c('Principal Design Consultant'), c('Design Director, Fintech')] } as never, 'leader', false, 'Head of Design')
  assert.deepEqual(r.draft.candidates.map((x) => x.direction), ['VP of Design', 'Principal Design Consultant', 'Design Director, Fintech'])
  assert.throws(() => canonicalizeDrafts({ candidates: [c('Senior Design Manager')] } as never, 'leader', true, 'Head of Design'))
})
