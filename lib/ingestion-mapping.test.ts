import test from 'node:test'
import assert from 'node:assert/strict'
import { mapIngestion, contentHashOf, sourceKindOf } from './ingestion-mapping'

test('maps rows, drops empties, dedupes skills case-insensitively', () => {
  const r = mapIngestion({
    timeline: [{ role: ' Design Lead ', company: 'SAP', startDate: '2019', endDate: 'Present' }, { role: '', company: 'x' }],
    projects: [{ name: 'Fiori', impact: '30% faster' }, { name: ' ' }],
    skills: ['Figma', 'figma', ' ', 'Research'],
    education: [{ institution: 'NID', degree: 'MDes', year: 'Class of 2012' }, { institution: '' }],
  })
  assert.equal(r.roles.length, 1)
  assert.equal(r.roles[0].title, 'Design Lead')
  assert.deepEqual(r.projects[0].outcomes, ['30% faster'])
  assert.deepEqual(r.skills, ['Figma', 'Research'])
  assert.equal(r.education[0].endYear, 2012)
})

test('content hash is stable and distinguishes content', () => {
  const a = { kind: 'resume' as const, name: 'a.pdf', text: 'hello' }
  assert.equal(contentHashOf(a), contentHashOf({ ...a, name: 'b.pdf' }))
  assert.notEqual(contentHashOf(a), contentHashOf({ ...a, text: 'other' }))
  assert.equal(sourceKindOf('profile-link'), 'LINK')
})
