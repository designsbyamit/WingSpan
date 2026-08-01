// lib/career-alpha.ts
// Career Alpha Stage 2 — archetype fingerprinting, freshness probing, and
// five-dimension intelligence generation via Gemini (Groq fallback).
import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'
import { ExtractedCareerData, CareerAlphaIntelligence, CareerStage } from '@/types/wingspan'
import { loadCacheEntry, updateCacheDimensions, CacheEntry, CacheDimensionEntry } from '@/lib/career-alpha-cache'

const GEMINI_MODEL = (process.env.GEMINI_MODEL ?? 'gemini-2.0-flash').split('\n')[0].trim()
const GROQ_MODEL = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'

async function generateContent(systemPrompt: string, userPrompt: string): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY ?? ''
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey)
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL, systemInstruction: systemPrompt })
      const result = await model.generateContent(userPrompt)
      return result.response.text()
    } catch (e) {
      console.warn('Gemini failed, falling back to Groq:', e instanceof Error ? e.message.slice(0, 80) : e)
    }
  }
  // Groq fallback
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' })
  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    max_tokens: 4096,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  })
  return response.choices[0]?.message?.content ?? '{}'
}

// ── Archetype Fingerprint ──────────────────────────────────────────────────

/**
 * Derives a deterministic kebab-case slug that identifies an archetype.
 * Inputs: career stage, primary domain, geography, and top 2 interests.
 * Example output: "early-ux-design-india-ai-design-systems"
 *
 * Pure function — no Claude calls, no I/O.
 */
export function computeArchetypeFingerprint(
  extractedData: ExtractedCareerData,
  interests: string[]
): string {
  // ── Career stage from years of experience ────────────────────────────────
  const currentYear = new Date().getFullYear()
  let totalYears = 0
  for (const entry of extractedData.timeline) {
    const start = parseInt(entry.startDate.slice(0, 4), 10)
    const end = entry.endDate.toLowerCase() === 'present'
      ? currentYear
      : parseInt(entry.endDate.slice(0, 4), 10)
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      totalYears += end - start
    }
  }
  let careerStage: CareerStage
  if (totalYears < 1) careerStage = 'student'
  else if (totalYears < 4) careerStage = 'early'
  else if (totalYears < 9) careerStage = 'mid'
  else if (totalYears < 16) careerStage = 'senior'
  else careerStage = 'leader'

  // ── Domain from skills and interests ─────────────────────────────────────
  const allText = [
    ...extractedData.skills,
    ...interests,
    ...extractedData.projects.map(p => [p.platform ?? '', p.industry ?? ''].join(' ')),
  ].join(' ').toLowerCase()

  let domain = 'design'
  if (allText.includes('product design') || allText.includes('product designer')) {
    domain = 'product-design'
  } else if (allText.includes('ux') || allText.includes('user experience')) {
    domain = 'ux-design'
  } else if (allText.includes('service design')) {
    domain = 'service-design'
  } else if (allText.includes('ui design') || allText.includes('visual design') || allText.includes('interface design')) {
    domain = 'ui-design'
  } else if (allText.includes('design system') || allText.includes('design systems')) {
    domain = 'design-systems'
  } else if (allText.includes('research') || allText.includes('user research')) {
    domain = 'ux-research'
  } else if (allText.includes('content design') || allText.includes('ux writing')) {
    domain = 'content-design'
  } else if (allText.includes('motion') || allText.includes('animation')) {
    domain = 'motion-design'
  }

  // ── Geography from geographySignals ──────────────────────────────────────
  const geography = extractedData.geographySignals?.[0]
    ? extractedData.geographySignals[0]
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    : 'global'

  // ── Top 2 interests sorted alphabetically ────────────────────────────────
  const topInterests = [...interests]
    .map(i => i.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    .sort()
    .slice(0, 2)

  const parts = [careerStage, domain, geography, ...topInterests]
  return parts.filter(Boolean).join('-')
}

// ── Freshness Probe ────────────────────────────────────────────────────────

/**
 * Asks Claude which cached dimensions have gone stale since their cached_at date.
 * Returns the list of stale dimension keys and reasons.
 *
 * Stale criteria: sector layoffs/hiring surges, new AI capabilities, visa/immigration
 * policy changes, geopolitical events, funding shifts, new AI/labour research,
 * or significant economic conditions changes.
 */
