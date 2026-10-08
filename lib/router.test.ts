import { test } from 'node:test'
import assert from 'node:assert/strict'
import { geminiModelChain, isRetryableProviderError, friendlyProviderError } from './router'

test('model chain: configured model first, fallbacks after, no duplicates', () => {
  assert.deepEqual(
    geminiModelChain({ GEMINI_MODEL: 'gemini-3.1-pro-preview\n', GEMINI_FALLBACK_MODELS: 'gemini-2.5-flash, gemini-3.1-pro-preview' }),
    ['gemini-3.1-pro-preview', 'gemini-2.5-flash'],
  )
  const defaults = geminiModelChain({})
  assert.ok(defaults.length >= 2)
  assert.ok(defaults.every((m) => m.includes('flash')))
})

test('quota and missing-model errors are retryable; bad input is not', () => {
  const quota = new Error('[GoogleGenerativeAI Error]: Error fetching ... [429 Too Many Requests] You exceeded your current quota')
  assert.equal(isRetryableProviderError(quota), true)
  assert.equal(isRetryableProviderError(new Error('[404 Not Found] models/gemini-x is not found')), true)
  assert.equal(isRetryableProviderError(new Error('[503 Service Unavailable] The model is overloaded')), true)
  assert.equal(isRetryableProviderError(new Error('[400 Bad Request] Invalid JSON payload')), false)
})

test('raw provider errors are never shown to people', () => {
  const quota = new Error('[429 Too Many Requests] Quota exceeded for metric: generativelanguage.googleapis.com/...')
  const msg = friendlyProviderError(quota)
  assert.doesNotMatch(msg, /googleapis|429|metric/)
  assert.match(msg, /try again/i)
  assert.equal(friendlyProviderError(new Error('We could not find enough career information.')), 'We could not find enough career information.')
})
