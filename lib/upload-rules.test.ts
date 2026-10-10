import test from 'node:test'
import assert from 'node:assert/strict'
import { checkFileBasics, checkLooksLikeResume, sniffMismatch, MAX_RESUME_BYTES } from './upload-rules'

test('size and type limits give specific codes', () => {
  assert.equal(checkFileBasics('cv.pdf', MAX_RESUME_BYTES + 1)?.code, 'TOO_LARGE')
  assert.equal(checkFileBasics('cv.pdf', 0)?.code, 'EMPTY_FILE')
  assert.equal(checkFileBasics('photo.jpg', 1000)?.code, 'UNSUPPORTED_TYPE')
  assert.match(checkFileBasics('photo.png', 1000)!.message, /screenshots/i)
  assert.equal(checkFileBasics('cv.docx', 100000), null)
})

test('renamed files are caught by their first bytes', () => {
  assert.equal(sniffMismatch('pdf', new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), true)
  assert.equal(sniffMismatch('pdf', Buffer.from('%PDF-1.7')), false)
  assert.equal(sniffMismatch('docx', Buffer.from('PK\x03\x04')), false)
})

const resume = `Priya Nair  priya@example.com  +91 98765 43210
Summary: Product designer with 8 years of experience in fintech.
Experience
Senior Product Designer, Acme Pay, 2019 – Present. Led design for the payments app and mentored four designers across two squads.
Product Designer, Zeta, Mar 2016 – Dec 2018. Designed onboarding flows and a design system used by six teams.
Education
B.Tech Computer Science, NIT Calicut, 2015
Skills: Figma, Research, Prototyping, Design Systems, Stakeholder Management, Workshop Facilitation, Accessibility, Data Analysis, Interaction Design`
const invoice = `INVOICE #20931 Bill to: Globex Corporation. Item Quantity Unit price Total. Hosting plan 3 months 120.00 360.00. Support 1 50.00 50.00. Subtotal 410.00 Tax 18% 73.80 Total due 483.80. Payment terms: net 30 days from the date of invoice. Please remit payment to the account below quoting the invoice number. Thank you for your business and we look forward to working with you again soon.`

test('a resume passes, an invoice and a near-empty file do not', () => {
  assert.equal(checkLooksLikeResume(resume), null)
  assert.equal(checkLooksLikeResume(invoice)?.code, 'NOT_A_RESUME')
  assert.equal(checkLooksLikeResume('hello world')?.code, 'TOO_LITTLE')
})
