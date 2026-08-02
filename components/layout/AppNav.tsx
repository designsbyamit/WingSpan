'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { House, User, Map, LogOut } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',        label: 'Home',    Icon: House },
  { href: '/paths',   label: 'Paths',   Icon: Map   },
  { href: '/profile', label: 'Profile', Icon: User  },
]

interface Props {
  userName: string
  xp: number
}

export function AppNav({ userName, xp }: Props) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      {/* ── Top nav bar (all screen sizes) ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-14 transition-all duration-500"
        style={{
          background: scrolled ? 'rgba(10,10,10,0.88)' : 'rgba(10,10,10,0.6)',
          backdropFilter: 'blur(20px) saturate(1.4)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <img src="/brand/LogoColor.svg" alt="Wingspan" style={{ height: '22px', width: 'auto' }} />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  active ? 'text-[#B6FF2E] bg-[rgba(182,255,46,0.08)]' : 'text-[rgba(255,255,255,0.45)] hover:text-[rgba(255,255,255,0.8)]'
                }`}
                aria-current={active ? 'page' : undefined}>
                <Icon size={14} />
                {label}
              </Link>
            )
          })}
        </div>

        {/* Right: user avatar + menu */}
        <div className="flex items-center gap-3 relative">
          {/* XP badge */}
          <span className="hidden sm:block text-xs font-medium px-2 py-1 rounded-full"
            style={{ background: 'rgba(182,255,46,0.1)', color: '#B6FF2E', border: '1px solid rgba(182,255,46,0.2)' }}>
            {xp.toLocaleString()} XP
          </span>

          {/* Avatar */}
          <button onClick={() => setMenuOpen(o => !o)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:ring-2 hover:ring-[rgba(182,255,46,0.4)]"
            style={{ background: 'rgba(182,255,46,0.15)', color: '#B6FF2E', border: '1px solid rgba(182,255,46,0.2)' }}>
            {userName.charAt(0).toUpperCase()}
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div className="absolute top-10 right-0 w-44 rounded-xl overflow-hidden border"
              style={{ background: 'rgba(18,18,22,0.96)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{userName}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{xp.toLocaleString()} XP</p>
              </div>
              {NAV_ITEMS.map(({ href, label, Icon }) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs transition-colors hover:bg-[rgba(255,255,255,0.05)]"
                  style={{ color: 'rgba(255,255,255,0.6)' }}>
                  <Icon size={13} />
                  {label}
                </Link>
              ))}
              <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <Link href="/api/auth/logout"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs transition-colors hover:bg-[rgba(255,255,255,0.05)]"
                  style={{ color: 'rgba(255,255,255,0.35)' }}>
                  <LogOut size={13} />
                  Sign out
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── Mobile bottom bar (secondary nav for quick access) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-14 px-2"
        style={{ background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
        aria-label="Mobile navigation">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                active ? 'text-[#B6FF2E]' : 'text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.7)]'
              }`}
              aria-current={active ? 'page' : undefined}>
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Click outside to close menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
      )}

      {/* Top padding for content */}
      <div className="h-14" />
    </>
  )
}
