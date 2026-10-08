import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import {
  listSnapshots, getWorking, upsertWorking, saveVersion,
  VersionLimitError, PayloadTooLargeError, type SnapshotInput,
} from '@/lib/blueprint-store'

function parse(body: unknown): SnapshotInput | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  if (!b.blueprint || typeof b.blueprint !== 'object') return null
  return {
    blueprint: b.blueprint,
    extractedData: b.extractedData,
    selectedPath: typeof b.selectedPath === 'string' ? b.selectedPath : null,
    analysisRunId: typeof b.analysisRunId === 'string' ? b.analysisRunId : null,
  }
}

function fail(err: unknown) {
  if (err instanceof VersionLimitError) return NextResponse.json({ error: err.message }, { status: 409 })
  if (err instanceof PayloadTooLargeError) return NextResponse.json({ error: err.message }, { status: 413 })
  throw err
}

// GET: list versions + working snapshot (?working=1 returns the working snapshot's content)
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (req.nextUrl.searchParams.get('working') === '1') {
    return NextResponse.json({ working: await getWorking(session.userId) })
  }
  return NextResponse.json(await listSnapshots(session.userId))
}

// PUT: autosave the working snapshot (overwrites)
export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const input = parse(await req.json().catch(() => null))
  if (!input) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  try {
    return NextResponse.json(await upsertWorking(session.userId, input))
  } catch (err) { return fail(err) }
}

// POST: save the current state as a named version
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  const input = parse(body)
  if (!input) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  const label = typeof (body as { label?: unknown }).label === 'string' ? (body as { label: string }).label : ''
  try {
    return NextResponse.json(await saveVersion(session.userId, input, label))
  } catch (err) { return fail(err) }
}
