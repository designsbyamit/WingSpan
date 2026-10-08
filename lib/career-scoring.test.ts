import test from 'node:test'
import assert from 'node:assert/strict'
import {
  WEIGHTS,
  FORMULA,
  InsufficientCandidatesError,
  buildCareerMap,
  careerScore,
  confidenceMultiplier,
  experienceScore,
  interestScore,
  marketScore,
  scoreCandidate,
  selectBets,
  similarity,
} from '@/lib/career-scoring'
import type { CandidateDraft, CareerDirectionDraft } from '@/lib/agent-contracts'

const sumOf = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0)
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`)

function draft(
  direction: string,
  o: { e?: number; m?: number; i?: number; d?: number; c?: number } = {},
): CandidateDraft {
  const { e = 60, m = 60, i = 60, d = 30, c = 0.8 } = o
  return {
    direction,
    experience: { capability: e, project: e, transferable: e, context: e, recency: e },
    market: { demand: m, growth: m, future: m, adjacency: m, relevance: m },
    interest: { direct: i, behavioural: i, stated: i, curiosity: i, adjacency: i },
    capabilityDistance: d,
    confidence: c,
    whyThisPerson: 'because',
    whyNow: 'now',
    evidenceIds: [],
    rationale: 'r',
  }
}

test('weights each sum to 1', () => {
  close(sumOf(WEIGHTS.overall), 1)
  close(sumOf(WEIGHTS.experience), 1)
  close(sumOf(WEIGHTS.market), 1)
  close(sumOf(WEIGHTS.interest), 1)
})

test('component scores follow the documented weights', () => {
  // 0.30*80 + 0.25*60 + 0.20*40 + 0.15*20 + 0.10*100 = 60
  close(experienceScore({ capability: 80, project: 60, transferable: 40, context: 20, recency: 100 }), 60)
  close(marketScore({ demand: 100, growth: 0, future: 0, adjacency: 0, relevance: 0 }), 30)
  close(interestScore({ direct: 0, behavioural: 100, stated: 0, curiosity: 0, adjacency: 0 }), 25)
  close(experienceScore({ capability: 100, project: 100, transferable: 100, context: 100, recency: 100 }), 100)
})

test('confidence multiplier runs from 0.75 to 1 and clamps', () => {
  close(confidenceMultiplier(0), 0.75)
  close(confidenceMultiplier(1), 1)
  close(confidenceMultiplier(0.5), 0.875)
  close(confidenceMultiplier(-3), 0.75)
  close(confidenceMultiplier(7), 1)
})

test('career score = (0.40E + 0.40M + 0.20I) * confidence multiplier', () => {
  // base = 32 + 24 + 8 = 64, multiplier 0.875
  assert.equal(careerScore(80, 60, 40, 0.5), 56)
})

test('weak evidence lowers the score but never below 75% of the base', () => {
  assert.equal(careerScore(100, 100, 100, 0), 75)
  assert.equal(careerScore(100, 100, 100, 1), 100)
})

test('demand is not destiny: market alone cannot beat a balanced fit', () => {
  const marketOnly = scoreCandidate(draft('Hype Role', { e: 0, m: 100, i: 0 }), 0.8)
  const balanced = scoreCandidate(draft('Balanced Role', { e: 60, m: 60, i: 60 }), 0.8)
  assert.ok(balanced.careerScore > marketOnly.careerScore)
})

test('scoreCandidate clamps out-of-range inputs and records the breakdown', () => {
  const s = scoreCandidate(draft('X', { e: 140, m: -20, i: 50, c: 5 }), 0.4)
  assert.equal(s.experienceScore, 100)
  assert.equal(s.marketScore, 0)
  assert.equal(s.confidence, 1)
  assert.equal(s.scoreBreakdown?.confidenceMultiplier, 1)
})

test('falls back to the supplied confidence when the draft has none', () => {
  const d = draft('Y')
  delete d.confidence
  assert.equal(scoreCandidate(d, 0.6).confidence, 0.6)
})

test('similarity flags near-duplicate job names', () => {
  assert.ok(similarity('Senior Product Designer', 'Product Designer, Senior') >= 0.6)
  assert.ok(similarity('Design Strategist', 'Engineering Manager') < 0.2)
})

const pool = () =>
  [
    draft('Senior Product Designer', { e: 90, m: 55, i: 60, d: 10 }),
    draft('Design Systems Lead', { e: 80, m: 65, i: 65, d: 30 }),
    draft('AI Experience Strategist', { e: 65, m: 85, i: 80, d: 40 }),
    draft('Head Of Design Operations', { e: 60, m: 60, i: 50, d: 55 }),
    draft('Founder, Applied AI Studio', { e: 35, m: 90, i: 85, d: 75 }),
    draft('Learning Experience Architect', { e: 55, m: 50, i: 70, d: 50 }),
  ].map((x) => scoreCandidate(x, 0.8))

test('selects three distinct directions with the right proximity to proven experience', () => {
  const { safe, growth, bold, notes } = selectBets(pool())
  assert.equal(safe.archetype, 'safe')
  assert.equal(growth.archetype, 'growth')
  assert.equal(bold.archetype, 'bold')
  assert.equal(new Set([safe.direction, growth.direction, bold.direction]).size, 3)
  assert.ok(safe.capabilityDistance <= 35)
  assert.ok(growth.capabilityDistance > 20 && growth.capabilityDistance <= 60)
  assert.ok(bold.capabilityDistance >= 45 && bold.capabilityDistance <= 85)
  assert.deepEqual(notes, [])
})

test('is deterministic: the same drafts always give the same result', () => {
  assert.deepEqual(selectBets(pool()), selectBets(pool()))
})

test('every candidate is returned, ranked, with only the three picks marked', () => {
  const { candidates } = selectBets(pool())
  assert.equal(candidates.length, 6)
  assert.equal(candidates.filter((c) => c.archetype !== 'reserve').length, 3)
  for (let n = 1; n < candidates.length; n += 1) {
    assert.ok(candidates[n - 1].careerScore >= candidates[n].careerScore)
  }
})

test('duplicate direction names keep only the best-scoring entry', () => {
  const dup = [
    ...pool(),
    scoreCandidate(draft('senior product designer', { e: 10, m: 10, i: 10, d: 10 }), 0.8),
  ]
  const { candidates } = selectBets(dup)
  assert.equal(candidates.filter((c) => /senior product designer/i.test(c.direction)).length, 1)
})

test('near-duplicate names are not used for two different bets', () => {
  const scored = [
    draft('Product Design Lead', { e: 90, m: 70, i: 70, d: 10 }),
    draft('Lead Product Design', { e: 88, m: 70, i: 70, d: 40 }),
    draft('AI Strategy Consultant', { e: 50, m: 80, i: 70, d: 40 }),
    draft('Venture Studio Founder', { e: 30, m: 85, i: 80, d: 70 }),
  ].map((x) => scoreCandidate(x, 0.8))
  const { safe, growth, bold } = selectBets(scored)
  const picks = [safe, growth, bold]
  for (let a = 0; a < picks.length; a += 1) {
    for (let b = a + 1; b < picks.length; b += 1) {
      assert.ok(similarity(picks[a].direction, picks[b].direction) < 0.6)
    }
  }
})

test('records a note when a fallback pick is needed', () => {
  const scored = [
    draft('A One', { d: 10 }),
    draft('B Two', { d: 12 }),
    draft('C Three', { d: 14 }),
  ].map((x) => scoreCandidate(x, 0.8))
  const { notes } = selectBets(scored)
  assert.ok(notes.some((n) => n.startsWith('Growth')))
  assert.ok(notes.some((n) => n.startsWith('Bold')))
})

test('refuses to manufacture three bets from fewer than three distinct directions', () => {
  const two = [draft('Only One'), draft('Only Two')].map((x) => scoreCandidate(x, 0.8))
  assert.throws(() => selectBets(two), InsufficientCandidatesError)
  const sameName = [draft('Same Name'), draft('same name'), draft('Another Role')].map((x) => scoreCandidate(x, 0.8))
  assert.throws(() => selectBets(sameName), InsufficientCandidatesError)
})

test('buildCareerMap returns a schema-valid CareerMap', () => {
  const input: CareerDirectionDraft = {
    candidates: [
      draft('Senior Product Designer', { e: 90, m: 55, i: 60, d: 10 }),
      draft('Design Systems Lead', { e: 80, m: 65, i: 65, d: 30 }),
      draft('AI Experience Strategist', { e: 65, m: 85, i: 80, d: 40 }),
      draft('Founder, Applied AI Studio', { e: 35, m: 90, i: 85, d: 75 }),
    ],
  }
  const map = buildCareerMap(input, 0.7)
  assert.equal(map.version, '0.2')
  assert.equal(map.formula, FORMULA)
  assert.equal(map.safe.archetype, 'safe')
  assert.equal(map.candidates.length, 4)
  assert.ok(map.confidence > 0 && map.confidence <= 1)
  assert.ok(map.validation[0].includes('Scored 4 candidates'))
})
