import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isDesignRole, seniorityOf, fresherOk, inIndia, minYears } from './classify'
import { fresherScore } from './score'

test('design role detection', () => {
  assert.ok(isDesignRole('Associate Product Designer'))
  assert.ok(isDesignRole('UX Research Intern'))
  assert.ok(isDesignRole('Visual Designer, Brand'))
  assert.ok(!isDesignRole('Design Verification Engineer'))
  assert.ok(!isDesignRole('Senior Backend Engineer'))
  assert.ok(!isDesignRole('Account Executive'))
})
test('seniority and years', () => {
  assert.equal(seniorityOf('Product Design Intern', '').seniority, 'INTERN')
  assert.equal(seniorityOf('Senior Product Designer', '').seniority, 'SENIOR')
  assert.equal(seniorityOf('Product Designer', '3-5 years of experience').seniority, 'MID')
  assert.equal(minYears('5+ years of design experience'), 5)
  assert.equal(minYears('2 to 4 years'), 2)
  assert.equal(minYears('no numbers here'), null)
})
test('fresher eligibility is conservative', () => {
  assert.ok(fresherOk('Design Intern', ''))
  assert.ok(fresherOk('Associate UX Designer', '0-1 years of experience. Freshers welcome.'))
  assert.ok(!fresherOk('Product Designer', '3+ years'))
  assert.ok(!fresherOk('Senior Designer', 'freshers welcome'))
  assert.ok(!fresherOk('Product Designer', 'Join our team'))
  assert.ok(!fresherOk('Design Intern', '2 years of experience'))
})
test('india detection', () => {
  assert.ok(inIndia('Bengaluru, Karnataka'))
  assert.ok(inIndia('Remote - India'))
  assert.ok(!inIndia('London, UK'))
})
test('fresher score: evidence beats prior; unknown stays null', () => {
  assert.equal(fresherScore({ kind: 'PRODUCT', crawledOk: false, designOpen: 0, indiaDesignOpen: 0, fresherOpen: 0, fresherSeen90d: 0 }).score, null)
  assert.equal(fresherScore({ kind: 'PRODUCT', crawledOk: true, designOpen: 0, indiaDesignOpen: 0, fresherOpen: 0, fresherSeen90d: 0 }).confidence, 'prior-only')
  const high = fresherScore({ kind: 'STARTUP', crawledOk: true, designOpen: 4, indiaDesignOpen: 4, fresherOpen: 3, fresherSeen90d: 4 })
  const low = fresherScore({ kind: 'STARTUP', crawledOk: true, designOpen: 4, indiaDesignOpen: 4, fresherOpen: 0, fresherSeen90d: 0 })
  assert.ok(high.score! > low.score! + 40)
})
