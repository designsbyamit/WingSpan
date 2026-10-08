import { NextRequest, NextResponse } from 'next/server'
import { parseFile } from '@/lib/parsers'
import { mockExtractedData } from '@/lib/mock-data'
import { normalizeCareerEvidence, scanWebsiteToCareerEvidence } from '@/lib/website-scanner'
import { buildCareerInputBundle, CareerInputSource } from '@/lib/career-input'
import { getSession } from '@/lib/auth'
import { saveIngestion } from '@/lib/ingestion-store'
import type { IngestSource } from '@/lib/ingestion-mapping'

export const maxDuration = 120

function classifyFile(filename: string): CareerInputSource['kind'] {
  const lower = filename.toLowerCase()
  if (/\b(resume|cv|curriculum)\b/.test(lower)) return 'resume'
  if (/\.(xlsx|xls|csv)$/.test(lower)) return 'projects-spreadsheet'
  return 'supporting-document'
}

function classifyUrl(key: string): CareerInputSource['kind'] {
  return key === 'portfolio' ? 'portfolio' : 'profile-link'
}

export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_MOCK === 'true') {
    await new Promise((r) => setTimeout(r, 2000))
    return NextResponse.json(mockExtractedData)
  }

  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const urlsRaw = formData.get('urls') as string | null
    const urls: Record<string, string> = urlsRaw ? JSON.parse(urlsRaw) : {}
    const portfolioUrl = (urls.portfolio ?? '').trim()

    if (files.length === 0 && !Object.values(urls).some(Boolean)) {
      return NextResponse.json(
        { error: 'Add a resume, portfolio, project spreadsheet, or profile link to continue.' },
        { status: 400 }
      )
    }

    const texts: string[] = []
    const documentTexts: Array<{ filename: string; text: string }> = []
    const sources: CareerInputSource[] = []
    const fileMeta = new Map<string, { sizeBytes: number; mimeType: string }>()

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const text = await parseFile(buffer, file.name, file.type)

      fileMeta.set(file.name, { sizeBytes: file.size, mimeType: file.type })
      if (text.trim()) {
        texts.push(`[UPLOADED DOCUMENT: ${file.name}]\n${text}`)
        documentTexts.push({ filename: file.name, text })
        sources.push({
          kind: classifyFile(file.name),
          name: file.name,
          text,
        })
      }
    }

    for (const [key, value] of Object.entries(urls)) {
      const url = value.trim()
      if (!url) continue
      sources.push({
        kind: classifyUrl(key),
        name: key,
        url,
      })
    }

    const evidence = portfolioUrl
      ? (await scanWebsiteToCareerEvidence(portfolioUrl, urls, documentTexts)).evidence
      : await normalizeCareerEvidence([], [], urls, documentTexts)

    const bundle = buildCareerInputBundle(evidence, sources)

    const rawText = [
      bundle.careerAlpha.rawText,
      ...texts,
    ].filter(Boolean).join('\n\n').slice(0, 20000)

    // Signed-in users: remember what was found. Never blocks or fails the extraction.
    const session = await getSession().catch(() => null)
    if (session) {
      const ingestSources: IngestSource[] = sources.map((s) => ({
        kind: s.kind, name: s.name, url: s.url, text: s.text, ...fileMeta.get(s.name),
      }))
      await saveIngestion(session.userId, ingestSources, bundle.careerAlpha).catch((e) =>
        console.error('Ingestion save failed:', e),
      )
    }

    return NextResponse.json({
      ...bundle.careerAlpha,
      rawText,
      evidence: bundle.evidence,
      inputSources: bundle.sources.map(({ kind, name, url }) => ({ kind, name, url })),
      sourceSummary: bundle.careerAlpha.sourceSummary,
    })
  } catch (err) {
    console.error('Extract error:', err)
    const message = err instanceof Error ? err.message : 'Unknown extraction error'
    return NextResponse.json(
      { error: message, code: 'EXTRACTION_FAILED' },
      { status: 500 }
    )
  }
}
