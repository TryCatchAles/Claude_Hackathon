'use client'

import { useEffect, useRef } from 'react'

const LETTERS = 'Bloomkin'.split('')
const MAX_LIFT = 32        // px lift at closest point
const INFLUENCE = 180      // px radius of influence
const SMOOTHING = 0.12     // how fast letters follow (0–1)

export function WaveTitle() {
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([])
  const offsets = useRef<number[]>(LETTERS.map(() => 0))
  const targets = useRef<number[]>(LETTERS.map(() => 0))
  const mouse = useRef({ x: -9999, y: -9999 })
  const rafRef = useRef<number>()

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY }
    }
    const onLeave = () => {
      mouse.current = { x: -9999, y: -9999 }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', onLeave)

    const animate = () => {
      letterRefs.current.forEach((el, i) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const dx = mouse.current.x - centerX
        const dy = mouse.current.y - centerY
        const dist = Math.sqrt(dx * dx + dy * dy)

        // lift proportional to proximity, shaped as a smooth bell curve
        targets.current[i] = dist < INFLUENCE
          ? -MAX_LIFT * Math.pow(1 - dist / INFLUENCE, 1.8)
          : 0

        // smooth lerp toward target
        offsets.current[i] += (targets.current[i] - offsets.current[i]) * SMOOTHING
        el.style.transform = `translateY(${offsets.current[i].toFixed(2)}px)`
      })

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <h1
      className="tracking-tight leading-none mb-4 select-none flex cursor-default"
      style={{ fontSize: 'clamp(4.5rem, 11vw, 9.5rem)', fontFamily: 'Sterion, sans-serif' }}
    >
      {LETTERS.map((char, i) => (
        <span
          key={i}
          ref={el => { letterRefs.current[i] = el }}
          className="inline-block bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent will-change-transform"
        >
          {char}
        </span>
      ))}
    </h1>
  )
}
