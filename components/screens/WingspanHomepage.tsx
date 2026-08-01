'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

// ── Constellation Node ─────────────────────────────────────────────────────

interface Node {
  id: string
  x: number
  y: number
  label: string
  type: 'skill' | 'project' | 'milestone' | 'opportunity'
  size: number
  delay: number
}

const NODES: Node[] = [
  { id: 'n1', x: 50, y: 45, label: 'UX Leadership', type: 'skill', size: 14, delay: 0 },
  { id: 'n2', x: 28, y: 30, label: 'Design Systems', type: 'skill', size: 10, delay: 0.2 },
  { id: 'n3', x: 72, y: 28, label: 'AI Product', type: 'opportunity', size: 12, delay: 0.4 },
  { id: 'n4', x: 20, y: 60, label: 'Airline App', type: 'project', size: 9, delay: 0.6 },
  { id: 'n5', x: 78, y: 62, label: 'Chief Design Officer', type: 'milestone', size: 11, delay: 0.8 },
  { id: 'n6', x: 42, y: 72, label: 'Agentic UX', type: 'opportunity', size: 9, delay: 1.0 },
  { id: 'n7', x: 62, y: 75, label: 'Team of 12', type: 'project', size: 8, delay: 1.2 },
  { id: 'n8', x: 35, y: 18, label: 'Figma Mastery', type: 'skill', size: 8, delay: 1.4 },
  { id: 'n9', x: 85, y: 42, label: 'Executive Presence', type: 'milestone', size: 10, delay: 1.6 },
  { id: 'n10', x: 15, y: 82, label: 'User Research', type: 'skill', size: 9, delay: 1.8 },
]

const EDGES = [
  ['n1', 'n2'], ['n1', 'n3'], ['n1', 'n5'], ['n1', 'n6'],
  ['n2', 'n4'], ['n2', 'n8'], ['n3', 'n9'], ['n3', 'n7'],
  ['n4', 'n10'], ['n5', 'n9'], ['n6', 'n7'],
]

const NODE_COLORS = {
  skill: '#B6FF2E',
  project: '#60A5FA',
  milestone: '#F59E0B',
  opportunity: '#A78BFA',
}

function ConstellationViz({ progress }: { progress: number }) {
  return (
    <div className="relative w-full h-full">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* Edges */}
        {EDGES.map(([aId, bId], i) => {
          const a = NODES.find(n => n.id === aId)!
          const b = NODES.find(n => n.id === bId)!
          const edgeProgress = Math.max(0, Math.min(1, (progress - 0.1) * 3 - i * 0.05))
          return (
            <motion.line
              key={`${aId}-${bId}`}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="rgba(182,255,46,0.12)"
              strokeWidth="0.3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: edgeProgress, opacity: edgeProgress * 0.8 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          )
        })}
        {/* Nodes */}
        {NODES.map((node) => {
          const nodeProgress = Math.max(0, Math.min(1, (progress - node.delay * 0.08) * 4))
          const color = NODE_COLORS[node.type]
          return (
            <g key={node.id}>
              {/* Outer glow ring */}
              <motion.circle
                cx={node.x} cy={node.y} r={node.size * 0.9}
                fill="none"
                stroke={color}
                strokeWidth="0.2"
                opacity={nodeProgress * 0.3}
                initial={{ scale: 0 }}
                animate={{ scale: nodeProgress, opacity: nodeProgress * 0.3 }}
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
              />
              {/* Core dot */}
              <motion.circle
                cx={node.x} cy={node.y} r={node.size * 0.35}
                fill={color}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: nodeProgress, opacity: nodeProgress * 0.9 }}
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                transition={{ delay: node.delay * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
              {/* Label */}
              {nodeProgress > 0.6 && (
                <motion.text
                  x={node.x} y={node.y + node.size * 0.6 + 1.8}
                  textAnchor="middle"
                  fill={color}
                  fontSize="1.8"
                  opacity={nodeProgress * 0.7}
                  fontFamily="system-ui"
                  style={{ pointerEvents: 'none' }}
                >
                  {node.label}
                </motion.text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Ambient glow */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(182,255,46,0.04) 0%, transparent 70%)',
          opacity: progress,
        }}
      />
    </div>
  )
}

// ── Scroll Chapter ─────────────────────────────────────────────────────────

function Chapter({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-15% 0px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

// ── Insight Card ───────────────────────────────────────────────────────────

function InsightPill({ icon, text, color, delay }: { icon: string; text: string; color: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -16 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(255,255,255,0.07)',
      }}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>{text}</span>
      <div className="ml-auto w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
    </motion.div>
  )
}

// ── Monday Card ────────────────────────────────────────────────────────────

function MondayCard({ line, sub, delay }: { line: string; sub?: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className="px-5 py-4 rounded-2xl border"
      style={{
        background: 'rgba(182,255,46,0.04)',
        borderColor: 'rgba(182,255,46,0.15)',
      }}
    >
      <p className="text-sm font-medium" style={{ color: '#B6FF2E' }}>{line}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'rgba(182,255,46,0.5)' }}>{sub}</p>}
    </motion.div>
  )
}

