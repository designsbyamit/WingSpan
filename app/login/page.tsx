'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function LoginForm() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'
  const error = searchParams.get('error')

  async function handleGoogle() {
    // Get the auth URL from our server (which sets the CSRF cookie)
    const res = await fetch(`/api/auth/google?redirect=${encodeURIComponent(redirect)}`)
    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#23262F' }}>
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="text-center flex flex-col items-center gap-4">
          <img src="/LogoColor.svg" alt="Wingspan" className="h-12 w-auto" />
          <p className="text-sm text-[var(--text-muted)] font-jakarta leading-relaxed">
            Become a better designer.<br />One experience at a time.
          </p>
        </div>

        <div className="w-full rounded-2xl border border-[var(--border-ws)] p-6 flex flex-col gap-4" style={{ backgroundColor: '#353B45' }}>
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[var(--border-ws)] bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-white"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.8-11.3-7L6 33.5C9.4 39.6 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4-4.2 5.2l6.2 5.2C41 34.8 44 29.8 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            Continue with Google
          </button>

          {error && (
            <p className="text-xs text-red-400 text-center font-jakarta">
              {decodeURIComponent(error)}
            </p>
          )}

          <p className="text-center text-xs text-[var(--text-muted)] font-jakarta">
            No password. No OTP. Just Google.
          </p>
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
