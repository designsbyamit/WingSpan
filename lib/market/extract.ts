import { z } from 'zod'
import { routeCall } from '@/lib/router'
import { METRICS, isMetric, normalizeRegion, type Metric } from '@/lib/market/vocabulary'

// Turns report text into structured, citable observations. The model may only restate numbers that
// appear in the text; anything without a clear statement is dropped.

export interface RawObservation {
  metric: Metric
  subject: string
  region: string
  value: number | null
  unit: string | null
  period: string | null
  statement: string
  hasSource: boolean
}

const numeric = z.union([z.number(), z.string().trim().regex(/^-?\d+(\.\d+)?$/).transform(Number), z.null()]).optional()
const rowSchema = z.object({
  metric: z.string(),
  subject: z.string().default('all'),
  region: z.string().default('Global'),
  value: numeric,
  unit: z.string().nullish(),
  period: z.string().nullish(),
  statement: z.string().min(8),
  citedSource: z.boolean().optional(),
})
const outSchema = z.object({ observations: z.array(rowSchema) })

const SYSTEM = `You extract job-market and industry facts from a report for a career-intelligence database. Rules:
- Only record facts stated in the text. Never infer, extrapolate or invent a number.
- Each observation is ONE fact about a role, skill, sector, region or the labour market, relevant to professional careers (especially design, product, technology, AI, and white-collar work).
- "statement" is your own short paraphrase (max 200 characters), never a copied sentence.
- "value" is the number as stated (percentages as 18 for 18%; salaries as the number in the stated unit); null if the fact has no number.
- "unit" examples: "%", "INR lakh/yr", "USD/yr", "count", "index", "USD bn".
- "period" is the period the fact applies to ("2026", "2026-H1", "2023-2026"), or null.
- "region" is a country/region name or "Global".
- "citedSource" is true only if the text itself attributes the figure to a named study, survey or dataset.
- Skip marketing claims, forecasts without a stated basis, and anything about a single company's internal affairs.
Return only JSON: {"observations":[{"metric":string,"subject":string,"region":string,"value":number|null,"unit":string|null,"period":string|null,"statement":string,"citedSource":boolean}]}
Allowed metrics: ${METRICS.join(', ')}.`

const clean = (s: string) => s.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

export async function extractObservations(text: string, context: { title?: string; publisher: string; url: string }): Promise<RawObservation[]> {
  const body = text.slice(0, 22_000)
  const user = `Document: ${context.title ?? context.url}\nPublisher: ${context.publisher}\nURL: ${context.url}\n\n--- TEXT ---\n${body}\n--- END ---\n\nExtract up to 25 observations.`
  const run = async (extra = '') => outSchema.parse(JSON.parse(clean(await routeCall(SYSTEM, user + extra, 'analysis', 6000))))
  let parsed: z.infer<typeof outSchema>
  try { parsed = await run() } catch (e) {
    console.warn('Market extraction invalid, retrying once:', e instanceof Error ? e.message.slice(0, 120) : e)
    parsed = await run('\n\nYour previous reply was not valid JSON in the required shape. Return only the JSON object.')
  }
  return parsed.observations.slice(0, 25).map((o) => ({
    metric: isMetric(o.metric) ? o.metric : 'other',
    subject: o.subject.trim().slice(0, 120) || 'all',
    region: normalizeRegion(o.region),
    value: typeof o.value === 'number' && isFinite(o.value) ? o.value : null,
    unit: o.unit?.trim().slice(0, 40) || null,
    period: o.period?.trim().slice(0, 30) || null,
    statement: o.statement.trim().slice(0, 260),
    hasSource: o.citedSource === true,
  }))
}
