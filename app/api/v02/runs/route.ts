import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { listRuns, MAX_SAVED_VERSIONS } from '@/lib/analysis-store'

// The signed-in user's working run and saved versions, newest first.
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const runs = await listRuns(session.userId)
  return NextResponse.json({
    working: runs.find((r) => r.isWorking) ?? null,
    versions: runs.filter((r) => !r.isWorking && r.savedAt),
    maxVersions: MAX_SAVED_VERSIONS,
  })
}
