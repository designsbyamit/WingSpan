import fs from 'fs'
import path from 'path'

export interface ParsedConcept {
  name: string
  body: string  // paragraph content under the heading
}

export interface ParsedModule {
  title: string
  story: string
  scenario: string
  concepts: ParsedConcept[]
  estimatedMins: number
  difficulty: number      // 1–5 (mirrors sourceLevel)
  sourceLevel: number     // 1–5
  sourceModule: number    // 1–N
  slug: string            // e.g. "l1-m01-what-is-design"
}

/**
 * Derives (sourceLevel, sourceModule, slug) from filename.
 * Accepts filenames like: L1-M01-what-is-design.md
 */
function parseLevelModule(filePath: string): { level: number; module: number; slug: string } {
  const base = path.basename(filePath, '.md')
  const match = base.match(/^L(\d+)-M(\d+)-(.+)$/)
  if (!match) throw new Error(`Cannot parse level/module from filename: ${path.basename(filePath)}`)
  return {
    level: parseInt(match[1], 10),
    module: parseInt(match[2], 10),
    slug: base.toLowerCase(),
  }
}

/**
 * Extracts the first non-empty paragraph from a block of text.
 * A paragraph is a run of non-blank lines that don't start with # or ---.
 */
function firstParagraph(text: string): string {
  const lines = text.split('\n')
  const paragraphLines: string[] = []
  let inParagraph = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!inParagraph) {
      if (trimmed.length > 0 && !trimmed.startsWith('#') && !trimmed.startsWith('---')) {
        inParagraph = true
        paragraphLines.push(trimmed)
      }
    } else {
      if (trimmed.length === 0) break
      paragraphLines.push(trimmed)
    }
  }

  return paragraphLines.join(' ')
}

/**
 * Extracts the content of a named ## section.
 * Returns everything from the section heading until the next ## heading or EOF.
 */
