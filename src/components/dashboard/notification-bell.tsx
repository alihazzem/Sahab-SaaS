'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { NotificationList } from './notification-list'
import { cn } from '@/lib/utils'

interface Notification {
    id: string
    type: string
    title: string
    message: string
    actionUrl?: string | null
    actionLabel?: string | null
    isRead: boolean
    createdAt: string
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [hasNewNotifications, setHasNewNotifications] = useState(false)

    const fetchNotifications = useCallback(async (showLoading = true, retryCount = 0) => {
        try {
            if (showLoading) {
                setIsLoading(true)
            }
            const response = await fetch('/api/notifications?limit=10', {
                credentials: 'include', // Ensure cookies are sent with the request
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            // Handle authentication errors with retry
            if (response.status === 401) {
                if (retryCount === 0) {
                    // Retry once after a brief delay
                    console.log('Authentication failed, retrying...')
                    await new Promise(resolve => setTimeout(resolve, 500))
                    return fetchNotifications(showLoading, retryCount + 1)
                } else {
                    // If retry also fails, redirect to sign-in
                    console.error('Authentication failed after retry, redirecting to sign-in')
                    window.location.href = '/auth/sign-in'
                    return
                }
            }

            if (response.ok) {
                const result = await response.json()
                // API returns data in result.data.notifications structure
                const data = result.data || result

                // Check if there are new notifications
                const newUnreadCount = data.unreadCount || 0

                setNotifications((prevNotifications) => {
                    const prevUnreadCount = prevNotifications.filter(n => !n.isRead).length
                    if (newUnreadCount > prevUnreadCount) {
                        setHasNewNotifications(true)
                        // Clear the indicator after 3 seconds
                        setTimeout(() => setHasNewNotifications(false), 3000)
                    }
                    return data.notifications || []
                })

                setUnreadCount(newUnreadCount)
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
        } finally {
            if (showLoading) {
                setIsLoading(false)
            }
        }
    }, [])

    useEffect(() => {
        // Fetch notifications on mount
        fetchNotifications()

        // Poll for new notifications every 5 seconds for real-time feel
        const interval = setInterval(() => fetchNotifications(false), 5000)

        return () => clearInterval(interval)
    }, [fetchNotifications])

    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications()
        }
    }, [isOpen, fetchNotifications])

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (response.status === 401) {
                console.error('Authentication failed')
                window.location.href = '/auth/sign-in'
                return
            }

            if (response.ok) {
                // Update local state
                setNotifications(prev =>
                    prev.map(n =>
                        n.id === notificationId ? { ...n, isRead: true } : n
                    )
                )
                setUnreadCount(prev => Math.max(0, prev - 1))
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error)
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            const response = await fetch('/api/notifications/mark-all-read', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (response.status === 401) {
                console.error('Authentication failed')
                window.location.href = '/auth/sign-in'
                return
            }

            if (response.ok) {
                // Update local state
                setNotifications(prev =>
                    prev.map(n => ({ ...n, isRead: true }))
                )
                setUnreadCount(0)
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error)
        }
    }

    const handleDelete = async (notificationId: string) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (response.status === 401) {
                console.error('Authentication failed')
                window.location.href = '/auth/sign-in'
                return
            }

            if (response.ok) {
                // Update local state
                setNotifications(prev => prev.filter(n => n.id !== notificationId))
                // Update unread count if the deleted notification was unread
                const deletedNotification = notifications.find(n => n.id === notificationId)
                if (deletedNotification && !deletedNotification.isRead) {
                    setUnreadCount(prev => Math.max(0, prev - 1))
                }
            }
        } catch (error) {
            console.error('Failed to delete notification:', error)
        }
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative cursor-pointer"
                    aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
                >
                    <Bell className={cn(
                        "h-5 w-5 transition-transform",
                        hasNewNotifications && "animate-bounce"
                    )} />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[400px] p-0">
                <NotificationList
                    notifications={notifications}
                    isLoading={isLoading}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    onDelete={handleDelete}
                    onRefresh={fetchNotifications}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
