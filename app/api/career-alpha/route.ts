// app/api/career-alpha/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { computeCareerAlpha } from '@/lib/career-alpha'
import { ExtractedCareerData } from '@/types/wingspan'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const extractedData: ExtractedCareerData = body.extractedData
    const interests: string[] = body.interests ?? []

    if (!extractedData) {
      return NextResponse.json({ error: 'extractedData is required' }, { status: 400 })
    }

    const careerAlpha = await computeCareerAlpha(extractedData, interests)

    return NextResponse.json({
      careerAlpha,
      observations: careerAlpha.observations ?? [],
    })
  } catch (err) {
    console.error('Career Alpha error:', err)
    return NextResponse.json(
      { error: 'Career Alpha computation failed' },
      { status: 500 }
    )
  }
}
