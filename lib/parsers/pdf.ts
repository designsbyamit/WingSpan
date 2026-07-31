// lib/parsers/pdf.ts

const VISION_THRESHOLD = 100

async function disablePdfjsWorker() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  if (pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = ''
  }
}

export async function parsePdf(buffer: Buffer): Promise<string> {
  // Try text extraction first
  try {
    await disablePdfjsWorker()
    const { PDFParse } = await import('pdf-parse')
    const parser = new PDFParse({ data: buffer })
    const data = await parser.getText()
    if (data.text.trim().length >= VISION_THRESHOLD) {
      return data.text
    }
  } catch {
    // Fall through to vision
  }

  // Fallback: render pages as images and extract via Claude Vision
  return extractPdfViaVision(buffer)
}

async function extractPdfViaVision(buffer: Buffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    useSystemFonts: true,
  }).promise

  const pageImages: string[] = []

  for (let i = 1; i <= Math.min(pdf.numPages, 8); i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 1.0 }) // Keep at 1x — Claude Vision max is 1568px per side
    const { createCanvas } = await import('canvas')
    const canvas = createCanvas(viewport.width, viewport.height)
    const ctx = canvas.getContext('2d')
    await page.render({
      canvas: canvas as unknown as HTMLCanvasElement,
      canvasContext: ctx as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise
    pageImages.push(canvas.toDataURL('image/jpeg', 0.9).split(',')[1])
  }

  const { extractPdfViaClaudeVision } = await import('@/lib/claude')
  return extractPdfViaClaudeVision(pageImages)
}
