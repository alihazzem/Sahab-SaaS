"use client"

import { useEffect } from "react"
import { useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Cloud } from "lucide-react"

export default function SSOCallback() {
    const { handleRedirectCallback } = useClerk()
    const router = useRouter()

    useEffect(() => {
        const handleCallback = async () => {
            try {
                await handleRedirectCallback({})
                router.push("/dashboard")
            } catch (error) {
                console.error("SSO callback error:", error)
                router.push("/sign-in")
            }
        }

        handleCallback()
    }, [handleRedirectCallback, router])

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-border shadow-lg">
                <CardContent className="py-3">
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <div className="bg-primary/10 p-3 rounded-xl animate-pulse">
                                <Cloud className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-xl font-semibold text-foreground">Completing sign in...</h1>
                            <p className="text-muted-foreground text-sm">Please wait while we redirect you</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
