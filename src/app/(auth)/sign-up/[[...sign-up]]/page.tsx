"use client"

import type React from "react"

import { useState } from "react"
import { useSignUp } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Github } from "lucide-react"
import Link from "next/link"

export default function SignUpPage() {
    const { isLoaded, signUp, setActive } = useSignUp()
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [code, setCode] = useState("")
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isLoaded) return

        setIsLoading(true)
        setError("")

        try {
            await signUp.create({
                firstName,
                lastName,
                emailAddress: email,
                password,
            })

            await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
            setVerifying(true)
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError("Sign up failed. Please try again.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerification = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isLoaded) return

        setIsLoading(true)
        setError("")

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            })

            if (completeSignUp.status === "complete") {
                await setActive({ session: completeSignUp.createdSessionId })
                router.push("/dashboard")
            } else {
                setError("Verification failed. Please try again.")
            }
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError("Verification failed. Please try again.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleOAuthSignUp = async (strategy: "oauth_google" | "oauth_github") => {
        if (!isLoaded) return

        try {
            await signUp.authenticateWithRedirect({
                strategy,
                redirectUrl: "/sso-callback",
                redirectUrlComplete: "/dashboard",
            })
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError("OAuth sign up failed. Please try again.")
            }
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">

                {/* Sign Up Form */}
                <Card className="border-border shadow-lg">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-3xl font-bold text-center">
                            {verifying ? "Verify Email" : "Create your account"}
                        </CardTitle>
                        <CardDescription className="text-center text-muted-foreground">
                            {verifying ? "Enter the verification code sent to your email" : "Get started with Cloudinary SaaS today"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!verifying ? (
                            <>
                                {/* OAuth Buttons */}
                                <div className="space-y-3 mb-6">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleOAuthSignUp("oauth_google")}
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
                                        onClick={() => handleOAuthSignUp("oauth_github")}
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

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
                                                First Name
                                            </Label>
                                            <Input
                                                id="firstName"
                                                type="text"
                                                placeholder="John"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                autoComplete="given-name"
                                                className="bg-input border-border focus:ring-ring focus:border-ring"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
                                                Last Name
                                            </Label>
                                            <Input
                                                id="lastName"
                                                type="text"
                                                placeholder="Doe"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                autoComplete="family-name"
                                                className="bg-input border-border focus:ring-ring focus:border-ring"
                                            />
                                        </div>
                                    </div>

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
                                                placeholder="Create a password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                autoComplete="new-password"
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

                                    <div className="text-xs text-muted-foreground">Password must be at least 8 characters long</div>

                                    <Button
                                        type="submit"
                                        disabled={isLoading || !firstName || !lastName || !email || !password}
                                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 transition-colors cursor-pointer"
                                    >
                                        {isLoading ? "Creating account..." : "Create Account"}
                                    </Button>
                                </form>
                            </>
                        ) : (
                            <form onSubmit={handleVerification} className="space-y-4">
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="code" className="text-sm font-medium text-foreground">
                                        Verification Code
                                    </Label>
                                    <Input
                                        id="code"
                                        type="text"
                                        placeholder="Enter 6-digit code"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        maxLength={6}
                                        className="bg-input border-border focus:ring-ring focus:border-ring text-center text-lg tracking-widest"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading || code.length !== 6}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 transition-colors cursor-pointer"
                                >
                                    {isLoading ? "Verifying..." : "Verify Email"}
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setVerifying(false)}
                                    className="w-full text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                    Back to sign up
                                </Button>
                            </form>
                        )}

                        <div id="clerk-captcha" data-cl-theme="dark" data-cl-size="flexible" data-cl-language="es-ES" />

                        <div className="mt-6 text-center">
                            <p className="text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <Link href="/sign-in" className="text-primary hover:text-primary/80 font-medium transition-colors">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
