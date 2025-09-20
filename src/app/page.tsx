"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowRight,
  Play,
  Zap,
  Shield,
  Globe,
  Sparkles,
  Upload,
  Smartphone,
  Laptop,
  Tablet,
  CheckCircle,
  Users,
  TrendingUp,
  Clock,
  ChevronUp
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"

export default function HomePage() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="Sahab Logo"
                  width={60}
                  height={60}
                  className="w-24 h-24 md:w-28 md:h-28 object-contain"
                  priority
                />
              </Link>
            </div>

            {/* Navigation Links - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('features')}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                About
              </button>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="text-sm px-4 py-2 bg-muted/50 hover:bg-muted border-border cursor-pointer">
                <Link href="/auth/sign-in">Sign In</Link>
              </Button>
              <Button size="sm" className="text-sm px-4 py-2 cursor-pointer">
                <Link href="/auth/sign-up ">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='none' fill-rule='evenodd'%3e%3cg fill='%239C92AC' fill-opacity='0.05'%3e%3ccircle cx='30' cy='30' r='1'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e")`,
            backgroundSize: '60px 60px'
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="pt-16 pb-12 sm:pt-20 sm:pb-16 md:pt-24 md:pb-20 lg:pt-28 lg:pb-24">
            {/* Badge */}
            <div className="text-center mb-6 sm:mb-8 md:mb-10">
              <Badge variant="secondary" className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                Next-Generation Cloud Media Platform
              </Badge>
            </div>

            {/* Main Heading */}
            <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-10 md:mb-12 lg:mb-14">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-balance mb-4 sm:mb-5 md:mb-6 lg:mb-7">
                Transform Media with
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70 mt-1 sm:mt-2">
                  Sahab
                </span>
              </h1>

              <p className="text-base text-md sm:text-lg text-muted-foreground max-w-2xl sm:max-w-3xl mx-auto text-pretty px-4 sm:px-0">
                Professional cloud media processing platform that transforms how you handle images and videos.
                Upload, optimize, and deliver content with enterprise-grade performance and reliability.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-12 sm:mb-14 md:mb-16 lg:mb-18 xl:mb-20 px-4 sm:px-0">
              <Button size="lg" className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 bg-primary hover:bg-primary/90 transition-colors min-h-[48px] sm:min-h-[52px] cursor-pointer">
                <Link href="/auth/sign-up" className="flex items-center gap-2">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 border-primary/30 hover:bg-primary/10 bg-transparent transition-colors min-h-[48px] sm:min-h-[52px] cursor-pointer"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Watch Demo
              </Button>
            </div>

            {/* Hero Visual */}
            <div className="relative max-w-5xl mx-auto px-2 sm:px-0">
              <div className="relative bg-card border border-border rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl overflow-hidden">
                {/* Mock Dashboard */}
                <div className="bg-gradient-to-br from-card via-card to-card/80 p-4 sm:p-6 md:p-8">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                    <div className="ml-2 sm:ml-4 text-xs sm:text-sm text-muted-foreground">Sahab Dashboard</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {/* Upload Card */}
                    <Card className="relative group hover:shadow-lg transition-shadow duration-300">
                      <CardContent className="p-4 sm:p-5 md:p-6">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                            <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          </div>
                          <div className="text-xs sm:text-sm font-medium">Quick Upload</div>
                        </div>
                        <div className="text-xs text-muted-foreground">Drag & drop your media</div>
                      </CardContent>
                    </Card>

                    {/* Processing Card */}
                    <Card className="relative group hover:shadow-lg transition-shadow duration-300">
                      <CardContent className="p-4 sm:p-5 md:p-6">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <div className="p-1.5 sm:p-2 bg-green-500/10 rounded-lg">
                            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                          </div>
                          <div className="text-xs sm:text-sm font-medium">Auto Processing</div>
                        </div>
                        <div className="text-xs text-muted-foreground">Optimize automatically</div>
                      </CardContent>
                    </Card>

                    {/* Delivery Card */}
                    <Card className="relative group hover:shadow-lg transition-shadow duration-300 sm:col-span-2 lg:col-span-1">
                      <CardContent className="p-4 sm:p-5 md:p-6">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg">
                            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                          </div>
                          <div className="text-xs sm:text-sm font-medium">Global CDN</div>
                        </div>
                        <div className="text-xs text-muted-foreground">Fast worldwide delivery</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-12 sm:mb-14 md:mb-16 lg:mb-18">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-5 md:mb-6 text-balance">
              Why Choose <span className="text-primary">Sahab</span>?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl sm:max-w-3xl mx-auto text-pretty px-4 sm:px-0">
              Engineered with cutting-edge technology to provide the fastest, most reliable media management experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 md:gap-8">
            {/* Feature 1 */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6 sm:p-7 md:p-8">
                <div className="p-2.5 sm:p-3 bg-primary/10 rounded-xl w-fit mb-5 sm:mb-6 group-hover:bg-primary/20 transition-colors">
                  <Zap className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Lightning Fast Processing</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  State-of-the-art algorithms and enterprise cloud infrastructure deliver unmatched image and video processing performance.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6 sm:p-7 md:p-8">
                <div className="p-2.5 sm:p-3 bg-green-500/10 rounded-xl w-fit mb-5 sm:mb-6 group-hover:bg-green-500/20 transition-colors">
                  <Shield className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-green-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Enterprise Security</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Bank-grade security with end-to-end encryption, secure storage protocols, and comprehensive privacy protection.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 md:col-span-2 lg:col-span-1">
              <CardContent className="p-6 sm:p-7 md:p-8">
                <div className="p-2.5 sm:p-3 bg-blue-500/10 rounded-xl w-fit mb-5 sm:mb-6 group-hover:bg-blue-500/20 transition-colors">
                  <Globe className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Global CDN Network</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Instantly deliver content worldwide through our premium edge locations with intelligent routing and caching.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Device Compatibility Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-12 sm:mb-14 md:mb-16 lg:mb-18">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-5 md:mb-6 text-balance">
              Works on <span className="text-primary">Every Device</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl sm:max-w-3xl mx-auto text-pretty px-4 sm:px-0">
              Optimized responsive design that delivers exceptional user experience across all platforms and screen sizes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 md:gap-8 lg:gap-10 items-center">
            {/* Desktop */}
            <div className="text-center group">
              <div className="p-6 sm:p-7 md:p-8 bg-primary/5 rounded-2xl mb-5 sm:mb-6 group-hover:bg-primary/10 transition-colors mx-auto max-w-[200px] sm:max-w-none">
                <Laptop className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-primary mx-auto" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Desktop</h3>
              <p className="text-sm sm:text-base text-muted-foreground px-4 sm:px-2 lg:px-4">Professional dashboard with comprehensive media management tools</p>
            </div>

            {/* Tablet */}
            <div className="text-center group">
              <div className="p-6 sm:p-7 md:p-8 bg-primary/5 rounded-2xl mb-5 sm:mb-6 group-hover:bg-primary/10 transition-colors mx-auto max-w-[200px] sm:max-w-none">
                <Tablet className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-primary mx-auto" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Tablet</h3>
              <p className="text-sm sm:text-base text-muted-foreground px-4 sm:px-2 lg:px-4">Intuitive touch interface optimized for creative workflows</p>
            </div>

            {/* Mobile */}
            <div className="text-center group">
              <div className="p-6 sm:p-7 md:p-8 bg-primary/5 rounded-2xl mb-5 sm:mb-6 group-hover:bg-primary/10 transition-colors mx-auto max-w-[200px] sm:max-w-none">
                <Smartphone className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-primary mx-auto" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Mobile</h3>
              <p className="text-sm sm:text-base text-muted-foreground px-4 sm:px-2 lg:px-4">Full-featured mobile access with gesture-based navigation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Stats Section */}
      <section id="about" className="py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28 bg-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-10 lg:gap-8 text-center">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-center">
                <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary mr-2 sm:mr-3" />
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">50M+</div>
              </div>
              <div className="text-sm sm:text-base lg:text-lg text-muted-foreground">Files Processed</div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-center">
                <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-green-500 mr-2 sm:mr-3" />
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">99.9%</div>
              </div>
              <div className="text-sm sm:text-base lg:text-lg text-muted-foreground">Uptime Guarantee</div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-center">
                <Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-500 mr-2 sm:mr-3" />
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">10K+</div>
              </div>
              <div className="text-sm sm:text-base lg:text-lg text-muted-foreground">Active Users</div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-center">
                <Clock className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-orange-500 mr-2 sm:mr-3" />
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">2x</div>
              </div>
              <div className="text-sm sm:text-base lg:text-lg text-muted-foreground">Faster Processing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-12 sm:mb-14 md:mb-16 lg:mb-18">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-5 md:mb-6 text-balance">
              Simple, <span className="text-primary">Transparent Pricing</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl sm:max-w-3xl mx-auto text-pretty px-4 sm:px-0">
              Choose the perfect plan for your needs. Scale effortlessly as your business grows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 md:gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="relative group hover:shadow-xl transition-all duration-300 border-2">
              <CardContent className="p-6 sm:p-7 md:p-8">
                <div className="text-center mb-6 sm:mb-7 md:mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">Starter</h3>
                  <div className="text-3xl sm:text-4xl font-bold mb-2">Free</div>
                  <p className="text-sm sm:text-base text-muted-foreground">Perfect for individuals and small projects</p>
                </div>

                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-7 md:mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">500MB Storage</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">50 Transformations/month</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">5MB Max Upload</span>
                  </li>
                </ul>

                <Button className="w-full min-h-[44px] sm:min-h-[48px] cursor-pointer" variant="outline">
                  <Link href="/auth/sign-up">Start Free</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="relative group hover:shadow-xl transition-all duration-300 border-2 border-primary">
              <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-4 sm:px-6 py-1">Most Popular</Badge>
              </div>
              <CardContent className="p-6 sm:p-7 md:p-8">
                <div className="text-center mb-6 sm:mb-7 md:mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">Pro</h3>
                  <div className="text-3xl sm:text-4xl font-bold mb-2">199<span className="text-base sm:text-lg text-muted-foreground"> EGP/month</span></div>
                  <p className="text-sm sm:text-base text-muted-foreground">For growing businesses</p>
                </div>

                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-7 md:mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">10GB Storage</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">5,000 Transformations/month</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">100MB Max Upload</span>
                  </li>
                </ul>

                <Button className="w-full min-h-[44px] sm:min-h-[48px] cursor-pointer">
                  <Link href="/auth/sign-up">Start Pro Trial</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="relative group hover:shadow-xl transition-all duration-300 border-2">
              <CardContent className="p-6 sm:p-7 md:p-8">
                <div className="text-center mb-6 sm:mb-7 md:mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">Enterprise</h3>
                  <div className="text-3xl sm:text-4xl font-bold mb-2">999<span className="text-base sm:text-lg text-muted-foreground"> EGP/month</span></div>
                  <p className="text-sm sm:text-base text-muted-foreground">For large organizations</p>
                </div>

                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-7 md:mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">100GB Storage</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">50,000 Transformations/month</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">1GB Max Upload</span>
                  </li>
                </ul>

                <Button className="w-full min-h-[44px] sm:min-h-[48px] cursor-pointer" variant="outline">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 xl:px-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-5 sm:mb-6 md:mb-7 text-balance">
            Ready to Transform Your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70 mt-1 sm:mt-2">
              Media Experience?
            </span>
          </h2>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-7 md:mb-8 text-pretty max-w-2xl mx-auto">
            Join thousands of professionals who trust Sahab for their media processing needs.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button size="lg" className="text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 bg-primary hover:bg-primary/90 transition-colors min-h-[48px] sm:min-h-[52px] cursor-pointer">
              <Link href="/auth/sign-up" className="flex items-center gap-2">
                Start Your Journey
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 border-primary/30 hover:bg-primary/10 bg-transparent transition-colors min-h-[48px] sm:min-h-[52px] cursor-pointer"
            >
              <Link href="/auth/sign-in">Sign In</Link>
            </Button>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-5 md:mt-6">
            Free plan available • 30-day money-back guarantee
          </p>
        </div>
      </section>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 cursor-pointer"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
