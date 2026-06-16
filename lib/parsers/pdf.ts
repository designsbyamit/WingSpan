// lib/parsers/pdf.ts
import { PDFParse } from 'pdf-parse'
import OpenAI from 'openai'

const VISION_THRESHOLD = 100

export async function parsePdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer })
  const data = await parser.getText()
  if (data.text.trim().length >= VISION_THRESHOLD) {
    return data.text
  }
  return extractPdfViaVision(buffer)
}

async function extractPdfViaVision(buffer: Buffer): Promise<string> {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise
  const pageImages: string[] = []

  for (let i = 1; i <= Math.min(pdf.numPages, 6); i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 1.5 })
    const { createCanvas } = await import('canvas')
    const canvas = createCanvas(viewport.width, viewport.height)
    const ctx = canvas.getContext('2d')
    // pdfjs-dist v6: `canvas` is required; pass null for `canvasContext` (backwards-compat)
    await page.render({
      canvas: canvas as unknown as HTMLCanvasElement,
      canvasContext: ctx as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise
    pageImages.push(canvas.toDataURL('image/jpeg', 0.85).split(',')[1])
  }

  const client = new OpenAI()
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract all text content from these resume pages. Return plain text only, preserving structure (job titles, dates, descriptions). No commentary.',
          },
          ...pageImages.map((img) => ({
            type: 'image_url' as const,
            image_url: { url: `data:image/jpeg;base64,${img}` },
          })),
        ],
      },
    ],
    max_tokens: 4096,
  })

  return response.choices[0].message.content ?? ''
}
