// app/api/template/route.ts
import { NextResponse } from 'next/server'
import { generateProjectRepositoryTemplate } from '@/lib/template'

export async function GET() {
  const buffer = generateProjectRepositoryTemplate()
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="wingspan-project-repository.xlsx"',
    },
  })
}
