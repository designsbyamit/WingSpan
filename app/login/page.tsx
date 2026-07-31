// app/login/page.tsx
'use client'

import { useState, FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type State = 'idle' | 'loading' | 'sent' | 'error'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email.trim()) return

    setState('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = (await res.json()) as { message?: string; error?: string }

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.')
        setState('error')
        return
      }

      setState('sent')
    } catch {
      setErrorMsg('Network error. Check your connection and try again.')
      setState('error')
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: '#23262F' }}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        {/* Wordmark */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white font-sora">
            Design Evolution
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)] font-jakarta leading-relaxed">
            Become a better designer.
            <br />
            One experience at a time.
          </p>
        </div>

        {/* Form / confirmation card */}
        <div
          className="w-full rounded-2xl border border-[var(--border-ws)] p-6"
          style={{ backgroundColor: '#353B45' }}
        >
          {state === 'sent' ? (
            <SentState email={email} onBack={() => setState('idle')} />
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={state === 'error' ? errorMsg : undefined}
                disabled={state === 'loading'}
                required
              />

              <Button
                type="submit"
                variant="indigo"
                size="lg"
                className="w-full h-11 text-sm font-medium"
                disabled={state === 'loading' || !email.trim()}
              >
                {state === 'loading' ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send magic link'
                )}
              </Button>

              <p className="text-center text-xs text-[var(--text-muted)] font-jakarta">
                No password. No OAuth. Just email.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function SentState({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center py-2">
      <div
        className="size-12 rounded-full flex items-center justify-center text-2xl"
        style={{ backgroundColor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}
      >
        ✉️
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)] font-sora">
          Check your email
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)] font-jakarta">
          We sent a magic link to{' '}
          <span className="text-[var(--text-secondary)]">{email}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-[var(--text-muted)] underline underline-offset-2 hover:text-[var(--text-secondary)] transition-colors font-jakarta"
      >
        Use a different email
      </button>
    </div>
  )
}
