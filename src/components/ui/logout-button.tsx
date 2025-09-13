"use client"

import { useClerk, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
    const { signOut } = useClerk()
    const { isSignedIn, user } = useUser()

    const handleLogout = () => {
        signOut({ redirectUrl: '/' })
    }

    if (!isSignedIn) {
        return null
    }

    return (
        <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
                Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
            </span>

            <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 cursor-pointer"
            >
                <LogOut className="w-4 h-4" />
                Logout
            </Button>
        </div>
    )
}

export function CompactLogoutButton() {
    const { signOut } = useClerk()
    const { isSignedIn } = useUser()

    if (!isSignedIn) {
        return null
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ redirectUrl: '/' })}
            className="p-2 cursor-alias"
            title="Logout"
        >
            <LogOut className="w-4 h-4" />
        </Button>
    )
}