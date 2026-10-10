import test from 'node:test'
import assert from 'node:assert/strict'
import { parseIndeedSectors, parseWorldBank } from './feeds'
import { htmlToText, extractLinks, pageMeta } from './fetch'
import { normalizeRegion, isMetric } from './vocabulary'
import { fingerprint } from './fingerprint'

const day = (n: number) => new Date(Date.UTC(2025, 9, 1) + n * 86_400_000).toISOString().slice(0, 10)

test('Indeed CSV: 4-week average and year-on-year change per sector', () => {
  const rows = ['date,jobcountry,indeed_job_postings_index,variable,display_name']
  for (let n = 0; n <= 400; n++) {
    rows.push(`${day(n)},US,${n < 365 ? 100 : 80},total postings,Software Development`)
    rows.push(`${day(n)},US,50,new postings,Software Development`)
    rows.push(`${day(n)},US,70,total postings,Nursing`)
  }
  const out = parseIndeedSectors(rows.join('\n'), 'US', ['Software Development'])
  const yoy = out.find((o) => o.metric === 'postings_change_yoy')!
  assert.equal(out.length, 2)
  assert.equal(out.every((o) => o.subject === 'Software Development'), true)
  assert.ok(yoy.value < 0, 'postings fell from 100 to 80')
  assert.equal(out.find((o) => o.metric === 'postings_index')!.region, 'US')
})

test('World Bank: keeps the latest non-null value per country', () => {
  const json = [{}, [
    { countryiso3code: 'IND', date: '2024', value: 4.2 },
    { countryiso3code: 'IND', date: '2023', value: 4.5 },
    { countryiso3code: 'USA', date: '2024', value: null },
    { countryiso3code: 'USA', date: '2023', value: 3.6 },
  ]]
  const out = parseWorldBank(json, 'unemployment_rate')
  assert.deepEqual(out.map((o) => [o.region, o.value, o.period]).sort(), [['India', 4.2, '2024'], ['US', 3.6, '2023']])
})

test('HTML helpers', () => {
  const html = '<html><head><title>Report</title><meta property="article:published_time" content="2026-07-02T10:00:00Z"></head><body><script>x()</script><p>Hiring up 11%</p><a href="/2026/07/08/ai-jobs/">AI jobs</a></body></html>'
  assert.match(htmlToText(html), /Hiring up 11%/)
  assert.doesNotMatch(htmlToText(html), /x\(\)/)
  assert.equal(pageMeta(html).publishedAt?.toISOString().slice(0, 10), '2026-07-02')
  assert.equal(extractLinks(html, 'https://example.com/a')[0].url, 'https://example.com/2026/07/08/ai-jobs/')
})

test('vocabulary and fingerprints are stable', () => {
  assert.equal(normalizeRegion('gbr'), 'UK')
  assert.equal(normalizeRegion(''), 'Global')
  assert.equal(isMetric('salary'), true)
  assert.equal(isMetric('vibes'), false)
  const a = fingerprint('s1', { metric: 'salary', subject: 'UX Designer', region: 'India', period: '2026', value: 10.6 })
  assert.equal(a, fingerprint('s1', { metric: 'salary', subject: 'ux designer', region: 'India', period: '2026', value: 10.6 }))
  assert.notEqual(a, fingerprint('s2', { metric: 'salary', subject: 'UX Designer', region: 'India', period: '2026', value: 10.6 }))
})
