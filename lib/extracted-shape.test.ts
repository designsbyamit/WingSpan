import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeExtracted, normalizeValidated } from './extracted-shape'
import { normalizeBlueprint as normBp } from './blueprint-shape'

test('missing lists become empty arrays so nothing downstream throws', () => {
  const d = normalizeExtracted({ rawText: 'x' })
  assert.deepEqual([d.timeline, d.projects, d.skills, d.education], [[], [], [], []])
  assert.equal(d.skills.join(', '), '')
})

test('non-array values are replaced, real lists are kept', () => {
  const d = normalizeValidated({ skills: ['a', 'b'], interests: 'oops' as never, timeline: null as never } as never)
  assert.deepEqual(d.skills, ['a', 'b'])
  assert.deepEqual(d.interests, [])
  assert.deepEqual(d.timeline, [])
})

test('a sparse model reply (missing methods/technologies/domains) builds a full input bundle', async () => {
  const { normalizeCareerEvidence } = await import('./career-evidence')
  const { buildCareerInputBundle } = await import('./career-input')
  const sparse = { person: { name: 'A' }, timeline: [{ role: 'Designer', company: 'X', startDate: '2020', endDate: 'now' }], skills: ['UX'] }
  const bundle = buildCareerInputBundle(normalizeCareerEvidence(sparse as never), [])
  assert.ok(bundle.careerAlpha.rawText.includes('Designer at X'))
  assert.deepEqual(bundle.careerAlpha.skills, ['UX'])
  // even raw, un-normalized evidence must not throw
  assert.doesNotThrow(() => buildCareerInputBundle(sparse as never, []))
})

test('a blueprint missing sections still has every list the screens iterate', async () => {
  const { parseBlueprintJson } = await import('./claude')
  const bp = parseBlueprintJson('{"strengths":[{"name":"x"}],"actions":{"immediate":[]}}')
  assert.deepEqual(bp.actions.resources, [])
  assert.deepEqual(bp.futurePaths, [])
  assert.deepEqual(bp.profileMap.industries, [])
  assert.equal(bp.strengths.length, 1)
})

test('nested lists inside blueprint items are always arrays', async () => {
  const { normalizeBlueprint } = await import('./blueprint-shape')
  const bp = normalizeBlueprint({
    roadmapMilestones: [{ phase: 'P1' }],
    gaps: [{ title: 'g' }],
    futurePaths: [{ name: 'f' }],
    actions: { resources: [{ title: 'r' }, null] },
  })
  assert.deepEqual(bp.roadmapMilestones?.[0].hardSkills, [])
  assert.deepEqual(bp.gaps[0].objectives, [])
  assert.deepEqual(bp.futurePaths[0].keyTransitionAreas, [])
  assert.equal(bp.actions.resources.length, 1)
})

test('path matching tolerates missing pathway tags', async () => {
  const { matchesPath } = await import('./path-match')
  assert.equal(matchesPath(undefined, 'AI Product Leader'), false)
  assert.equal(matchesPath('AI Product Leader / Strategy', 'AI Product Leader'), true)
  assert.equal(matchesPath('anything', null), true)
})

test('gap readiness accepts percentages, strings and fractions', () => {
  const bp = normBp({ gaps: [
    { pathway: 'A', currentReadiness: '40%', futureReadiness: 0.85, gapSize: 'Medium' },
    { pathway: 'A', currentReadiness: 'n/a', futureReadiness: 90 },
  ] })
  assert.equal(bp.gaps[0].currentReadiness, 40)
  assert.equal(bp.gaps[0].futureReadiness, 85)
  assert.equal(bp.gaps[1].currentReadiness, 0)
})
