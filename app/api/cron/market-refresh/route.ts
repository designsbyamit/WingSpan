import { NextRequest, NextResponse } from 'next/server'
import { refreshMarketData } from '@/lib/market/ingest'

// Daily check; each source refreshes only when its own cadence (default every 10 days) has passed.
// Vercel Cron sends "Authorization: Bearer $CRON_SECRET"; without the secret configured the route refuses to run.
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const summary = await refreshMarketData({ trigger: 'cron' })
  return NextResponse.json(summary)
}
