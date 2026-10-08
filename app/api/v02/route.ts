import { NextRequest, NextResponse } from 'next/server'
import { aggregatorAgent, careerAlphaAgent, marketIntelligenceAgent, careerDirectionGenerator } from '@/lib/v02-agents'
import type { ExtractedCareerData } from '@/types/wingspan'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { extractedData?: ExtractedCareerData; interests?: string[] }
    if (!body.extractedData) return NextResponse.json({ error: 'extractedData is required' }, { status: 400 })
    const data = body.extractedData
    const interests = body.interests ?? []

    const evidenceGraph = await aggregatorAgent(data, interests)
    const careerDNA = await careerAlphaAgent(evidenceGraph, data, interests)
    const marketGraph = await marketIntelligenceAgent([
      ...(data.geographySignals ?? []),
      ...(data.footprintSignals ?? []),
    ])
    const careerMap = await careerDirectionGenerator(careerDNA, marketGraph)

    return NextResponse.json({
      version: '0.2',
      evidenceGraph,
      careerDNA,
      marketGraph,
      careerMap,
    })
  } catch (error) {
    console.error('v0.2 agent pipeline failed:', error)
    return NextResponse.json(
      { error: 'We could not complete the career intelligence pass. Please try again.' },
      { status: 500 }
    )
  }
}