import { careerEvidenceToCareerAlphaInput, CareerEvidence, CareerEvidenceProject, EvidenceSource } from './career-evidence'
import { routeCall } from './router'

const MAX_PAGES = 10
const MAX_SCREENSHOTS = 6
const MAX_TEXT_PER_PAGE = 22000

type PageKind = 'home' | 'about' | 'projects' | 'project' | 'resume' | 'contact' | 'other'

interface ScannedPage {
  url: string
  title: string
  kind: PageKind
  text: string
  links: string[]
  screenshot?: string
}

function classifyPage(url: string, title: string, text: string): PageKind {
  const hay = `${url} ${title} ${text.slice(0, 3000)}`.toLowerCase()
  const path = new URL(url).pathname.toLowerCase()
  if (/resume|cv|curriculum-vitae/.test(path) || /resume|curriculum vitae|download cv/.test(hay)) return 'resume'
  if (/about|profile|bio/.test(path) || /about me|about the designer|profile/.test(hay)) return 'about'
  if (/projects?|work|case-stud/.test(path) || /selected work|case stud|projects/.test(hay)) return path.split('/').filter(Boolean).length > 1 ? 'project' : 'projects'
  if (/contact|connect|say-hello/.test(path)) return 'contact'
  if (path === '/' || path === '') return 'home'
  return 'other'
}

function cleanText(text: string) {
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT_PER_PAGE)
}

async function readSitemap(origin: string): Promise<string[]> {
  const candidates = [new URL('/sitemap.xml', origin).toString(), new URL('/sitemap_index.xml', origin).toString()]
  for (const url of candidates) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'WingSpan Evidence Scanner/1.0' } })
      if (!res.ok) continue
      const xml = await res.text()
      const urls = [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map(m => m[1].trim())
      if (urls.length) return urls.slice(0, 100)
    } catch {}
  }
  return []
}

async function scanWithPlaywright(url: string, targets: string[]): Promise<ScannedPage[]> {
  let chromium: any
  let playwright: any
  try {
    playwright = await import('playwright-core')
    chromium = playwright.chromium
  } catch {
    return []
  }

  const browserWSEndpoint = process.env.PLAYWRIGHT_BROWSER_WS
  const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH
  if (!browserWSEndpoint && !executablePath) return []

  const browser = browserWSEndpoint
    ? await chromium.connectOverCDP(browserWSEndpoint)
    : await chromium.launch({ headless: true, executablePath, args: ['--no-sandbox', '--disable-dev-shm-usage'] })

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1100 },
      deviceScaleFactor: 1,
    })
    const pages: ScannedPage[] = []

    for (const target of targets.slice(0, MAX_PAGES)) {
      const page = await context.newPage()
      try {
        await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 15000 })
        await page.waitForTimeout(1200)
        const title = await page.title()
        const text = cleanText(await page.locator('body').innerText())
        const links = await page.locator('a[href]').evaluateAll((els: HTMLAnchorElement[]) =>
          els.map(a => a.href).filter(Boolean).slice(0, 100)
        )
        const kind = classifyPage(target, title, text)
        let screenshot: string | undefined
        if (pages.filter(p => p.screenshot).length < MAX_SCREENSHOTS) {
          const buffer = await page.screenshot({ type: 'jpeg', quality: 65, fullPage: true })
          screenshot = buffer.toString('base64')
        }
        pages.push({ url: target, title, kind, text, links, screenshot })
      } catch {
        // One page failing should never invalidate the whole scan.
      } finally {
        await page.close()
      }
    }
    await context.close()
    return pages
  } finally {
    await browser.close()
  }
}

function selectTargets(origin: string, sitemapUrls: string[], seedLinks: string[]): string[] {
  const all = [...new Set([origin, ...sitemapUrls, ...seedLinks])]
    .filter(u => {
      try { return new URL(u).origin === new URL(origin).origin && /^https?:$/.test(new URL(u).protocol) }
      catch { return false }
    })
  const score = (u: string) => {
    const p = new URL(u).pathname.toLowerCase()
    if (/resume|cv/.test(p)) return 100
    if (/about|profile|bio/.test(p)) return 90
    if (/projects?|work|case-stud/.test(p)) return 80
    if (/contact/.test(p)) return 50
    return 10
  }
  return all.sort((a, b) => score(b) - score(a)).slice(0, MAX_PAGES)
}

