"use client"

import { useClerk, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { LogOut, Camera, User } from 'lucide-react'
import { useState, useRef } from 'react'
import Image from 'next/image'

function ProfilePicture() {
    const { user } = useUser()
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleProfilePictureClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        setUploading(true)
        try {
            await user.setProfileImage({ file })
            // Force a re-render by updating the user
            await user.reload()
        } catch (error) {
            console.error('Error updating profile picture:', error)
            alert('Failed to update profile picture')
        } finally {
            setUploading(false)
        }
    }

    const profileImageUrl = user?.imageUrl

    return (
        <div className="relative group">
            <div
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-border cursor-pointer overflow-hidden transition-all hover:border-primary/50"
                onClick={handleProfilePictureClick}
            >
                {profileImageUrl ? (
                    <Image
                        src={profileImageUrl}
                        alt="Profile"
                        width={40}
                        height={40}
                        className="object-cover rounded-lg"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <User className="w-10 h-10 text-muted-foreground rounded-lg" />
                    </div>
                )}

                {/* Hover overlay */}
                <div className="w-10 h-10 absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <Camera className="w-4 h-4 text-white" />
                </div>

                {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
        </div>
    )
}

export function LogoutButton() {
    const { signOut } = useClerk()
    const { isSignedIn } = useUser()

    const handleLogout = () => {
        signOut({ redirectUrl: '/' })
    }

    if (!isSignedIn) {
        return null
    }

    return (
        <div className="flex items-center gap-3">
            <ProfilePicture />
            <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="cursor-pointer p-2"
                title="Logout"
            >
                <LogOut className="w-4 h-4" />
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