// scripts/verify-auth.ts
// Run with: npx dotenv -e .env.local tsx scripts/verify-auth.ts
// Note: getSession() reads from next/headers and cannot be tested in this script.
// The magic link token round-trip and createSession cookie generation are still verified here.
import { generateMagicLinkToken, verifyMagicLinkToken, createSession, clearSession } from '../lib/auth'
import { db } from '../lib/db'

async function main() {
  console.log('--- Magic link token round-trip ---')
  const token = await generateMagicLinkToken('test@example.com')
  console.log('Generated token (first 16 chars):', token.slice(0, 16) + '...')

  const email1 = await verifyMagicLinkToken(token)
  console.log('First verify (expect test@example.com):', email1)

  const email2 = await verifyMagicLinkToken(token)
  console.log('Second verify (expect null — already used):', email2)

  console.log('\n--- JWT session creation ---')
  const cookieHeader = await createSession('user_abc123', 'test@example.com')
  console.log('Cookie header (first 60 chars):', cookieHeader.slice(0, 60) + '...')

  const clearHeader = clearSession()
  console.log('\nClear-cookie header:', clearHeader)

  // Clean up test token
  await db.magicLinkToken.deleteMany({ where: { email: 'test@example.com' } })
  console.log('\nCleaned up test tokens')
}

main().catch(console.error).finally(() => process.exit(0))
