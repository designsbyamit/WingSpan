'use client'
import { useCallback, useEffect, useState } from 'react'
import type { ProfileDetails } from '@/lib/profile/details'

export type SavedProfile = ProfileDetails & { confirmedAt: string }

/** The signed-in person's confirmed details (null until they have confirmed them once). */
export function useProfileDetails(signedIn: boolean) {
  const [profile, setProfile] = useState<SavedProfile | null>(null)
  const [loaded, setLoaded] = useState(false)

  const reload = useCallback(async () => {
    const res = await fetch('/api/profile-details').catch(() => null)
    const data = res?.ok ? await res.json().catch(() => null) as { profile: SavedProfile | null } | null : null
    setProfile(data?.profile ?? null)
    setLoaded(true)
  }, [])

  useEffect(() => {
    // State is set only after the fetch resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (signedIn) void reload(); else { setProfile(null); setLoaded(false) }
  }, [signedIn, reload])

  return { profile, loaded, reload, setProfile }
}
