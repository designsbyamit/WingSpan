// app/api/mentor/route.ts
import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { streamMentorResponse } from '@/lib/mentor'
import type { MentorRequest } from '@/types/design-evolution'
import { appendMessages, type ChatMessage } from '@/lib/mentor-messages'
import { asStringArray } from '@/lib/learning-entity'

export const maxDuration = 120

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }
  const { sessionId, experienceId, messages } = body as MentorRequest

  if (!sessionId || !experienceId || !Array.isArray(messages)) {
    return new Response('sessionId, experienceId, and messages are required', {
      status: 400,
    })
  }

  // Verify the session belongs to the current user
  if (sessionId) {
    const sessionRecord = await db.learningSession.findFirst({
      where: { id: sessionId, userId: session.userId },
      select: { id: true }
    })
    if (!sessionRecord) {
      return new Response(JSON.stringify({ error: 'Session not found' }), { status: 404 })
    }
  }

  // Load experience title and concept names for the system prompt
  const experience = await db.experience.findUnique({
    where: { id: experienceId },
    select: {
      title: true,
      concepts: {
        include: { concept: { select: { title: true } } },
      },
    },
  })

  if (!experience) {
    return new Response('Experience not found', { status: 404 })
  }

  // Load learner's weak areas from AIMentorContext
  const mentorCtx = await db.aIMentorContext.findUnique({
    where: { userId: session.userId },
    select: { weaknesses: true },
  })
  const weaknesses: string[] = asStringArray(mentorCtx?.weaknesses)

  const readableStream = streamMentorResponse({
    messages,
    experienceTitle: experience.title,
    conceptNames: experience.concepts.map((c) => c.concept.title),
    weaknesses,
    onComplete: async (fullText) => {
      // Persist the latest user message and the assistant's reply
      await appendMessages(sessionId, [
        ...messages.slice(-1).map((m) => ({ role: m.role as ChatMessage['role'], content: m.content })),
        { role: 'assistant', content: fullText },
      ]).catch((err) => console.error('Failed to persist mentor messages:', err))
    },
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
