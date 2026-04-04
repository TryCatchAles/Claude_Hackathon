'use client'

import { useEffect, useRef } from 'react'

interface Ripple {
  x: number
  y: number
  id: number
}

export function WaterRipple() {
  const containerRef = useRef<HTMLDivElement>(null)
  const counter = useRef(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function spawnRipple(x: number, y: number) {
      const id = counter.current++
      const ring = document.createElement('span')
      ring.dataset.id = String(id)
      ring.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 0;
        height: 0;
        border-radius: 50%;
        border: 1.5px solid rgba(150, 220, 255, 0.7);
        transform: translate(-50%, -50%);
        pointer-events: none;
        animation: waterRipple 1.4s cubic-bezier(0.2, 0.8, 0.4, 1) forwards;
      `
      container.appendChild(ring)

      // second inner ring slightly delayed
      const ring2 = document.createElement('span')
      ring2.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 0;
        height: 0;
        border-radius: 50%;
        border: 1px solid rgba(120, 200, 255, 0.4);
        transform: translate(-50%, -50%);
        pointer-events: none;
        animation: waterRipple 1.8s 0.12s cubic-bezier(0.2, 0.8, 0.4, 1) forwards;
      `
      container.appendChild(ring2)

      // third faint outer ring
      const ring3 = document.createElement('span')
      ring3.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: 0;
        height: 0;
        border-radius: 50%;
        border: 0.8px solid rgba(100, 180, 255, 0.25);
        transform: translate(-50%, -50%);
        pointer-events: none;
        animation: waterRipple 2.2s 0.25s cubic-bezier(0.2, 0.8, 0.4, 1) forwards;
      `
      container.appendChild(ring3)

      setTimeout(() => {
        ring.remove()
        ring2.remove()
        ring3.remove()
      }, 2500)
    }

    function onClick(e: MouseEvent) {
      spawnRipple(e.clientX, e.clientY)
    }

    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [])

  return (
    <>
      <div
        ref={containerRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 5 }}
      />
      <style>{`
        @keyframes waterRipple {
          0%   { width: 0px;   height: 0px;  opacity: 1;   }
          100% { width: 320px; height: 320px; opacity: 0;  }
        }
      `}</style>
    </>
  )
}
