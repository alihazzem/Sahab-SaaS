"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSignIn, useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Github } from "lucide-react"
import Link from "next/link"

export default function SignInPage() {
    const { isLoaded, signIn, setActive } = useSignIn()
    const { userId, isSignedIn } = useAuth()
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isChecked, setIsChecked] = useState(false)

    // Check for existing authentication and redirect
    useEffect(() => {
        if (isSignedIn && userId) {
            router.replace("/dashboard")
        }
    }, [isSignedIn, userId, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isLoaded) return

        setIsLoading(true)
        setError("")

        try {
            const result = await signIn.create({
                identifier: email,
                password,
            })
            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId })
                router.push("/dashboard")
            } else {
                setError("Sign in failed. Please try again.")
            }
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError("Sign in failed. Please try again.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleOAuthSignIn = async (strategy: "oauth_google" | "oauth_github") => {
        if (!isLoaded) return

        try {
            await signIn.authenticateWithRedirect({
                strategy,
                redirectUrl: "/sso-callback",
                redirectUrlComplete: "/dashboard",
            })
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError("OAuth sign in failed. Please try again.")
            }
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                {/* Sign In Form */}
                <Card className="border-border shadow-lg">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-3xl font-semibold text-center">Welcome back</CardTitle>
                        <CardDescription className="text-center text-muted-foreground">
                            Sign in to your Cloudinary SaaS account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* OAuth buttons section */}
                        <div className="space-y-3 mb-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOAuthSignIn("oauth_google")}
                                className="w-full border-border hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                disabled={isLoading}
                            >
                                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Continue with Google
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOAuthSignIn("oauth_github")}
                                className="w-full border-border hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                disabled={isLoading}
                            >
                                <Github className="w-4 h-4 mr-2" />
                                Continue with GitHub
                            </Button>
                        </div>

                        {/* Divider */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="text"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    className="bg-input border-border focus:ring-ring focus:border-ring"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="current-password"
                                        className="bg-input border-border focus:ring-ring focus:border-ring pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-2">
                                    <input type="checkbox" id="remember"
                                        checked={!!isChecked}
                                        onChange={(e) => setIsChecked(e.target.checked)}
                                        className="rounded border-border checked:accent-primary cursor-pointer"
                                    />
                                    <Label htmlFor="remember"
                                        className={`text-muted-foreground hover:text-muted-foreground/80 cursor-pointer ${isChecked ? "text-primary" : ""} ${isChecked ? "hover:text-primary/80" : ""}`}>
                                        Remember me
                                    </Label>
                                </div>
                                <Link href="/auth/forgot-password" className="text-primary hover:text-primary/80 font-medium transition-colors">
                                    Forgot password?
                                </Link>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading || !email || !password}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 transition-colors cursor-pointer"
                            >
                                {isLoading ? "Signing in..." : "Sign In"}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-muted-foreground">
                                Don&apos;t have an account?{" "}
                                <Link href="/auth/sign-up" className="text-primary hover:text-primary/80 font-medium transition-colors">
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
