import { NextResponse, type NextRequest } from 'next/server'
import { computeCareerAlpha } from '@/lib/career-alpha'
import { streamBlueprint } from '@/lib/claude'
import { aggregatorAgent, careerAlphaAgent, marketIntelligenceAgent, careerDirectionGenerator } from '@/lib/v02-agents'
import type { ExtractedCareerData } from '@/types/wingspan'

// Staging diagnostics: runs the four analysis agents on a synthetic profile and reports
// per-stage success and timing. Disabled unless HEALTH_TEST=1 (never set in production).
export const maxDuration = 300

const SAMPLE = {
  timeline: [
    { id: 'r1', role: 'Senior Product Designer', company: 'Acme Corp', startDate: '2019', endDate: 'Present', description: 'Led checkout redesign and the mobile app design system across 14 teams.', confirmed: true },
    { id: 'r2', role: 'UX Designer', company: 'Globex', startDate: '2016', endDate: '2019', description: 'Designed B2B dashboards and ran user research for logistics customers.', confirmed: true },
  ],
  projects: [
    { id: 'p1', name: 'Checkout Redesign', company: 'Acme Corp', year: '2022', industry: 'E-commerce', platform: 'Web', audience: 'Consumers', summary: 'Simplified a five-step checkout into two steps.', impact: 'Conversion up 12%' },
    { id: 'p2', name: 'Design System', company: 'Globex', year: '2018', industry: 'Logistics', platform: 'Web', audience: 'Internal teams', summary: 'Built a shared component library.', impact: 'Adopted by 14 teams' },
  ],
  skills: ['Figma', 'User research', 'Design systems', 'Prototyping', 'Stakeholder management'],
  education: [{ institution: 'NID', degree: 'BDes', year: '2016' }],
  rawText: 'Jane Test, Senior Product Designer.',
  careerStageSignals: ['9 years experience'],
  evidenceQuality: 'moderate',
  geographySignals: ['India'],
  footprintSignals: ['portfolio'],
} as unknown as ExtractedCareerData

export async function GET(req: NextRequest) {
  if (process.env.HEALTH_TEST !== '1') return NextResponse.json({ error: 'disabled' }, { status: 404 })
  const interests = ['AI-native products', 'Design systems', 'Design leadership']
  const stages: Record<string, string> = {}
  const timed = async <T,>(name: string, run: () => Promise<T>): Promise<T> => {
    const t = Date.now()
    try {
      const out = await run()
      stages[name] = `ok ${Math.round((Date.now() - t) / 1000)}s`
      return out
    } catch (e) {
      stages[name] = `FAILED ${Math.round((Date.now() - t) / 1000)}s: ${String(e).slice(0, 400)}`
      throw e
    }
  }
  // ?flow=ui runs what the app's screens actually call: Career Alpha, then the Blueprint stream.
  if (req.nextUrl.searchParams.get('flow') === 'ui') {
    try {
      const alpha = await timed('careerAlpha', () => computeCareerAlpha(SAMPLE, interests))
      const bp = await timed('blueprint', async () => {
        for await (const ev of streamBlueprint({ ...SAMPLE, interests } as never, alpha)) {
          if (ev.type === 'complete') return ev.blueprint as Record<string, unknown[]>
        }
        throw new Error('stream ended without a complete event')
      })
      return NextResponse.json({
        ok: true, stages,
        sections: {
          strengths: bp.strengths?.length, futurePaths: bp.futurePaths?.length, gaps: bp.gaps?.length,
          immediate: (bp.actions as unknown as { immediate?: unknown[] })?.immediate?.length,
          roadmap: bp.roadmapMilestones?.length, insights: bp.insights?.length,
        },
      })
    } catch {
      return NextResponse.json({ ok: false, stages })
    }
  }

  try {
    const graph = await timed('aggregator', () => aggregatorAgent(SAMPLE, interests))
    const dna = await timed('careerAlpha', () => careerAlphaAgent(graph, SAMPLE, interests))
    const market = await timed('market', () => marketIntelligenceAgent(['India']))
    const map = await timed('directions', () => careerDirectionGenerator(dna, market))
    return NextResponse.json({ ok: true, stages, candidates: map.candidates?.length ?? null })
  } catch {
    return NextResponse.json({ ok: false, stages })
  }
}
