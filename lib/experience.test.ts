import test from 'node:test'
import assert from 'node:assert/strict'
import { experienceFacts } from './experience'

const row = (role: string, s: string, e: string) => ({ id: role, role, company: 'X', startDate: s, endDate: e, confirmed: true })

test('16-year design leader is classed as leader with latest role', () => {
  const f = experienceFacts([row('Senior Designer', '2010', '2015'), row('Design Director', '2015', '2020'), row('Head of Design', 'Mar 2020', 'Present')], 2026)
  assert.equal(f.years, 16)
  assert.equal(f.latestRole, 'Head of Design')
  assert.equal(f.seniority, 'leader')
})

test('short careers are early or mid', () => {
  assert.equal(experienceFacts([row('UX Designer', '2024', 'Present')], 2026).seniority, 'early')
  assert.equal(experienceFacts([row('Product Designer', '2021', 'Present')], 2026).seniority, 'mid')
  assert.equal(experienceFacts([], 2026).years, 0)
})
