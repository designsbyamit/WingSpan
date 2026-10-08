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

    // The step that failed in the field: resume -> CareerEvidence, on a synthetic resume.
    try {
      const { normalizeCareerEvidence } = await import('@/lib/website-scanner')
      const started = Date.now()
      const ev = await normalizeCareerEvidence([], [], {}, [{
        filename: 'resume.pdf',
        text: 'Jane Test — Senior Product Designer. 2019-Present: Acme Corp, Senior Product Designer. Led the redesign of the checkout flow, lifting conversion 12%. 2016-2019: Globex, UX Designer. Built a design system used by 14 teams. Skills: Figma, user research, design systems, prototyping. Education: BDes, NID 2016.',
      }])
      results.normalize_live = `ok in ${Date.now() - started}ms: ${ev.timeline?.length ?? 0} roles, ${ev.projects?.length ?? 0} projects, ${ev.skills?.length ?? 0} skills, quality=${ev.evidenceQuality}`
    } catch (e) { results.normalize_live = 'FAILED: ' + String(e).slice(0, 300) }

    // The JSON-returning analysis calls go through routeCall.
    try {
      const { routeCall } = await import('@/lib/router')
      const out = await routeCall('Return only JSON.', 'Return {"ok":true,"n":3}', 'analysis', 256)
      results.route_live = JSON.stringify(JSON.parse(out.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()))
    } catch (e) { results.route_live = 'FAILED: ' + String(e).slice(0, 300) }
  }

  return NextResponse.json(results)
}
