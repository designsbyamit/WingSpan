import { NextRequest, NextResponse } from 'next/server'
import { parseFile } from '@/lib/parsers'
import { extractCareerData } from '@/lib/claude'
import { mockExtractedData } from '@/lib/mock-data'
import { inspectPortfolioUrl, portfolioToText } from '@/lib/portfolio'

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

    if (portfolioUrl) {
      const inspection = await inspectPortfolioUrl(portfolioUrl, urls)
      if (!inspection.valid) {
        return NextResponse.json({
          error: inspection.message,
          code: 'PORTFOLIO_INVALID',
          portfolio: {
            url: portfolioUrl,
            canonicalUrl: inspection.canonicalUrl,
            confidence: inspection.confidence,
            signals: inspection.signals.slice(0, 5),
          },
        }, { status: 422 })
      }
      texts.push(portfolioToText(inspection))
    }

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const text = await parseFile(buffer, file.name, file.type)
      if (text.trim()) texts.push(`[UPLOADED DOCUMENT: ${file.name}]\n${text}`)
    }

    const combinedText = texts.join('\n\n--- SOURCE BREAK ---\n\n')
    if (!combinedText.trim()) {
      return NextResponse.json({
        error: 'We could not read enough from that source. Please upload your portfolio as a PDF.',
        code: 'SOURCE_EMPTY',
      }, { status: 422 })
    }

    const extractedData = await extractCareerData(combinedText, urls)
    return NextResponse.json(extractedData)
  } catch (err) {
    console.error('Extract error:', err)
    const message = err instanceof Error ? err.message : 'Unknown extraction error'
    return NextResponse.json(
      { error: message, code: 'EXTRACTION_FAILED' },
      { status: 500 }
    )
  }
}
