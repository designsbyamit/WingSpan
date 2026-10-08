import { NextRequest, NextResponse } from 'next/server'
import { inspectPortfolioUrl } from '@/lib/portfolio'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { url?: string; urls?: Record<string, string> }
    const url = (body.url ?? '').trim()
    if (!url) return NextResponse.json({ valid: true })

    const inspection = await inspectPortfolioUrl(url, body.urls ?? {})
    if (!inspection.valid) {
      return NextResponse.json({
        valid: false,
        code: 'PORTFOLIO_INVALID',
        message: inspection.message,
        confidence: inspection.confidence,
      }, { status: 422 })
    }

    return NextResponse.json({
      valid: true,
      message: 'Portfolio recognised.',
      canonicalUrl: inspection.canonicalUrl,
      confidence: inspection.confidence,
      pageCount: inspection.pages.length,
    })
  } catch {
    return NextResponse.json({
      valid: false,
      code: 'PORTFOLIO_INVALID',
      message: 'We could not verify that link. Please upload your portfolio instead.',
    }, { status: 422 })
  }
}
