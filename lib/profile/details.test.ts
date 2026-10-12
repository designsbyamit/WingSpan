import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyChanges, decide, diffDetails, proposeDetails, sameName, type ProfileDetails } from './details'

const t = (role: string, company: string, start: string, end: string) => ({ id: role, role, company, startDate: start, endDate: end, confirmed: false })
const data = (over: object = {}) => ({
  candidateName: 'Priya Sharma', contact: { email: 'Priya@Mail.com', phone: '+91 98765 43210', linkedinUrl: 'linkedin.com/in/priya', portfolioUrl: 'priya.design' },
  timeline: [t('UX Design Intern', 'Acme', '2025', '2025')], education: [{ institution: 'IDC IIT Bombay', degree: 'M.Des', year: '2027' }],
  skills: ['Figma'], projects: [], rawText: '', ...over,
})

test('details are read from the resume and cleaned', () => {
  const p = proposeDetails(data() as never, {}, 2026)
  assert.equal(p.fullName, 'Priya Sharma')
  assert.equal(p.email, 'priya@mail.com')
  assert.equal(p.linkedinUrl, 'https://linkedin.com/in/priya')
  assert.equal(p.track, 'STUDENT')
  assert.match(p.education, /M\.Des, IDC IIT Bombay/)
})
test('bad emails and phones are dropped, not stored', () => {
  const p = proposeDetails(data({ contact: { email: 'nope', phone: '12' } }) as never, {}, 2026)
  assert.equal(p.email, ''); assert.equal(p.phone, '')
})
test('name matching: same person vs another person', () => {
  assert.ok(sameName('Priya Sharma', 'PRIYA SHARMA'))
  assert.ok(sameName('Priya Kumari Sharma', 'Priya Sharma'))
  assert.ok(sameName('Priya Sharma', 'P. Sharma'))
  assert.ok(sameName('Dr. Rahul Menon', 'Rahul Menon'))
  assert.ok(sameName('Sharma Priya', 'Priya Sharma'))
  assert.ok(!sameName('Priya Sharma', 'Ananya Iyer'))
  assert.ok(!sameName('Priya Sharma', 'Priya'))
  assert.ok(!sameName('', 'Priya Sharma'))
})
const saved: ProfileDetails = proposeDetails(data() as never, {}, 2026)
test('first resume: ask the person to confirm', () => {
  assert.equal(decide(null, saved).status, 'new')
})
test('a different name never touches the profile', () => {
  const other = proposeDetails(data({ candidateName: 'Ananya Iyer', contact: { email: 'a@b.co' } }) as never, {}, 2026)
  assert.equal(decide(saved, other).status, 'different-name')
})
test('same name, new phone: a change to approve; nothing else is touched', () => {
  const next = proposeDetails(data({ contact: { ...data().contact, phone: '+91 90000 11111' } }) as never, {}, 2026)
  const r = decide(saved, next)
  assert.equal(r.status, 'same-person')
  if (r.status === 'same-person') {
    assert.deepEqual(r.changes.map((c) => c.field), ['phone'])
    assert.equal(applyChanges(saved, next, []).phone, saved.phone, 'nothing applied without consent')
    assert.equal(applyChanges(saved, next, ['phone']).phone, next.phone)
    assert.equal(applyChanges(saved, { ...next, fullName: 'Someone Else' }, ['phone']).fullName, saved.fullName, 'name is locked')
  }
})
test('same name, same details: nothing to ask; blanks never overwrite', () => {
  assert.equal(decide(saved, saved).status, 'unchanged')
  const blank = { ...saved, phone: '', linkedinUrl: '' }
  assert.deepEqual(diffDetails(saved, blank), [])
})
test('formatting differences are not changes', () => {
  const next = { ...saved, phone: '09876543210', linkedinUrl: 'https://www.linkedin.com/in/priya/' }
  assert.deepEqual(diffDetails({ ...saved, phone: '+919876543210' }, next).map((c) => c.field), [])
})
