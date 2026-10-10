import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeExtracted, normalizeValidated } from './extracted-shape'

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
