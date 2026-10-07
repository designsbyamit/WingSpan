// lib/parsers/index.ts
import { parsePdf } from './pdf'
import { parseDocx } from './docx'
import { parseXlsx } from './xlsx'

export async function parseFile(
  buffer: Buffer,
  filename: string,
  mimeType = ''
): Promise<string> {
  // Some browsers/mobile file providers can send an unreliable filename
  // (for example "0") even though the MIME type is correct. Prefer the
  // extension when it is trustworthy, then fall back to the MIME type.
  const rawExt = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() : ''
  const mime = mimeType.toLowerCase()

  const ext =
    rawExt ||
    (mime === 'application/pdf' ? 'pdf' : '') ||
    (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'docx' : '') ||
    (mime === 'text/plain' ? 'txt' : '') ||
    (mime === 'text/csv' || mime === 'application/csv' ? 'csv' : '') ||
    (mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ? 'xlsx' : '')

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
      throw new Error('Unsupported file type: ' + (rawExt || mime || 'unknown'))
  }
}