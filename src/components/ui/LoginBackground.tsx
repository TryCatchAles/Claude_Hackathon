'use client'

import { useRef, useEffect } from 'react'

// ─── scene constants ──────────────────────────────────────────────────────────
const NODE_COUNT   = 55
const LINK_DIST    = 170
const SPEED        = 0.22
const REPEL_RADIUS = 130
const REPEL_FORCE  = 3.2
const BLAST_RADIUS = 220
const BLAST_FORCE  = 10
const FRICTION     = 0.91

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  bvx: number
  bvy: number
  r: number
  petals: number
  rot: number
  rotSpeed: number
  hue: number
  scale: number
}

interface Ripple {
  x: number
  y: number
  radius: number
  maxRadius: number
  alpha: number
  hue: number
}

function initNodes(w: number, h: number): Node[] {
  return Array.from({ length: NODE_COUNT }, () => {
    const angle = Math.random() * Math.PI * 2
    const speed = (0.3 + Math.random() * 0.7) * SPEED
    const bvx   = Math.cos(angle) * speed
    const bvy   = Math.sin(angle) * speed
    const rng   = Math.random()
    return {
      x:        Math.random() * w,
      y:        Math.random() * h,
      vx:       bvx,
      vy:       bvy,
      bvx,
      bvy,
      r:        6 + Math.random() * 10,
      petals:   5 + Math.floor(Math.random() * 3),
      rot:      Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.006,
      hue:      rng < 0.30 ? 200 + Math.random() * 40
              : rng < 0.55 ? 300 + Math.random() * 40
              :               80  + Math.random() * 60,
      scale:    1,
    }
  })
}

// ─── petal path ───────────────────────────────────────────────────────────────
function tracePetal(ctx: CanvasRenderingContext2D, length: number, width: number) {
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(-width * 0.5, length * 0.2, -width * 0.45, length * 0.78, 0, length)
  ctx.bezierCurveTo( width * 0.45, length * 0.78,  width * 0.5, length * 0.2, 0, 0)
  ctx.closePath()
}

