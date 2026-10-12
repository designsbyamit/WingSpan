import { CATALOG } from '@/lib/resources-catalog'
import type { Action, Resource } from '@/types/wingspan'

// Makes the "Where" line of a roadmap action a real link. Order of trust:
//  1. the action's own link (if it is a proper web address),
//  2. a resource we already hold for this person or a catalog item whose title the text actually names,
//  3. a web search for the text, clearly labelled as a search (never presented as the destination itself).

export interface ResolvedLink { url: string; kind: 'direct' | 'resource' | 'catalog' | 'search'; label: string }

const STOP = new Set(['the', 'and', 'for', 'with', 'from', 'your', 'guide', 'guidebook', 'book', 'course', 'chapter', 'part', 'how', 'to', 'of'])
const toks = (s: string) => s.toLowerCase().replace(/['’]s\b/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !/^\d+$/.test(w))
const sig = (s: string) => toks(s).filter((w) => !STOP.has(w))

export const safeUrl = (u: string | undefined | null): string | null => {
  if (!u) return null
  if (/^[a-z][a-z0-9+.-]*:(\/\/|[^0-9])/i.test(u) && !/^https?:/i.test(u)) return null
  try { const x = new URL(/^https?:\/\//i.test(u) ? u : `https://${u}`); return x.protocol === 'http:' || x.protocol === 'https:' ? x.toString() : null } catch { return null }
}

/** Fraction of the candidate title's distinctive words that appear in `text`; needs at least two such words. */
function titleCoverage(title: string, textTokens: Set<string>): number {
  const t = sig(title)
  if (t.length < 2) return 0
  return t.filter((w) => textTokens.has(w)).length / t.length
}

export function searchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`
}

export function resolveActionLink(action: Pick<Action, 'link' | 'linkLabel' | 'whereToStart' | 'howToStart' | 'title'>, resources: Resource[] = []): ResolvedLink | null {
  const direct = safeUrl(action.link)
  if (direct) return { url: direct, kind: 'direct', label: action.linkLabel || 'Open link' }

  const text = [action.whereToStart, action.howToStart].filter(Boolean).join(' ')
  if (!text.trim()) return null
  const tt = new Set(toks(text))
  let best: { url: string; title: string; kind: 'resource' | 'catalog'; s: number } | null = null
  const consider = (title: string, url: string | undefined, kind: 'resource' | 'catalog') => {
    const u = safeUrl(url)
    if (!u) return
    const s = titleCoverage(title, tt)
    if (s >= 0.75 && (!best || s > best.s)) best = { url: u, title, kind, s }
  }
  for (const r of resources) consider(r.title, r.url, 'resource')
  for (const c of CATALOG) consider(c.title, c.url, 'catalog')
  const hit = best as { url: string; title: string; kind: 'resource' | 'catalog' } | null
  if (hit) return { url: hit.url, kind: hit.kind, label: `Open ${hit.title}` }

  const q = (action.whereToStart || action.title).trim()
  return { url: searchUrl(q), kind: 'search', label: 'Search for it' }
}

/** A resource without a usable link still gets a working door: a search for it. */
export function resourceLink(r: Pick<Resource, 'url' | 'title' | 'provider'>): { url: string; isSearch: boolean } {
  const u = safeUrl(r.url)
  return u ? { url: u, isSearch: false } : { url: searchUrl(`${r.title} ${r.provider ?? ''}`), isSearch: true }
}
