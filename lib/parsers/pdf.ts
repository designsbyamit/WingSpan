// lib/parsers/pdf.ts
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse')

export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer)
    if (data.text.trim().length > 50) return data.text
    throw new Error('PDF appears to be image-based or empty')
  } catch (err) {
    throw new Error(`Could not extract text from PDF: ${err instanceof Error ? err.message : String(err)}. Try converting to DOCX or pasting as text.`)
  }
}
