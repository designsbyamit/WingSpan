// app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { db } from '@/lib/db'
import { createSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const stateParam = searchParams.get('state')
  const storedCsrf = req.cookies.get('oauth_state')?.value

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', req.url))
  }

  // Parse state
  let redirect = '/'
  try {
    const state = JSON.parse(stateParam ?? '{}')
    // CSRF check
    if (!storedCsrf || state.csrf !== storedCsrf) {
      return NextResponse.redirect(new URL('/login?error=State+mismatch+%28CSRF%29', req.url))
    }
    redirect = state.redirect ?? '/'
  } catch {
    return NextResponse.redirect(new URL('/login?error=Invalid+state', req.url))
  }

  try {
    const origin = new URL(req.url).origin
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${origin}/api/auth/google/callback`
    )

    // Exchange code for tokens
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)

    // Verify ID token to get user info
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID!,
    })
    const payload = ticket.getPayload()
    if (!payload?.email) throw new Error('No email from Google')

    const email = payload.email
    const name = payload.name ?? null

    // Upsert user
    let user = await db.user.findUnique({ where: { email } })
    if (!user) {
      user = await db.user.create({ data: { email, name } })
    }

    // Create session
    const cookieHeader = await createSession(user.id, user.email)
    const response = NextResponse.redirect(new URL(redirect, req.url))
    response.headers.append('Set-Cookie', cookieHeader)
    // Clear CSRF cookie
    response.cookies.delete('oauth_state')
    return response
  } catch (err) {
    console.error('Google OAuth callback error:', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(msg)}`, req.url))
  }
}
