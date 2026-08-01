// app/api/refine/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const MODEL = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'
function getGroq() { return new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' }) }

export async function POST(req: NextRequest) {
  try {
    const { section, blueprint, instruction, careerAlpha } = await req.json()
    if (!section || !blueprint || !instruction) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const sectionPrompts: Record<string, string> = {
      profile: `You are a career strategist. The user wants to refine their Profile Map section with this instruction: "${instruction}"

Current profileMap:
${JSON.stringify(blueprint.profileMap, null, 2)}

Career data context:
${careerAlpha ? `Career Alpha score: ${careerAlpha.overallScore}, Stage: ${careerAlpha.careerStage}` : ''}

Return ONLY a JSON object with updated profileMap fields. Only include fields that change. Example:
{"identityStatement": "...", "careerEvolution": "..."}`,

      intelligence: `You are a career strategist. The user wants to refine their Career Intelligence (strengths/interests) with this instruction: "${instruction}"

Current strengths: ${JSON.stringify(blueprint.strengths, null, 2)}
Current interests: ${JSON.stringify(blueprint.interests, null, 2)}

Return ONLY a JSON object. You may update strengths, interests, or both:
{"strengths": [...], "interests": [...]}`,

      paths: `You are a career strategist. The user wants to adjust their Future Paths with this instruction: "${instruction}"

Current futurePaths: ${JSON.stringify(blueprint.futurePaths, null, 2)}
Career Alpha: ${careerAlpha ? JSON.stringify({ synthesis: careerAlpha.synthesis, overallScore: careerAlpha.overallScore }, null, 2) : 'not available'}

Return ONLY a JSON object with the updated futurePaths array:
{"futurePaths": [...]}

Keep the same 3-path structure (safe/growth/bold). Adjust content per the instruction.`,

      'gap-analysis': `You are a career strategist. The user wants to refine their Gap Analysis with this instruction: "${instruction}"

Current gaps: ${JSON.stringify(blueprint.gaps, null, 2)}
Current futurePaths titles: ${blueprint.futurePaths?.map((p: {title: string}) => p.title).join(', ')}

Return ONLY a JSON object with updated gaps:
{"gaps": [...]}

pathway fields must still match a futurePaths title.`,
    }

    const prompt = sectionPrompts[section]
    if (!prompt) {
      return NextResponse.json({ error: `Unknown section: ${section}` }, { status: 400 })
    }

    const response = await getGroq().chat.completions.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: 'system',
          content: 'You are a career strategist. Return ONLY valid JSON — no explanation, no markdown fences, no commentary.',
        },
        { role: 'user', content: prompt },
      ],
    })

    const text = response.choices[0]?.message?.content ?? '{}'
    const clean = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    const refined = JSON.parse(clean)

    return NextResponse.json({ refined })
  } catch (err) {
    console.error('Refine error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