export async function runFreshnessProbe(
  dimensions: CacheEntry['dimensions'],
  fingerprint: string,
  currentDate: string
): Promise<{ staleDimensions: string[]; staleReasons: Record<string, string>; allFresh: boolean }> {
  const dimensionSummaries = Object.entries(dimensions)
    .map(([key, dim]) => {
      if (!dim) return null
      return `${key}: cached_at=${dim.cached_at}, insight="${dim.insight.slice(0, 120)}…"`
    })
    .filter(Boolean)
    .join('\n')

  const prompt = `You are a market intelligence freshness checker.

Archetype: "${fingerprint}"
Today: ${currentDate}

Cached dimensions with their cached_at dates:
${dimensionSummaries}

Identify only dimensions where material shifts have occurred since cached_at that would meaningfully change the insight or recommendation.

Material shifts include: sector layoffs or hiring surges, new AI capabilities changing automation risk, visa/immigration policy changes, significant geopolitical events affecting professional mobility, major funding shifts in this domain, new AI/labour research publications, economic conditions changing for this geography or industry.

When uncertain, mark as stale.

Return only JSON:
{
  "staleDimensions": [],
  "staleReasons": {},
  "allFresh": boolean
}`

  const text = await generateContent('You are a market intelligence freshness checker. Return only JSON.', prompt)
  const clean = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
  const result = JSON.parse(clean) as {
    staleDimensions: string[]
    staleReasons: Record<string, string>
    allFresh: boolean
  }
  return result
}

// ── Career Alpha Orchestration ─────────────────────────────────────────────

const CAREER_ALPHA_SYSTEM_PROMPT = `You are Wingspan's Career Alpha engine — a hybrid career strategist, labor market economist, and futures analyst. You reason across five dimensions to produce intelligence that is equally valuable for a student with two projects as for a 15-year design director.

You have deep knowledge of:
- Current design industry hiring trends and role evolution globally
- AI/automation research: WEF Future of Jobs reports, McKinsey automation studies, Oxford probability models, Bain labor research, OECD employment outlook
- Geopolitical and economic factors affecting professional mobility and opportunity
- Skill adjacency networks in design and adjacent disciplines
- Human advantage research — capabilities AI cannot replicate and why
- Career ROI patterns across design specialisations and transitions
- Emerging role categories forming at the intersection of design, AI, and systems

When evidence is sparse, compensate with market depth and futures analysis.
When evidence is rich, let it dominate. Always calibrate language to confidence:
  confidenceScore 75-100: "Your track record strongly indicates..."
  confidenceScore 50-74:  "Clear signals suggest..."
  confidenceScore 25-49:  "Early signals point toward..."
  confidenceScore 0-24:   "This is an exploratory direction — emerging patterns hint..."

Return ONLY valid JSON matching the schema. No explanation, no markdown fences.`

const CAREER_ALPHA_SCHEMA = `{
  "careerStage": "student|early|mid|senior|leader",
  "archetypeLabel": "string",
  "archetypeFingerprint": "kebab-case-slug",
  "overallScore": 0,
  "synthesis": "string",
  "weightingRationale": "string",
  "methodSummary": "string",
  "observations": ["string (3-5 short live insights for the discovery feed, e.g. '12 years of enterprise design detected')"],
  "dimensions": {
    "intrinsicSignal": { "insight": "string", "signals": ["string"], "cached_at": "YYYY-MM-DD", "confidenceScore": 0 },
    "marketIntelligence": { "insight": "string", "signals": ["string"], "cached_at": "YYYY-MM-DD", "confidenceScore": 0 },
    "futuresAnalysis": { "insight": "string", "signals": ["string"], "cached_at": "YYYY-MM-DD", "confidenceScore": 0 },
    "humanAdvantageIndex": { "insight": "string", "signals": ["string"], "cached_at": "YYYY-MM-DD", "confidenceScore": 0 },
    "careerROI": { "insight": "string", "signals": ["string"], "cached_at": "YYYY-MM-DD", "confidenceScore": 0 }
  }
}`

