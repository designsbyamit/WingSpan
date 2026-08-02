'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, User, Map } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  Icon: React.ComponentType<{ size?: number; className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { href: '/',        label: 'Home',    Icon: House },
  { href: '/profile', label: 'Profile', Icon: User  },
  { href: '/paths',   label: 'Paths',   Icon: Map   },
]

interface Props {
  userName: string
  xp: number
}

export function AppNav({ userName, xp }: Props) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      {/* ── Mobile bottom bar ────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#23262F] border-t border-[#353B45] flex items-center justify-around h-16 px-2"
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                active
                  ? 'text-[#B6FF2E]'
                  : 'text-[#6b7280] hover:text-[#9ca3af]'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={22} />
              <span className="text-[10px] font-jakarta font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* ── Desktop left sidebar ─────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-50 w-16 bg-[#23262F] border-r border-[#353B45] items-center py-6 gap-2"
        aria-label="Main navigation"
      >
        {/* Brand mark */}
        <Link href="/" className="flex items-center justify-center mb-4 flex-none">
          <img src="/brand/LogoWings.svg" alt="Wingspan" style={{ width: '36px', height: 'auto' }} />
        </Link>

        {/* Nav items */}
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                active
                  ? 'bg-[#1a1a2e] text-[#B6FF2E]'
                  : 'text-[#6b7280] hover:bg-[#353B45] hover:text-[#9ca3af]'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={20} />
              <span className="sr-only">{label}</span>
            </Link>
          )
        })}

        {/* Spacer */}
        <div className="flex-1" />

        {/* User info */}
        <div className="flex flex-col items-center gap-1 pb-2">
          <div className="w-8 h-8 rounded-full bg-[#1a1a2e] border border-[#2a2a3a] flex items-center justify-center">
            <span className="text-[10px] font-sora font-semibold text-[#B6FF2E]">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-[9px] font-jakarta text-[#6b7280] text-center leading-tight max-w-[52px] truncate">
            {xp.toLocaleString()} XP
          </span>
        </div>
      </aside>
    </>
  )
}
