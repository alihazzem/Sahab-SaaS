"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Float } from "@react-three/drei"
import type * as THREE from "three"

interface FloatingImageProps {
    position: [number, number, number]
    rotation: [number, number, number]
    scale?: number
}

export function FloatingImage({ position, rotation, scale = 1 }: FloatingImageProps) {
    const meshRef = useRef<THREE.Mesh>(null)

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
            meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.2
        }
    })

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
                <boxGeometry args={[1.5, 1, 0.1]} />
                <meshStandardMaterial color="#a16207" metalness={0.8} roughness={0.2} />
            </mesh>
        </Float>
    )
}
