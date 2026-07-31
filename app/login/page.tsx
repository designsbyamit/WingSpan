'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { auth } from '@/lib/firebase'
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth'
import { useRouter, useSearchParams } from 'next/navigation'

type State = 'idle' | 'sending' | 'otp' | 'verifying' | 'error'

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
    recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    })
    return () => { recaptchaRef.current?.clear() }
  }, [])

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

      const res = await fetch('/api/auth/firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Authentication failed')
      }

      const redirect = searchParams.get('redirect') ?? '/'
      router.push(redirect)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid OTP. Please try again.')
      setState('error')
    }
  }

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

        <div className="w-full rounded-2xl border border-[var(--border-ws)] p-6" style={{ backgroundColor: '#353B45' }}>
          {state === 'otp' || state === 'verifying' || (state === 'error' && confirmation) ? (
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
                {state === 'verifying' ? <><Loader2 className="size-4 animate-spin" /> Verifying…</> : 'Verify OTP'}
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
            <div className="flex flex-col gap-4">
              <Input
                label="Mobile number"
                type="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={state === 'error' ? errorMsg : undefined}
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
                {state === 'sending' ? <><Loader2 className="size-4 animate-spin" /> Sending…</> : 'Send OTP'}
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
