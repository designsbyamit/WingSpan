import { NextResponse } from 'next/server'

export async function GET() {
  const results: Record<string, string> = {}

  try {
    await import('groq-sdk')
    results.groq = 'ok'
  } catch (e) { results.groq = String(e) }

  try {
    await import('pdf-parse')
    results['pdf-parse'] = 'ok'
  } catch (e) { results['pdf-parse'] = String(e) }

  try {
    await import('mammoth')
    results.mammoth = 'ok'
  } catch (e) { results.mammoth = String(e) }

  try {
    await import('xlsx')
    results.xlsx = 'ok'
  } catch (e) { results.xlsx = String(e) }

  results.GROQ_KEY = process.env.GROQ_API_KEY ? 'set' : 'MISSING'
  results.GOOGLE_ID = process.env.GOOGLE_CLIENT_ID ? 'set' : 'MISSING'

  return NextResponse.json(results)
}
