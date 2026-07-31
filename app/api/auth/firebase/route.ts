// app/api/auth/firebase/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { db } from '@/lib/db'
import { createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json()
    if (!idToken) return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })

    // Verify Firebase ID token
    const decoded = await getAdminAuth().verifyIdToken(idToken)
    const phone = decoded.phone_number
    if (!phone) return NextResponse.json({ error: 'No phone number in token' }, { status: 400 })

    // Upsert user by phone
    let user = await db.user.findFirst({ where: { phone } })
    if (!user) {
      user = await db.user.create({
        data: { phone, email: `${phone.replace('+', '')}@phone.wingspan.app` },
      })
    }

    // Create JWT session cookie
    const cookieHeader = await createSession(user.id, user.email)

    const response = NextResponse.json({ ok: true })
    response.headers.set('Set-Cookie', cookieHeader)
    return response
  } catch (err) {
    console.error('Firebase auth error:', err)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
  }
}
