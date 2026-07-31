// app/api/auth/firebase/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth } from '@/lib/firebase-admin'
import { db } from '@/lib/db'
import { createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json()
    if (!idToken) return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })

    const decoded = await getAdminAuth().verifyIdToken(idToken)
    const phone = decoded.phone_number
    const email = decoded.email

    if (!phone && !email) {
      return NextResponse.json({ error: 'No identifier in token' }, { status: 400 })
    }

    let user = null

    if (email) {
      // Google sign-in — upsert by email
      user = await db.user.findUnique({ where: { email } })
      if (!user) {
        user = await db.user.create({
          data: {
            email,
            name: decoded.name ?? null,
          },
        })
      }
    } else if (phone) {
      // Phone sign-in — upsert by phone
      user = await db.user.findFirst({ where: { phone } })
      if (!user) {
        user = await db.user.create({
          data: { phone, email: `${phone.replace('+', '')}@phone.wingspan.app` },
        })
      }
    }

    if (!user) return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })

    const cookieHeader = await createSession(user.id, user.email)
    const response = NextResponse.json({ ok: true })
    response.headers.set('Set-Cookie', cookieHeader)
    return response
  } catch (err) {
    console.error('Firebase auth error:', JSON.stringify(err, Object.getOwnPropertyNames(err)))
    return NextResponse.json({ error: 'Authentication failed', detail: String(err) }, { status: 401 })
  }
}
