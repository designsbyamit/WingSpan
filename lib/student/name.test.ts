import { test } from 'node:test'
import assert from 'node:assert/strict'
import { firstNameOf } from './name'

test('first name from a printed resume name', () => {
  assert.equal(firstNameOf('Priya Sharma'), 'Priya')
  assert.equal(firstNameOf('ANANYA IYER'), 'Ananya')
  assert.equal(firstNameOf('Dr. Rahul Menon'), 'Rahul')
  assert.equal(firstNameOf("  Aoife O'Brien "), 'Aoife')
})
test('unsure means no name', () => {
  assert.equal(firstNameOf(''), null)
  assert.equal(firstNameOf(undefined), null)
  assert.equal(firstNameOf('Resume'), null)
  assert.equal(firstNameOf('priya@mail.com'), null)
  assert.equal(firstNameOf('A. Kumar'), null)
})
