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

import { callValidated, describeIssues } from './v02-agents'
import { z } from 'zod'

test('agent output that fails validation is retried once with the problems listed', async () => {
  const schema = z.object({ version: z.literal('0.2'), n: z.number() })
  const prompts: string[] = []
  const replies = [{ n: 'x' }, { version: '0.2', n: 3 }]
  const ask = async (_s: string, u: string) => { prompts.push(u); return replies.shift() }
  const out = await callValidated('sys', 'user', (o) => schema.parse(o), 100, ask as never)
  assert.deepEqual(out, { version: '0.2', n: 3 })
  assert.equal(prompts.length, 2)
  assert.match(prompts[1], /version/)
  assert.match(prompts[1], /did not match/)
})

test('a second failure is surfaced, not swallowed', async () => {
  const schema = z.object({ n: z.number() })
  const ask = async () => ({ n: 'still wrong' })
  await assert.rejects(callValidated('s', 'u', (o) => schema.parse(o), 100, ask as never))
  assert.match(describeIssues(schema.safeParse({}).error), /n/)
})

import { blueprintProblems, parseBlueprintJson } from './claude'

test('a thin Blueprint is flagged, a complete one is not', () => {
  const thin = { futurePaths: [{}], strengths: [{}], actions: { immediate: [] }, roadmapMilestones: [{}] } as never
  assert.equal(blueprintProblems(thin).length, 4)
  const full = {
    futurePaths: [{}, {}, {}], strengths: [{}, {}, {}], actions: { immediate: [{}] }, roadmapMilestones: [{}, {}, {}],
  } as never
  assert.deepEqual(blueprintProblems(full), [])
})

test('a cut-off Blueprint reply is closed and parsed', () => {
  const bp = parseBlueprintJson('```json\n{"strengths":[{"name":"A"},{"name":"B')
  assert.equal((bp.strengths as unknown[]).length, 2)
})

import { errorTail, deadForMs } from './router'

test('error logging keeps the status, and per-minute limits are skipped only briefly', () => {
  const perMinute = new Error('Error fetching from https://generativelanguage.googleapis.com/v1beta/models/x:streamGenerateContent?alt=sse: [429 Too Many Requests] Quota exceeded for metric ...RequestsPerMinute... Please retry in 12s')
  assert.match(errorTail(perMinute), /^\[429 Too Many Requests\]/)
  assert.equal(deadForMs(perMinute), 60_000)
  const daily = new Error('[429] Quota exceeded ... GenerateRequestsPerDayPerProjectPerModel-FreeTier, limit: 0')
  assert.equal(deadForMs(daily), 15 * 60 * 1000)
})

test('a model that timed out is skipped for five minutes', () => {
  const slow = new Error('[GoogleGenerativeAI Error]: Request aborted when fetching ...: This operation was aborted')
  assert.equal(deadForMs(slow), 5 * 60 * 1000)
})
