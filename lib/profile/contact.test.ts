import { test } from 'node:test'
import assert from 'node:assert/strict'
import { identityFrom, readContactFromText } from './contact'
import { proposeDetails } from './details'

// The header of a real resume, as the PDF reader returns it.
const RESUME = `[UPLOADED DOCUMENT: Mayuri_Bhide_Resume.pdf]
MAYURI BHIDE
Product Designer | UI/UX Designer
Pune, Maharashtra, India | +91 9822568377 | mayuribhide01@gmail.com | linkedin.com/in/mayuri-bhide
Portfolio: mayuribhide.framer.website | behance.net/mayurib11
PROFESSIONAL SUMMARY
Product and UX Designer with 2 years of experience designing user-centered, accessible B2B and B2C web applications.
WORK EXPERIENCE
UI/UX Designer | Hummingbird Web Solutions Dec 2023 – Jun 2025`

test('reads name and contact from the resume header', () => {
  const r = readContactFromText(RESUME)
  assert.equal(r.name, 'MAYURI BHIDE')
  assert.equal(r.contact.email, 'mayuribhide01@gmail.com')
  assert.equal(r.contact.phone, '+91 9822568377')
  assert.equal(r.contact.location, 'Pune, Maharashtra, India')
  assert.equal(r.contact.linkedinUrl, 'linkedin.com/in/mayuri-bhide')
  assert.equal(r.contact.portfolioUrl, 'mayuribhide.framer.website')
})
test('a job title or section heading is never taken as the name', () => {
  assert.equal(readContactFromText('Product Designer\nProfessional Summary\nSkills').name, '')
  assert.equal(readContactFromText('RESUME\nPriya Sharma\nUX Designer').name, 'Priya Sharma')
})
test('AI-read values win; text fills only the gaps', () => {
  const id = identityFrom({ candidateName: 'Mayuri B.', contact: { email: 'other@x.co' }, rawText: RESUME })
  assert.equal(id.name, 'Mayuri B.')
  assert.equal(id.contact.email, 'other@x.co')
  assert.equal(id.contact.phone, '+91 9822568377')
})
test('details proposed from older extracted data (no name or contact fields) are still filled', () => {
  const p = proposeDetails({ timeline: [], education: [{ institution: 'MIT Institute of Design', degree: 'M.Des', year: 'Jul 2025 – Jul 2027 (Expected)' }], skills: [], rawText: RESUME }, {}, 2026)
  assert.equal(p.fullName, 'Mayuri Bhide')
  assert.equal(p.email, 'mayuribhide01@gmail.com')
  assert.equal(p.linkedinUrl, 'https://linkedin.com/in/mayuri-bhide')
  assert.equal(p.portfolioUrl, 'https://mayuribhide.framer.website')
})
