'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'

function TorusKnot() {
  const ref = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    ref.current.rotation.x = t * 0.12
    ref.current.rotation.y = t * 0.18
  })

  return (
    <mesh ref={ref} position={[1.2, 0, 0]}>
      <torusKnotGeometry args={[1.3, 0.42, 200, 20]} />
      <meshPhysicalMaterial
        color="#7c3aed"
        metalness={0.05}
        roughness={0.08}
        // @ts-ignore
        iridescence={1}
        // @ts-ignore
        iridescenceIOR={1.8}
      />
    </mesh>
  )
}

export function LoginBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
        camera={{ position: [0, 0, 5.5], fov: 52 }}
      >
        <color attach="background" args={['#0d0a1e']} />

        <ambientLight intensity={0.2} />
        <pointLight position={[-5, 4, 4]} color="#818cf8" intensity={15} />
        <pointLight position={[5, -4, 4]} color="#06b6d4" intensity={15} />
        <pointLight position={[0, 5, -3]} color="#d946ef" intensity={10} />

        <TorusKnot />
      </Canvas>
    </div>
  )
}