// ─── draw one flower ──────────────────────────────────────────────────────────
function drawFlower(ctx: CanvasRenderingContext2D, n: Node, near: boolean) {
  const { x, y, petals, rot, hue } = n
  const r     = n.r * n.scale
  const pLen  = r * 2.1
  const pWide = r * 1.05

  // ambient glow — wider when cursor is nearby
  const glowR = r * (near ? 6.5 : 5)
  const glow  = ctx.createRadialGradient(x, y, 0, x, y, glowR)
  glow.addColorStop(0, `hsla(${hue}, 90%, 68%, ${near ? 0.32 : 0.18})`)
  glow.addColorStop(1, `hsla(${hue}, 90%, 60%, 0)`)
  ctx.beginPath()
  ctx.arc(x, y, glowR, 0, Math.PI * 2)
  ctx.fillStyle = glow
  ctx.fill()

  // back-layer petals
  for (let p = 0; p < petals; p++) {
    const a = rot + ((p + 0.5) / petals) * Math.PI * 2
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(a)
    tracePetal(ctx, pLen * 0.82, pWide * 0.82)
    ctx.fillStyle = `hsla(${hue - 15}, 80%, 38%, 0.52)`
    ctx.fill()
    ctx.restore()
  }

  // front-layer petals
  for (let p = 0; p < petals; p++) {
    const a = rot + (p / petals) * Math.PI * 2
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(a)
    tracePetal(ctx, pLen, pWide)
    const pg = ctx.createLinearGradient(0, 0, 0, pLen)
    pg.addColorStop(0,   `hsla(${hue},      100%, ${near ? 88 : 78}%, 0.95)`)
    pg.addColorStop(0.6, `hsla(${hue + 12}, 95%,  ${near ? 72 : 62}%, 0.85)`)
    pg.addColorStop(1,   `hsla(${hue + 22}, 85%,  50%, 0.60)`)
    ctx.fillStyle = pg
    ctx.fill()
    ctx.restore()
  }

  // centre disc
  const coreR = r * 0.58
  const cg    = ctx.createRadialGradient(x, y, 0, x, y, coreR)
  cg.addColorStop(0,    'rgba(255, 255, 255, 1)')
  cg.addColorStop(0.35, `hsla(${hue + 35}, 100%, 94%, 1)`)
  cg.addColorStop(0.75, `hsla(${hue + 20}, 100%, 72%, 0.9)`)
  cg.addColorStop(1,    `hsla(${hue + 10}, 90%,  55%, 0.6)`)
  ctx.beginPath()
  ctx.arc(x, y, coreR, 0, Math.PI * 2)
  ctx.fillStyle = cg
  ctx.fill()

  // specular dot
  ctx.beginPath()
  ctx.arc(x - coreR * 0.28, y - coreR * 0.28, coreR * 0.22, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.fill()
}

// ─── component ────────────────────────────────────────────────────────────────
export function LoginBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = window.innerWidth
    let h = window.innerHeight
    let nodes = initNodes(w, h)
    let raf: number
    const mouse   = { x: -9999, y: -9999 }
    const ripples: Ripple[] = []

    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width  = w
      canvas.height = h
      nodes = initNodes(w, h)
    }

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }

    const onClick = (e: MouseEvent) => {
      const cx = e.clientX, cy = e.clientY
      // blast flowers outward
      for (const n of nodes) {
        const dx   = n.x - cx
        const dy   = n.y - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < BLAST_RADIUS && dist > 0) {
          const force = (1 - dist / BLAST_RADIUS) * BLAST_FORCE
          n.vx   += (dx / dist) * force
          n.vy   += (dy / dist) * force
          n.scale = 1 + (1 - dist / BLAST_RADIUS) * 1.3
        }
      }
      // expanding ripple ring
      const avgHue = nodes.reduce((s, n) => s + n.hue, 0) / nodes.length
      ripples.push({ x: cx, y: cy, radius: 0, maxRadius: BLAST_RADIUS * 1.3, alpha: 0.7, hue: avgHue })
    }

    resize()
    window.addEventListener('resize', resize)
    // Listen on window so pointer-events:none canvas doesn't block login button
    window.addEventListener('mousemove', onMove)
    window.addEventListener('click', onClick)

    const draw = () => {
      ctx.fillStyle = '#0a0f0d'
      ctx.fillRect(0, 0, w, h)

      // update nodes
      for (const n of nodes) {
        // mouse repulsion
        const mdx   = n.x - mouse.x
        const mdy   = n.y - mouse.y
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy)
        if (mdist < REPEL_RADIUS && mdist > 0) {
          const force = (1 - mdist / REPEL_RADIUS) * REPEL_FORCE
          n.vx += (mdx / mdist) * force * 0.07
          n.vy += (mdy / mdist) * force * 0.07
        }

        // friction — bleeds back toward base drift
        n.vx = n.vx * FRICTION + n.bvx * (1 - FRICTION)
        n.vy = n.vy * FRICTION + n.bvy * (1 - FRICTION)

        // scale settle
        n.scale += (1 - n.scale) * 0.055

        n.x   += n.vx
        n.y   += n.vy
        n.rot += n.rotSpeed

        if (n.x < -40)    n.x = w + 40
        if (n.x > w + 40) n.x = -40
        if (n.y < -40)    n.y = h + 40
        if (n.y > h + 40) n.y = -40
      }

      // ripple rings
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i]
        rp.radius += 3.5
        rp.alpha  *= 0.95
        ctx.beginPath()
        ctx.arc(rp.x, rp.y, rp.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `hsla(${rp.hue}, 80%, 75%, ${rp.alpha})`
        ctx.lineWidth   = 1.2
        ctx.stroke()
        if (rp.alpha < 0.01 || rp.radius > rp.maxRadius) ripples.splice(i, 1)
      }

      // edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a    = nodes[i], b = nodes[j]
          const dx   = a.x - b.x
          const dy   = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < LINK_DIST) {
            const alpha  = (1 - dist / LINK_DIST) * 0.28
            const midHue = (a.hue + b.hue) / 2
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `hsla(${midHue}, 80%, 65%, ${alpha})`
            ctx.lineWidth   = 0.8
            ctx.stroke()
          }
        }
      }

      // flowers
      for (const n of nodes) {
        const dx   = n.x - mouse.x
        const dy   = n.y - mouse.y
        const near = Math.sqrt(dx * dx + dy * dy) < REPEL_RADIUS
        drawFlower(ctx, n, near)
      }

      raf = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('click', onClick)
    }
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
