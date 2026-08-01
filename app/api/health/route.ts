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
  results.GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash (default)'
  results.GOOGLE_ID = process.env.GOOGLE_CLIENT_ID ? 'set' : 'MISSING'

  // Test Gemini connectivity
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash' })
    const result = await model.generateContent('Say "ok" and nothing else.')
    results.gemini_test = result.response.text().trim().slice(0, 20)
  } catch (e) { results.gemini_test = String(e).slice(0, 200) }

  return NextResponse.json(results)
}
