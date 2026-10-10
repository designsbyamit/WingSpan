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
