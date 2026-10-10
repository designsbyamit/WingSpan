import { NextResponse, after, type NextRequest } from 'next/server'
import { computeCareerAlpha } from '@/lib/career-alpha'
import { streamBlueprint } from '@/lib/claude'
import { aggregatorAgent, careerAlphaAgent, marketIntelligenceAgent, careerDirectionGenerator } from '@/lib/v02-agents'
import { runAgents, orchestratorAgent, toCareerAlpha, buildDeepAnalysis, betsFrom } from '@/lib/orchestrator'
import { refreshMarketData } from '@/lib/market/ingest'
import { growthAgent, fallbackGrowth } from '@/lib/growth-agent'
import { CATALOG } from '@/lib/resources-catalog'
import { db } from '@/lib/db'
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

const LEADER = {
  timeline: [
    { id: 'l1', role: 'Head of Design', company: 'Enterprise SaaS Co', startDate: '2020', endDate: 'Present', description: 'Lead a 40-person design org across 6 product lines; set design strategy with the CPO; built the design operations function.', confirmed: true },
    { id: 'l2', role: 'Design Director', company: 'Fintech Ltd', startDate: '2015', endDate: '2020', description: 'Managed 4 design managers; shipped the retail banking app redesign; introduced research ops.', confirmed: true },
    { id: 'l3', role: 'Senior Interaction Designer', company: 'Agency X', startDate: '2010', endDate: '2015', description: 'Designed web and mobile products for telecom and retail clients.', confirmed: true },
  ],
  projects: [
    { id: 'lp1', name: 'Design org scale-up', company: 'Enterprise SaaS Co', year: '2022', industry: 'Enterprise software', platform: 'Web', audience: 'Enterprise users', summary: 'Grew the design team from 8 to 40 and introduced a career ladder.', impact: 'Design NPS up 30 points' },
    { id: 'lp2', name: 'Mobile banking redesign', company: 'Fintech Ltd', year: '2018', industry: 'Banking', platform: 'Mobile', audience: 'Retail customers', summary: 'End-to-end redesign of the flagship app.', impact: 'App rating 3.1 to 4.6' },
  ],
  skills: ['Design leadership', 'Design strategy', 'People management', 'Design operations', 'Product strategy', 'Stakeholder management'],
  education: [{ institution: 'NID', degree: 'MDes', year: '2010' }],
  rawText: 'Head of Design with 16 years of experience.',
  evidenceQuality: 'rich',
  geographySignals: ['India'],
  footprintSignals: [],
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
  // ?flow=models lists the text models this key can see and probes each with a tiny request.
  if (req.nextUrl.searchParams.get('flow') === 'models') {
    const key = (process.env.GEMINI_API_KEY ?? '').trim()
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': key } })
    const body = await res.json() as { models?: { name: string; supportedGenerationMethods?: string[] }[]; error?: { message?: string } }
    if (!res.ok) return NextResponse.json({ ok: false, error: body.error?.message?.slice(0, 200) })
    const names = (body.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m) => m.name.replace('models/', ''))
      .filter((n) => /gemini/.test(n) && !/embed|image|tts|audio|live|robotics|computer|vision|imagen|veo|learnlm|gemma/.test(n))
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(key)
    const probes: Record<string, string> = {}
    await Promise.all(names.slice(0, 25).map(async (n) => {
      try {
        const t = Date.now()
        await genAI.getGenerativeModel({ model: n }).generateContent('Say ok')
        probes[n] = `ok ${Date.now() - t}ms`
      } catch (e) {
        const m = String(e instanceof Error ? e.message : e)
        const i = m.search(/\[\d{3} /)
        probes[n] = (i >= 0 ? m.slice(i) : m).replace(/\s+/g, ' ').slice(0, 140)
      }
    }))
    return NextResponse.json({ ok: true, probes })
  }

  // ?flow=market runs the real market-data refresh against the staging database (add &force=1 to ignore cadence, &source=key for one source).
  if (req.nextUrl.searchParams.get('flow') === 'market') {
    try {
      const summary = await refreshMarketData({
        trigger: 'health', force: req.nextUrl.searchParams.get('force') === '1',
        onlySource: req.nextUrl.searchParams.get('source') ?? undefined, budgetMs: 200_000, maxExtractions: 6,
      })
      return NextResponse.json({ ok: true, ...summary })
    } catch (e) {
      return NextResponse.json({ ok: false, error: e instanceof Error ? e.message.slice(0, 300) : 'failed' })
    }
  }
  // ?flow=marketdb summarises what the market database holds.
  if (req.nextUrl.searchParams.get('flow') === 'marketdb') {
    const [sources, docs, obs, runs] = await Promise.all([
      db.marketDataSource.findMany({ select: { key: true, kind: true, reliability: true, lastFetchedAt: true, lastStatus: true, _count: { select: { observations: true, documents: true } } }, orderBy: { key: 'asc' } }),
      db.marketDataDocument.count(), db.marketObservation.count({ where: { supersededAt: null } }),
      db.marketIngestionRun.findMany({ orderBy: { startedAt: 'desc' }, take: 3, select: { trigger: true, status: true, startedAt: true, documentsNew: true, observationsNew: true } }),
    ])
    const sample = await db.marketObservation.findMany({ where: { supersededAt: null }, orderBy: { reliability: 'desc' }, take: 12, select: { metric: true, subject: true, region: true, value: true, unit: true, period: true, statement: true, reliability: true } })
    return NextResponse.json({ ok: true, documents: docs, observations: obs, sources, runs, sample })
  }

  // ?flow=orchestrated runs the real app path: four agents, Orchestrator, then the Blueprint built around the chosen bets.
  if (req.nextUrl.searchParams.get('flow') === 'orchestrated') {
    const leader = req.nextUrl.searchParams.get('profile') === 'leader'
    const profile = leader ? LEADER : SAMPLE
    const ints = leader ? ['Product Strategy', 'Design Leadership', 'People Management', 'AI Product Design', 'Agentic Experience Design'] : interests
    const check = async (): Promise<Record<string, unknown>> => {
      try {
        const run = await timed('agents', () => runAgents(profile, ints))
        const bets = betsFrom(run.careerMap, run.marketGraph)
        const [out, plan] = await timed('orchestrator+growth', () => Promise.all([
          orchestratorAgent(run, profile, ints),
          growthAgent(run, bets, profile, ints).catch((e) => { stages['growth'] = `failed: ${e instanceof Error ? e.message.slice(0, 120) : e}`; return fallbackGrowth(bets) }),
        ]))
        const alpha = toCareerAlpha(out, run, profile, ints)
        const deep = buildDeepAnalysis(run, out, null, { plan, ms: null })
        const bp = await timed('blueprint', async () => {
          for await (const ev of streamBlueprint({ ...profile, interests: ints } as never, alpha, bets, { gaps: plan.gaps, resources: plan.resources })) {
            if (ev.type === 'complete') return ev.blueprint as Record<string, unknown[]>
          }
          throw new Error('stream ended without a complete event')
        })
        const titles = (bp.futurePaths as { title: string }[]).map((p) => p.title)
        const gaps = bp.gaps as { pathway: string; title?: string; currentReadiness: number; futureReadiness: number; gapSize: string }[]
        const resources = ((bp.actions as unknown as { resources?: { pathway: string; title: string; url?: string }[] })?.resources ?? [])
        return ({
          ok: true, stages, agentTimings: run.timings,
          careerStage: alpha.careerStage, archetype: alpha.archetypeLabel, overall: alpha.overallScore,
          bets: bets.map((b) => `${b.archetype}: ${b.direction} (${b.careerScore})`),
          candidates: deep.candidates.map((c) => `${c.direction} [${c.archetype}] ${c.score} d=${c.distance} risk=${c.risk ?? '-'}`),
          validation: run.careerMap.validation,
          marketDirections: deep.market.directions.map((d) => d.name),
          marketEvidence: deep.market.evidence?.length ?? 0,
          pathsMatchBets: bets.every((b, i) => titles[i] === b.direction),
          gapsLinked: gaps.every((g) => titles.includes(g.pathway)),
          gaps: gaps.map((g) => `${g.pathway} | ${g.title ?? '-'} | ${g.currentReadiness}→${g.futureReadiness} ${g.gapSize}`),
          resources: titles.map((t) => `${t}: ${resources.filter((r) => r.pathway === t).map((r) => r.title).join('; ')}`),
          growthNotes: plan.notes,
          sections: { roadmap: bp.roadmapMilestones?.length, immediate: (bp.actions as unknown as { immediate?: unknown[] })?.immediate?.length },
          marketBasis: deep.market.basis, whyThisOrder: out.recommendation?.whyThisOrder,
        })
      } catch (e) {
        return ({ ok: false, stages, error: e instanceof Error ? e.message.slice(0, 300) : 'failed' })
      }
    }
    // The full run can outlast an HTTP proxy's patience: &async=1 runs it after the response and
    // stores the result; read it back with ?flow=last.
    if (req.nextUrl.searchParams.get('async') === '1') {
      after(async () => {
        const result = await check()
        await db.auditEvent.create({ data: { action: 'health.orchestrated', entityType: 'Health', metadata: JSON.parse(JSON.stringify(result)) } }).catch(() => undefined)
      })
      return NextResponse.json({ ok: true, started: true, readWith: '?flow=last' })
    }
    return NextResponse.json(await check())
  }

  if (req.nextUrl.searchParams.get('flow') === 'last') {
    const last = await db.auditEvent.findFirst({ where: { action: 'health.orchestrated' }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json(last ? { at: last.createdAt, ...(last.metadata as object) } : { ok: false, none: true })
  }

  // ?flow=resources checks every link in the curated resource catalog from the server.
  if (req.nextUrl.searchParams.get('flow') === 'resources') {
    const results = await Promise.all(CATALOG.map(async (c) => {
      try {
        const res = await fetch(c.url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(15_000), headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WingSpanLinkCheck/1.0)' } })
        return { id: c.id, status: res.status, finalUrl: res.url !== c.url ? res.url : undefined }
      } catch (e) { return { id: c.id, status: 0, error: e instanceof Error ? e.message.slice(0, 80) : 'failed' } }
    }))
    // 401/403/429 are publishers refusing server-side fetches (bot protection), not dead links.
    const blocked = results.filter((r) => [401, 403, 429].includes(r.status))
    const bad = results.filter((r) => r.status === 0 || (r.status >= 400 && ![401, 403, 429].includes(r.status)))
    return NextResponse.json({ ok: bad.length === 0, total: results.length, bad, blockedForBots: blocked.map((b) => b.id), redirected: results.filter((r) => r.finalUrl) })
  }

  // ?flow=ui runs what the app's screens actually call: Career Alpha, then the Blueprint stream.
  if (req.nextUrl.searchParams.get('flow') === 'ui') {
    const leader = req.nextUrl.searchParams.get('profile') === 'leader'
    const profile = leader ? LEADER : SAMPLE
    const uiInterests = leader ? ['Product Strategy', 'Design Leadership', 'People Management', 'AI Product Design', 'Agent-Agent Collaboration'] : interests
    try {
      const alpha = await timed('careerAlpha', () => computeCareerAlpha(profile, uiInterests))
      const bp = await timed('blueprint', async () => {
        for await (const ev of streamBlueprint({ ...profile, interests: uiInterests } as never, alpha)) {
          if (ev.type === 'complete') return ev.blueprint as Record<string, unknown[]>
        }
        throw new Error('stream ended without a complete event')
      })
      return NextResponse.json({
        ok: true, stages,
        careerStage: alpha.careerStage, archetype: alpha.archetypeLabel,
        paths: (bp.futurePaths as { title?: string; betArchetype?: string }[] | undefined)?.map((p) => `${p.betArchetype}: ${p.title}`),
        gapSizes: (bp.gaps as { gapSize?: string }[] | undefined)?.map((g) => g.gapSize),
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
