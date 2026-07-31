// app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLinkToken, createSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing_token', request.url))
  }

  const email = await verifyMagicLinkToken(token)

  if (!email) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
  }

  // Upsert user — create on first sign-in, find on subsequent ones
  const user = await db.user.upsert({
    where: { email },
    create: { email },
    update: {},
    select: { id: true, careerLevelId: true },
  })

  const cookieHeader = await createSession(user.id, email)

  const destination = !user.careerLevelId ? '/onboarding' : '/'
  const response = NextResponse.redirect(new URL(destination, request.url))
  response.headers.set('Set-Cookie', cookieHeader)

  return response
}
