// app/api/auth/magic-link/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateMagicLinkToken } from '@/lib/auth'
import { sendMagicLink } from '@/lib/email'

export async function POST(request: NextRequest): Promise<NextResponse> {
  let email: string

  try {
    const body = await request.json()
    email = (body.email as string | undefined)?.toLowerCase().trim() ?? ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 })
  }

  try {
    const token = await generateMagicLinkToken(email)
    await sendMagicLink(email, token)
    return NextResponse.json({ message: 'Magic link sent. Check your inbox.' })
  } catch (err) {
    console.error('[magic-link] Error:', err)
    return NextResponse.json(
      { error: 'Failed to send magic link. Please try again.' },
      { status: 500 }
    )
  }
}
