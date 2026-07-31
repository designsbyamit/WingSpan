// lib/career-alpha-cache.ts
import fs from 'fs'
import path from 'path'
import { CareerStage } from '@/types/wingspan'

const CACHE_PATH = path.join(process.cwd(), '.wingspan-cache', 'career-alpha.json')

interface CacheDimensionEntry {
  insight: string
  signals: string[]
  cached_at: string
  confidenceScore: number
}

interface CacheEntry {
  fingerprint: string
  archetypeLabel: string
  careerStage: CareerStage
  dimensions: {
    marketIntelligence?: CacheDimensionEntry
    futuresAnalysis?: CacheDimensionEntry
    humanAdvantageIndex?: CacheDimensionEntry
    careerROI?: CacheDimensionEntry
  }
  last_freshness_probe: string
}

type CacheStore = Record<string, CacheEntry>

function readStore(): CacheStore {
  try {
    const raw = fs.readFileSync(CACHE_PATH, 'utf-8')
    return JSON.parse(raw) as CacheStore
  } catch {
    return {}
  }
}

function writeStore(store: CacheStore): void {
  try {
    const dir = path.dirname(CACHE_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(CACHE_PATH, JSON.stringify(store, null, 2), 'utf-8')
  } catch {
    // Cache write failed (e.g. read-only filesystem on serverless) — degrade gracefully
  }
}

export function loadCacheEntry(fingerprint: string): CacheEntry | null {
  const store = readStore()
  return store[fingerprint] ?? null
}

export function saveCacheEntry(entry: CacheEntry): void {
  const store = readStore()
  store[entry.fingerprint] = entry
  writeStore(store)
}

export function updateCacheDimensions(
  fingerprint: string,
  dimensions: Partial<CacheEntry['dimensions']>,
  archetypeLabel: string,
  careerStage: CareerStage
): void {
  const store = readStore()
  const existing = store[fingerprint]
  store[fingerprint] = {
    fingerprint,
    archetypeLabel,
    careerStage,
    dimensions: { ...(existing?.dimensions ?? {}), ...dimensions },
    last_freshness_probe: new Date().toISOString().split('T')[0],
  }
  writeStore(store)
}

export type { CacheEntry, CacheDimensionEntry }
