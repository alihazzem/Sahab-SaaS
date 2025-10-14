'use client'

import { formatDistanceToNow } from 'date-fns'
import {
    AlertCircle,
    CheckCircle,
    XCircle,
    UserPlus,
    TrendingUp,
    AlertTriangle,
    DollarSign,
    CreditCard,
    Info,
    X,
    Check,
    RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import Link from 'next/link'
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

interface NotificationListProps {
    notifications: Notification[]
    isLoading: boolean
    onMarkAsRead: (id: string) => void
    onMarkAllAsRead: () => void
    onDelete: (id: string) => void
    onRefresh: () => void
}

const notificationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    TEAM_INVITATION: UserPlus,
    USAGE_WARNING: AlertTriangle,
    USAGE_CRITICAL: AlertCircle,
    USAGE_EXCEEDED: XCircle,
    UPLOAD_SUCCESS: CheckCircle,
    UPLOAD_FAILED: XCircle,
    PLAN_UPGRADE_SUGGESTION: TrendingUp,
    TEAM_MEMBER_JOINED: UserPlus,
    TEAM_MEMBER_LEFT: UserPlus,
    PAYMENT_SUCCESS: DollarSign,
    PAYMENT_FAILED: XCircle,
    SUBSCRIPTION_RENEWED: CreditCard,
    SUBSCRIPTION_EXPIRED: XCircle,
}

const notificationColors: Record<string, string> = {
    TEAM_INVITATION: 'text-blue-600',
    USAGE_WARNING: 'text-yellow-600',
    USAGE_CRITICAL: 'text-orange-600',
    USAGE_EXCEEDED: 'text-red-600',
    UPLOAD_SUCCESS: 'text-green-600',
    UPLOAD_FAILED: 'text-red-600',
    PLAN_UPGRADE_SUGGESTION: 'text-purple-600',
    TEAM_MEMBER_JOINED: 'text-blue-600',
    TEAM_MEMBER_LEFT: 'text-gray-600',
    PAYMENT_SUCCESS: 'text-green-600',
    PAYMENT_FAILED: 'text-red-600',
    SUBSCRIPTION_RENEWED: 'text-green-600',
    SUBSCRIPTION_EXPIRED: 'text-red-600',
}

export function NotificationList({
    notifications,
    isLoading,
    onMarkAsRead,
    onMarkAllAsRead,
    onDelete,
    onRefresh,
}: NotificationListProps) {
    const hasUnread = notifications.some(n => !n.isRead)

    return (
        <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-lg">Notifications</h3>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="cursor-pointer"
                    >
                        <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                    </Button>
                    {hasUnread && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onMarkAllAsRead}
                            className="cursor-pointer"
                        >
                            <Check className="h-4 w-4 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            <ScrollArea className="h-[400px]">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                        <Info className="h-12 w-12 mb-2 opacity-50" />
                        <p className="text-sm">No notifications</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {notifications.map((notification) => {
                            const Icon = notificationIcons[notification.type] || Info
                            const iconColor = notificationColors[notification.type] || 'text-gray-600'

                            return (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        'p-4 hover:bg-accent/50 transition-colors',
                                        !notification.isRead && 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-l-blue-500'
                                    )}
                                >
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0">
                                            <Icon className={cn('h-5 w-5', iconColor)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={cn(
                                                        'text-sm font-medium',
                                                        !notification.isRead && 'font-semibold'
                                                    )}>
                                                        {notification.title}
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        {formatDistanceToNow(new Date(notification.createdAt), {
                                                            addSuffix: true,
                                                        })}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 flex-shrink-0 cursor-pointer"
                                                    onClick={() => onDelete(notification.id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center gap-2 mt-3">
                                                {notification.actionUrl && notification.actionLabel && (
                                                    <Link href={notification.actionUrl}>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 text-xs cursor-pointer"
                                                        >
                                                            {notification.actionLabel}
                                                        </Button>
                                                    </Link>
                                                )}
                                                {!notification.isRead && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-xs cursor-pointer"
                                                        onClick={() => onMarkAsRead(notification.id)}
                                                    >
                                                        Mark as read
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </ScrollArea>
        </div>
    )
}
