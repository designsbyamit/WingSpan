// lib/parsers/pdf.ts
// Minimal PDF text extractor — no pdfjs-dist, no DOM dependencies

function cleanText(text: string): string {
  return text
    .replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const content = buffer.toString('binary')
    const textBlocks: string[] = []
    const btEtRegex = /BT([\s\S]*?)ET/g
    let match: RegExpExecArray | null

    while ((match = btEtRegex.exec(content)) !== null) {
      const block = match[1]
      const stringRegex = /\(((?:[^)(\\]|\\[\s\S])*)\)\s*(?:Tj|'|")|(\[.*?\])\s*TJ/g
      let strMatch: RegExpExecArray | null
      while ((strMatch = stringRegex.exec(block)) !== null) {
        if (strMatch[1]) {
          const decoded = strMatch[1]
            .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
            .replace(/\\\\/g, '\\').replace(/\\\(/g, '(').replace(/\\\)/g, ')')
            .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
          textBlocks.push(decoded)
        } else if (strMatch[2]) {
          const tjStrings = strMatch[2].match(/\((?:[^)(\\]|\\[\s\S])*\)/g) ?? []
          for (const s of tjStrings) textBlocks.push(s.slice(1, -1))
        }
      }
    }

    const text = cleanText(textBlocks.join(' '))
    if (text.length > 100) return text

    const ascii = cleanText(content)
    const words = ascii.split(' ').filter(w => w.length > 2 && /[a-zA-Z]{2,}/.test(w))
    if (words.length > 30) return words.join(' ')

    throw new Error('PDF appears to be image-based. Please upload as DOCX or TXT.')
  } catch (err) {
    if (err instanceof Error && err.message.includes('DOCX')) throw err
    throw new Error('PDF extraction failed. Please upload your CV as DOCX or TXT instead.')
  }
}
