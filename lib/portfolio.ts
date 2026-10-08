import dns from 'node:dns/promises'
import net from 'node:net'
import { routeCall } from '@/lib/router'

const MAX_PAGES = 4
const MAX_PAGE_CHARS = 18000
const MAX_TOTAL_CHARS = 90000
const FETCH_TIMEOUT_MS = 6000

export interface PortfolioPage {
  url: string
  title: string
  text: string
  links: string[]
}

export interface PortfolioInspection {
  valid: boolean
  reason: 'valid' | 'unreachable' | 'not_portfolio' | 'not_personal' | 'insufficient_content'
  message: string
  canonicalUrl: string
  pages: PortfolioPage[]
  confidence: number
  signals: string[]
}

function stripHtml(html: string): { title: string; text: string; links: string[] } {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()

  const links: string[] = []
  const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = linkRe.exec(html)) && links.length < 100) {
    links.push(match[1])
  }

  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()

  return { title, text: cleaned.slice(0, MAX_PAGE_CHARS), links }
}

function isPrivateIp(ip: string) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number)
    return a === 10 || a === 127 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
      a === 0
  }
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase()
    return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') ||
      normalized.startsWith('fe80:')
  }
  return true
}

async function assertSafeUrl(input: string): Promise<URL> {
  const url = new URL(input)
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP(S) portfolio links are supported.')
  if (url.username || url.password) throw new Error('Portfolio links with credentials are not supported.')
  const host = url.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.local') || net.isIP(host) && isPrivateIp(host)) {
    throw new Error('This link cannot be accessed safely.')
  }
  const addresses = await dns.lookup(host, { all: true })
  if (!addresses.length || addresses.some(a => isPrivateIp(a.address))) {
    throw new Error('This link cannot be accessed safely.')
  }
  url.hash = ''
  return url
}

async function fetchPage(input: string): Promise<{ finalUrl: string; html: string }> {
  let current = await assertSafeUrl(input)
  for (let i = 0; i < 4; i++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
      const res = await fetch(current, {
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': 'WingSpan Portfolio Reader/1.0' },
      })
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location')
        if (!location) throw new Error('Portfolio redirected without a destination.')
        current = await assertSafeUrl(new URL(location, current).toString())
        continue
      }
      if (!res.ok) throw new Error(`Portfolio returned HTTP ${res.status}.`)
      const type = res.headers.get('content-type') ?? ''
      if (!type.includes('text/html') && !type.includes('application/xhtml+xml')) {
        throw new Error('This link does not point to a readable web page.')
      }
      const html = await res.text()

      // Many modern portfolios are client-rendered. In that case the HTML shell
      // contains almost no useful career content even though a browser shows a
      // complete portfolio. Fall back to Jina's public reader for the same URL.
      const quickText = stripHtml(html).text
      if (quickText.length < 250) {
        try {
          const readerUrl = `https://r.jina.ai/${current.toString()}`
          const readerController = new AbortController()
          const readerTimeout = setTimeout(() => readerController.abort(), 12000)
          try {
            const readerRes = await fetch(readerUrl, {
              signal: readerController.signal,
              headers: { 'User-Agent': 'WingSpan Portfolio Reader/1.0' },
            })
            if (readerRes.ok) {
              const markdown = await readerRes.text()
              if (markdown.trim().length > quickText.length) {
                return { finalUrl: current.toString(), html: `<html><head><title>Portfolio</title></head><body>${markdown}</body></html>` }
              }
            }
          } finally {
            clearTimeout(readerTimeout)
          }
        } catch {
          // Keep the direct HTML result if the reader fallback is unavailable.
        }
      }

      return { finalUrl: current.toString(), html }
    } finally {
      clearTimeout(timeout)
    }
  }
  throw new Error('Too many redirects.')
}

