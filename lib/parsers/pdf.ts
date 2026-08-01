// lib/parsers/pdf.ts
// Minimal PDF text extractor — no pdfjs-dist, no DOM dependencies

export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    // Extract text from PDF content streams using regex
    // Handles most text-based PDFs without needing a full PDF engine
    const content = buffer.toString('binary')

    // Find all BT...ET blocks (text blocks in PDF spec)
    const textBlocks: string[] = []
    const btEtRegex = /BT([\s\S]*?)ET/g
    let match: RegExpExecArray | null

    while ((match = btEtRegex.exec(content)) !== null) {
      const block = match[1]
      // Extract strings from Tj, TJ, ' and " operators
      const stringRegex = /\(((?:[^)(\\]|\\[\s\S])*)\)\s*(?:Tj|'|")|(\[.*?\])\s*TJ/g
      let strMatch: RegExpExecArray | null
      while ((strMatch = stringRegex.exec(block)) !== null) {
        if (strMatch[1]) {
          // Decode PDF string escape sequences
          const decoded = strMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\\\/g, '\\')
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
          textBlocks.push(decoded)
        } else if (strMatch[2]) {
          // TJ array — extract individual strings
          const tjStrings = strMatch[2].match(/\((?:[^)(\\]|\\[\s\S])*\)/g) ?? []
          for (const s of tjStrings) {
            textBlocks.push(s.slice(1, -1))
          }
        }
      }
    }

    const text = textBlocks.join(' ').replace(/\s+/g, ' ').trim()

    if (text.length > 50) return text

    // Fallback: try to extract any readable ASCII text from the buffer
    const ascii = content.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim()
    const words = ascii.split(' ').filter(w => w.length > 2 && /[a-zA-Z]/.test(w))
    if (words.length > 20) return words.join(' ')

    throw new Error('Could not extract readable text from PDF')
  } catch (err) {
    throw new Error(
      `PDF extraction failed: ${err instanceof Error ? err.message : String(err)}. ` +
      `Please try uploading as DOCX or TXT instead.`
    )
  }
}
