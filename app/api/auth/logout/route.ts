// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { clearSession } from '@/lib/auth'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.redirect(new URL('/login', request.url))
  response.headers.set('Set-Cookie', clearSession())
  return response
}
