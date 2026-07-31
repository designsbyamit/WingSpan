// lib/firebase-admin.ts — server-side Firebase Admin init
import { getApps, initializeApp, cert, App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

function getPrivateKey(): string {
  const b64 = process.env.FIREBASE_PRIVATE_KEY_BASE64
  if (b64) return Buffer.from(b64, 'base64').toString('utf8')
  // fallback for local dev with raw key
  return (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n')
}

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0]
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: getPrivateKey(),
    }),
  })
}

export function getAdminAuth() {
  return getAuth(getAdminApp())
}
