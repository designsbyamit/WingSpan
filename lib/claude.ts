// lib/claude.ts
// Groq for fast extraction (Stage 1), Gemini for deep analysis (Blueprint streaming)
import Groq from 'groq-sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { ExtractedCareerData, Blueprint, ValidatedCareerData, CareerAlphaIntelligence } from '@/types/wingspan'

// Groq — fast, used for extraction only
const GROQ_MODEL = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'
function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' }) }

// Gemini — high quality, used for Blueprint analysis
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'
function getGemini() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')
  return genAI.getGenerativeModel({ model: GEMINI_MODEL })
}

// ── Stage 1: Extract structured career data from raw text ──────────────────

export async function extractCareerData(
  rawText: string,
  urls: Record<string, string>
): Promise<ExtractedCareerData> {
  const urlContext = Object.entries(urls)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const response = await getGroq().chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are an expert career data extraction engine. Your job is to extract EVERY piece of career information from a resume — missing a project or role is a critical failure. Be exhaustive and aggressive in your extraction.`,
      },
      {
        role: 'user',
        content: `Extract ALL structured career information from the resume text below. Return ONLY valid JSON — no explanation, no markdown, no code fences.

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

CRITICAL EXTRACTION RULES:

timeline — Every role must be captured:
- Extract EVERY job, role, position, or engagement mentioned anywhere in the resume
- Include freelance, contract, consulting, and part-time work
- For each role, write a detailed description summarising responsibilities

projects — Extract AGGRESSIVELY from all sources:
- Explicitly named projects (e.g. "Project X", "Led the redesign of...")
- Client engagements described in job descriptions (e.g. "Worked with a Middle Eastern airline...")
- Any product, feature, or initiative described with a verb ("designed", "led", "built", "launched", "created", "developed", "redesigned")
- Internal tools, platforms, or systems mentioned
- Measurable outcomes (conversion improvement, user growth, engagement metrics) signal a project
- If a job description mentions multiple distinct clients or outcomes — create one project per client/outcome
- NEVER leave a role with 0 projects if work is described. Extract at minimum 1 project per role.
- For name: use the product/client/initiative name, or construct one from the description (e.g. "Airline Booking App Redesign")
- For impact: extract any metrics, percentages, outcomes mentioned — if none, infer from context

skills — Be comprehensive:
- Design tools (Figma, Sketch, Adobe XD, InVision, etc.)
- Methods (UX Research, Design Thinking, Service Design, etc.)
- Technical skills (HTML/CSS, Prototyping, etc.)
- Soft skills (Leadership, Stakeholder Management, etc.)
- Domain knowledge (E-commerce, Enterprise, Healthcare, etc.)

evidenceQuality:
  "rich"     — 10+ years, multiple projects with impact metrics, diverse roles
  "moderate" — 3-9 years, some projects, reasonable progression
  "sparse"   — student, bootcamp, 1-2 internships, limited measurable impact

careerStageSignals: years active, role seniority, team size, education, publications, certifications
geographySignals: infer market context from company names, institutions, client names
footprintSignals: from provided URLs — portfolio, github, behance, dribbble, personal-site, none

Resume text:
${rawText}

${urlContext ? `Profile URLs:\n${urlContext}` : ''}`,
      },
    ],
  })

  const text = response.choices[0]?.message?.content ?? '{}'
  let clean = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

  // Repair truncated JSON (same pattern as streamBlueprint)
  if (!clean.endsWith('}')) {
    const stack: string[] = []
    let inString = false, escaped = false
    for (const ch of clean) {
      if (escaped) { escaped = false; continue }
      if (ch === '\\' && inString) { escaped = true; continue }
      if (ch === '"') { inString = !inString; continue }
      if (inString) continue
      if (ch === '{' || ch === '[') stack.push(ch === '{' ? '}' : ']')
      if (ch === '}' || ch === ']') stack.pop()
    }
    if (inString) clean += '"'
    while (stack.length > 0) clean += stack.pop()
  }

  let json: Record<string, unknown> = {}
  try {
    json = JSON.parse(clean)
  } catch {
    console.error('extractCareerData: JSON parse failed, returning partial data')
  }
  return { ...json, rawText: rawText.slice(0, 4000) } as ExtractedCareerData
}

// ── PDF Vision fallback: extract text from image-based PDFs using Claude ───

export async function extractPdfViaClaudeVision(pageImages: string[]): Promise<string> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const parts = [
    ...pageImages.map(img => ({
      inlineData: { mimeType: 'image/jpeg' as const, data: img },
    })),
    { text: 'Extract all text content from these resume pages. Return plain text only, preserving structure (job titles, dates, company names, descriptions). No commentary, no formatting, just the text.' },
  ]

  const result = await model.generateContent(parts)
  return result.response.text()
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
    "confidence": "number 0-100 (not 0-1)",
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
    "confidence": "number 0-1 (this IS a 0-1 field — do not change)",
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
    "currentReadiness": "number 0-100 (not 0-1)",
    "futureReadiness": "number 0-100 (not 0-1)",
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
    "timeline": "number 0-100 (not 0-1)",
    "projects": "number 0-100 (not 0-1)",
    "strengths": "number 0-100 (not 0-1)",
    "futurePaths": "number 0-100 (not 0-1)"
  },
  "insights": ["string — exactly 3-5 observations, each citing specific named evidence from this person's career (company, project, role, or timeframe). BAD: 'You have strong cross-functional experience.' GOOD: 'Your N-year tenure at Company during their [context] phase signals [specific pattern] — rare at [level] and a predictor of success in [path].'"],
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

  const evidenceInstruction = validatedData.evidenceQuality === 'sparse'
    ? `Evidence quality: SPARSE. Use hedged language throughout ("early signals suggest", "your trajectory hints at"). Keep all confidenceScores in the 45–65 range. Do not invent specific projects or outcomes not present in the data.`
    : validatedData.evidenceQuality === 'rich'
    ? `Evidence quality: RICH. For every claim in identityStatement, careerEvolution, strengths, and insights, name at least one specific project, role, company, or metric from the career data below. ConfidenceScores may reach 75–90 where the data supports it.`
    : `Evidence quality: MODERATE. Balance grounded claims with calibrated confidence. ConfidenceScores should fall in the 60–80 range.`

  const negativeExamples = `
Negative examples — these patterns are failures, do not produce them:

identityStatement
  BAD: "A strategic designer with 8 years of enterprise experience."
  GOOD: "The designer who led [specific Company]'s [specific Project] from [startDate] to [outcome], now moving toward [specific direction based on their interests]."

careerEvolution
  BAD: "Has grown from individual contributor to senior designer, developing expertise across multiple industries."
  GOOD: "Started as [role] at [Company1], shifted focus to [specific domain] after [specific event or project], then spent [N] years at [Company2] solving [specific problem] — an arc that reveals [specific pattern unique to this person]."

positioningStatement
  BAD: "An experienced UX designer ready for leadership roles."
  GOOD: "The go-to [specific role] for [specific context] — uniquely equipped after [specific project at specific company] to [specific capability] in a way that most [peers] cannot."

insights
  BAD: "You have strong cross-functional experience."
  GOOD: "Your [N]-year tenure at [Company] during their [specific context] phase signals unusually high tolerance for ambiguity — rare at the [level] level and a direct predictor of success in [specific future path]."
`

  const userPrompt = `${caCtx}
Career stage tone: ${stageInstruction}
${evidenceInstruction}

${careerBetsInstruction}

${gapInstruction}

Career Profile:
- Timeline: ${JSON.stringify(validatedData.timeline)}
- Projects: ${JSON.stringify(validatedData.projects)}
- Skills: ${validatedData.skills.join(', ')}
- Education: ${JSON.stringify(validatedData.education)}
- Future Interests: ${validatedData.interests.join(', ')}
${negativeExamples}
Generate a comprehensive, deeply personal Future Self Blueprint. Reference actual projects, roles, and companies by name. Every insight must cite real evidence. Make the person feel this was written only for them.

Return ONLY valid JSON matching the schema below — no explanation, no markdown fences.

${BLUEPRINT_SCHEMA}`

  // Send initial step immediately so the client knows we've started
  yield { type: 'step', step: 'timeline', label: 'Reconstructing career timeline…', percentage: STEP_PERCENTAGES.timeline }

  const systemInstruction = `You are a senior career strategist and labor market economist with 20 years of experience helping professionals navigate career inflection points — from early-career designers to C-suite executives.

Your analysis is grounded in specific evidence, not platitudes. Every sentence you write about a person must reference a specific role, project, company, skill, or timeframe from their actual career data. Generic statements that could apply to any professional in the same domain are a failure of your craft.

Confidence calibration rules:
- Score 75–90: confirmed signal — multiple named pieces of evidence, named projects and roles, sustained pattern
- Score 60–75: strong signal — clear evidence but fewer sources or shorter timeframe
- Score 45–60: emerging signal — single data point or inferred from adjacent evidence
- Score 30–45: speculative — extrapolated from weak signals; always use hedged language ("early indicators suggest", "if this pattern holds")

Never assign confidenceScores above 65 for a sparse profile (evidenceQuality: "sparse").
Never use the words "passion", "passionate", "strong communicator", "team player", or "results-driven".
Never write sentences that would be equally true of any designer at the same career stage.

Your output is the first thing this person will read about their own career potential. Make it feel like it was written specifically for them — because it must be.`

  // Use Gemini for high-quality blueprint analysis with streaming
  const geminiModel = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '').getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction,
  })

  const geminiStream = await geminiModel.generateContentStream(userPrompt)

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

  for await (const chunk of geminiStream.stream) {
    const text = chunk.text()
    if (text) {
      accumulated += text

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
