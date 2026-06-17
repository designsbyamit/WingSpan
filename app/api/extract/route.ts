// app/api/extract/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { parseFile } from '@/lib/parsers'
import { extractCareerData } from '@/lib/openai'
import { mockExtractedData } from '@/lib/mock-data'

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

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const texts: string[] = []
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const text = await parseFile(buffer, file.name)
      texts.push(text)
    }

    const combinedText = texts.join('\n\n---\n\n')
    const extractedData = await extractCareerData(combinedText, urls)

    return NextResponse.json(extractedData)
  } catch (err) {
    console.error('Extract error:', err)
    return NextResponse.json(
      { error: 'Failed to extract career data' },
      { status: 500 }
    )
  }
}
