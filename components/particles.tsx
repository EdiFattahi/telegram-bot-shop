'use client'

import { useState } from 'react'

interface Particle {
  id: number
  left: number
  top: number
  size: number
  duration: number
  delay: number
  opacity: number
}

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 5 + 5,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.5 + 0.2,
  }))
}

export default function Particles() {
  const [particles] = useState<Particle[]>(() =>
    createParticles(30)
  )

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-primary/40 animate-pulse"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            opacity: particle.opacity,
          }}
        />
      ))}
    </div>
  )
}
