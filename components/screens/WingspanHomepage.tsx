'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, useScroll, useTransform, useInView, useSpring, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

// ── Spring config ──────────────────────────────────────────────────────────
const SPRING = { ease: [0.16, 1, 0.3, 1] as const }
const SPRING_SLOW = { ease: [0.16, 1, 0.3, 1] as const, duration: 1.1 }

// ── Constellation ──────────────────────────────────────────────────────────
interface Node { id: string; x: number; y: number; label: string; type: 'skill'|'project'|'milestone'|'opportunity'; size: number; delay: number }
const NODES: Node[] = [
  { id:'n1', x:50, y:44, label:'UX Leadership', type:'skill', size:14, delay:0 },
  { id:'n2', x:28, y:30, label:'Design Systems', type:'skill', size:10, delay:0.2 },
  { id:'n3', x:72, y:27, label:'AI Product', type:'opportunity', size:12, delay:0.4 },
  { id:'n4', x:20, y:60, label:'Airline App', type:'project', size:9, delay:0.6 },
  { id:'n5', x:78, y:62, label:'Chief Design Officer', type:'milestone', size:11, delay:0.8 },
  { id:'n6', x:42, y:72, label:'Agentic UX', type:'opportunity', size:9, delay:1.0 },
  { id:'n7', x:62, y:74, label:'Team of 12', type:'project', size:8, delay:1.2 },
  { id:'n8', x:35, y:17, label:'Figma Mastery', type:'skill', size:8, delay:1.4 },
  { id:'n9', x:85, y:42, label:'Executive Presence', type:'milestone', size:10, delay:1.6 },
  { id:'n10', x:15, y:82, label:'User Research', type:'skill', size:9, delay:1.8 },
]
const EDGES = [['n1','n2'],['n1','n3'],['n1','n5'],['n1','n6'],['n2','n4'],['n2','n8'],['n3','n9'],['n3','n7'],['n4','n10'],['n5','n9'],['n6','n7']]
const NODE_COLORS = { skill:'#B6FF2E', project:'#60A5FA', milestone:'#F59E0B', opportunity:'#A78BFA' }

