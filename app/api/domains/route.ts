// app/api/domains/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(): Promise<NextResponse> {
  const domains = await db.domain.findMany({
    select: { id: true, name: true, order: true },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(domains)
}
