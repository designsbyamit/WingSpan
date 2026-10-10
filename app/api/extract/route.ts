import { NextRequest, NextResponse } from 'next/server'
import { parseFile } from '@/lib/parsers'
import { mockExtractedData } from '@/lib/mock-data'
import { normalizeCareerEvidence, scanWebsiteToCareerEvidence } from '@/lib/website-scanner'
import { buildCareerInputBundle, CareerInputSource } from '@/lib/career-input'
import { getSession } from '@/lib/auth'
import { normalizeExtracted } from '@/lib/extracted-shape'
import { saveIngestion } from '@/lib/ingestion-store'
import type { IngestSource } from '@/lib/ingestion-mapping'
import { friendlyProviderError } from '@/lib/router'
import { UploadProblem, checkFileBasics, checkLooksLikeResume, extensionOf, sniffMismatch } from '@/lib/upload-rules'

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
      const isSheet = /\.(xlsx|xls|csv)$/i.test(file.name)
      // Resume-type files get the full set of checks; spreadsheets are project data and keep their own path.
      if (!isSheet) {
        const basic = checkFileBasics(file.name, file.size)
        if (basic) throw basic
      }
      const buffer = Buffer.from(await file.arrayBuffer())
      if (!isSheet && sniffMismatch(extensionOf(file.name), buffer.subarray(0, 8))) {
        throw new UploadProblem('UNREADABLE', `That file is named .${extensionOf(file.name)} but is not a real ${extensionOf(file.name).toUpperCase()} document. Open your resume and export it again as a PDF or Word file.`)
      }
      let text: string
      try {
        text = await parseFile(buffer, file.name, file.type)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (/password|encrypt/i.test(msg)) throw new UploadProblem('PASSWORD_PROTECTED', 'This file is password protected, so we cannot read it. Remove the password, save a copy, and upload that.')
        if (/image-based|empty/i.test(msg)) throw new UploadProblem('TOO_LITTLE', 'This PDF seems to be a scan or image, so there is no text for us to read. Export a text-based PDF from your editor, or upload a Word file.')
        throw new UploadProblem('UNREADABLE', "We couldn't open that file. It may be damaged. Export your resume again as a PDF or Word file and try again.")
      }
      if (!isSheet) {
        const looks = checkLooksLikeResume(text)
        if (looks && !portfolioUrl) throw looks
      }

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
      ...normalizeExtracted(bundle.careerAlpha),
      rawText,
      evidence: bundle.evidence,
      inputSources: bundle.sources.map(({ kind, name, url }) => ({ kind, name, url })),
      sourceSummary: bundle.careerAlpha.sourceSummary,
    })
  } catch (err) {
    if (err instanceof UploadProblem) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status })
    }
    if (err instanceof Error && /could not find enough career information/i.test(err.message)) {
      return NextResponse.json({ error: "We couldn't find roles, projects or skills in that file. Check it is your resume and that it contains readable text.", code: 'TOO_LITTLE' }, { status: 422 })
    }
    console.error('Extract error:', err)
    const message = err instanceof Error ? friendlyProviderError(err) : 'Unknown extraction error'
    return NextResponse.json(
      { error: message, code: 'EXTRACTION_FAILED' },
      { status: 500 }
    )
  }
}
