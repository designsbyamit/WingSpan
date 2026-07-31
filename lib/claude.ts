// lib/claude.ts
// All AI calls via Anthropic Claude — replaces lib/openai.ts
import Anthropic from '@anthropic-ai/sdk'
import { ExtractedCareerData, Blueprint, ValidatedCareerData, CareerAlphaIntelligence } from '@/types/wingspan'

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
})

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-latest'

// ── Stage 1: Extract structured career data from raw text ──────────────────

export async function extractCareerData(
  rawText: string,
  urls: Record<string, string>
): Promise<ExtractedCareerData> {
  const urlContext = Object.entries(urls)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const response = await claude.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are a career data extraction assistant. Extract structured career information from the resume text below and return ONLY valid JSON — no explanation, no markdown, no code fences.

Return JSON matching this schema exactly:
{
  "timeline": [{ "id": "uuid-string", "role": "string", "company": "string", "startDate": "YYYY-MM or Year", "endDate": "YYYY-MM, Year, or Present", "description": "string", "confirmed": false }],
  "projects": [{ "id": "uuid-string", "name": "string", "company": "string", "year": "string", "industry": "string", "platform": "string", "audience": "string", "summary": "string", "impact": "string" }],
  "skills": ["string"],
  "education": [{ "institution": "string", "degree": "string", "year": "string" }],
  "rawText": "first 2000 chars of input",
  "careerStageSignals": ["string"],
  "evidenceQuality": "rich|moderate|sparse",
  "geographySignals": ["string"],
  "footprintSignals": ["string"]
}

Rules:
- Generate a unique UUID v4 string for each id field
- Extract every role, project, skill, and education entry you can find
- For projects: infer industry, platform (Web/Mobile/Enterprise SaaS/etc), audience (B2B/B2C/Internal)
- Skills: extract technical skills, design skills, soft skills, and tools separately
- Be comprehensive — extract everything present

Additional extraction tasks:

careerStageSignals: extract all signals indicating career maturity —
years active, role seniority progression, team/org size indicators,
education recency, presence of side projects, community contributions,
certifications, hackathons, publications, conference participation.

evidenceQuality: rate overall evidence richness as one of:
  "rich"     — 10+ years, multiple projects with impact metrics, diverse roles
  "moderate" — 3-9 years, some projects, reasonable progression
  "sparse"   — student, bootcamp, 1-2 internships, limited measurable impact

geographySignals: infer likely market context from company names, education
institutions, location mentions, client names.

footprintSignals: from provided URLs, identify type of digital presence:
portfolio, github, behance, dribbble, personal-site, publications, none.
List each type found.

Resume text:
${rawText}

${urlContext ? `Profile URLs:\n${urlContext}` : ''}`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  // Strip any accidental markdown fences
  const clean = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
  const json = JSON.parse(clean)
  return { ...json, rawText: rawText.slice(0, 2000) }
}

// ── PDF Vision fallback: extract text from image-based PDFs using Claude ───

export async function extractPdfViaClaudeVision(pageImages: string[]): Promise<string> {
  const response = await claude.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          ...pageImages.map(img => ({
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: 'image/jpeg' as const,
              data: img,
            },
          })),
          {
            type: 'text' as const,
            text: 'Extract all text content from these resume pages. Return plain text only, preserving structure (job titles, dates, company names, descriptions). No commentary, no formatting, just the text.',
          },
        ],
      },
    ],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

// ── Stage 2: Stream Blueprint generation ──────────────────────────────────

export const STEP_PERCENTAGES: Record<string, number> = {
  parsing: 10,
  structuring: 20,
  timeline: 35,
  strengths: 50,
  paths: 65,
  gaps: 78,
  actions: 90,
  complete: 100,
}

const BLUEPRINT_SCHEMA = `{
  "profileMap": {
    "identityStatement": "string (1-2 sentences, deeply personal professional narrative)",
    "yearsOfExperience": number,
    "industries": ["string"],
    "platforms": ["string"],
    "domains": ["string"],
    "careerEvolution": "string (2-3 sentence arc narrative)",
    "metrics": [{"label": "string", "value": "number or string", "highlight": true}]
  },
  "strengths": [{
    "name": "string",
    "confidence": number,
    "evidence": "string (1 sentence with specific evidence)",
    "careerAdvantage": "string (how this strength benefits future growth)",
    "projectCount": number,
    "projects": ["string"],
    "rationale": "string (2-3 sentences of deep reasoning)"
  }],
  "interests": [{
    "name": "string",
    "frequency": number,
    "evidence": "string",
    "whyItAppears": ["string"],
    "marketOutlook": "Very High Growth|High Growth|Emerging|Stable",
    "futureRelevance": "string"
  }],
  "futurePaths": [{
    "title": "string",
    "whyItFits": "string (2-3 sentences, highly specific)",
    "evidence": ["string"],
    "opportunitySize": "emerging|growing|established",
    "confidence": number,
    "recommendationStatus": "Recommended|Strongly Recommended|Emerging Opportunity",
    "timeline": "string (e.g. '12-18 Months')",
    "marketDemand": "Very High|High|Moderate|Emerging",
    "growthPotential": "Excellent|Strong|Good|Moderate",
    "keyTransitionAreas": ["string"],
    "betArchetype": "safe|growth|bold",
    "betRationale": "string",
    "careerAlphaScore": 0,
    "marketOpportunityScore": 0,
    "futureResilienceScore": 0,
    "learningInvestment": "low|medium|high|very-high",
    "estimatedTransitionMonths": 0,
    "careerROIScore": 0,
    "whyNotOtherPaths": "string"
  }],
  "gaps": [{
    "pathway": "string (must match a futurePaths title)",
    "gapType": "Skills Gap|Positioning Gap|Leadership Gap|Visibility Gap|Domain Gap",
    "currentReadiness": number,
    "futureReadiness": number,
    "currentState": "string",
    "desiredState": "string",
    "requiredCapabilities": ["string"],
    "gapSize": "small|medium|large",
    "whyItMatters": "string",
    "timeline": "string",
    "effort": "string",
    "howToClose": "string",
    "objectives": [{"id": "string", "text": "string (specific actionable item)", "completed": false}]
  }],
  "actions": {
    "immediate": [{"title":"string","description":"string","measurable":"string","pathway":"string","priority":"high|medium|low","actionType":"project|link|book|course|community|publish|connect|general","howToStart":"string","link":"string or null","linkLabel":"string or null","whereToStart":"string or null","timeEstimate":"string or null"}],
    "mediumTerm": [{"title":"string","description":"string","measurable":"string","pathway":"string","priority":"high|medium|low","actionType":"project|link|book|course|community|publish|connect|general","howToStart":"string","link":"string or null","linkLabel":"string or null","whereToStart":"string or null","timeEstimate":"string or null"}],
    "longTerm": [{"title":"string","description":"string","measurable":"string","pathway":"string","priority":"high|medium|low","actionType":"project|link|book|course|community|publish|connect|general","howToStart":"string","link":"string or null","linkLabel":"string or null","whereToStart":"string or null","timeEstimate":"string or null"}],
    "resources": [{"type":"book|course|community|event|article|framework","title":"string","url":"string or null","pathway":"string","whereToStart":"string or null","firstStep":"string or null"}]
  },
  "confidenceScores": {
    "timeline": number,
    "projects": number,
    "strengths": number,
    "futurePaths": number
  },
  "insights": ["string (3-5 surprising, specific observations)"],
  "rationale": {"key": "value"},
  "positioning": {
    "targetRole": "string",
    "targetCompanies": ["string"],
    "targetIdentity": ["string"],
    "positioningStatement": "string"
  },
  "roadmapMilestones": [
    {
      "phase": "Today|30 Days|90 Days|6 Months|12 Months|18 Months",
      "actions": ["string"],
      "hardSkills": ["string"] or null,
      "softSkills": ["string"] or null,
      "positioningMoves": ["string"] or null
    }
  ]
}`

export async function* streamBlueprint(
  validatedData: ValidatedCareerData,
  careerAlpha: CareerAlphaIntelligence
): AsyncGenerator<{ type: string; [key: string]: unknown }> {

  const caCtx = `Career Alpha Intelligence (pre-computed — do NOT re-derive):
  Stage: ${careerAlpha.careerStage}
  Archetype: ${careerAlpha.archetypeLabel}
  Overall Score: ${careerAlpha.overallScore}
  Synthesis: ${careerAlpha.synthesis}
  Weighting: ${careerAlpha.weightingRationale}
  Market Intelligence: ${careerAlpha.dimensions?.marketIntelligence?.insight ?? 'Not available'}
  Futures Analysis: ${careerAlpha.dimensions?.futuresAnalysis?.insight ?? 'Not available'}
  Human Advantage: ${careerAlpha.dimensions?.humanAdvantageIndex?.insight ?? 'Not available'}
  Career ROI: ${careerAlpha.dimensions?.careerROI?.insight ?? 'Not available'}
  Intrinsic Signal: ${careerAlpha.dimensions?.intrinsicSignal?.insight ?? 'Not available'}`

  const stageInstruction = (() => {
    const s = careerAlpha.careerStage
    if (s === 'student' || s === 'early') return `Lead with potential and exploration. Reference what they have already shown. Acknowledge limited evidence through calibrated language ("early signals suggest", "your projects hint at"). Emphasize high-upside, capability-building moves. Never fabricate confidence from sparse evidence. The Career Alpha extrinsic analysis compensates — let it give the output substance.`
    if (s === 'mid') return `Balance demonstrated strengths with emerging specialisation. Acknowledge crossroads moments. Reference work complexity, not just duration. Identify positioning opportunities opening in the next 12-24 months.`
    return `Lead with strategic positioning, influence, and legacy. Focus on leverage, not skill acquisition. Reference market timing and organisational scale. Recommend strategic moves, not courses. Reference Career Alpha human advantage analysis — what they uniquely bring that compounds at scale.`
  })()

  const careerBetsInstruction = `Generate exactly 3 Future Paths as Career Bets. Always exactly 3.

BET 1 — SAFE BET (betArchetype: "safe")
Highest-confidence path. Builds directly on demonstrated strengths. Near-term market demand confirmed by Career Alpha market intelligence. Lower transition effort. Predictable progression. Downstream actions: consolidation moves, near-term wins, proven resources.

BET 2 — GROWTH BET (betArchetype: "growth")
Meaningful step up in ambition. Achievable within 18-24 months. Market demand is growing per Career Alpha. Career Alpha signals latent capacity. Medium transition effort with clear capability bridges. Downstream actions: skill bridges, medium-horizon milestones, emerging resources.

BET 3 — BOLD BET (betArchetype: "bold")
Highest-upside direction. Career Alpha futures analysis and human advantage suggest this person is well-positioned if they commit. Longest horizon, highest career ROI per Career Alpha modeling. Downstream actions: exploratory moves, long-horizon milestones, frontier resources.

For each bet populate all fields including betRationale, whyNotOtherPaths, careerAlphaScore, marketOpportunityScore, futureResilienceScore, learningInvestment, estimatedTransitionMonths, careerROIScore.`

  const gapInstruction = `NEVER frame gaps as deficits. Always frame as capability unlocks.
NOT: "You lack X" — INSTEAD: "X could unlock your path to Y"
For each gap include: why it matters for the selected Career Bet, recommended acquisition sequence, estimated effort aligned with Career Alpha ROI analysis, specific actionable milestones.`

  const userPrompt = `${caCtx}

Career stage tone: ${stageInstruction}

${careerBetsInstruction}

${gapInstruction}

Career Profile:
- Timeline: ${JSON.stringify(validatedData.timeline)}
- Projects: ${JSON.stringify(validatedData.projects)}
- Skills: ${validatedData.skills.join(', ')}
- Education: ${JSON.stringify(validatedData.education)}
- Future Interests: ${validatedData.interests.join(', ')}

Generate a comprehensive, deeply personal Future Self Blueprint. Reference actual projects, roles, and companies by name. Every insight must cite real evidence. Make the person feel this was written only for them.

Return ONLY valid JSON matching the schema below — no explanation, no markdown fences.

${BLUEPRINT_SCHEMA}`

  // Send initial step immediately so the client knows we've started
  yield { type: 'step', step: 'timeline', label: 'Reconstructing career timeline…', percentage: STEP_PERCENTAGES.timeline }

  // Use Claude streaming so we can flush keepalives and progress events
  // while the model is generating — prevents browser SSE timeout
  const stream = claude.messages.stream({
    model: MODEL,
    max_tokens: 16000,  // Raised from 8192 — full blueprint JSON can exceed 10k tokens
    messages: [{ role: 'user', content: userPrompt }],
  })

  // Accumulate tokens while sending periodic progress pings
  let accumulated = ''
  let lastPingAt = Date.now()
  let stepIndex = 0

  const STEPS_DURING_STREAM = [
    { step: 'strengths', label: 'Detecting strength patterns…',   percentage: STEP_PERCENTAGES.strengths,  minChars: 200  },
    { step: 'paths',     label: 'Mapping future opportunities…',  percentage: STEP_PERCENTAGES.paths,      minChars: 800  },
    { step: 'gaps',      label: 'Analyzing gaps…',                percentage: STEP_PERCENTAGES.gaps,       minChars: 1800 },
    { step: 'actions',   label: 'Generating your Blueprint…',     percentage: STEP_PERCENTAGES.actions,    minChars: 3000 },
  ]

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      accumulated += chunk.delta.text

      // Emit progress steps based on how much JSON has been generated
      while (stepIndex < STEPS_DURING_STREAM.length) {
        const next = STEPS_DURING_STREAM[stepIndex]
        if (accumulated.length >= next.minChars) {
          yield { type: 'step', step: next.step, label: next.label, percentage: next.percentage }
          if (stepIndex === 0) {
            yield { type: 'observation', text: 'Patterns emerging from your career data…' }
          }
          stepIndex++
        } else {
          break
        }
      }

      // Send a keepalive every 10s to prevent SSE timeout
      if (Date.now() - lastPingAt > 10000) {
        yield { type: 'ping', percentage: Math.min(
          STEP_PERCENTAGES.timeline + Math.round((accumulated.length / 12000) * 55),
          89
        )}
        lastPingAt = Date.now()
      }
    }
  }

  // Emit any remaining steps we didn't hit during streaming
  while (stepIndex < STEPS_DURING_STREAM.length) {
    const s = STEPS_DURING_STREAM[stepIndex++]
    yield { type: 'step', step: s.step, label: s.label, percentage: s.percentage }
  }

  let clean = accumulated.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

  // If Claude hit the token limit and truncated mid-JSON, attempt repair:
  // Find the last complete top-level key and close all open brackets/braces
  if (!clean.endsWith('}')) {
    console.warn(`Blueprint JSON appears truncated at ${clean.length} chars — attempting repair`)
    // Count open braces/brackets and close them
    let depth = 0
    let inString = false
    let escaped = false
    for (const ch of clean) {
      if (escaped) { escaped = false; continue }
      if (ch === '\\' && inString) { escaped = true; continue }
      if (ch === '"') { inString = !inString; continue }
      if (inString) continue
      if (ch === '{' || ch === '[') depth++
      if (ch === '}' || ch === ']') depth--
    }
    // Close any open string first
    if (inString) clean += '"'
    // Close open structures from innermost to outermost
    // We need to close with matching chars — use a simple heuristic
    // by tracking the stack
    const stack: string[] = []
    inString = false
    escaped = false
    for (const ch of clean) {
      if (escaped) { escaped = false; continue }
      if (ch === '\\' && inString) { escaped = true; continue }
      if (ch === '"') { inString = !inString; continue }
      if (inString) continue
      if (ch === '{') stack.push('}')
      if (ch === '[') stack.push(']')
      if (ch === '}' || ch === ']') stack.pop()
    }
    // Append closing chars in reverse order
    while (stack.length > 0) clean += stack.pop()
  }

  let blueprint: Blueprint
  try {
    blueprint = JSON.parse(clean)
  } catch (parseErr) {
    console.error('Blueprint JSON parse failed even after repair:', parseErr)
    throw new Error('Blueprint generation was cut short. Please try again with a shorter resume or fewer projects.')
  }

  if (blueprint.insights?.length > 0) {
    yield { type: 'observation', text: blueprint.insights[0] }
  }

  yield { type: 'complete', blueprint, percentage: 100 }
}
