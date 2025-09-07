"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { Suspense, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FeatureCard } from "@/components/reuse/feature-card"
import { FloatingParticles } from "@/components/reuse/floating-particles"
import { ArrowRight, Play, Zap, Shield, Globe, Sparkles } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"

const Scene = dynamic(() => import("@/components/3d/scene").then((mod) => ({ default: mod.Scene })), {
  ssr: false,
})

export default function HomePage() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Hero Section with 3D Scene */}
      <section className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Suspense fallback={<div className="w-full h-full bg-background/50 animate-pulse" />}>
            <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
              <Scene />
              <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={1.5708} />
            </Canvas>
          </Suspense>
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <Badge
            variant="secondary"
            className="mb-6 text-sm font-medium bg-secondary text-secondary-foreground border-secondary/20"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Next-Gen Media Processing
          </Badge>

          <h1 className="text-6xl md:text-8xl font-bold mb-6 text-balance">
            Transform Your
            <span className="text-primary block">Media Experience</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
            Powerful cloud-based image and video processing that scales with your business. Optimize, transform, and
            deliver media at lightning speed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="text-lg px-8 py-6 bg-primary cursor-pointer hover:bg-primary/90">
              <Link
                href="/auth/sign-up"
              >
                Start Free Trial
              </Link>
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 border-primary/30 hover:bg-primary/10 bg-transparent"
              onClick={() => setIsVideoPlaying(!isVideoPlaying)}
            >
              <Play className="mr-2 w-5 h-5" />
              Watch Demo
            </Button>
          </div>
        </div>

        <FloatingParticles count={20} />
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
              Why Choose <span className="text-primary">Cloudinary</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
              Experience the future of media management with our cutting-edge platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Zap}
              title="Lightning Fast"
              description="Process and deliver images and videos at unprecedented speeds with our global CDN network."
              delay={100}
            />

            <FeatureCard
              icon={Shield}
              title="Enterprise Security"
              description="Bank-level security with end-to-end encryption and compliance with industry standards."
              delay={200}
            />

            <FeatureCard
              icon={Globe}
              title="Global Scale"
              description="Serve millions of users worldwide with our distributed infrastructure and edge locations."
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 bg-card/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="space-y-4">
              <div className="text-5xl font-bold text-primary">10B+</div>
              <div className="text-xl text-muted-foreground">Images Processed</div>
            </div>

            <div className="space-y-4">
              <div className="text-5xl font-bold text-primary">99.9%</div>
              <div className="text-xl text-muted-foreground">Uptime Guarantee</div>
            </div>

            <div className="space-y-4">
              <div className="text-5xl font-bold text-primary">150+</div>
              <div className="text-xl text-muted-foreground">Countries Served</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
            Ready to Transform Your
            <span className="text-primary block">Media Workflow?</span>
          </h2>

          <p className="text-xl text-muted-foreground mb-8 text-pretty">
            Join thousands of developers and businesses who trust Cloudinary for their media needs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6 bg-primary cursor-pointer hover:bg-primary/90">
              <Link href="/auth/sign-up" className="flex items-center">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 border-primary/30 hover:bg-primary/10 bg-transparent cursor-pointer"
            >
              <Link href="/auth/sign-in">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
