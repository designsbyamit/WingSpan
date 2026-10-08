import { NextRequest, NextResponse } from 'next/server'
import { purgeExpiredAgentOutput } from '@/lib/analysis-store'

// Daily job: remove raw agent output past its 90-day retention. Vercel Cron sends
// "Authorization: Bearer $CRON_SECRET"; without the secret configured the route refuses to run.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json(await purgeExpiredAgentOutput())
}
