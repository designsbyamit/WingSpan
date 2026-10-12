// Fresher-Friendliness Score for a company, 0-100. Built from what the company's own job board shows, plus a small
// prior for the kind of employer. Returns null (unknown) rather than guessing when there is no evidence.

export interface ScoreInput {
  kind: string
  crawledOk: boolean
  designOpen: number          // open design postings
  indiaDesignOpen: number     // of those, in India or remote
  fresherOpen: number         // open design postings a fresher could apply to (India or remote)
  fresherSeen90d: number      // fresher-eligible design postings seen at any time in the last 90 days
}
export interface ScoreResult { score: number | null; confidence: 'evidence' | 'prior-only' | 'unknown'; signals: Record<string, number | string> }

const PRIOR: Record<string, number> = { GCC: 0.6, STARTUP: 0.6, PRODUCT: 0.5, AGENCY: 0.5, ENTERPRISE: 0.4 }

export function fresherScore(i: ScoreInput): ScoreResult {
  const prior = PRIOR[i.kind] ?? 0.45
  const signals = { fresherOpen: i.fresherOpen, fresherSeen90d: i.fresherSeen90d, designOpen: i.designOpen, indiaDesignOpen: i.indiaDesignOpen, prior }
  if (!i.crawledOk) return { score: null, confidence: 'unknown', signals }
  if (i.designOpen === 0 && i.fresherSeen90d === 0) return { score: null, confidence: 'prior-only', signals }
  const s = 0.45 * Math.min(1, i.fresherOpen / 2) + 0.15 * Math.min(1, i.fresherSeen90d / 3) + 0.2 * Math.min(1, i.indiaDesignOpen / 3) + 0.2 * prior
  return { score: Math.round(s * 100), confidence: 'evidence', signals }
}
