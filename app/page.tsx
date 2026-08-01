import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Image from 'next/image'
import Link from 'next/link'

export default async function RootPage() {
  const session = await getSession()
  if (session) redirect('/paths')

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#23262F', color: '#f0f0f0' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <Image src="/brand/LogoColor.svg" alt="WingSpan" width={120} height={30} />
        <div className="flex items-center gap-4">
          <Link href="/wingspan" className="text-sm text-white/60 hover:text-white transition-colors">Try Blueprint</Link>
          <Link href="/login" className="text-sm font-semibold bg-[#B6FF2E] text-[#23262F] px-4 py-2 rounded-lg hover:bg-[#9EE020] transition-colors">Sign in</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center gap-8 max-w-3xl mx-auto">
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-bold leading-tight" style={{ fontFamily: 'var(--font-sora, sans-serif)' }}>
            Your Future Self Blueprint
          </h1>
          <p className="text-lg text-white/60 leading-relaxed max-w-xl mx-auto">
            WingSpan analyses your career, detects your strengths, and builds a personalised Blueprint — then guides your growth through the Design Evolution learning platform.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/wingspan" className="px-8 py-3 rounded-xl bg-[#B6FF2E] text-[#23262F] font-bold text-sm hover:bg-[#9EE020] transition-colors">
            Upload your CV — it's free
          </Link>
          <Link href="/login" className="px-8 py-3 rounded-xl border border-white/20 text-white text-sm hover:border-white/40 transition-colors">
            Sign in
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 w-full text-left">
          {[
            { title: 'Career Analysis', desc: 'Upload your CV and portfolio. WingSpan extracts your strengths, gaps, and career signals.' },
            { title: 'Future Self Blueprint', desc: 'AI generates 3 career bets tailored to you — with a personalised growth roadmap.' },
            { title: 'Design Evolution', desc: 'Daily learning experiences drawn from your Blueprint, guided by an AI mentor.' },
          ].map(f => (
            <div key={f.title} className="rounded-2xl border border-white/10 p-5 flex flex-col gap-2" style={{ backgroundColor: '#353B45' }}>
              <h3 className="text-sm font-semibold text-[#B6FF2E]">{f.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-white/10 flex items-center justify-between text-xs text-white/30">
        <span>© 2026 WingSpan</span>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white/60 transition-colors">Terms of Service</Link>
        </div>
      </footer>
    </div>
  )
}
