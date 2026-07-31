import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

// Root entry point — redirects based on session state.
// Authenticated users go to the app home (app/(app)/page.tsx resolves to /).
// Unauthenticated users go to /login.
//
// Note: We redirect authenticated users to /paths rather than / to avoid
// a potential infinite redirect loop between app/page.tsx and app/(app)/page.tsx
// (both resolve to the same URL segment "/").
export default async function RootPage() {
  const session = await getSession()

  if (session) {
    redirect('/paths')
  } else {
    redirect('/login')
  }
}
