// lib/auth.ts
import { SignJWT, jwtVerify } from 'jose'
import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

const COOKIE_NAME = 'de_session'
const SESSION_DURATION_SEC = 30 * 24 * 60 * 60       // 30 days
const TOKEN_EXPIRY_MS = 15 * 60 * 1000               // 15 minutes

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters long')
  }
  return new TextEncoder().encode(secret)
}

// ── Magic link tokens ──────────────────────────────────────────────────────

export async function generateMagicLinkToken(email: string): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS)

  await db.magicLinkToken.create({
    data: { email, token, expiresAt },
  })

  return token
}

export async function verifyMagicLinkToken(token: string): Promise<string | null> {
  const record = await db.magicLinkToken.findUnique({ where: { token } })

  if (!record) return null
  if (record.usedAt) return null
  if (record.expiresAt < new Date()) return null

  await db.magicLinkToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  })

  return record.email
}

// ── JWT sessions ───────────────────────────────────────────────────────────

export async function createSession(userId: string, email: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SEC * 1000)

  const jwt = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getJwtSecret())

  const cookieValue = [
    `${COOKIE_NAME}=${jwt}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Expires=${expiresAt.toUTCString()}`,
    process.env.NODE_ENV === 'production' ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')

  return cookieValue
}

export async function getSession(): Promise<{ userId: string; email: string } | null> {
  const cookieStore = await cookies()
  const jwt = cookieStore.get(COOKIE_NAME)?.value

  if (!jwt) return null

  try {
    const { payload } = await jwtVerify(jwt, getJwtSecret())
    const userId = payload.userId as string | undefined
    const email = payload.email as string | undefined
    if (!userId || !email) return null
    return { userId, email }
  } catch {
    return null
  }
}

export function clearSession(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0`
}
