import type { Blueprint } from '@/types/wingspan'

const lst = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])
const objs = (v: unknown): Record<string, unknown>[] =>
  lst<unknown>(v).filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
/** Each item keeps its fields; the listed keys are forced to arrays. */
const withLists = <T,>(v: unknown, keys: string[]): T[] =>
  objs(v).map((o) => { const c: Record<string, unknown> = { ...o }; for (const k of keys) c[k] = lst(o[k]); return c as T })

/** Fill every list the Blueprint screens iterate, so a partial reply renders instead of crashing. */
export function normalizeBlueprint(raw: unknown): Blueprint {
  const b = (raw && typeof raw === 'object' ? raw : {}) as Partial<Blueprint>
  const pm = (b.profileMap ?? {}) as Partial<Blueprint['profileMap']>
  const a = (b.actions ?? {}) as Partial<Blueprint['actions']>
  return {
    ...b,
    profileMap: {
      ...pm,
      identityStatement: pm.identityStatement ?? '',
      yearsOfExperience: typeof pm.yearsOfExperience === 'number' ? pm.yearsOfExperience : 0,
      industries: lst(pm.industries), platforms: lst(pm.platforms), domains: lst(pm.domains),
      careerEvolution: pm.careerEvolution ?? '',
      metrics: lst(pm.metrics),
    },
    strengths: withLists(b.strengths, ['projects']),
    interests: withLists(b.interests, ['whyItAppears']),
    futurePaths: withLists(b.futurePaths, ['keyTransitionAreas']),
    gaps: withLists<Record<string, unknown>>(b.gaps, ['requiredCapabilities', 'objectives']).map((g) => {
      const size = String(g.gapSize ?? '').toLowerCase()
      // Readiness arrives as 40, "40", "40%" or 0.4; anything unreadable becomes 0 (the UI then shows the gap size instead).
      const num = (v: unknown) => {
        const n = typeof v === 'number' ? v : Number(String(v ?? '').replace('%', '').trim())
        if (!Number.isFinite(n) || n < 0) return 0
        return Math.round(Math.min(100, n > 0 && n <= 1 ? n * 100 : n))
      }
      return {
        ...g,
        pathway: typeof g.pathway === 'string' ? g.pathway : '',
        gapType: typeof g.gapType === 'string' && g.gapType ? g.gapType : 'Capability gap',
        gapSize: size === 'small' || size === 'large' ? size : size.startsWith('l') || size === 'high' ? 'large' : size.startsWith('s') || size === 'low' ? 'small' : 'medium',
        currentReadiness: num(g.currentReadiness),
        futureReadiness: num(g.futureReadiness),
        objectives: (g.objectives as unknown[]).filter((o) => !!o && typeof o === 'object'),
      }
    }) as never,
    actions: { immediate: objs(a.immediate) as never, mediumTerm: objs(a.mediumTerm) as never, longTerm: objs(a.longTerm) as never, resources: objs(a.resources) as never },
    confidenceScores: b.confidenceScores ?? { timeline: 0, projects: 0, strengths: 0, futurePaths: 0 },
    insights: lst(b.insights),
    rationale: b.rationale && typeof b.rationale === 'object' ? b.rationale : {},
    roadmapMilestones: withLists(b.roadmapMilestones, ['actions', 'hardSkills', 'softSkills', 'positioningMoves']),
    careerAlpha: b.careerAlpha && typeof b.careerAlpha === 'object' && b.careerAlpha.dimensions
      ? {
          ...b.careerAlpha,
          dimensions: Object.fromEntries(Object.entries(b.careerAlpha.dimensions).map(([k, d]) =>
            [k, d && typeof d === 'object' ? { ...d, signals: lst((d as { signals?: unknown }).signals) } : d])) as never,
        }
      : b.careerAlpha,
  } as Blueprint
}
