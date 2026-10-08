import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { saveAsVersion, VersionLimitError } from '@/lib/analysis-store'

// Keep the working run as a named version. Without this, the next analysis replaces it.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = (await req.json().catch(() => ({}))) as { label?: unknown }
  const label = typeof body.label === 'string' ? body.label : ''
  try {
    const saved = await saveAsVersion(session.userId, id, label)
    if (!saved) return NextResponse.json({ error: 'Only your current analysis can be saved as a version.' }, { status: 404 })
    return NextResponse.json(saved)
  } catch (err) {
    if (err instanceof VersionLimitError) return NextResponse.json({ error: err.message }, { status: 409 })
    throw err
  }
}
