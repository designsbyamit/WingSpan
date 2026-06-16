// lib/parsers/xlsx.ts
import * as XLSX from 'xlsx'

export function parseXlsx(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const lines: string[] = []
  for (const sheetName of workbook.SheetNames) {
    lines.push(`--- Sheet: ${sheetName} ---`)
    const sheet = workbook.Sheets[sheetName]
    const csv = XLSX.utils.sheet_to_csv(sheet)
    lines.push(csv)
  }
  return lines.join('\n')
}
