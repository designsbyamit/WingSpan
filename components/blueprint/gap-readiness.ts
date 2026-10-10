import type { Gap } from '@/types/wingspan'

export type GapSize = 'small' | 'medium' | 'large'

export type Readiness =
  | { kind: 'scored'; now: number; target: number; points: number }
  | { kind: 'qualitative'; size: GapSize }

/** Accepts 0-100 or a 0-1 fraction; anything else (missing, NaN, negative) becomes null. */
function toPercent(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : v
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return null
  const pct = n > 0 && n <= 1 ? n * 100 : n
  return Math.round(Math.min(100, pct))
}

export function gapSizeOf(gap: Pick<Gap, 'gapSize'>): GapSize {
  return gap.gapSize === 'small' || gap.gapSize === 'large' ? gap.gapSize : 'medium'
}

/**
 * Readiness numbers are only shown when they carry information. When both values are
 * missing or zero, or the target is not above the current level, fall back to the
 * qualitative gap size so the UI never prints "0%" or "0 point gap".
 */
export function readinessOf(gap: Pick<Gap, 'currentReadiness' | 'futureReadiness' | 'gapSize'>): Readiness {
  const now = toPercent(gap.currentReadiness)
  const target = toPercent(gap.futureReadiness)
  if (now === null || target === null || target === 0 || target <= now) {
    return { kind: 'qualitative', size: gapSizeOf(gap) }
  }
  return { kind: 'scored', now, target, points: target - now }
}

export const GAP_SIZE_LABEL: Record<GapSize, string> = {
  small: 'Small gap',
  medium: 'Medium gap',
  large: 'Large gap',
}

/** How much of the bar a qualitative gap fills (more = bigger gap). */
export const GAP_SIZE_LEVEL: Record<GapSize, number> = { small: 1, medium: 2, large: 3 }
