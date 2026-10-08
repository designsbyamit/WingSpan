'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { notifyAuthChanged } from '@/lib/use-auth'

type AuthMode = 'signup' | 'login'

export function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [mode, setMode] = useState<AuthMode>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const body = mode === 'signup'
        ? { email, password, name: name.trim() || undefined }
        : { email, password }
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }
      notifyAuthChanged()
      onSuccess()
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  function handleGoogle() {
    window.location.href = `/api/auth/google?redirect=${encodeURIComponent(window.location.pathname)}`
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        transition={{ duration: 0.3, ease: [0.16,1,0.3,1] }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border p-6 flex flex-col gap-5"
        style={{ background: '#0f0f12', borderColor: 'rgba(255,255,255,0.1)' }}>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-base font-semibold text-white">
              {mode === 'signup' ? 'Save your Blueprint' : 'Welcome back'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {mode === 'signup'
                ? 'Create a free account to save your Blueprint and continue your journey.'
                : 'Sign in to access your saved Blueprint.'}
            </p>
          </div>
          <button onClick={onClose} className="text-[rgba(255,255,255,0.3)] hover:text-white transition-colors mt-0.5">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'signup' && (
            <input
              type="text" placeholder="Your name (optional)"
              value={name} onChange={e => setName(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}
            />
          )}
          <input
            type="email" placeholder="Email address" required
            value={email} onChange={e => setEmail(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}
          />
          <input
            type="password" placeholder="Password (min 8 characters)" required
            value={password} onChange={e => setPassword(e.target.value)}
            className="w-full rounded-xl px-4 py-2.5 text-sm border outline-none transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }}
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
            style={{ background: '#B6FF2E', color: '#0d0d0d' }}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            {mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>or</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Google */}
        <button onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:bg-white/5"
          style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.8-11.3-7L6 33.5C9.4 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4-4.2 5.2l6.2 5.2C41 34.8 44 29.8 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          Continue with Google
        </button>

        {/* Toggle */}
        <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
          {' '}
          <button onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError('') }}
            className="underline underline-offset-2 hover:text-white transition-colors"
            style={{ color: '#B6FF2E' }}>
            {mode === 'signup' ? 'Sign in' : 'Create account'}
          </button>
        </p>
      </motion.div>
    </motion.div>
  )
}

