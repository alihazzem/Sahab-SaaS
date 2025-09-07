"use client"

import { Environment, Text } from "@react-three/drei"
import { FloatingImage } from "./floating-image"

export function Scene() {
    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#a16207" />

            <FloatingImage position={[-3, 1, -2]} rotation={[0.2, 0.3, 0]} />
            <FloatingImage position={[3, -1, -1]} rotation={[-0.1, -0.4, 0.1]} scale={0.8} />
            <FloatingImage position={[0, 2, -3]} rotation={[0.3, 0, -0.2]} scale={1.2} />

            <Text
                fontSize={0.8}
                position={[-2, 0, 0]}
                color="#a16207"
                anchorX="center"
                anchorY="middle"
            >
                CLOUDINARY
            </Text>

            <Environment preset="night" />
        </>
    )
}
