import { db } from '@/lib/db'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

const toDb = { user: 'USER', assistant: 'ASSISTANT', system: 'SYSTEM' } as const

/** Conversation shown to the learner: user and assistant turns only. */
export async function getMessages(sessionId: string): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const rows = await db.mentorMessage.findMany({
    where: { sessionId, role: { in: ['USER', 'ASSISTANT'] } },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: { role: true, content: true },
  })
  return rows.map((r) => ({ role: r.role === 'USER' ? ('user' as const) : ('assistant' as const), content: r.content }))
}

export async function appendMessages(sessionId: string, messages: ChatMessage[]): Promise<void> {
  if (messages.length === 0) return
  // createdAt is spaced by a millisecond so order is stable even when written in one batch.
  const base = Date.now()
  await db.mentorMessage.createMany({
    data: messages.map((m, i) => ({
      sessionId,
      role: toDb[m.role],
      content: m.content,
      createdAt: new Date(base + i),
    })),
  })
}