async function normalizeEvidence(
  pages: ScannedPage[],
  sitemapUrls: string[],
  profileUrls: Record<string, string>
): Promise<CareerEvidence> {
  const evidencePages = pages.map((p, i) => ({
    index: i + 1, url: p.url, title: p.title, kind: p.kind,
    text: p.text,
  }))

  const imageParts = pages.filter(p => p.screenshot).map(p => ({
    inlineData: { mimeType: 'image/jpeg', data: p.screenshot! },
  }))

  const prompt = `Normalize this professional footprint into a canonical CareerEvidence object.

Rules:
- Use ONLY evidence found in the supplied page text, screenshots, sitemap, or profile URLs.
- Treat About/Profile pages as likely resume evidence.
- Treat project/case-study pages as primary project evidence.
- Look for role, company, date, responsibility, method, outcome, metric, technology, domain, client, audience, and leadership evidence.
- Deduplicate projects across navigation, listing pages, and case-study pages.
- If a project is visually clear but text is sparse, use screenshot evidence and mark the evidence accordingly.
- Never invent dates, metrics, clients, outcomes, or skills.
- Preserve uncertainty rather than guessing.
- Include source URLs for every project and role where possible.
- evidenceQuality is rich only when there is broad, corroborated evidence.
- Return ONLY valid JSON.

PAGE EVIDENCE:
${JSON.stringify(evidencePages)}

SITEMAP URLS:
${JSON.stringify(sitemapUrls.slice(0, 100))}

PROFILE LINKS:
${JSON.stringify(profileUrls)}

Return this exact shape:
{
  "schemaVersion":"1.0",
  "person":{"name":"","headline":"","location":"","summary":""},
  "timeline":[],
  "projects":[],
  "skills":[],
  "education":[],
  "certifications":[],
  "publications":[],
  "communities":[],
  "domains":[],
  "methods":[],
  "technologies":[],
  "metrics":[],
  "interests":[],
  "geographySignals":[],
  "footprintSignals":[],
  "evidenceQuality":"rich|moderate|sparse",
  "sources":[],
  "pagesScanned":[],
  "extractionNotes":[]
}

Project objects must contain:
{"id":"","name":"","company":"","year":"","industry":"","platform":"","audience":"","summary":"","impact":"","sourceUrls":[],"evidence":[],"visualSignals":[],"methods":[],"responsibilities":[],"outcomes":[],"technologies":[]}
`

  const gemini = process.env.GEMINI_API_KEY
  if (!gemini) {
    throw new Error('GEMINI_API_KEY is required for visual website analysis.')
  }

  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(gemini)
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
    systemInstruction: 'You are a forensic portfolio and resume analyst. Extract evidence conservatively and comprehensively.',
  })
  const result = await model.generateContent([
    { text: prompt },
    ...imageParts.slice(0, MAX_SCREENSHOTS),
  ])
  const raw = result.response.text().replace(/^\`\`\`(?:json)?\n?/m, '').replace(/\n?\`\`\`$/m, '').trim()
  const parsed = JSON.parse(raw) as CareerEvidence

  parsed.schemaVersion = '1.0'
  parsed.sources = Array.isArray(parsed.sources) ? parsed.sources : []
  parsed.pagesScanned = pages.map(p => ({
    url: p.url, title: p.title, type: p.kind,
    textLength: p.text.length, screenshotCaptured: !!p.screenshot,
  }))
  return parsed
}

export async function scanWebsiteToCareerEvidence(
  inputUrl: string,
  profileUrls: Record<string, string> = {}
): Promise<{ evidence: CareerEvidence; careerAlphaInput: ReturnType<typeof careerEvidenceToCareerAlphaInput> }> {
  const originUrl = /^https?:\/\//i.test(inputUrl) ? inputUrl : `https://${inputUrl}`
  const origin = new URL(originUrl).origin
  const sitemapUrls = await readSitemap(origin)

  const seedLinks = Object.values(profileUrls).filter(Boolean)
  const targets = selectTargets(originUrl, sitemapUrls, [originUrl, ...seedLinks])

  // Playwright is deliberately first. If no browser endpoint is configured,
  // the existing server reader can still be used by adding its output as text.
  const rendered = await scanWithPlaywright(originUrl, targets)

  if (rendered.length === 0) {
    throw new Error('The website scanner could not start a browser. Configure PLAYWRIGHT_BROWSER_WS or PLAYWRIGHT_EXECUTABLE_PATH.')
  }

  const evidence = await normalizeEvidence(rendered, sitemapUrls, profileUrls)
  return {
    evidence,
    careerAlphaInput: careerEvidenceToCareerAlphaInput(evidence, []),
  }
}