// ── Nav ────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
      style={{
        background: scrolled ? 'rgba(13,13,13,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <Image src="/brand/LogoColor.svg" alt="Wingspan" width={110} height={28} />
      <div className="flex items-center gap-6">
        <Link href="/wingspan" className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Try Blueprint
        </Link>
        <Link
          href="/login"
          className="px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-px"
          style={{ background: '#B6FF2E', color: '#0d0d0d' }}
        >
          Sign in
        </Link>
      </div>
    </motion.nav>
  )
}

// ── FAQ ────────────────────────────────────────────────────────────────────

const FAQS = [
  { q: 'What does Wingspan actually do?', a: 'Wingspan analyses your career history — resume, projects, portfolio — and generates a personalised Blueprint: your strengths, where the market is moving, which opportunities fit you, and a concrete growth roadmap. Then it guides your evolution through daily learning experiences.' },
  { q: 'How is this different from a resume builder?', a: 'A resume builder captures what you\'ve done. Wingspan understands who you\'re becoming. It\'s a living companion that evolves every time you complete a project, learn something new, or change direction.' },
  { q: 'What file formats can I upload?', a: 'PDF, DOCX, and TXT. We recommend DOCX for the most accurate extraction. You can also paste portfolio URLs and LinkedIn links.' },
  { q: 'Is my data private?', a: 'Yes. Your career data is used solely to generate your Blueprint and guide your learning. We never sell it or share it with third parties.' },
  { q: 'How long does the analysis take?', a: 'Extract takes about 5–10 seconds. The full Career Alpha analysis and Blueprint generation runs in the background — usually under 60 seconds — while you review your extracted timeline.' },
]

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="flex flex-col gap-2">
      {FAQS.map((item, i) => (
        <div
          key={i}
          className="rounded-2xl border overflow-hidden cursor-pointer"
          style={{ borderColor: open === i ? 'rgba(182,255,46,0.2)' : 'rgba(255,255,255,0.07)', transition: 'border-color 0.3s' }}
          onClick={() => setOpen(open === i ? null : i)}
        >
          <div className="flex items-center justify-between px-6 py-4 gap-4">
            <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{item.q}</span>
            <motion.div
              animate={{ rotate: open === i ? 45 : 0 }}
              transition={{ duration: 0.25 }}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full"
              style={{ background: open === i ? '#B6FF2E' : 'rgba(255,255,255,0.08)' }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 2v6M2 5h6" stroke={open === i ? '#0d0d0d' : 'rgba(255,255,255,0.6)'} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </motion.div>
          </div>
          <AnimatePresence>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <p className="px-6 pb-4 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{item.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

// ── Stat Counter ───────────────────────────────────────────────────────────

function StatCard({ value, label, delay }: { value: string; label: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-1 p-6 rounded-2xl border"
      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <span className="text-4xl font-light tracking-tight" style={{ color: '#B6FF2E', letterSpacing: '-0.03em' }}>{value}</span>
      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
    </motion.div>
  )
}

// ── Main Homepage ──────────────────────────────────────────────────────────

export function WingspanHomepage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const vizRef = useRef<HTMLDivElement>(null)
  const [vizProgress, setVizProgress] = useState(0)
  const vizInView = useInView(vizRef, { margin: '-20% 0px' })

  const { scrollYProgress } = useScroll({ target: containerRef })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.12], [0, -40])

  // Animate constellation as scroll progresses through viz section
  useEffect(() => {
    if (!vizInView) return
    const handle = setInterval(() => {
      setVizProgress(p => Math.min(p + 0.015, 1))
    }, 30)
    return () => clearInterval(handle)
  }, [vizInView])

  return (
    <div ref={containerRef} className="min-h-screen" style={{ background: '#0d0d0d', color: '#f0f0f0' }}>
      <Nav />

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden"
      >
        {/* Background ambient */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `
            radial-gradient(ellipse 70% 55% at 50% -10%, rgba(182,255,46,0.08) 0%, transparent 65%),
            radial-gradient(ellipse 50% 40% at 80% 80%, rgba(96,165,250,0.05) 0%, transparent 60%),
            radial-gradient(ellipse 40% 35% at 10% 70%, rgba(167,139,250,0.04) 0%, transparent 55%)
          `
        }} />

        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
          {[20, 40, 60, 80].map(pct => (
            <div key={pct} className="absolute left-0 right-0 h-px" style={{
              top: `${pct}%`,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04) 20%, rgba(255,255,255,0.04) 80%, transparent)'
            }} />
          ))}
          {[25, 50, 75].map(pct => (
            <div key={pct} className="absolute top-0 bottom-0 w-px" style={{
              left: `${pct}%`,
              background: 'linear-gradient(0deg, transparent, rgba(255,255,255,0.04) 20%, rgba(255,255,255,0.04) 80%, transparent)'
            }} />
          ))}
        </div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center gap-8"
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase"
            style={{ borderColor: 'rgba(182,255,46,0.25)', color: '#B6FF2E', background: 'rgba(182,255,46,0.06)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#B6FF2E] animate-pulse" />
            Career Intelligence
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-[clamp(2.8rem,8vw,5.5rem)] font-light leading-[1.0] tracking-tight"
            style={{ color: '#f5f5f5', letterSpacing: '-0.04em' }}
          >
            Design a career<br />
            <span style={{ color: '#B6FF2E' }}>that keeps evolving.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-xl text-lg font-light leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '-0.01em' }}
          >
            Wingspan helps you understand where you are,
            discover where you can go, and guides every step in between.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link
              href="/wingspan"
              className="px-8 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: '#B6FF2E', color: '#0d0d0d', boxShadow: '0 0 0 0 rgba(182,255,46,0)' }}
            >
              Start Your Career Journey
            </Link>
            <Link
              href="#how"
              className="px-8 py-3.5 rounded-2xl text-sm font-medium border transition-all duration-200 hover:-translate-y-0.5"
              style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)' }}
            >
              See How It Works
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ color: 'rgba(255,255,255,0.2)' }}
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 9l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* ── CHAPTER 1 — The Gap ── */}
      <section id="how" className="px-6 py-32 max-w-3xl mx-auto">
        <Chapter>
          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-5">
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>The Gap</p>
              <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-light leading-tight" style={{ letterSpacing: '-0.03em', color: '#f5f5f5' }}>
                Life changes.<br />
                Jobs change.<br />
                Technology changes.
              </h2>
              <p className="text-xl font-light" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '-0.01em' }}>
                Why should your career stay frozen in a PDF?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Most platforms', desc: 'Help you apply for jobs', icon: '📄', dim: true },
                { label: 'Wingspan', desc: 'Helps you continuously design your career', icon: '◈', dim: false },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl border flex flex-col gap-3"
                  style={{
                    background: item.dim ? 'rgba(255,255,255,0.02)' : 'rgba(182,255,46,0.04)',
                    borderColor: item.dim ? 'rgba(255,255,255,0.06)' : 'rgba(182,255,46,0.18)',
                  }}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="text-xs font-semibold tracking-wider uppercase mb-1" style={{ color: item.dim ? 'rgba(255,255,255,0.2)' : '#B6FF2E' }}>{item.label}</p>
                    <p className="text-base font-medium" style={{ color: item.dim ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.8)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Chapter>
      </section>

      {/* ── CHAPTER 2 — Your Resume vs Your Career ── */}
      <section className="px-6 py-24 max-w-3xl mx-auto border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <Chapter>
          <div className="flex flex-col gap-8">
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>The Distinction</p>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>Your resume</p>
                <p className="text-2xl font-light leading-snug" style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '-0.02em' }}>
                  tells people what you&apos;ve done.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#B6FF2E' }}>Your career</p>
                <p className="text-2xl font-light leading-snug" style={{ color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.02em' }}>
                  tells the story of who you&apos;re becoming.
                </p>
              </div>
            </div>
          </div>
        </Chapter>
      </section>

      {/* ── CHAPTER 3 — Constellation Viz ── */}
      <section ref={vizRef} className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <Chapter>
            <p className="text-xs font-semibold tracking-widest uppercase text-center mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>How It Understands You</p>
            <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-light leading-tight text-center max-w-2xl mx-auto mb-12" style={{ letterSpacing: '-0.03em', color: '#f5f5f5' }}>
              Upload your resume.<br />
              Watch your career come alive.
            </h2>
          </Chapter>

          <div className="relative">
            {/* Viz container */}
            <div className="relative w-full mx-auto" style={{ height: '480px', maxWidth: '600px' }}>
              <div className="absolute inset-0 rounded-3xl overflow-hidden border" style={{
                borderColor: 'rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.01)',
              }}>
                <ConstellationViz progress={vizProgress} />
              </div>

              {/* Legend */}
              <div className="absolute bottom-6 left-6 flex flex-wrap gap-3">
                {Object.entries(NODE_COLORS).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.35)' }}>{type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* What it detects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-10 max-w-3xl mx-auto">
              {[
                { icon: '◆', label: 'Your strengths', color: '#B6FF2E' },
                { icon: '◈', label: 'Deep experience signals', color: '#60A5FA' },
                { icon: '◉', label: 'Hidden skills', color: '#A78BFA' },
                { icon: '▲', label: 'Achievements & impact', color: '#F59E0B' },
                { icon: '●', label: 'Career trajectory', color: '#34D399' },
                { icon: '◇', label: 'Untapped potential', color: '#FB923C' },
              ].map((item, i) => (
                <Chapter key={i} delay={i * 0.08}>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                    <span className="text-sm" style={{ color: item.color }}>{item.icon}</span>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
                  </div>
                </Chapter>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CHAPTER 4 — Career Alpha ── */}
      <section className="px-6 py-24 max-w-3xl mx-auto border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <Chapter>
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>Then It Goes Further</p>
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-light leading-tight mb-10" style={{ letterSpacing: '-0.03em', color: '#f5f5f5' }}>
            It understands the market.<br />Not just you.
          </h2>
        </Chapter>

        <div className="flex flex-col gap-3">
          {[
            { text: 'Where your career stands today', color: '#B6FF2E', delay: 0 },
            { text: 'What opportunities fit you specifically', color: '#60A5FA', delay: 0.06 },
            { text: "What's shifting in the market right now", color: '#A78BFA', delay: 0.12 },
            { text: 'Which skills will matter most in 18 months', color: '#F59E0B', delay: 0.18 },
            { text: 'Where you have an unfair advantage', color: '#34D399', delay: 0.24 },
            { text: "Where you're quietly falling behind", color: '#FB923C', delay: 0.30 },
          ].map((item, i) => (
            <InsightPill key={i} icon="→" text={item.text} color={item.color} delay={item.delay} />
          ))}
        </div>
      </section>

      {/* ── CHAPTER 5 — Living Companion ── */}
      <section className="px-6 py-24 max-w-3xl mx-auto border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <Chapter>
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>Not a Report</p>
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-light leading-tight mb-4" style={{ letterSpacing: '-0.03em', color: '#f5f5f5' }}>
            A living career companion.
          </h2>
          <p className="text-lg font-light mb-10" style={{ color: 'rgba(255,255,255,0.35)' }}>
            One that evolves every time you do.
          </p>
        </Chapter>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { event: 'Finish a project', icon: '◆' },
            { event: 'Learn something new', icon: '◈' },
            { event: 'Receive feedback', icon: '◉' },
            { event: 'Change roles', icon: '▲' },
            { event: 'Explore opportunities', icon: '●' },
            { event: 'Build something', icon: '◇' },
          ].map((item, i) => (
            <Chapter key={i} delay={i * 0.07}>
              <div
                className="flex flex-col gap-2 p-4 rounded-2xl border text-center"
                style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
              >
                <span className="text-lg" style={{ color: '#B6FF2E' }}>{item.icon}</span>
                <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.event}</span>
              </div>
            </Chapter>
          ))}
        </div>
      </section>

      {/* ── CHAPTER 6 — Roles ── */}
      <section className="px-6 py-24 max-w-3xl mx-auto border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <Chapter>
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>Your Companion</p>
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-light leading-tight mb-10" style={{ letterSpacing: '-0.03em', color: '#f5f5f5' }}>
            It doesn&apos;t tell you what&apos;s wrong.<br />
            It helps you move forward.
          </h2>
        </Chapter>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { role: 'Mentor', desc: 'Guides without prescribing', color: '#B6FF2E' },
            { role: 'Strategist', desc: 'Sees the board, not just the move', color: '#60A5FA' },
            { role: 'Coach', desc: 'Pushes when it matters', color: '#A78BFA' },
            { role: 'Learning Partner', desc: 'Grows alongside you', color: '#34D399' },
            { role: 'Career Navigator', desc: 'Reads the terrain ahead', color: '#F59E0B' },
            { role: 'Intelligence Engine', desc: 'Sees what you cannot', color: '#FB923C' },
          ].map((item, i) => (
            <Chapter key={i} delay={i * 0.06}>
              <div
                className="flex flex-col gap-2 p-5 rounded-2xl border h-full"
                style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
              >
                <span className="text-xs font-bold tracking-wider uppercase" style={{ color: item.color }}>{item.role}</span>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.desc}</span>
              </div>
            </Chapter>
          ))}
        </div>
      </section>

      {/* ── CHAPTER 7 — Monday Morning ── */}
      <section className="px-6 py-24 max-w-3xl mx-auto border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <Chapter>
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>Monday Morning</p>
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-light leading-tight mb-4" style={{ letterSpacing: '-0.03em', color: '#f5f5f5' }}>
            Instead of asking<br />
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>"What should I do?"</span>
          </h2>
          <p className="text-lg font-light mb-10" style={{ color: 'rgba(255,255,255,0.35)' }}>
            You see.
          </p>
        </Chapter>

        <div className="flex flex-col gap-3">
          <MondayCard line="Here's what changed this week." delay={0} />
          <MondayCard line="Your dream companies are hiring." sub="Your profile now matches 92%." delay={0.08} />
          <MondayCard line="One project could significantly improve your chances." delay={0.16} />
          <MondayCard line="This skill is becoming critical in your market." delay={0.24} />
          <MondayCard line="You've completed 68% of your current growth journey." delay={0.32} />
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="px-6 py-24 max-w-3xl mx-auto border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="grid grid-cols-3 gap-4">
          <StatCard value="6" label="phases of analysis" delay={0} />
          <StatCard value="3" label="career bets generated" delay={0.08} />
          <StatCard value="<60s" label="full Blueprint time" delay={0.16} />
        </div>
      </section>

      {/* ── HOW IT WORKS — Timeline ── */}
      <section className="px-6 py-24 max-w-3xl mx-auto border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <Chapter>
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>The Journey</p>
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-light leading-tight mb-12" style={{ letterSpacing: '-0.03em', color: '#f5f5f5' }}>
            From resume to roadmap.
          </h2>
        </Chapter>

        <div className="relative flex flex-col gap-0">
          <div className="absolute left-5 top-0 bottom-0 w-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          {[
            { step: '01', label: 'Upload', desc: 'Resume, portfolio, LinkedIn — anything that tells your story', color: '#B6FF2E' },
            { step: '02', label: 'Extract', desc: 'Every role, project, skill, and signal pulled and structured (~10s)', color: '#60A5FA' },
            { step: '03', label: 'Analyse', desc: 'Career Alpha runs across 5 dimensions — market, futures, human advantage, ROI, signal', color: '#A78BFA' },
            { step: '04', label: 'Blueprint', desc: '3 career bets, gap analysis, growth roadmap, positioning strategy', color: '#F59E0B' },
            { step: '05', label: 'Evolve', desc: 'Daily learning experiences guided by your Blueprint. Refine as you grow.', color: '#34D399' },
          ].map((item, i) => (
            <Chapter key={i} delay={i * 0.1}>
              <div className="flex gap-8 pb-10 relative">
                <div
                  className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ background: item.color, color: '#0d0d0d' }}
                >
                  {item.step}
                </div>
                <div className="flex flex-col gap-1 pt-1.5">
                  <p className="text-base font-semibold" style={{ color: '#f5f5f5' }}>{item.label}</p>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.desc}</p>
                </div>
              </div>
            </Chapter>
          ))}
        </div>
      </section>

      {/* ── PRICING PREVIEW ── */}
      <section className="px-6 py-24 max-w-3xl mx-auto border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <Chapter>
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>Pricing</p>
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-light leading-tight mb-10" style={{ letterSpacing: '-0.03em', color: '#f5f5f5' }}>
            Start free.<br />Grow with you.
          </h2>
        </Chapter>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              name: 'Blueprint',
              price: 'Free',
              desc: 'Generate your Future Self Blueprint, Career Alpha analysis, and 3 career bets.',
              features: ['CV upload & extraction', 'Full Blueprint generation', 'Career Alpha analysis', 'Gap analysis & roadmap', 'Notion export'],
              cta: 'Start Free',
              href: '/wingspan',
              accent: false,
            },
            {
              name: 'Evolve',
              price: 'Coming soon',
              desc: 'Daily learning experiences guided by your Blueprint, with an AI mentor.',
              features: ['Everything in Blueprint', 'Design Evolution platform', 'Daily learning experiences', 'AI Mentor (Socratic)', 'Progress tracking', 'Blueprint auto-updates'],
              cta: 'Join Waitlist',
              href: '/login',
              accent: true,
            },
          ].map((plan, i) => (
            <Chapter key={i} delay={i * 0.1}>
              <div
                className="flex flex-col gap-6 p-7 rounded-3xl border h-full"
                style={{
                  background: plan.accent ? 'rgba(182,255,46,0.04)' : 'rgba(255,255,255,0.02)',
                  borderColor: plan.accent ? 'rgba(182,255,46,0.2)' : 'rgba(255,255,255,0.07)',
                }}
              >
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-bold tracking-wider uppercase" style={{ color: plan.accent ? '#B6FF2E' : 'rgba(255,255,255,0.3)' }}>{plan.name}</p>
                  <p className="text-3xl font-light" style={{ color: '#f5f5f5', letterSpacing: '-0.03em' }}>{plan.price}</p>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>{plan.desc}</p>
                </div>
                <ul className="flex flex-col gap-2 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2.5 7l3 3 6-6" stroke={plan.accent ? '#B6FF2E' : 'rgba(255,255,255,0.3)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className="w-full py-3 rounded-2xl text-sm font-semibold text-center transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: plan.accent ? '#B6FF2E' : 'rgba(255,255,255,0.07)',
                    color: plan.accent ? '#0d0d0d' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            </Chapter>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 py-24 max-w-3xl mx-auto border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <Chapter>
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>Questions</p>
          <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-light leading-tight mb-10" style={{ letterSpacing: '-0.03em', color: '#f5f5f5' }}>
            The honest answers.
          </h2>
        </Chapter>
        <FAQ />
      </section>

      {/* ── FINAL CTA ── */}
      <section className="px-6 py-32 max-w-3xl mx-auto text-center">
        <Chapter>
          <div className="flex flex-col items-center gap-8">
            <h2 className="text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-tight" style={{ letterSpacing: '-0.04em', color: '#f5f5f5' }}>
              Your career is not<br />
              <span style={{ color: '#B6FF2E' }}>a static document.</span>
            </h2>
            <p className="max-w-md text-lg font-light" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Upload your resume. See yourself clearly. Move forward with confidence.
            </p>
            <Link
              href="/wingspan"
              className="px-10 py-4 rounded-2xl text-base font-semibold transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: '#B6FF2E', color: '#0d0d0d' }}
            >
              Start Your Career Journey
            </Link>
          </div>
        </Chapter>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="px-8 py-8 border-t flex items-center justify-between"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-6">
          <Image src="/brand/LogoColor.svg" alt="Wingspan" width={90} height={22} />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>© 2026 Wingspan</span>
        </div>
        <div className="flex gap-6">
          <Link href="/privacy" className="text-xs transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.25)' }}>Privacy</Link>
          <Link href="/terms" className="text-xs transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.25)' }}>Terms</Link>
          <Link href="/wingspan" className="text-xs transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.25)' }}>Blueprint</Link>
        </div>
      </footer>
    </div>
  )
}