function ConstellationViz({ progress }: { progress: number }) {
  const [pulseNode, setPulseNode] = useState(0)
  useEffect(() => {
    if (progress < 0.3) return
    const t = setInterval(() => setPulseNode(n => (n + 1) % NODES.length), 1800)
    return () => clearInterval(t)
  }, [progress])

  return (
    <div className="relative w-full h-full">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {EDGES.map(([aId, bId], i) => {
          const a = NODES.find(n => n.id === aId)!
          const b = NODES.find(n => n.id === bId)!
          const ep = Math.max(0, Math.min(1, (progress - 0.1) * 3 - i * 0.04))
          return (
            <motion.line key={`${aId}-${bId}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="rgba(182,255,46,0.15)" strokeWidth="0.25"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: ep, opacity: ep * 0.7 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          )
        })}
        {NODES.map((node, idx) => {
          const np = Math.max(0, Math.min(1, (progress - node.delay * 0.07) * 4))
          const color = NODE_COLORS[node.type]
          const isPulsing = pulseNode === idx && progress > 0.3
          return (
            <g key={node.id}>
              {/* Pulse ring */}
              <motion.circle cx={node.x} cy={node.y} r={node.size * 1.2}
                fill="none" stroke={color} strokeWidth="0.15"
                animate={isPulsing ? { r: [node.size * 0.8, node.size * 2.5], opacity: [0.4, 0] } : { opacity: 0 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
              />
              {/* Outer ring */}
              <motion.circle cx={node.x} cy={node.y} r={node.size * 0.85}
                fill="none" stroke={color} strokeWidth="0.18"
                initial={{ scale: 0 }} animate={{ scale: np, opacity: np * 0.25 }}
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
              />
              {/* Core */}
              <motion.circle cx={node.x} cy={node.y} r={node.size * 0.32}
                fill={color}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: np, opacity: np * 0.95 }}
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                transition={{ delay: node.delay * 0.07, duration: 0.5, ease: [0.16,1,0.3,1] }}
              />
              {np > 0.7 && (
                <motion.text x={node.x} y={node.y + node.size * 0.55 + 1.6}
                  textAnchor="middle" fill={color} fontSize="1.7"
                  opacity={np * 0.6} fontFamily="system-ui"
                  style={{ pointerEvents: 'none' }}>
                  {node.label}
                </motion.text>
              )}
            </g>
          )
        })}
      </svg>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 55% 55% at 50% 50%, rgba(182,255,46,${0.05 * progress}) 0%, transparent 70%)` }} />
    </div>
  )
}

// ── Animated Background ────────────────────────────────────────────────────
function Background() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Layer 1: mesh gradients — visible */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse 80% 60% at 15% -10%, rgba(182,255,46,0.12) 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 85% 15%, rgba(96,165,250,0.09) 0%, transparent 55%),
          radial-gradient(ellipse 50% 40% at 10% 85%, rgba(167,139,250,0.07) 0%, transparent 50%),
          radial-gradient(ellipse 40% 35% at 90% 80%, rgba(182,255,46,0.06) 0%, transparent 50%)
        `
      }} />
      {/* Layer 2: slow animated blobs */}
      <motion.div className="absolute"
        animate={{ x: [0, 80, -40, 0], y: [0, -60, 80, 0], scale: [1, 1.3, 0.9, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: 700, height: 700, top: '-15%', left: '-15%',
          background: 'radial-gradient(ellipse, rgba(182,255,46,0.08) 0%, transparent 65%)',
          filter: 'blur(50px)' }}
      />
      <motion.div className="absolute"
        animate={{ x: [0, -100, 60, 0], y: [0, 80, -40, 0], scale: [1, 0.8, 1.2, 1] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        style={{ width: 600, height: 600, bottom: '-10%', right: '-10%',
          background: 'radial-gradient(ellipse, rgba(96,165,250,0.07) 0%, transparent 65%)',
          filter: 'blur(70px)' }}
      />
      <motion.div className="absolute"
        animate={{ x: [0, 50, -30, 0], y: [0, -40, 60, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 10 }}
        style={{ width: 400, height: 400, top: '40%', left: '40%',
          background: 'radial-gradient(ellipse, rgba(167,139,250,0.06) 0%, transparent 65%)',
          filter: 'blur(60px)' }}
      />
      {/* Layer 3: grid lines */}
      <div className="absolute inset-0" style={{ opacity: 0.5 }}>
        {[20,40,60,80].map(p => (
          <div key={p} className="absolute left-0 right-0 h-px" style={{ top:`${p}%`,
            background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.05) 20%,rgba(255,255,255,0.05) 80%,transparent)' }} />
        ))}
        {[25,50,75].map(p => (
          <div key={p} className="absolute top-0 bottom-0 w-px" style={{ left:`${p}%`,
            background:'linear-gradient(0deg,transparent,rgba(255,255,255,0.05) 20%,rgba(255,255,255,0.05) 80%,transparent)' }} />
        ))}
      </div>
      {/* Layer 4: light sweep */}
      <motion.div className="absolute top-0 left-0 right-0 h-px"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 6, repeat: Infinity, repeatDelay: 10, ease: 'easeInOut' }}
        style={{ background: 'linear-gradient(90deg, transparent, rgba(182,255,46,0.5), transparent)', filter: 'blur(1px)' }}
      />
    </div>
  )
}

// ── Reveal ─────────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, y = 28 }: { children: React.ReactNode; delay?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px' })
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, ...SPRING_SLOW }}>
      {children}
    </motion.div>
  )
}

// ── Masked headline reveal ─────────────────────────────────────────────────
function MaskedHeadline({ children, delay = 0, className = '', style }: { children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px' })
  return (
    <div ref={ref} style={{ clipPath: 'inset(-20% 0 -20% 0)' }}>
      <motion.div className={className} style={style}
        initial={{ y: '110%', opacity: 0 }}
        animate={inView ? { y: 0, opacity: 1 } : {}}
        transition={{ delay, ...SPRING_SLOW }}>
        {children}
      </motion.div>
    </div>
  )
}

// ── Magnetic button ────────────────────────────────────────────────────────
function MagneticButton({ children, href, className, style }: { children: React.ReactNode; href: string; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const x = useSpring(pos.x, { stiffness: 200, damping: 20 })
  const y = useSpring(pos.y, { stiffness: 200, damping: 20 })

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    setPos({ x: (e.clientX - cx) * 0.3, y: (e.clientY - cy) * 0.3 })
  }, [])

  return (
    <motion.a ref={ref} href={href} className={className} style={{ ...style, x, y }}
      onMouseMove={onMouseMove} onMouseLeave={() => setPos({ x: 0, y: 0 })}
      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2, ...SPRING }}>
      {children}
    </motion.a>
  )
}

// ── Glass card ─────────────────────────────────────────────────────────────
function GlassCard({ children, className = '', delay = 0, style }: { children: React.ReactNode; className?: string; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px' })
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.8, delay, ...SPRING }}
      whileHover={{ y: -3, transition: { duration: 0.3, ...SPRING } }}
      className={`relative overflow-hidden ${className}`}
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(4px)',
        boxShadow: '0 1px 1px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.08)',
      }}>
      {/* Top specular edge */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.12) 60%, transparent)' }} />
      {children}
    </motion.div>
  )
}

// ── Nav ────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <motion.nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ...SPRING }}
      style={{
        background: scrolled ? 'rgba(10,10,10,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px) saturate(1.4)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
      }}>
      <Image src="/brand/LogoColor.svg" alt="Wingspan" width={110} height={28} />
      <div className="flex items-center gap-6">
        <motion.a href="/wingspan" className="text-sm font-medium"
          style={{ color: 'rgba(255,255,255,0.45)' }}
          whileHover={{ color: 'rgba(255,255,255,0.85)' }}
          transition={{ duration: 0.2 }}>
          Try Blueprint
        </motion.a>
        <MagneticButton href="/login"
          className="px-5 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#B6FF2E', color: '#0d0d0d' }}>
          Sign in
        </MagneticButton>
      </div>
    </motion.nav>
  )
}

// ── Hero ───────────────────────────────────────────────────────────────────
function Hero() {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 0.15], [0, -50])
  const opacity = useTransform(scrollYProgress, [0, 0.12], [1, 0])

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20 overflow-hidden">
      <motion.div style={{ y, opacity }} className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center gap-10">
        {/* Eyebrow */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ...SPRING }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase"
          style={{ borderColor: 'rgba(182,255,46,0.2)', color: '#B6FF2E', background: 'rgba(182,255,46,0.05)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#B6FF2E] animate-pulse" />
          Career Intelligence
        </motion.div>

        {/* Headline */}
        <div className="flex flex-col items-center gap-2">
          <div style={{ clipPath: 'inset(-20% 0 -20% 0)' }}>
            <motion.h1 initial={{ y: '110%' }} animate={{ y: 0 }}
              transition={{ delay: 0.55, ...SPRING_SLOW }}
              className="text-[clamp(2.8rem,8vw,5.5rem)] font-extralight"
              style={{ color: '#f5f5f5', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
              Design a career
            </motion.h1>
          </div>
          <div style={{ clipPath: 'inset(-20% 0 -20% 0)' }}>
            <motion.h1 initial={{ y: '110%' }} animate={{ y: 0 }}
              transition={{ delay: 0.7, ...SPRING_SLOW }}
              className="text-[clamp(2.8rem,8vw,5.5rem)] font-extralight"
              style={{ color: '#B6FF2E', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
              that keeps evolving.
            </motion.h1>
          </div>
        </div>

        {/* Subheadline */}
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.9, ...SPRING }}
          className="max-w-lg text-lg font-light leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '-0.01em' }}>
          Wingspan helps you understand where you are,
          discover where you can go, and guides every step in between.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1, ...SPRING }}
          className="flex flex-col sm:flex-row items-center gap-4">
          <MagneticButton href="/wingspan"
            className="px-9 py-3.5 rounded-2xl text-sm font-semibold"
            style={{ background: '#B6FF2E', color: '#0d0d0d' }}>
            Start Your Career Journey
          </MagneticButton>
          <MagneticButton href="#how"
            className="px-9 py-3.5 rounded-2xl text-sm font-medium border"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
            See How It Works
          </MagneticButton>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ color: 'rgba(255,255,255,0.18)' }}>
        <span className="text-[10px] tracking-[0.2em] uppercase">Scroll</span>
        <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2.5 8l4.5 4 4.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </motion.div>
    </section>
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
  const [open, setOpen] = useState<number|null>(null)
  return (
    <div className="flex flex-col gap-2">
      {FAQS.map((item, i) => (
        <GlassCard key={i} className="rounded-2xl cursor-pointer" delay={i * 0.04} >
          <div onClick={() => setOpen(open === i ? null : i)}>
            <div className="flex items-center justify-between px-6 py-4 gap-4">
              <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{item.q}</span>
              <motion.div animate={{ rotate: open === i ? 45 : 0 }} transition={{ duration: 0.25 }}
                className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full"
                style={{ background: open === i ? '#B6FF2E' : 'rgba(255,255,255,0.07)' }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 2v6M2 5h6" stroke={open === i ? '#0d0d0d' : 'rgba(255,255,255,0.5)'} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </motion.div>
            </div>
            <AnimatePresence>
              {open === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ...SPRING }}
                  className="overflow-hidden">
                  <p className="px-6 pb-4 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>
      ))}
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
export function WingspanHomepage() {
  const vizRef = useRef<HTMLDivElement>(null)
  const vizInView = useInView(vizRef, { margin: '-20% 0px' })
  const [vizProgress, setVizProgress] = useState(0)

  useEffect(() => {
    if (!vizInView) return
    const h = setInterval(() => setVizProgress(p => Math.min(p + 0.012, 1)), 30)
    return () => clearInterval(h)
  }, [vizInView])

  return (
    <div className="min-h-screen relative" style={{ background: '#0a0a0a', color: '#f0f0f0' }}>
      <Background />
      <div className="relative z-10">
        <Nav />
        <Hero />

        {/* ── The Gap ── */}
        <section id="how" className="px-6 py-32 max-w-3xl mx-auto">
          <Reveal>
            <p className="text-xs font-semibold tracking-widest uppercase mb-6" style={{ color: 'rgba(255,255,255,0.2)' }}>The Gap</p>
          </Reveal>
          <div className="flex flex-col gap-6">
            {['Life changes.', 'Jobs change.', 'Technology changes.'].map((line, i) => (
              <MaskedHeadline key={line} delay={i * 0.12}
                className="text-[clamp(2.2rem,5vw,4rem)] font-extralight"
                style={{ letterSpacing: '-0.03em', color: i < 2 ? 'rgba(255,255,255,0.5)' : '#f5f5f5' } as React.CSSProperties}>
                {line}
              </MaskedHeadline>
            ))}
            <Reveal delay={0.4}>
              <p className="text-xl font-light mt-4" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '-0.01em' }}>
                Why should your career stay frozen in a PDF?
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-14">
            {[
              { label: 'Most platforms', desc: 'Help you apply for jobs', dim: true },
              { label: 'Wingspan', desc: 'Helps you continuously design your career', dim: false },
            ].map((item, i) => (
              <GlassCard key={i} className="p-6 rounded-2xl" delay={i * 0.1}>
                <p className="text-xs font-bold tracking-wider uppercase mb-2"
                  style={{ color: item.dim ? 'rgba(255,255,255,0.18)' : '#B6FF2E' }}>{item.label}</p>
                <p className="text-base font-medium"
                  style={{ color: item.dim ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)' }}>{item.desc}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* ── Distinction ── */}
        <section className="px-6 py-24 max-w-3xl mx-auto border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <Reveal>
            <p className="text-xs font-semibold tracking-widest uppercase mb-8" style={{ color: 'rgba(255,255,255,0.2)' }}>The Distinction</p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: 'rgba(255,255,255,0.18)' }}>Your resume</p>
                <p className="text-2xl font-light leading-snug" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '-0.02em' }}>
                  tells people what you&apos;ve done.
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: '#B6FF2E' }}>Your career</p>
                <p className="text-2xl font-light leading-snug" style={{ color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.02em' }}>
                  tells the story of who you&apos;re becoming.
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── Constellation ── */}
        <section ref={vizRef} className="px-6 py-24">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <p className="text-xs font-semibold tracking-widest uppercase text-center mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>How It Understands You</p>
            </Reveal>
            <MaskedHeadline delay={0.1} className="text-[clamp(1.8rem,4vw,3rem)] font-extralight leading-tight text-center max-w-2xl mx-auto mb-14"
              style={{ letterSpacing: '-0.03em', color: '#f5f5f5' } as React.CSSProperties}>
              Upload your resume.<br />Watch your career come alive.
            </MaskedHeadline>

            <div className="relative max-w-xl mx-auto">
              <GlassCard className="rounded-3xl overflow-hidden" style={{ height: '460px' }}>
                <ConstellationViz progress={vizProgress} />
                <div className="absolute bottom-5 left-5 flex flex-wrap gap-3">
                  {Object.entries(NODE_COLORS).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                      <span className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.3)' }}>{type}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-10 max-w-3xl mx-auto">
              {[
                { icon: '◆', label: 'Your strengths', color: '#B6FF2E' },
                { icon: '◈', label: 'Deep experience signals', color: '#60A5FA' },
                { icon: '◉', label: 'Hidden skills', color: '#A78BFA' },
                { icon: '▲', label: 'Achievements & impact', color: '#F59E0B' },
                { icon: '●', label: 'Career trajectory', color: '#34D399' },
                { icon: '◇', label: 'Untapped potential', color: '#FB923C' },
              ].map((item, i) => (
                <GlassCard key={i} className="p-3 rounded-xl" delay={i * 0.06}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm" style={{ color: item.color }}>{item.icon}</span>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>{item.label}</span>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* ── Then It Goes Further ── */}
        <section className="px-6 py-24 max-w-3xl mx-auto border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <Reveal><p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>Then It Goes Further</p></Reveal>
          <MaskedHeadline delay={0.1} className="text-[clamp(1.8rem,4vw,3rem)] font-extralight leading-tight mb-12" style={{ letterSpacing: '-0.03em', color: '#f5f5f5' } as React.CSSProperties}>
            It understands the market.<br />Not just you.
          </MaskedHeadline>
          <div className="flex flex-col gap-2.5">
            {[
              { text: 'Where your career stands today', color: '#B6FF2E' },
              { text: 'What opportunities fit you specifically', color: '#60A5FA' },
              { text: "What's shifting in the market right now", color: '#A78BFA' },
              { text: 'Which skills will matter most in 18 months', color: '#F59E0B' },
              { text: 'Where you have an unfair advantage', color: '#34D399' },
              { text: "Where you're quietly falling behind", color: '#FB923C' },
            ].map((item, i) => (
              <GlassCard key={i} className="rounded-xl" delay={i * 0.05}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{item.text}</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* ── Living Companion ── */}
        <section className="px-6 py-24 max-w-3xl mx-auto border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <Reveal><p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>Not a Report</p></Reveal>
          <MaskedHeadline delay={0.1} className="text-[clamp(1.8rem,4vw,3rem)] font-extralight leading-tight mb-4" style={{ letterSpacing: '-0.03em', color: '#f5f5f5' } as React.CSSProperties}>
            A living career companion.
          </MaskedHeadline>
          <Reveal delay={0.2}><p className="text-lg font-light mb-10" style={{ color: 'rgba(255,255,255,0.3)' }}>One that evolves every time you do.</p></Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {['Finish a project','Learn something new','Receive feedback','Change roles','Explore opportunities','Build something'].map((event, i) => (
              <GlassCard key={i} className="p-4 rounded-2xl text-center" delay={i * 0.06}>
                <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>{event}</span>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* ── Roles ── */}
        <section className="px-6 py-24 max-w-3xl mx-auto border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <Reveal><p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>Your Companion</p></Reveal>
          <MaskedHeadline delay={0.1} className="text-[clamp(1.8rem,4vw,3rem)] font-extralight leading-tight mb-12" style={{ letterSpacing: '-0.03em', color: '#f5f5f5' } as React.CSSProperties}>
            It doesn&apos;t tell you what&apos;s wrong.<br />It helps you move forward.
          </MaskedHeadline>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { role:'Mentor', desc:'Guides without prescribing', color:'#B6FF2E' },
              { role:'Strategist', desc:'Sees the board, not just the move', color:'#60A5FA' },
              { role:'Coach', desc:'Pushes when it matters', color:'#A78BFA' },
              { role:'Learning Partner', desc:'Grows alongside you', color:'#34D399' },
              { role:'Career Navigator', desc:'Reads the terrain ahead', color:'#F59E0B' },
              { role:'Intelligence Engine', desc:'Sees what you cannot', color:'#FB923C' },
            ].map((item, i) => (
              <GlassCard key={i} className="p-5 rounded-2xl" delay={i * 0.06}>
                <p className="text-xs font-bold tracking-wider uppercase mb-1.5" style={{ color: item.color }}>{item.role}</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>{item.desc}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* ── Monday Morning ── */}
        <section className="px-6 py-24 max-w-3xl mx-auto border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <Reveal><p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>Monday Morning</p></Reveal>
          <MaskedHeadline delay={0.1} className="text-[clamp(1.8rem,4vw,3rem)] font-extralight leading-tight mb-4" style={{ letterSpacing: '-0.03em', color: '#f5f5f5' } as React.CSSProperties}>
            Instead of asking<br /><span style={{ color: 'rgba(255,255,255,0.25)' }}>&ldquo;What should I do?&rdquo;</span>
          </MaskedHeadline>
          <Reveal delay={0.2}><p className="text-lg font-light mb-10" style={{ color: 'rgba(255,255,255,0.3)' }}>You see.</p></Reveal>
          <div className="flex flex-col gap-3">
            {[
              { line:"Here's what changed this week.", sub: undefined },
              { line:"Your dream companies are hiring.", sub:"Your profile now matches 92%." },
              { line:"One project could significantly improve your chances.", sub: undefined },
              { line:"This skill is becoming critical in your market.", sub: undefined },
              { line:"You've completed 68% of your current growth journey.", sub: undefined },
            ].map((item, i) => (
              <GlassCard key={i} className="rounded-2xl" delay={i * 0.08}>
                <div className="px-5 py-4"
                  style={{ background: 'rgba(182,255,46,0.035)', borderColor: 'rgba(182,255,46,0.12)' }}>
                  <p className="text-sm font-medium" style={{ color: '#B6FF2E' }}>{item.line}</p>
                  {item.sub && <p className="text-xs mt-1" style={{ color: 'rgba(182,255,46,0.45)' }}>{item.sub}</p>}
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="px-6 py-20 max-w-3xl mx-auto border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value:'6', label:'phases of analysis' },
              { value:'3', label:'career bets generated' },
              { value:'<60s', label:'full Blueprint time' },
            ].map((s, i) => (
              <GlassCard key={i} className="p-6 rounded-2xl" delay={i * 0.08}>
                <p className="text-4xl font-light mb-1" style={{ color: '#B6FF2E', letterSpacing: '-0.03em' }}>{s.value}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="px-6 py-24 max-w-3xl mx-auto border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <Reveal><p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>The Journey</p></Reveal>
          <MaskedHeadline delay={0.1} className="text-[clamp(1.8rem,4vw,3rem)] font-extralight leading-tight mb-14" style={{ letterSpacing: '-0.03em', color: '#f5f5f5' } as React.CSSProperties}>
            From resume to roadmap.
          </MaskedHeadline>
          <div className="relative flex flex-col">
            <div className="absolute left-5 top-0 bottom-0 w-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
            {[
              { step:'01', label:'Upload', desc:'Resume, portfolio, LinkedIn — anything that tells your story', color:'#B6FF2E' },
              { step:'02', label:'Extract', desc:'Every role, project, skill, and signal pulled and structured (~10s)', color:'#60A5FA' },
              { step:'03', label:'Analyse', desc:'Career Alpha runs across 5 dimensions — market, futures, human advantage, ROI, signal', color:'#A78BFA' },
              { step:'04', label:'Blueprint', desc:'3 career bets, gap analysis, growth roadmap, positioning strategy', color:'#F59E0B' },
              { step:'05', label:'Evolve', desc:'Daily learning experiences guided by your Blueprint. Refine as you grow.', color:'#34D399' },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="flex gap-8 pb-10">
                  <div className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{ background: item.color, color: '#0d0d0d' }}>{item.step}</div>
                  <div className="pt-1.5">
                    <p className="text-base font-semibold mb-0.5" style={{ color: '#f5f5f5' }}>{item.label}</p>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className="px-6 py-24 max-w-3xl mx-auto border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <Reveal><p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>Pricing</p></Reveal>
          <MaskedHeadline delay={0.1} className="text-[clamp(1.8rem,4vw,3rem)] font-extralight leading-tight mb-10" style={{ letterSpacing: '-0.03em', color: '#f5f5f5' } as React.CSSProperties}>
            Start free.<br />Grow with you.
          </MaskedHeadline>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name:'Blueprint', price:'Free', desc:'Generate your Future Self Blueprint, Career Alpha analysis, and 3 career bets.',
                features:['CV upload & extraction','Full Blueprint generation','Career Alpha analysis','Gap analysis & roadmap','Notion export'],
                cta:'Start Free', href:'/wingspan', accent:false },
              { name:'Evolve', price:'Coming soon', desc:'Daily learning experiences guided by your Blueprint, with an AI mentor.',
                features:['Everything in Blueprint','Design Evolution platform','Daily learning experiences','AI Mentor (Socratic)','Progress tracking','Blueprint auto-updates'],
                cta:'Join Waitlist', href:'/login', accent:true },
            ].map((plan, i) => (
              <GlassCard key={i} className="p-7 rounded-3xl h-full flex flex-col gap-6" delay={i * 0.1}
                style={{ background: plan.accent ? 'rgba(182,255,46,0.04)' : undefined, borderColor: plan.accent ? 'rgba(182,255,46,0.15)' : undefined } as React.CSSProperties}>
                <div>
                  <p className="text-xs font-bold tracking-wider uppercase mb-1" style={{ color: plan.accent ? '#B6FF2E' : 'rgba(255,255,255,0.25)' }}>{plan.name}</p>
                  <p className="text-3xl font-light mb-1" style={{ color: '#f5f5f5', letterSpacing: '-0.03em' }}>{plan.price}</p>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.32)' }}>{plan.desc}</p>
                </div>
                <ul className="flex flex-col gap-2 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2 6.5l3 3 6-6" stroke={plan.accent ? '#B6FF2E' : 'rgba(255,255,255,0.25)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <MagneticButton href={plan.href}
                  className="w-full py-3 rounded-2xl text-sm font-semibold text-center block"
                  style={{ background: plan.accent ? '#B6FF2E' : 'rgba(255,255,255,0.06)', color: plan.accent ? '#0d0d0d' : 'rgba(255,255,255,0.6)' }}>
                  {plan.cta}
                </MagneticButton>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="px-6 py-24 max-w-3xl mx-auto border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <Reveal><p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>Questions</p></Reveal>
          <MaskedHeadline delay={0.1} className="text-[clamp(1.8rem,4vw,3rem)] font-extralight leading-tight mb-10" style={{ letterSpacing: '-0.03em', color: '#f5f5f5' } as React.CSSProperties}>
            The honest answers.
          </MaskedHeadline>
          <FAQ />
        </section>

        {/* ── Final CTA ── */}
        <section className="px-6 py-32 max-w-3xl mx-auto text-center">
          <div className="flex flex-col items-center gap-8">
            <MaskedHeadline delay={0} className="text-[clamp(2.5rem,6vw,4.5rem)] font-extralight leading-tight" style={{ letterSpacing: '-0.04em', color: '#f5f5f5' } as React.CSSProperties}>
              Your career is not<br /><span style={{ color: '#B6FF2E' }}>a static document.</span>
            </MaskedHeadline>
            <Reveal delay={0.3}>
              <p className="max-w-sm text-lg font-light" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Upload your resume. See yourself clearly. Move forward with confidence.
              </p>
            </Reveal>
            <Reveal delay={0.5}>
              <MagneticButton href="/wingspan"
                className="px-12 py-4 rounded-2xl text-base font-semibold"
                style={{ background: '#B6FF2E', color: '#0d0d0d' }}>
                Start Your Career Journey
              </MagneticButton>
            </Reveal>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="px-8 py-8 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-5">
            <Image src="/brand/LogoColor.svg" alt="Wingspan" width={90} height={22} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>© 2026 Wingspan</span>
          </div>
          <div className="flex gap-5">
            {[{label:'Privacy',href:'/privacy'},{label:'Terms',href:'/terms'},{label:'Blueprint',href:'/wingspan'}].map(l => (
              <motion.a key={l.href} href={l.href} className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}
                whileHover={{ color: 'rgba(255,255,255,0.7)' }} transition={{ duration: 0.2 }}>
                {l.label}
              </motion.a>
            ))}
          </div>
        </footer>
      </div>
    </div>
  )
}