/**
 * Full Career Alpha orchestration:
 * 1. Compute archetype fingerprint (pure, deterministic)
 * 2. Load cache entry for this fingerprint
 * 3. If cached, run freshness probe to identify stale dimensions
 * 4. Build user prompt — inject fresh cached dimensions, mark stale ones for recomputation
 * 5. Call Claude (non-streaming, max_tokens: 4096)
 * 6. Parse JSON response
 * 7. Save/update cache with new extrinsic dimensions (all except intrinsicSignal)
 * 8. Return the full CareerAlphaIntelligence object
 */
export async function computeCareerAlpha(
  extractedData: ExtractedCareerData,
  interests: string[]
): Promise<CareerAlphaIntelligence> {
  const currentDate = new Date().toISOString().split('T')[0]

  // Step 1: Fingerprint
  const fingerprint = computeArchetypeFingerprint(extractedData, interests)

  // Step 2: Load cache
  const cached = loadCacheEntry(fingerprint)

  // Step 3: Freshness probe
  let staleDimensions: string[] = []
  if (cached && Object.keys(cached.dimensions).length > 0) {
    try {
      const probe = await runFreshnessProbe(cached.dimensions, fingerprint, currentDate)
      staleDimensions = probe.allFresh ? [] : probe.staleDimensions
    } catch {
      // Probe failure is non-fatal — treat all as stale
      staleDimensions = Object.keys(cached.dimensions)
    }
  }

  // Step 4: Build user prompt, injecting fresh cached dimensions
  const extrinsicDimensionKeys = [
    'marketIntelligence',
    'futuresAnalysis',
    'humanAdvantageIndex',
    'careerROI',
  ] as const

  type ExtrinsicKey = typeof extrinsicDimensionKeys[number]

  const cachedContext = cached
    ? extrinsicDimensionKeys
        .filter(key => !staleDimensions.includes(key) && cached.dimensions[key])
        .map(key => {
          const dim = cached.dimensions[key] as CacheDimensionEntry
          return `CACHED ${key} (fresh, do not regenerate): ${JSON.stringify(dim)}`
        })
        .join('\n')
    : ''

  const userPrompt = `Career data:
- Timeline: ${JSON.stringify(extractedData.timeline)}
- Projects: ${JSON.stringify(extractedData.projects)}
- Skills: ${extractedData.skills.join(', ')}
- Education: ${JSON.stringify(extractedData.education)}
- Interests: ${interests.join(', ')}
- Evidence quality: ${extractedData.evidenceQuality ?? 'unknown'}
- Geography signals: ${(extractedData.geographySignals ?? []).join(', ') || 'none detected'}
- Footprint signals: ${(extractedData.footprintSignals ?? []).join(', ') || 'none'}
- Archetype fingerprint: ${fingerprint}
- Today's date: ${currentDate}

${cachedContext ? `Pre-computed dimensions (use these values verbatim for the listed keys):\n${cachedContext}\n\n` : ''}Generate Career Alpha intelligence. For any pre-computed dimension above, copy the values exactly into the output JSON. For all other dimensions, generate fresh analysis.

Return ONLY valid JSON matching this schema:
${CAREER_ALPHA_SCHEMA}`

  // Step 5: Call Gemini (with Groq fallback)
  const text = await generateContent(CAREER_ALPHA_SYSTEM_PROMPT, userPrompt)
  const clean = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

  // Step 6: Parse
  const intelligence = JSON.parse(clean) as CareerAlphaIntelligence

  // Ensure fingerprint is consistent with our computed value
  intelligence.archetypeFingerprint = fingerprint

  // Step 7: Update cache with new extrinsic dimensions
  // intrinsicSignal is always user-specific — never cached
  const newDimensions: Partial<CacheEntry['dimensions']> = {}
  for (const key of extrinsicDimensionKeys) {
    const dim = intelligence.dimensions[key as ExtrinsicKey]
    if (dim) {
      newDimensions[key as ExtrinsicKey] = {
        insight: dim.insight,
        signals: dim.signals,
        cached_at: currentDate,
        confidenceScore: dim.confidenceScore,
      }
    }
  }

  updateCacheDimensions(
    fingerprint,
    newDimensions,
    intelligence.archetypeLabel,
    intelligence.careerStage
  )

  // Step 8: Return
  return intelligence
}
