'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface TopNavProps {
  userName?: string
  xp?: number
}

export function TopNav({ userName, xp }: TopNavProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const isLoggedIn = !!userName

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-14 transition-all duration-500"
        style={{
          background: scrolled ? 'rgba(10,10,10,0.92)' : 'rgba(10,10,10,0.6)',
          backdropFilter: 'blur(20px) saturate(1.4)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <img src="/brand/WingSpanLogo_H.svg" alt="Wingspan" style={{ height: "28px", width: "auto" }} />
        </Link>

        {/* Center nav — only for logged in */}
        {isLoggedIn && (
          <div className="hidden md:flex items-center gap-1">
            {[
              { href: '/', label: 'Home' },
              { href: '/profile', label: 'Profile' },
            ].map(({ href, label }) => {
              const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
              return (
                <Link key={href} href={href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active ? 'text-[#B6FF2E] bg-[rgba(182,255,46,0.08)]' : 'text-[rgba(255,255,255,0.45)] hover:text-[rgba(255,255,255,0.8)]'
                  }`}>
                  {label}
                </Link>
              )
            })}
          </div>
        )}

        {/* Right */}
        <div className="flex items-center gap-3 relative">
          {isLoggedIn ? (
            <>
              <span className="hidden sm:block text-xs font-medium px-2 py-1 rounded-full"
                style={{ background: 'rgba(182,255,46,0.1)', color: '#B6FF2E', border: '1px solid rgba(182,255,46,0.2)' }}>
                {xp?.toLocaleString()} XP
              </span>
              <button onClick={() => setMenuOpen(o => !o)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:ring-2 hover:ring-[rgba(182,255,46,0.4)]"
                style={{ background: 'rgba(182,255,46,0.15)', color: '#B6FF2E', border: '1px solid rgba(182,255,46,0.2)' }}>
                {userName.charAt(0).toUpperCase()}
              </button>
              {menuOpen && (
                <div className="absolute top-10 right-0 w-44 rounded-xl overflow-hidden border"
                  style={{ background: 'rgba(18,18,22,0.96)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{userName}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{xp?.toLocaleString()} XP</p>
                  </div>
                  {[{ href: '/', label: 'Home' }, { href: '/profile', label: 'Profile' }].map(({ href, label }) => (
                    <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                      className="flex items-center px-4 py-2.5 text-xs transition-colors hover:bg-[rgba(255,255,255,0.05)]"
                      style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {label}
                    </Link>
                  ))}
                  <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <Link href="/api/auth/logout"
                      className="flex items-center px-4 py-2.5 text-xs transition-colors hover:bg-[rgba(255,255,255,0.05)]"
                      style={{ color: 'rgba(255,255,255,0.35)' }}>
                      Sign out
                    </Link>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Link href="/login"
              className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all hover:-translate-y-px"
              style={{ background: '#B6FF2E', color: '#0d0d0d' }}>
              Sign in
            </Link>
          )}
        </div>
      </nav>

      {menuOpen && <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />}

      {/* Spacer */}
      <div className="h-14" />
    </>
  )
}
