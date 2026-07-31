'use client'
import { useEffect, useRef } from 'react'

// Seeded random — ensures non-looping but deterministic generation
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

interface Node {
  x: number; y: number; z: number        // z: 0..1 depth
  vx: number; vy: number
  r: number                               // base radius
  brightness: number                      // 0..1
  phase: number                           // oscillation phase offset
  pulseSpeed: number
  clusterId: number
  awakening: number                       // 0=dark 1=fully awake
  awakeDir: number                        // +1 waking, -1 sleeping
  awakeTimer: number
  color: [number, number, number]         // hsl h, s, l
}

interface Edge {
  a: number; b: number
  strength: number                        // 0..1 life
  growing: boolean
  signal: number | null                   // 0..1 position along edge, or null
  signalSpeed: number
  age: number
}

interface InsightEvent {
  type: 'wave' | 'galaxy' | 'broadcast'
  x: number; y: number
  radius: number
  maxRadius: number
  alpha: number
  color: string
}

const PALETTES = [
  [190, 100, 70] as [number, number, number],  // electric cyan
  [220, 90, 75] as [number, number, number],   // soft blue
  [250, 70, 80] as [number, number, number],   // subtle violet
  [200, 80, 90] as [number, number, number],   // white-blue
  [45, 100, 75] as [number, number, number],   // gold (rare)
]

