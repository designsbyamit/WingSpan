// lib/parsers/xlsx.ts
export async function parseXlsx(buffer: Buffer): Promise<string> {
  const XLSX = await import('xlsx')
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
