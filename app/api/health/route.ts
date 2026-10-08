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
  const { geminiModelChain } = await import('@/lib/router')
  results.GEMINI_MODELS = geminiModelChain().join(' → ')
  results.OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ? 'set' : 'MISSING'
  results.GOOGLE_ID = process.env.GOOGLE_CLIENT_ID ? 'set' : 'MISSING'

  // NOTE: no live API calls here — use /api/health?test=1 for live testing
  const { searchParams } = new URL('https://x.x?' + (process.env.NODE_ENV ?? ''))
  if (process.env.HEALTH_TEST === '1') {
    try {
      const { generateWithGemini } = await import('@/lib/router')
      const text = await generateWithGemini([{ text: 'Say ok' }])
      results.gemini_live = text.trim().slice(0, 20)
    } catch (e) { results.gemini_live = String(e).slice(0, 150) }
  }

  return NextResponse.json(results)
}
