import { test } from 'node:test'
import assert from 'node:assert/strict'
import { detectStudent } from './detect'

const t = (role: string, start: string, end: string) => ({ id: role, role, company: 'X', startDate: start, endDate: end, confirmed: false })
const base = { rawText: '', skills: ['Figma', 'User research'] }

test('MDes student with internships is a design student', () => {
  const r = detectStudent({ ...base, timeline: [t('UX Design Intern', '2025', '2025')], education: [{ institution: 'IDC IIT Bombay', degree: 'M.Des Interaction Design', year: '2027' }] }, 2026)
  assert.equal(r.mode, 'student')
  assert.ok(r.reasons.length >= 2)
})
test('recent BDes graduate with no roles is a design student', () => {
  const r = detectStudent({ ...base, timeline: [], education: [{ institution: 'NID', degree: 'B.Des', year: '2025' }] }, 2026)
  assert.equal(r.mode, 'student')
})
test('experienced professional doing a part-time MDes stays professional', () => {
  const r = detectStudent({ ...base, timeline: [t('Senior Product Designer', '2018', '2026')], education: [{ institution: 'X', degree: 'M.Des', year: '2027' }] }, 2026)
  assert.equal(r.mode, 'professional')
})
test('non-design student stays on the professional flow', () => {
  const r = detectStudent({ rawText: '', skills: ['Excel'], timeline: [], education: [{ institution: 'Y', degree: 'B.Com', year: '2026' }] }, 2026)
  assert.equal(r.isStudent, true)
  assert.equal(r.mode, 'professional')
})
test('graduate from long ago is not a student', () => {
  const r = detectStudent({ ...base, timeline: [], education: [{ institution: 'Z', degree: 'B.Des', year: '2014' }] }, 2026)
  assert.equal(r.isStudent, false)
})
test('missing data is safe', () => {
  assert.equal(detectStudent(null).mode, 'professional')
})

test('track: studying only, working only, or both', () => {
  const stu = detectStudent({ ...base, timeline: [t('UX Design Intern', '2025', '2025')], education: [{ institution: 'IDC', degree: 'M.Des', year: '2027' }] }, 2026)
  assert.equal(stu.track, 'STUDENT')
  const both = detectStudent({ ...base, timeline: [t('Senior Product Designer', '2018', 'Present')], education: [{ institution: 'X', degree: 'M.Des', year: '2027' }] }, 2026)
  assert.equal(both.track, 'BOTH')
  const pro = detectStudent({ ...base, timeline: [t('Product Designer', '2019', 'Present')], education: [{ institution: 'X', degree: 'B.Des', year: '2018' }] }, 2026)
  assert.equal(pro.track, 'PROFESSIONAL')
  assert.ok(pro.fullTimeYears >= 7)
})
test('a job that only just began beside a degree in progress is still the student journey', () => {
  const r = detectStudent({ ...base, timeline: [t('Associate Designer', `${new Date().getFullYear()}-${String(Math.max(1, new Date().getMonth() - 2)).padStart(2, '0')}`, 'Present')], education: [{ institution: 'X', degree: 'B.Des', year: String(new Date().getFullYear()) }] }, new Date().getFullYear())
  assert.equal(r.track, 'STUDENT')
})
