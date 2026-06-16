// lib/parsers/index.ts
import { parsePdf } from './pdf'
import { parseDocx } from './docx'
import { parseXlsx } from './xlsx'

export async function parseFile(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'pdf':
      return parsePdf(buffer)
    case 'docx':
      return parseDocx(buffer)
    case 'xlsx':
    case 'csv':
      return parseXlsx(buffer)
    case 'txt':
      return buffer.toString('utf-8')
    default:
      throw new Error(`Unsupported file type: ${ext}`)
  }
}
