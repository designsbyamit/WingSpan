import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildResumeFacts, checkClaim, checkEdge, checkDays, figuresSupported, themeOfDay } from './verify'
import type { SourceRef } from './types'

const src = (id: string, statement: string): SourceRef => ({ id, kind: 'REPORT', label: 'R', publisher: 'P', url: 'https://x.y', publishedAt: null, retrievedAt: '2026-10-12', reliability: 0.8, statement })
const known = new Map([['S1', src('S1', '75% of employers plan to hire freshers in H2 2026 (1,097 employers)')]])

test('figures must appear in the cited sources', () => {
  assert.ok(figuresSupported('75% of employers plan to hire freshers', ['75% of employers plan to hire']))
  assert.ok(!figuresSupported('90% of employers plan to hire', ['75% of employers plan to hire']))
  assert.ok(figuresSupported('Hiring in 2026 for 3 lanes', ['anything']), 'years and single digits are not data claims')
})
test('claims without a valid source are labelled general; unsupported figures are flagged', () => {
  assert.equal(checkClaim({ text: 'Demand is strong', sources: ['S9'] }, known).general, true)
  assert.equal(checkClaim({ text: '75% of employers plan to hire freshers', sources: ['S1'] }, known).unverifiedNumber, undefined)
  assert.equal(checkClaim({ text: '95% of employers plan to hire freshers', sources: ['S1'] }, known).unverifiedNumber, true)
})
test('differentiators must cite real resume facts', () => {
  const edge = { headline: 'h', differentiators: [
    { title: 'a', whyHirersCare: 'x', evidence: ['R1'], strength: 'demonstrated' as const },
    { title: 'b', whyHirersCare: 'x', evidence: ['R99'], strength: 'indicated' as const },
  ], alreadyProven: [{ text: 'p', evidence: ['R42'] }], honestGaps: [] }
  const out = checkEdge(edge, new Set(['R1', 'R2']))
  assert.equal(out.differentiators.length, 1)
  assert.equal(out.alreadyProven.length, 0)
  assert.throws(() => checkEdge({ ...edge, differentiators: [edge.differentiators[1]] }, new Set(['R1'])))
})
test('the 14 days always exist with fixed weekly themes', () => {
  const days = checkDays([{ day: 2, action: 'Add a metric to case study two', why: 'w', minutes: 40, guidance: 'g' }])
  assert.equal(days.length, 14)
  assert.equal(days[0].theme, 'Position')
  assert.equal(days[1].action, 'Add a metric to case study two')
  assert.equal(days[1].minutes, 20, 'capped at 20 minutes')
  assert.equal(days[7].theme, themeOfDay(8))
})
test('resume facts get stable ids', () => {
  const f = buildResumeFacts({ timeline: [{ id: 'a', role: 'Intern', company: 'X', startDate: '2025', endDate: '2025', confirmed: false }], projects: [{ id: 'p', name: 'App', company: '' }], skills: ['Figma'], education: [{ institution: 'IDC', degree: 'M.Des' }], rawText: '' })
  assert.deepEqual(f.map((x) => x.id), ['R1', 'R2', 'R3', 'R4'])
})

import { studentPlanToMarkdown } from './export'
test('the downloadable plan keeps citations and lists every source', () => {
  const md = studentPlanToMarkdown({
    version: 1, generatedAt: '2026-10-12T00:00:00Z', detection: { reasons: [] },
    edge: { headline: 'I design for people others skip', differentiators: [], alreadyProven: [], honestGaps: [] },
    market: [{ text: '75% plan to hire freshers', sources: ['S1'] }, { text: 'Demand is rising', sources: [], general: true }],
    lanes: [], bridge: { title: 'Freelance', why: 'w', whereToLook: [], claim: { text: 'c', sources: [] } },
    openings: [], openingsNote: 'None open.', days: [], caveats: [],
    sources: [src('S1', 'x')],
  })
  assert.match(md, /75% plan to hire freshers \[S1\]/)
  assert.match(md, /general guidance, no source/)
  assert.match(md, /- S1: R \(P, read 2026-10-12\) https:\/\/x\.y/)
})

import { stripIds, applySupport } from './verify'
test('internal ids never reach the student', () => {
  assert.equal(stripIds('Audit your R1-R4 projects (R2) and read S3'), 'Audit your projects and read your work')
  assert.ok(!/\bR\d/.test(stripIds('Use R5 evidence')))
})
test('the claim checker removes sources that do not support a claim', () => {
  const c = { text: 'claim', sources: ['S1', 'S2'] }
  assert.deepEqual(applySupport(c, { i: 0, supported: 'yes', keep: ['S2'] }).sources, ['S2'])
  assert.equal(applySupport(c, { i: 0, supported: 'no', keep: [] }).general, true)
  assert.equal(applySupport(c, { i: 0, supported: 'partly', keep: [] }).general, true, 'no supporting source left means general guidance')
  assert.equal(applySupport(c, undefined).unchecked, true)
})
