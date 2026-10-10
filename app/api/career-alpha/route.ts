// app/api/career-alpha/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { computeCareerAlpha } from '@/lib/career-alpha'
import { ExtractedCareerData } from '@/types/wingspan'
import { CareerInputBundle } from '@/lib/career-input'
import { friendlyProviderError } from '@/lib/router'

export const maxDuration = 120

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Preferred contract: the extractor's canonical CareerInputBundle.
    // Backward compatibility: accept the legacy extractedData shape too.
    const bundle = body.inputBundle as CareerInputBundle | undefined
    const extractedData: ExtractedCareerData | undefined =
      bundle?.careerAlpha ?? body.extractedData
    const interests: string[] =
      body.interests ?? bundle?.careerAlpha.interests ?? []

    if (!extractedData) {
      return NextResponse.json(
        { error: 'inputBundle.careerAlpha is required' },
        { status: 400 }
      )
    }

    const careerAlpha = await computeCareerAlpha(extractedData, interests)

    return NextResponse.json({
      careerAlpha,
      observations: careerAlpha.observations ?? [],
      inputSources: bundle?.sources ?? [],
      sourceSummary: bundle?.careerAlpha.sourceSummary ?? null,
    })
  } catch (err) {
    console.error('Career Alpha error:', err)
    return NextResponse.json(
      { error: friendlyProviderError(err) },
      { status: 500 }
    )
  }
}
