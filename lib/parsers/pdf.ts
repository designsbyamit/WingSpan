// lib/parsers/pdf.ts

export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = await import('pdf-parse')
    const parse = pdfParse.default ?? pdfParse
    const data = await parse(buffer)
    if (data.text.trim().length > 50) return data.text
    throw new Error('PDF appears to be image-based or empty')
  } catch (err) {
    throw new Error(`Could not extract text from PDF: ${err instanceof Error ? err.message : String(err)}. Try converting to DOCX or pasting as text.`)
  }
}
