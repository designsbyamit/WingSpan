'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { auth } from '@/lib/firebase'
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  GoogleAuthProvider,
  signInWithPopup,
  ConfirmationResult,
} from 'firebase/auth'
import { useRouter, useSearchParams } from 'next/navigation'

type State = 'idle' | 'sending' | 'otp' | 'verifying' | 'google' | 'error'

async function exchangeToken(idToken: string) {
  const res = await fetch('/api/auth/firebase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error ?? 'Authentication failed')
  }
}

function LoginForm() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null)
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' })
    return () => { recaptchaRef.current?.clear() }
  }, [])

  const redirect = () => router.push(searchParams.get('redirect') ?? '/')

  async function handleGoogle() {
    setState('google')
    setErrorMsg('')
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider())
      const idToken = await result.user.getIdToken()
      await exchangeToken(idToken)
      redirect()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Google sign-in failed.')
      setState('error')
    }
  }

  async function handleSendOtp() {
    if (!phone.trim()) return
    setState('sending')
    setErrorMsg('')
    try {
      const result = await signInWithPhoneNumber(auth, phone.trim(), recaptchaRef.current!)
      setConfirmation(result)
      setState('otp')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send OTP. Check the number and try again.')
      setState('error')
    }
  }

  async function handleVerifyOtp() {
    if (!otp.trim() || !confirmation) return
    setState('verifying')
    setErrorMsg('')
    try {
      const result = await confirmation.confirm(otp.trim())
      const idToken = await result.user.getIdToken()
      await exchangeToken(idToken)
      redirect()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid OTP. Please try again.')
      setState('error')
    }
  }

  const showOtp = state === 'otp' || state === 'verifying' || (state === 'error' && confirmation)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#23262F' }}>
      <div id="recaptcha-container" />
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white font-sora">Design Evolution</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)] font-jakarta leading-relaxed">
            Become a better designer.<br />One experience at a time.
          </p>
        </div>

        <div className="w-full rounded-2xl border border-[var(--border-ws)] p-6 flex flex-col gap-4" style={{ backgroundColor: '#353B45' }}>

          {/* Google Sign-In */}
          {!showOtp && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={state === 'google'}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-[var(--border-ws)] bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-white disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.8-11.3-7L6 33.5C9.4 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4-4.2 5.2l6.2 5.2C41 34.8 44 29.8 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[var(--border-ws)]" />
                <span className="text-xs text-[var(--text-dim)]">or use mobile</span>
                <div className="flex-1 h-px bg-[var(--border-ws)]" />
              </div>
            </>
          )}

          {/* Phone OTP */}
          {showOtp ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-[var(--text-secondary)] font-jakarta">
                Enter the OTP sent to <span className="text-white font-medium">{phone}</span>
              </p>
              <Input
                label="One-time password"
                type="text"
                inputMode="numeric"
                placeholder="______"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                error={state === 'error' ? errorMsg : undefined}
                disabled={state === 'verifying'}
              />
              <Button
                type="button"
                variant="indigo"
                size="lg"
                className="w-full h-11 text-sm font-medium"
                disabled={state === 'verifying' || otp.length < 6}
                onClick={handleVerifyOtp}
              >
                {state === 'verifying' ? <><Loader2 className="size-4 animate-spin" />Verifying…</> : 'Verify OTP'}
              </Button>
              <button
                type="button"
                onClick={() => { setState('idle'); setOtp(''); setConfirmation(null) }}
                className="text-xs text-[var(--text-muted)] underline underline-offset-2 hover:text-[var(--text-secondary)] transition-colors font-jakarta text-center"
              >
                Use a different number
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Input
                label="Mobile number"
                type="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={state === 'error' && !confirmation ? errorMsg : undefined}
                disabled={state === 'sending'}
              />
              <Button
                type="button"
                variant="indigo"
                size="lg"
                className="w-full h-11 text-sm font-medium"
                disabled={state === 'sending' || !phone.trim()}
                onClick={handleSendOtp}
              >
                {state === 'sending' ? <><Loader2 className="size-4 animate-spin" />Sending…</> : 'Send OTP'}
              </Button>
              <p className="text-center text-xs text-[var(--text-muted)] font-jakarta">
                Enter your number with country code (e.g. +91)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
