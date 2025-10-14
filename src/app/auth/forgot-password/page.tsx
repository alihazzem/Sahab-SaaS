"use client"

import type React from "react"
import { useState } from "react"
import { useSignIn } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
    const { isLoaded, signIn } = useSignIn()
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [emailSent, setEmailSent] = useState(false)
    const [resetCode, setResetCode] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [step, setStep] = useState<"email" | "code" | "success">("email")

    const handleSendResetEmail = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isLoaded || !email) return

        setIsLoading(true)
        setError("")

        try {
            await signIn.create({
                strategy: "reset_password_email_code",
                identifier: email,
            })
            setEmailSent(true)
            setStep("code")
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message || "Failed to send reset email. Please try again.")
            } else {
                setError("Failed to send reset email. Please try again.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isLoaded || !resetCode || !newPassword) return

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters long")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            const result = await signIn.attemptFirstFactor({
                strategy: "reset_password_email_code",
                code: resetCode,
                password: newPassword,
            })

            if (result.status === "complete") {
                setStep("success")
                // Redirect to sign-in page after 2 seconds
                setTimeout(() => {
                    router.push("/auth/sign-in")
                }, 2000)
            } else {
                setError("Password reset failed. Please try again.")
            }
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message || "Invalid reset code. Please try again.")
            } else {
                setError("Invalid reset code. Please try again.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <Card className="border-border shadow-lg">
                    <CardHeader className="space-y-1 pb-4">
                        {step === "success" ? (
                            <>
                                <div className="flex justify-center mb-4">
                                    <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
                                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                                <CardTitle className="text-3xl font-semibold text-center">
                                    Password Reset Successfully!
                                </CardTitle>
                                <CardDescription className="text-center text-muted-foreground">
                                    Your password has been reset. Redirecting to sign in...
                                </CardDescription>
                            </>
                        ) : step === "code" ? (
                            <>
                                <div className="flex justify-center mb-4">
                                    <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-3">
                                        <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                                <CardTitle className="text-3xl font-semibold text-center">
                                    Check Your Email
                                </CardTitle>
                                <CardDescription className="text-center text-muted-foreground">
                                    We&apos;ve sent a verification code to {email}
                                </CardDescription>
                            </>
                        ) : (
                            <>
                                <CardTitle className="text-3xl font-semibold text-center">
                                    Forgot Password?
                                </CardTitle>
                                <CardDescription className="text-center text-muted-foreground">
                                    No worries, we&apos;ll send you reset instructions
                                </CardDescription>
                            </>
                        )}
                    </CardHeader>
                    <CardContent>
                        {step === "success" ? (
                            <div className="text-center py-4">
                                <p className="text-sm text-muted-foreground">
                                    You can now sign in with your new password.
                                </p>
                            </div>
                        ) : step === "code" ? (
                            <form onSubmit={handleResetPassword} className="space-y-4">
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
                                        value={resetCode}
                                        onChange={(e) => setResetCode(e.target.value)}
                                        className="bg-input border-border focus:ring-ring focus:border-ring"
                                        maxLength={6}
                                        autoFocus
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Check your email for the verification code
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="newPassword" className="text-sm font-medium text-foreground">
                                        New Password
                                    </Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="bg-input border-border focus:ring-ring focus:border-ring"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                                        Confirm Password
                                    </Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="bg-input border-border focus:ring-ring focus:border-ring"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading || !resetCode || !newPassword || !confirmPassword}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 transition-colors cursor-pointer"
                                >
                                    {isLoading ? "Resetting Password..." : "Reset Password"}
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setStep("email")}
                                    className="w-full cursor-pointer"
                                    disabled={isLoading}
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to email
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleSendResetEmail} className="space-y-4">
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                {emailSent && !error && (
                                    <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20">
                                        <AlertDescription className="text-green-800 dark:text-green-200">
                                            Password reset email sent! Check your inbox.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium text-foreground">
                                        Email Address
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="email"
                                        className="bg-input border-border focus:ring-ring focus:border-ring"
                                        autoFocus
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        We&apos;ll send a verification code to this email address
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading || !email}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 transition-colors cursor-pointer"
                                >
                                    {isLoading ? "Sending..." : "Send Reset Code"}
                                </Button>

                                <Link href="/auth/sign-in">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full cursor-pointer"
                                        disabled={isLoading}
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to Sign In
                                    </Button>
                                </Link>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