function extractSection(lines: string[], sectionName: string): string {
  const headerPattern = new RegExp(`^##\\s+${sectionName}`, 'i')
  let inSection = false
  const sectionLines: string[] = []

  for (const line of lines) {
    if (headerPattern.test(line)) {
      inSection = true
      continue
    }
    if (inSection) {
      if (/^##\s/.test(line)) break
      sectionLines.push(line)
    }
  }

  return sectionLines.join('\n').trim()
}

/**
 * Extracts concepts from section headings with their paragraph bodies.
 * Strategy: prefer ### headings (sub-concepts within a section).
 * If no ### headings found, fall back to ## headings (modules where topics ARE the ## headings).
 * Skips clearly structural/meta sections.
 */
function extractConcepts(lines: string[]): ParsedConcept[] {
  const skipH2 = new Set([
    'assignment', 'key takeaways', 'closing reflection', 'recommended books',
    'topics', 'purpose', 'looking ahead', 'overview',
  ])
  // ## headings that are narrative hooks, not concept names
  const narrativePattern = /^(the |why |how |what |when |where |who |a |an )/i
  const structural = /^Level \d|^Module \d|^Foundation|^Craft|^Professional|^Strategy|^Mastery/i
  const bookPattern = /by [A-Z]|\*[^*]+\*\s+by|—\s+[A-Z]/  // book title lines

  // First pass: check if this module uses ### for concepts
  const hasH3Concepts = lines.some(l => {
    const m = l.match(/^###\s+(.+)$/)
    if (!m) return false
    const h = m[1].trim().toLowerCase()
    return !skipH2.has(h) && !structural.test(m[1]) && !bookPattern.test(l)
  })

  const concepts: ParsedConcept[] = []
  const seen = new Set<string>()

  let currentHeading: string | null = null
  let bodyLines: string[] = []
  let inConceptSection = false
  let inSkipSection = false  // true when inside Recommended Books or similar

  const flush = () => {
    if (!currentHeading) return
    const clean = currentHeading.replace(/[*_`]/g, '').trim()
    if (clean.length > 3 && clean.length < 100 && !seen.has(clean.toLowerCase())) {
      seen.add(clean.toLowerCase())
      const bodyText = bodyLines.join('\n').trim()
      const firstPara = bodyText.split(/\n\n/)[0]?.replace(/\n/g, ' ').trim() ?? ''
      concepts.push({ name: clean, body: firstPara })
    }
    currentHeading = null
    bodyLines = []
  }

  for (const line of lines) {
    if (hasH3Concepts) {
      // Mode: use ### headings as concepts
      const h3 = line.match(/^###\s+(.+)$/)
      if (h3) {
        flush()
        const h = h3[1].trim()
        if (!skipH2.has(h.toLowerCase()) && !structural.test(h) && !bookPattern.test(line)) {
          currentHeading = h
          inConceptSection = true
        } else {
          inConceptSection = false
        }
        continue
      }
      const h2 = line.match(/^##\s+(.+)$/)
      if (h2) {
        flush()
        const hLower = h2[1].trim().toLowerCase()
        inSkipSection = skipH2.has(hLower)
        inConceptSection = false
        continue
      }
    } else {
      // Mode: use ## headings as concepts (skip narrative/structural ones)
      const h2 = line.match(/^##\s+(.+)$/)
      if (h2) {
        flush()
        const h = h2[1].trim()
        const hLower = h.toLowerCase()
        inSkipSection = skipH2.has(hLower)
        if (
          !inSkipSection &&
          !structural.test(h) &&
          !narrativePattern.test(h) &&
          !bookPattern.test(line) &&
          !h.includes('—') &&
          !/^assignment/i.test(h) &&
          h.split(' ').length <= 6
        ) {
          currentHeading = h
          inConceptSection = true
        } else {
          inConceptSection = false
        }
        continue
      }
      // In ## mode, also skip ### headings that are inside a skip section (book titles)
      const h3 = line.match(/^###\s+(.+)$/)
      if (h3) {
        flush()
        inConceptSection = false
        continue
      }
    }

    if (inConceptSection && currentHeading) {
      bodyLines.push(line)
    }
  }
  flush()

  return concepts.slice(0, 15)
}

/**
 * Infers estimated reading time in minutes.
 * Falls back to word-count-based estimate (200 wpm), clamped 10–60 mins.
 */
function inferEstimatedMins(content: string): number {
  const explicit = content.match(/(\d+)\s*(?:minutes?|mins?)/i)
  if (explicit) {
    const val = parseInt(explicit[1], 10)
    if (val >= 5 && val <= 120) return val
  }

  const wordCount = content.split(/\s+/).length
  const readingMins = Math.round(wordCount / 200)
  return Math.max(10, Math.min(60, readingMins))
}

/**
 * Calibrates the assignment text for a short daily session (~15 min).
 * - Reduces "20 examples" → "3 examples" and similar large counts
 * - Trims the text to the core task (first 400 chars) to avoid overwhelming learners
 * - Adds a category prompt (physical / digital / service) if the original asks for observation examples
 */
function calibrateScenario(raw: string): string {
  if (!raw) return raw

  let text = raw

  // Reduce large example counts to 3
  text = text.replace(/\b(20|15|10|eight|ten|fifteen|twenty)\s+(examples?|instances?|cases?|posters?|products?|screens?|apps?|interfaces?)/gi,
    (_, _n, noun) => `3 ${noun}`)

  // Reduce "five posters" → "three posters" etc.
  text = text.replace(/\bfive\s+(posters?|examples?|screens?|apps?)/gi, 'three $1')

  // If the scenario asks for examples without specifying categories, add the category guide
  const hasCategories = /physical|digital|service|app|product|interface/i.test(text.slice(0, 300))
  const isObservation = /find|document|photograph|identify|collect|spot/i.test(text.slice(0, 200))

  if (isObservation && !hasCategories) {
    text = text.replace(
      /^(\*\*Your task:\*\*[^.]+\.)/,
      '$1\n\n**Choose one from each category:** one physical product, one digital interface, one service or environment.'
    )
  }

  return text
}

export function parseModuleFile(filePath: string): ParsedModule {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const { level, module, slug } = parseLevelModule(filePath)

  // Title: first # heading, strip "Module N: " prefix
  const titleLine = lines.find(l => /^#\s/.test(l)) ?? ''
  const rawTitle = titleLine.replace(/^#\s+/, '').trim()
  const title = rawTitle.replace(/^Module\s+\d+:\s*/i, '').trim()

  // Story: first paragraph after the opening --- divider
  // Structure: # Title, ## Level heading, ---, hook paragraph
  let afterFirstDivider = false
  let storyLines: string[] = []
  let inStory = false

  for (const line of lines) {
    if (!afterFirstDivider) {
      if (line.trim() === '---') {
        afterFirstDivider = true
      }
      continue
    }
    if (!inStory) {
      if (line.trim().length > 0 && !line.startsWith('#')) {
        inStory = true
        storyLines.push(line.trim())
      }
    } else {
      if (line.trim().length === 0) break
      storyLines.push(line.trim())
    }
  }

  const story = storyLines.join(' ') || firstParagraph(content)

  // Scenario: content under ## Assignment, calibrated for short sessions
  const rawScenario = extractSection(lines, 'Assignment')
  const scenario = calibrateScenario(rawScenario)

  // Concepts: from ## headings and bold terms
  const concepts = extractConcepts(lines)

  // Estimated minutes
  const estimatedMins = inferEstimatedMins(content)

  return {
    title,
    story,
    scenario,
    concepts,
    estimatedMins,
    difficulty: level,
    sourceLevel: level,
    sourceModule: module,
    slug,
  }
}
