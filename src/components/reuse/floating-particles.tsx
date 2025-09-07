"use client"

import { useEffect, useState } from "react"
import { FloatingParticlesProps, Particle } from "@/types"

export function FloatingParticles({ count = 20 }: FloatingParticlesProps) {
    const [particles, setParticles] = useState<Particle[]>([])

    useEffect(() => {
        const newParticles = [...Array(count)].map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            top: Math.random() * 100,
            animationDelay: Math.random() * 3,
            animationDuration: 2 + Math.random() * 2,
        }))
        setParticles(newParticles)
    }, [count])

    return (
        <div className="absolute inset-0 pointer-events-none">
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="absolute w-2 h-2 bg-primary/20 rounded-full animate-pulse"
                    style={{
                        left: `${particle.left}%`,
                        top: `${particle.top}%`,
                        animationDelay: `${particle.animationDelay}s`,
                        animationDuration: `${particle.animationDuration}s`,
                    }}
                />
            ))}
        </div>
    )
}
