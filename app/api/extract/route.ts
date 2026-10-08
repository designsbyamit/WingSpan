import { NextRequest, NextResponse } from 'next/server'
import { parseFile } from '@/lib/parsers'
import { mockExtractedData } from '@/lib/mock-data'
import { normalizeCareerEvidence, scanWebsiteToCareerEvidence } from '@/lib/website-scanner'
import { careerEvidenceToCareerAlphaInput } from '@/lib/career-evidence'

export const maxDuration = 120

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

    if (files.length === 0 && !portfolioUrl) {
      return NextResponse.json({ error: 'Add a resume, portfolio, or profile link to continue.' }, { status: 400 })
    }

    const texts: string[] = []
    const documentTexts: Array<{ filename: string; text: string }> = []

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const text = await parseFile(buffer, file.name, file.type)
      if (text.trim()) {
        texts.push(`[UPLOADED DOCUMENT: ${file.name}]\\n${text}`)
        documentTexts.push({ filename: file.name, text })
      }
    }

    let normalizedEvidence

    if (portfolioUrl) {
      const result = await scanWebsiteToCareerEvidence(portfolioUrl, urls, documentTexts)
      normalizedEvidence = result.evidence
    } else {
      normalizedEvidence = await normalizeCareerEvidence([], [], urls, documentTexts)
    }

    const extractedData = careerEvidenceToCareerAlphaInput(normalizedEvidence, [])
    extractedData.rawText = [
      extractedData.rawText,
      ...texts,
    ].filter(Boolean).join('\\n\\n').slice(0, 20000)

    return NextResponse.json({
      ...extractedData,
      evidence: normalizedEvidence,
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
