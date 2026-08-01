// app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state') ?? '/'

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', req.url))
  }

  try {
    // Exchange code for tokens
    const origin = new URL(req.url).origin
    const redirectUri = `${origin}/api/auth/google/callback`
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenRes.json()
    if (!tokenRes.ok) {
      console.error('Token exchange failed:', JSON.stringify(tokens))
      throw new Error(tokens.error_description ?? tokens.error ?? 'Token exchange failed')
    }

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const googleUser = await userRes.json()
    const email: string = googleUser.email
    const name: string | undefined = googleUser.name

    if (!email) throw new Error('No email from Google')

    // Upsert user
    let user = await db.user.findUnique({ where: { email } })
    if (!user) {
      user = await db.user.create({ data: { email, name: name ?? null } })
    }

    // Create session
    const cookieHeader = await createSession(user.id, user.email)
    const response = NextResponse.redirect(new URL(state, req.url))
    response.headers.set('Set-Cookie', cookieHeader)
    return response
  } catch (err) {
    console.error('Google OAuth error:', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(msg)}`, req.url))
  }
}
