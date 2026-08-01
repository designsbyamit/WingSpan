// lib/parsers/pdf.ts
// unpdf: serverless-safe PDF text extraction, no DOM dependencies

export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const { extractText } = await import('unpdf')
    const result = await extractText(new Uint8Array(buffer), { mergePages: true })
    const text = (Array.isArray(result.text) ? result.text.join('\n') : result.text ?? '').trim()
    if (text.length > 100) return text
    throw new Error('PDF appears to be image-based or empty')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('image-based')) throw new Error('PDF appears to be image-based. Please upload as DOCX or TXT instead.')
    throw new Error(`PDF extraction failed: ${msg}. Please try DOCX or TXT.`)
  }
}
