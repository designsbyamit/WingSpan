import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveActionLink, resourceLink, safeUrl } from './links'

const base = { title: 'Audit', howToStart: '', whereToStart: '' }
test('own link wins and is made safe', () => {
  assert.equal(resolveActionLink({ ...base, link: 'example.com/x', linkLabel: 'Open Course' })?.url, 'https://example.com/x')
  assert.equal(safeUrl('javascript:alert(1)'), null)
  assert.equal(safeUrl('ftp://x.y'), null)
})
test('a named catalog title becomes a direct link', () => {
  const r = resolveActionLink({ ...base, whereToStart: 'People + AI Guidebook Chapter 1: User Needs & Defining Success', howToStart: "Review Google's People + AI Guidebook" })
  assert.ok(r && r.kind === 'catalog', JSON.stringify(r))
})
test('unknown text falls back to a labelled search, not a fake destination', () => {
  const r = resolveActionLink({ ...base, whereToStart: 'Some obscure workshop notes' })
  assert.equal(r?.kind, 'search')
  assert.ok(r?.url.startsWith('https://www.google.com/search?q='))
})
test('nothing to go on means no link', () => {
  assert.equal(resolveActionLink({ ...base }), null)
})
test('resources without a url get a search link', () => {
  assert.equal(resourceLink({ title: 'X', url: undefined, provider: 'Y' }).isSearch, true)
  assert.equal(resourceLink({ title: 'X', url: 'https://a.b/c' }).isSearch, false)
})
