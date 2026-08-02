// lib/use-auth.ts
'use client'
import { useState, useEffect } from 'react'

interface AuthUser { email: string; userId?: string }

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined) // undefined = loading

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => setUser(d ? { email: d.email } : null))
      .catch(() => setUser(null))
  }, [])

  return { user, loading: user === undefined }
}
