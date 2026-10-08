// lib/use-auth.ts
'use client'
import { useState, useEffect, useCallback } from 'react'

interface AuthUser { email: string; userId?: string }

const AUTH_CHANGED = 'wingspan:auth-changed'

/** Call after login/signup/logout so every useAuth() instance refetches, without a page reload. */
export function notifyAuthChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(AUTH_CHANGED))
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined) // undefined = loading

  const refresh = useCallback(() => {
    return fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => setUser(d ? { email: d.email } : null))
      .catch(() => setUser(null))
  }, [])

  useEffect(() => {
    void refresh()
    const on = () => { void refresh() }
    window.addEventListener(AUTH_CHANGED, on)
    return () => window.removeEventListener(AUTH_CHANGED, on)
  }, [refresh])

  return { user, loading: user === undefined, refresh }
}