export function UniverseCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const stateRef = useRef<{
    nodes: Node[]
    edges: Edge[]
    events: InsightEvent[]
    t: number
    lastInsight: number
    seed: number
    width: number
    height: number
    dpr: number
    camX: number; camY: number; camDrift: number
    expansion: number
    expansionDir: number
  } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = Math.min(window.devicePixelRatio ?? 1, 2)
    const W = window.innerWidth
    const H = window.innerHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = `${W}px`
    canvas.style.height = `${H}px`
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    const rng = seededRandom(0xf00dbabe)
    const NODE_COUNT = Math.min(Math.floor((W * H) / 3000), 400)

    function mkNode(i: number): Node {
      const z = rng()
      const clusterId = Math.floor(rng() * 8)
      // Slightly attract to cluster centres
      const cx = W * (0.15 + (clusterId % 4) * 0.23)
      const cy = H * (0.2 + Math.floor(clusterId / 4) * 0.6)
      const x = cx + (rng() - 0.5) * W * 0.35
      const y = cy + (rng() - 0.5) * H * 0.45
      const col = PALETTES[Math.floor(rng() * (PALETTES.length - 1))] // gold only via events
      return {
        x: Math.max(0, Math.min(W, x)),
        y: Math.max(0, Math.min(H, y)),
        z,
        vx: (rng() - 0.5) * 0.08 * (1 - z * 0.6),
        vy: (rng() - 0.5) * 0.08 * (1 - z * 0.6),
        r: 0.8 + rng() * 2.5 * (1 - z * 0.5),
        brightness: 0.2 + rng() * 0.8,
        phase: rng() * Math.PI * 2,
        pulseSpeed: 0.003 + rng() * 0.008,
        clusterId,
        awakening: rng() > 0.6 ? 1 : 0,
        awakeDir: rng() > 0.5 ? 1 : -1,
        awakeTimer: rng() * 300,
        color: col,
      }
    }

    const nodes = Array.from({ length: NODE_COUNT }, (_, i) => mkNode(i))

    // Build initial sparse edges
    const edges: Edge[] = []
    const MAX_EDGES = NODE_COUNT * 1.5

    function tryAddEdge() {
      if (edges.length >= MAX_EDGES) return
      const ai = Math.floor(rng() * nodes.length)
      const bi = Math.floor(rng() * nodes.length)
      if (ai === bi) return
      const a = nodes[ai], b = nodes[bi]
      const dx = a.x - b.x, dy = a.y - b.y
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d < 20 || d > Math.min(W, H) * 0.4) return
      edges.push({
        a: ai, b: bi,
        strength: 0,
        growing: true,
        signal: null,
        signalSpeed: 0.003 + rng() * 0.01,
        age: 0,
      })
    }

    for (let i = 0; i < 80; i++) tryAddEdge()

    const events: InsightEvent[] = []
    let t = 0
    let lastInsight = 0
    let camX = 0, camY = 0, camDrift = 0
    let expansion = 1, expansionDir = 0.0002

    stateRef.current = {
      nodes, edges, events, t, lastInsight, seed: 0,
      width: W, height: H, dpr,
      camX, camY, camDrift,
      expansion, expansionDir,
    }

    // Radial vignette to clear center for UI text
    function drawVignette() {
      const cx = W / 2, cy = H / 2
      const r = Math.min(W, H) * 0.48
      const grad = ctx.createRadialGradient(cx, cy, r * 0.25, cx, cy, r * 0.9)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(0.5, 'rgba(0,0,0,0.1)')
      grad.addColorStop(1, 'rgba(0,0,0,0.55)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)
    }

    // Center clear zone — keeps UI readable
    function drawCenterClear() {
      const cx = W / 2, cy = H / 2
      const r = Math.min(W, H) * 0.32
      const grad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r)
      grad.addColorStop(0, 'rgba(10,8,22,0.82)')
      grad.addColorStop(0.6, 'rgba(10,8,22,0.45)')
      grad.addColorStop(1, 'rgba(10,8,22,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)
    }

    function drawNebulaLayer() {
      // Very subtle background nebula blobs
      const positions = [
        [W * 0.15, H * 0.2, W * 0.35, '190,60,25'],
        [W * 0.8, H * 0.75, W * 0.3, '250,50,20'],
        [W * 0.5, H * 0.9, W * 0.4, '220,80,18'],
      ]
      for (const [x, y, r, col] of positions) {
        const grad = ctx.createRadialGradient(x as number, y as number, 0, x as number, y as number, r as number)
        const pulse = 0.03 + 0.01 * Math.sin(t * 0.0005)
        grad.addColorStop(0, `rgba(${col},${pulse + 0.01})`)
        grad.addColorStop(1, `rgba(${col},0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(x as number, y as number, r as number, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    function insightEvent() {
      const types: InsightEvent['type'][] = ['wave', 'galaxy', 'broadcast']
      const type = types[Math.floor(rng() * types.length)]
      const cx = W * (0.2 + rng() * 0.6)
      const cy = H * (0.2 + rng() * 0.6)
      const colChoices = ['rgba(190,230,255,', 'rgba(200,180,255,', 'rgba(255,220,100,']
      const col = colChoices[Math.floor(rng() * colChoices.length)]
      events.push({
        type, x: cx, y: cy,
        radius: 0, maxRadius: Math.min(W, H) * (0.3 + rng() * 0.35),
        alpha: 0.6,
        color: col,
      })

      // Awaken nearby nodes
      for (const node of nodes) {
        const dx = node.x - cx, dy = node.y - cy
        if (Math.sqrt(dx * dx + dy * dy) < Math.min(W, H) * 0.25) {
          node.awakeDir = 1
          node.awakeTimer = 0
          if (type === 'broadcast') {
            node.brightness = Math.min(1, node.brightness + 0.4)
          }
        }
      }
    }

    function render() {
      t++

      // Pause when hidden
      if (document.hidden) {
        animRef.current = requestAnimationFrame(render)
        return
      }

      // Slow camera drift
      camDrift += 0.0003
      camX = Math.sin(camDrift) * W * 0.012
      camY = Math.cos(camDrift * 0.7) * H * 0.008

      // Expansion breath
      expansion += expansionDir
      if (expansion > 1.025 || expansion < 0.978) expansionDir = -expansionDir

      // Clear
      ctx.fillStyle = '#060812'
      ctx.fillRect(0, 0, W, H)

      ctx.save()
      // Camera transform applied to whole scene
      ctx.translate(W / 2 + camX, H / 2 + camY)
      ctx.scale(expansion, expansion)
      ctx.translate(-(W / 2), -(H / 2))

      drawNebulaLayer()

      // Background stars
      ctx.save()
      for (let i = 0; i < 180; i++) {
        const x = ((i * 137.508 + 23) % W)
        const y = ((i * 97.311 + 41) % H)
        const b = 0.15 + ((i % 7) / 7) * 0.35
        const twinkle = b * (0.7 + 0.3 * Math.sin(t * 0.002 + i))
        ctx.fillStyle = `rgba(200,215,255,${twinkle})`
        ctx.beginPath()
        ctx.arc(x, y, 0.6, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()

      // Update + draw edges
      const toRemove: number[] = []
      for (let ei = 0; ei < edges.length; ei++) {
        const e = edges[ei]
        e.age++

        if (e.growing) {
          e.strength += 0.008 + rng() * 0.004
          if (e.strength >= 1) {
            e.strength = 1
            e.growing = false
            e.signal = 0
          }
        } else {
          // Edges live 200-600 frames then dissolve
          if (e.age > 200 + Math.floor(rng() * 400)) {
            e.strength -= 0.005
          }
          if (e.strength <= 0) {
            toRemove.push(ei)
            continue
          }
        }

        const na = nodes[e.a], nb = nodes[e.b]
        const avgZ = (na.z + nb.z) / 2
        const depthAlpha = 0.15 + (1 - avgZ) * 0.4

        // Edge line
        const [h, s, l] = na.color
        ctx.beginPath()
        ctx.moveTo(na.x, na.y)
        ctx.lineTo(nb.x, nb.y)
        ctx.strokeStyle = `hsla(${h},${s}%,${l}%,${depthAlpha * e.strength * 0.4})`
        ctx.lineWidth = 0.5 * (1 - avgZ * 0.4)
        ctx.stroke()

        // Signal pulse
        if (e.signal !== null) {
          e.signal += e.signalSpeed
          if (e.signal > 1) {
            e.signal = null
            // Chance to pass signal to another edge from nb
            if (rng() > 0.4) {
              for (const other of edges) {
                if ((other.a === e.b || other.b === e.b) && other.signal === null) {
                  other.signal = 0
                  break
                }
              }
            }
          } else {
            const sx = na.x + (nb.x - na.x) * e.signal
            const sy = na.y + (nb.y - na.y) * e.signal
            const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, 4)
            grd.addColorStop(0, `hsla(${h},100%,90%,0.9)`)
            grd.addColorStop(1, `hsla(${h},${s}%,${l}%,0)`)
            ctx.fillStyle = grd
            ctx.beginPath()
            ctx.arc(sx, sy, 4, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
      // Remove dead edges (reverse so indices stay valid)
      for (let i = toRemove.length - 1; i >= 0; i--) edges.splice(toRemove[i], 1)

      // Add new edges
      if (t % 12 === 0 && edges.length < MAX_EDGES) tryAddEdge()

      // Draw + update nodes
      for (const node of nodes) {
        // Drift
        node.x += node.vx
        node.y += node.vy
        if (node.x < -20) node.x = W + 20
        if (node.x > W + 20) node.x = -20
        if (node.y < -20) node.y = H + 20
        if (node.y > H + 20) node.y = -20

        // Very gentle cluster gravity
        const cx = W * (0.15 + (node.clusterId % 4) * 0.23)
        const cy = H * (0.2 + Math.floor(node.clusterId / 4) * 0.6)
        node.vx += (cx - node.x) * 0.000015
        node.vy += (cy - node.y) * 0.000015
        // Speed cap
        const spd = Math.sqrt(node.vx * node.vx + node.vy * node.vy)
        if (spd > 0.15) { node.vx *= 0.15 / spd; node.vy *= 0.15 / spd }

        // Awakening
        node.awakeTimer--
        if (node.awakeTimer <= 0) {
          node.awakening += node.awakeDir * 0.003
          if (node.awakening >= 1) { node.awakening = 1; node.awakeDir = -1; node.awakeTimer = 120 + Math.floor(rng() * 400) }
          if (node.awakening <= 0) { node.awakening = 0; node.awakeDir = 1; node.awakeTimer = 60 + Math.floor(rng() * 300) }
        }

        const pulse = 0.5 + 0.5 * Math.sin(t * node.pulseSpeed + node.phase)
        const eff_r = node.r * (0.7 + 0.3 * pulse) * node.awakening
        const eff_a = node.brightness * node.awakening * (0.4 + 0.45 * (1 - node.z)) * pulse
        if (eff_a < 0.02 || eff_r < 0.3) continue

        const [h, s, l] = node.color

        // Outer glow
        const grd = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, eff_r * 3)
        grd.addColorStop(0, `hsla(${h},${s}%,${l}%,${eff_a * 0.5})`)
        grd.addColorStop(1, `hsla(${h},${s}%,${l}%,0)`)
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(node.x, node.y, eff_r * 3, 0, Math.PI * 2)
        ctx.fill()

        // Core dot
        ctx.fillStyle = `hsla(${h},100%,92%,${eff_a})`
        ctx.beginPath()
        ctx.arc(node.x, node.y, eff_r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Insight events
      if (t - lastInsight > (900 + Math.floor(rng() * 900))) {
        insightEvent()
        lastInsight = t
      }
      const aliveEvents: InsightEvent[] = []
      for (const ev of events) {
        ev.radius += 2.5
        ev.alpha -= 0.004
        if (ev.alpha <= 0) continue
        aliveEvents.push(ev)
        ctx.beginPath()
        ctx.arc(ev.x, ev.y, ev.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `${ev.color}${ev.alpha.toFixed(2)})`
        ctx.lineWidth = 1.2
        ctx.stroke()
        // Inner ring
        if (ev.radius > 30) {
          ctx.beginPath()
          ctx.arc(ev.x, ev.y, ev.radius * 0.55, 0, Math.PI * 2)
          ctx.strokeStyle = `${ev.color}${(ev.alpha * 0.35).toFixed(2)})`
          ctx.lineWidth = 0.6
          ctx.stroke()
        }
      }
      events.length = 0
      for (const ev of aliveEvents) events.push(ev)

      ctx.restore()

      drawCenterClear()
      drawVignette()

      animRef.current = requestAnimationFrame(render)
    }

    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!prefersReduced) {
      animRef.current = requestAnimationFrame(render)
    } else {
      // Static fallback: just draw dark bg with subtle gradient
      ctx.fillStyle = '#060812'
      ctx.fillRect(0, 0, W, H)
    }

    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  )
}
