// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'

// Paths that do NOT require authentication
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/api/auth/magic-link',
  '/api/auth/verify',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/auth/google',
  '/privacy',
  '/terms',
  '/wingspan',
  '/api/extract',
  '/api/career-alpha',
  '/api/blueprint',
  '/api/template',
]

export async function proxy(request: NextRequest): Promise<NextResponse | undefined> {
  const { pathname } = request.nextUrl

  // Allow public paths through unconditionally
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
  if (isPublic) return undefined

  // Allow Next.js internals and static assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff2?)$/)
  ) {
    return undefined
  }

  // Check session
  const session = await getSession()
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return undefined
}

export const config = {
  matcher: [
    // Run on all paths except Next.js build artefacts
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
