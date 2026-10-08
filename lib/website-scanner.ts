import { careerEvidenceToCareerAlphaInput, CareerEvidence, CareerEvidenceProject, EvidenceSource } from './career-evidence'

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

  let browser: any
  if (browserWSEndpoint) {
    browser = await chromium.connectOverCDP(browserWSEndpoint)
  } else {
    const serverlessChromium = await import('@sparticuz/chromium')
    browser = await chromium.launch({
      headless: true,
      args: serverlessChromium.default.args,
      executablePath: executablePath || await serverlessChromium.default.executablePath(),
    })
  }

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

  const byKind = (pattern: RegExp) => all.filter(u => pattern.test(new URL(u).pathname.toLowerCase()))
  const selected: string[] = [origin]

  const priorityGroups = [
    /resume|cv/,
    /about|profile|bio/,
    /projects?|work|case-stud/,
    /contact/,
  ]

  for (const pattern of priorityGroups) {
    for (const u of byKind(pattern)) {
      if (!selected.includes(u)) selected.push(u)
      if (selected.length >= MAX_PAGES) return selected
      if (pattern.test('/projects?') && selected.filter(x => pattern.test(new URL(x).pathname.toLowerCase())).length >= 5) break
    }
  }

  for (const u of all) {
    if (!selected.includes(u)) selected.push(u)
    if (selected.length >= MAX_PAGES) break
  }
  return selected
}

export async function normalizeCareerEvidence(
  pages: ScannedPage[],
  sitemapUrls: string[],
  profileUrls: Record<string, string>,
  documentTexts: Array<{ filename: string; text: string }> = []
): Promise<CareerEvidence> {
  const evidencePages = pages.map((p, i) => ({
    index: i + 1, url: p.url, title: p.title, kind: p.kind,
    text: p.text,
  }))

  const uploadedDocuments = documentTexts.map((d, i) => ({
    index: i + 1,
    filename: d.filename,
    // Keep the entire source available to normalization, while preventing one
    // oversized spreadsheet/document from consuming the whole context.
    text: d.text.slice(0, 30000),
  }))

  const imageParts = pages.filter(p => p.screenshot).map(p => ({
    inlineData: { mimeType: 'image/jpeg', data: p.screenshot! },
  }))

  const prompt = `Normalize this professional footprint into a canonical CareerEvidence object.

The input can contain ANY COMBINATION of:
1. Resume/CV documents
2. Portfolio websites and case-study pages
3. Project spreadsheets/Excel/CSV files
4. Supporting project documents
5. Profile links

All sources must be merged into ONE coherent career evidence model before downstream analysis.

Rules:
- Use ONLY evidence found in the supplied documents, page text, screenshots, sitemap, or profile URLs.
- Treat files whose names contain resume/cv/curriculum as resume evidence.
- Treat Excel/CSV files as structured project evidence. Interpret headers and rows as project records, not as generic prose. Map columns such as project, client/company, year/date, industry, platform, role, responsibilities, methods, outcomes, impact, metrics, technologies, and audience wherever present.
- Treat About/Profile pages as resume evidence.
- Treat project/case-study pages as primary project evidence.
- If the same project appears in multiple sources, merge the evidence into one project rather than creating duplicates.
- Prefer more specific/corroborated evidence when sources disagree, but preserve uncertainty instead of guessing.
- Look for role, company, date, responsibility, method, outcome, metric, technology, domain, client, audience, and leadership evidence.
- If a project is visually clear but text is sparse, use screenshot evidence and mark the evidence accordingly.
- Never invent dates, metrics, clients, outcomes, skills, or project details.
- Include source URLs or filenames for every project and role where possible.
- evidenceQuality is rich only when there is broad, corroborated evidence.
- Return ONLY valid JSON.

UPLOADED DOCUMENT EVIDENCE:
${JSON.stringify(uploadedDocuments)}

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
  profileUrls: Record<string, string> = {},
  documentTexts: Array<{ filename: string; text: string }> = []
): Promise<{ evidence: CareerEvidence; careerAlphaInput: ReturnType<typeof careerEvidenceToCareerAlphaInput> }> {
  const originUrl = /^https?:\/\//i.test(inputUrl) ? inputUrl : `https://${inputUrl}`
  const origin = new URL(originUrl).origin
  const sitemapUrls = await readSitemap(origin)
  const seedLinks = Object.values(profileUrls).filter(Boolean)

  const homePages = await scanWithPlaywright(originUrl, [originUrl])
  if (homePages.length === 0) {
    throw new Error('The website scanner could not render the portfolio.')
  }

  const discoveredLinks = homePages.flatMap(p => p.links)
  const targets = selectTargets(originUrl, sitemapUrls, [originUrl, ...seedLinks, ...discoveredLinks])
  const secondaryTargets = targets.filter(u => u !== originUrl)
  const secondaryPages = secondaryTargets.length
    ? await scanWithPlaywright(originUrl, secondaryTargets)
    : []
  const rendered = [...homePages, ...secondaryPages].slice(0, MAX_PAGES)

  const evidence = await normalizeCareerEvidence(rendered, sitemapUrls, profileUrls, documentTexts)
  return {
    evidence,
    careerAlphaInput: careerEvidenceToCareerAlphaInput(evidence, []),
  }
}