function scorePortfolioSignals(pages: PortfolioPage[]) {
  const corpus = pages.map(p => `${p.title} ${p.text} ${p.url}`.toLowerCase()).join(' ')
  const pathCorpus = pages.map(p => new URL(p.url).pathname.toLowerCase()).join(' ')
  const positive = [
    /portfolio/, /case stud/, /selected work/, /my work/, /projects?/, /about me/, /about/, /contact/,
    /experience/, /designer/, /design lead/, /ux/, /product design/, /interaction design/
  ]
  const negative = [
    /privacy policy/, /terms of service/, /login/, /sign in/, /pricing/, /documentation/, /blog only/
  ]
  const positives = positive.filter(r => r.test(corpus) || r.test(pathCorpus)).length
  const negatives = negative.filter(r => r.test(corpus) || r.test(pathCorpus)).length
  const hasProjectLikePage = pages.some(p => /(^|\/)(projects?|work|case-stud(?:y|ies)|selected-work)(\/|$)/i.test(new URL(p.url).pathname))
  const hasAboutLikePage = pages.some(p => /(^|\/)(about|about-me|profile)(\/|$)/i.test(new URL(p.url).pathname))
  const hasContactLikePage = pages.some(p => /(^|\/)(contact|connect|say-hello)(\/|$)/i.test(new URL(p.url).pathname))
  return {
    positives, negatives, hasProjectLikePage, hasAboutLikePage, hasContactLikePage,
    score: Math.max(0, Math.min(100, 25 + positives * 8 + (hasProjectLikePage ? 12 : 0) +
      (hasAboutLikePage ? 8 : 0) + (hasContactLikePage ? 5 : 0) - negatives * 12))
  }
}

export async function inspectPortfolioUrl(input: string, companionUrls: Record<string, string> = {}): Promise<PortfolioInspection> {
  let first: URL
  try {
    first = await assertSafeUrl(/^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`)
  } catch {
    return {
      valid: false, reason: 'unreachable', message: 'That link could not be safely reached. Please upload your portfolio instead.',
      canonicalUrl: input, pages: [], confidence: 0, signals: []
    }
  }

  const pages: PortfolioPage[] = []
  const visited = new Set<string>()
  const queue = [first.toString()]

  while (queue.length && pages.length < MAX_PAGES) {
    const current = queue.shift()!
    if (visited.has(current)) continue
    visited.add(current)
    try {
      const fetched = await fetchPage(current)
      const parsed = stripHtml(fetched.html)
      const page: PortfolioPage = { url: fetched.finalUrl, title: parsed.title, text: parsed.text, links: parsed.links }
      pages.push(page)

      const base = new URL(fetched.finalUrl)
      const candidates = parsed.links
        .map(href => { try { return new URL(href, base).toString() } catch { return null } })
        .filter((u): u is string => !!u)
        .filter(u => {
          const parsedUrl = new URL(u)
          return parsedUrl.origin === base.origin && ['http:', 'https:'].includes(parsedUrl.protocol)
        })
        .filter(u => !visited.has(u))
        .sort((a, b) => {
          const rank = (u: string) => /\/(projects?|work|case-stud|about|contact|experience|resume|cv)(\/|$)/i.test(new URL(u).pathname) ? 0 : 1
          return rank(a) - rank(b)
        })
      queue.push(...candidates.slice(0, 12))
    } catch {
      // A single broken child page should not invalidate an otherwise usable portfolio.
    }
  }

  const signal = scorePortfolioSignals(pages)
  const totalChars = pages.reduce((sum, p) => sum + p.text.length, 0)

  if (pages.length === 0) {
    return { valid: false, reason: 'unreachable', message: 'We could not read that website. Please upload your portfolio instead.', canonicalUrl: first.toString(), pages, confidence: 0, signals: [] }
  }
  // This endpoint is a gate only for obvious unreachable/unsafe URLs. Do not make
  // users prove that a site is a portfolio before we analyse it. Modern portfolios
  // are often JS-rendered and can look sparse to a server-side HTML reader.
  // Deeper portfolio classification belongs to the extraction pipeline.
  const acceptedConfidence = Math.max(signal.score, totalChars >= 500 ? 60 : 50)

  return {
    valid: true, reason: 'valid',
    message: 'Portfolio link accepted. We will analyse the work we can read from it.',
    canonicalUrl: pages[0].url, pages, confidence: acceptedConfidence,
    signals: []
  }

}

export function portfolioToText(inspection: PortfolioInspection) {
  return inspection.pages
    .map((p, i) => `[PORTFOLIO PAGE ${i + 1}]\nURL: ${p.url}\nTITLE: ${p.title}\nCONTENT:\n${p.text}`)
    .join('\n\n---\n\n')
    .slice(0, MAX_TOTAL_CHARS)
}
