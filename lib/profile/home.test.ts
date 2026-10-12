import { test } from 'node:test'
import assert from 'node:assert/strict'
import { milestonesFor, nextNudge, stageCopy, type HomeFacts } from './home'

const f = (o: Partial<HomeFacts> = {}): HomeFacts => ({ firstName: 'Meera', track: 'PROFESSIONAL', years: 9, projects: 3, roles: 3, skills: 8, selectedPath: null, actionsTotal: 5, actionsStarted: 0, actionsDone: 0, versions: 0, detailsConfirmed: false, hasPlan: false, hasBlueprint: true, ...o })

test('copy follows the experience band and uses the first name', () => {
  assert.match(stageCopy(f({ years: 15 })).headline, /^Meera, you are playing the long game/)
  assert.equal(stageCopy(f({ years: 15 })).band, 'leader')
  assert.equal(stageCopy(f({ track: 'STUDENT', years: 0 })).band, 'student')
  assert.equal(stageCopy(f({ track: 'BOTH' })).badge, 'Studying and working')
  assert.doesNotMatch(stageCopy(f({ firstName: null })).headline, /^null|undefined/)
})
test('praise is built only from facts present', () => {
  const none = stageCopy(f({ projects: 0, skills: 0, years: null, topProject: undefined }))
  assert.equal(none.praise.length, 1)
  const withImpact = stageCopy(f({ topProject: { name: 'Checkout redesign', impact: 'cut drop-off by a third' } }))
  assert.match(withImpact.praise[0].body, /Checkout redesign: cut drop-off by a third/)
})
test('milestones reflect real progress and the nudge follows it', () => {
  const m = milestonesFor(f({ detailsConfirmed: true, actionsDone: 3, versions: 1, selectedPath: 'Head of Design' }))
  assert.ok(m.every((x) => x.done))
  assert.match(nextNudge(f()), /Confirm your details/)
  assert.match(nextNudge(f({ detailsConfirmed: true })), /Choose a direction/)
  assert.equal(milestonesFor(f({ track: 'STUDENT' })).some((x) => x.id === 'path'), false)
})
