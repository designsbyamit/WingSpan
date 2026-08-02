import { NextResponse } from 'next/server'

export async function GET() {
  const results: Record<string, string> = {}

  try {
    await import('groq-sdk')
    results.groq = 'ok'
  } catch (e) { results.groq = String(e) }

  try {
    await import('mammoth')
    results.mammoth = 'ok'
  } catch (e) { results.mammoth = String(e) }

  results.GROQ_KEY = process.env.GROQ_API_KEY ? 'set' : 'MISSING'
  results.GEMINI_KEY = process.env.GEMINI_API_KEY ? 'set' : 'MISSING'
  results.GEMINI_MODEL = (process.env.GEMINI_MODEL ?? 'gemini-2.0-flash (default)').split('\n')[0].trim()
  results.OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ? 'set' : 'MISSING'
  results.GOOGLE_ID = process.env.GOOGLE_CLIENT_ID ? 'set' : 'MISSING'

  // NOTE: no live API calls here — use /api/health?test=1 for live testing
  const { searchParams } = new URL('https://x.x?' + (process.env.NODE_ENV ?? ''))
  if (process.env.HEALTH_TEST === '1') {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')
      const model = genAI.getGenerativeModel({ model: results.GEMINI_MODEL })
      const r = await model.generateContent('Say ok')
      results.gemini_live = r.response.text().trim().slice(0, 20)
    } catch (e) { results.gemini_live = String(e).slice(0, 150) }
  }

  return NextResponse.json(results)
}
