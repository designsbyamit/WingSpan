// app/(app)/layout.tsx
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { AppNav } from '@/components/layout/AppNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // DEV BYPASS: hardcoded session, remove before shipping
  const session = (await getSession()) ?? { userId: 'cmrx3naan0001yqil02daq62x', email: 'amit.xasap@gmail.com' }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { name: true, xp: true },
  })

  const userName = user?.name ?? session.email.split('@')[0]
  const xp = user?.xp ?? 0

  return (
    <>
      <AppNav userName={userName} xp={xp} />
      {/* No sidebar offset — top nav only, mobile bottom bar */}
      <div className="pb-14 md:pb-0 min-h-screen bg-[#0d0d0d] text-white" style={{ fontFamily: 'var(--font-jakarta)' }}>
        {children}
      </div>
    </>
  )
}
