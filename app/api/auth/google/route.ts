// app/api/auth/google/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  const redirect = req.nextUrl.searchParams.get('redirect') ?? '/'

  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${new URL(req.url).origin}/api/auth/google/callback`
  )

  // Generate CSRF state token — encode redirect inside it
  const csrfToken = crypto.randomBytes(32).toString('hex')
  const state = JSON.stringify({ csrf: csrfToken, redirect })

  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    state,
    prompt: 'select_account',
  })

  const response = NextResponse.json({ url })
  response.cookies.set('oauth_state', csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  })
  return response
}
