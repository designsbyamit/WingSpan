// lib/openai.ts
import OpenAI from 'openai'
import { ExtractedCareerData, Blueprint, ValidatedCareerData } from '@/types/wingspan'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function extractCareerData(
  rawText: string,
  urls: Record<string, string>
): Promise<ExtractedCareerData> {
  const urlContext = Object.entries(urls)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a career data extraction assistant. Extract structured career information from resume text and return valid JSON matching this schema exactly:
{
  "timeline": [{ "id": "string (uuid)", "role": "string", "company": "string", "startDate": "string (YYYY-MM or Year)", "endDate": "string (YYYY-MM, Year, or Present)", "description": "string", "confirmed": false }],
  "projects": [{ "id": "string (uuid)", "name": "string", "company": "string", "year": "string", "industry": "string", "platform": "string", "audience": "string", "summary": "string", "impact": "string" }],
  "skills": ["string"],
  "education": [{ "institution": "string", "degree": "string", "year": "string" }],
  "rawText": "string (first 2000 chars of input)"
}
Extract as much as possible. Generate UUIDs for ids. Be comprehensive.`,
      },
      {
        role: 'user',
        content: `Resume text:\n${rawText}\n\n${urlContext ? `Profile URLs:\n${urlContext}` : ''}`,
      },
    ],
  })

  const json = JSON.parse(response.choices[0].message.content ?? '{}')
  return { ...json, rawText: rawText.slice(0, 2000) }
}

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

export async function* streamBlueprint(
  validatedData: ValidatedCareerData
): AsyncGenerator<{ type: string; [key: string]: unknown }> {
  yield { type: 'step', step: 'timeline', label: 'Reconstructing career timeline…', percentage: STEP_PERCENTAGES.timeline }

  const prompt = buildBlueprintPrompt(validatedData)

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    stream: false,
    messages: [
      {
        role: 'system',
        content: `You are an expert career intelligence analyst. Generate a deeply personal, evidence-based Future Self Blueprint. Return valid JSON matching this schema exactly:
{
  "profileMap": {
    "identityStatement": "string (1-2 sentences, deeply personal professional narrative)",
    "yearsOfExperience": number,
    "industries": ["string"],
    "platforms": ["string"],
    "domains": ["string"],
    "careerEvolution": "string (2-3 sentence arc narrative)"
  },
  "strengths": [{
    "name": "string",
    "confidence": number (0-100),
    "evidence": "string (1 sentence with specific evidence)",
    "projectCount": number,
    "projects": ["string"],
    "rationale": "string (2-3 sentences of deep reasoning)"
  }],
  "interests": [{
    "name": "string",
    "frequency": number (1-10),
    "evidence": "string"
  }],
  "futurePaths": [{
    "title": "string",
    "whyItFits": "string (2-3 sentences, highly specific)",
    "evidence": ["string"],
    "opportunitySize": "emerging|growing|established",
    "confidence": number (0-100)
  }],
  "gaps": [{
    "pathway": "string (must match a futurePaths title)",
    "currentReadiness": number (0-100),
    "futureReadiness": number (0-100),
    "requiredCapabilities": ["string"],
    "gapSize": "small|medium|large",
    "timeline": "string (e.g. '6-12 months')",
    "effort": "string (e.g. 'High — requires active project work')",
    "howToClose": "string (specific, actionable 2-3 sentences)"
  }],
  "actions": {
    "immediate": [{ "title": "string", "description": "string", "measurable": "string (specific outcome)", "pathway": "string", "priority": "high|medium|low", "actionType": "project|link|book|course|community|publish|connect|general", "howToStart": "string (exact first step — open X, click Y, do Z)", "link": "string (real working URL) or null", "linkLabel": "string (CTA label e.g. 'Open Course', 'Join Community') or null", "whereToStart": "string (platform or context) or null", "timeEstimate": "string (e.g. '2 hours', '1 weekend') or null" }],
    "mediumTerm": [{ "title": "string", "description": "string", "measurable": "string", "pathway": "string", "priority": "high|medium|low", "actionType": "project|link|book|course|community|publish|connect|general", "howToStart": "string", "link": "string or null", "linkLabel": "string or null", "whereToStart": "string or null", "timeEstimate": "string or null" }],
    "longTerm": [{ "title": "string", "description": "string", "measurable": "string", "pathway": "string", "priority": "high|medium|low", "actionType": "project|link|book|course|community|publish|connect|general", "howToStart": "string", "link": "string or null", "linkLabel": "string or null", "whereToStart": "string or null", "timeEstimate": "string or null" }],
    "resources": [{ "type": "book|course|community|event|article|framework", "title": "string", "url": "string (real working URL) or null", "pathway": "string", "whereToStart": "string (e.g. which chapter to start from) or null", "firstStep": "string (e.g. how to access or buy) or null" }]
  },
  "confidenceScores": {
    "timeline": number (0-100),
    "projects": number (0-100),
    "strengths": number (0-100),
    "futurePaths": number (0-100)
  },
  "insights": ["string (3-5 surprising, specific observations about patterns)"],
  "rationale": { "key": "value" }
}

Be deeply personal and specific. Reference actual projects and roles from the data. Every insight must have evidence. Make the person feel truly seen.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  yield { type: 'step', step: 'strengths', label: 'Detecting strength patterns…', percentage: STEP_PERCENTAGES.strengths }
  yield { type: 'observation', text: 'Patterns emerging from your career data…' }
  yield { type: 'step', step: 'paths', label: 'Mapping future opportunities…', percentage: STEP_PERCENTAGES.paths }
  yield { type: 'step', step: 'gaps', label: 'Analyzing gaps…', percentage: STEP_PERCENTAGES.gaps }
  yield { type: 'step', step: 'actions', label: 'Generating your Blueprint…', percentage: STEP_PERCENTAGES.actions }

  const blueprint: Blueprint = JSON.parse(stream.choices[0].message.content ?? '{}')

  if (blueprint.insights?.length > 0) {
    yield { type: 'observation', text: blueprint.insights[0] }
  }

  yield { type: 'complete', blueprint, percentage: 100 }
}

function buildBlueprintPrompt(data: ValidatedCareerData): string {
  return `Career Profile:
- Timeline: ${JSON.stringify(data.timeline)}
- Projects: ${JSON.stringify(data.projects)}
- Skills: ${data.skills.join(', ')}
- Education: ${JSON.stringify(data.education)}
- Future Interests: ${data.interests.join(', ')}

Generate a comprehensive, deeply personal Future Self Blueprint for this person. Be specific and reference their actual work. Make every insight feel like it could only have been written for them.`
}
