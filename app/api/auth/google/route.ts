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

  // CSRF state token
  const csrfToken = crypto.randomBytes(32).toString('hex')
  const state = JSON.stringify({ csrf: csrfToken, redirect })

  // PKCE: code_verifier (secret) + code_challenge (public, sent to Google)
  const codeVerifier = crypto.randomBytes(64).toString('base64url')
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')

  const { CodeChallengeMethod } = await import('google-auth-library')
  const url = client.generateAuthUrl({
    scope: ['openid', 'email', 'profile'],
    state,
    prompt: 'select_account',
    code_challenge: codeChallenge,
    code_challenge_method: CodeChallengeMethod.S256,
  })

  const response = NextResponse.json({ url })
  // Store CSRF token and PKCE verifier in secure HTTP-only cookies
  response.cookies.set('oauth_state', csrfToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 60 * 10,
    path: '/',
  })
  response.cookies.set('pkce_verifier', codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 60 * 10,
    path: '/',
  })
  return response
}
