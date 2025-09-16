"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Upload,
    HardDrive,
    Zap,
    TrendingUp,
    AlertTriangle,
    Info,
    ArrowUp,
    Clock,
    Crown,
    Sparkles,
    FileImage
} from 'lucide-react'
import { formatSize } from '@/utils/format'
import { formatFileSize, PLAN_LIMITS } from '@/lib/client-usage'
import type { UsageAnalyticsProps } from '@/types'

export function UsageAnalytics({ subscription }: UsageAnalyticsProps) {
    if (!subscription) {
        return null
    }

    const { plan, usage } = subscription

    // Convert bytes to MB for storage calculations
    const storageUsedMB = usage.storageUsed / (1024 * 1024)
    const storageRemainingMB = Math.max(0, plan.storageLimit - storageUsedMB)

    const storagePercentage = (storageUsedMB / plan.storageLimit) * 100
    const transformationsPercentage = (usage.transformationsUsed / plan.transformationsLimit) * 100

    // Calculate how many videos can still be processed (each video uses 3 transformations)
    const videosRemainingWithProcessing = Math.floor(usage.transformationsRemaining / 3)
    const isTransformationsLow = transformationsPercentage >= 80
    const isTransformationsExhausted = usage.transformationsRemaining < 3

    const getUsageColor = (percentage: number) => {
        if (percentage >= 90) return 'text-red-500'
        if (percentage >= 70) return 'text-yellow-500'
        return 'text-green-500'
    }

    const getTransformationStatus = () => {
        if (isTransformationsExhausted) {
            return {
                color: 'text-red-500',
                icon: AlertTriangle,
                message: 'No processing available'
            }
        }
        if (isTransformationsLow) {
            return {
                color: 'text-yellow-500',
                icon: AlertTriangle,
                message: `~${videosRemainingWithProcessing} videos left`
            }
        }
        return {
            color: 'text-green-500',
            icon: Info,
            message: `~${videosRemainingWithProcessing} videos available`
        }
    }

    const transformationStatus = getTransformationStatus()

    // Calculate next reset date (first of next month)
    const now = new Date()
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const daysUntilReset = Math.ceil((nextReset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // Get file size limits based on plan
    const planLimits = PLAN_LIMITS[plan.name.toUpperCase()] || PLAN_LIMITS['FREE']

    return (
        <div className="space-y-4">
            {/* Plan Information Summary */}
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {plan.name === 'Free' ? (
                            <TrendingUp className="h-5 w-5 text-primary" />
                        ) : (
                            <Crown className="h-5 w-5 text-primary" />
                        )}
                        {plan.name} Plan Limits
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <FileImage className="h-4 w-4 text-blue-500" />
                                Max File Size
                            </div>
                            <div className="text-lg font-bold text-primary">
                                {formatFileSize(planLimits.maxFileSize)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Per upload (images & videos)
                            </p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <HardDrive className="h-4 w-4 text-green-500" />
                                Storage Limit
                            </div>
                            <div className="text-lg font-bold text-primary">
                                {formatFileSize(planLimits.storage)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Total storage space
                            </p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Zap className="h-4 w-4 text-yellow-500" />
                                Transformations
                            </div>
                            <div className="text-lg font-bold text-primary">
                                {plan.transformationsLimit.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Per month
                            </p>
                        </div>
                    </div>
                    {plan.name === 'Free' && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                            <Button
                                size="sm"
                                className="w-full cursor-pointer"
                            >
                                <Crown className="h-4 w-4 mr-2" />
                                Upgrade for Higher Limits
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {/* Storage Usage */}
                <Card className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/30 bg-gradient-to-br from-card to-card/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
                        <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                            <HardDrive className="h-4 w-4 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                {formatSize(usage.storageUsed)}
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">
                                        of {plan.storageLimit} MB
                                    </span>
                                    <span className={`font-medium ${getUsageColor(storagePercentage)}`}>
                                        {storagePercentage.toFixed(1)}%
                                    </span>
                                </div>
                                <Progress
                                    value={storagePercentage}
                                    className="h-2 bg-secondary"
                                />
                            </div>
                            <div className="pt-2 border-t border-border/50">
                                <div className={`text-xs flex items-center gap-1 ${getUsageColor(storagePercentage)}`}>
                                    <ArrowUp className="h-3 w-3 rotate-45" />
                                    {storageRemainingMB.toFixed(1)} MB remaining
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Transformations Usage */}
                <Card className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/30 bg-gradient-to-br from-card to-card/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium">Transformations</CardTitle>
                        <div className="p-2 bg-yellow-500/10 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
                            <Zap className="h-4 w-4 text-yellow-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                {usage.transformationsUsed}
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">
                                        of {plan.transformationsLimit}
                                    </span>
                                    <span className={`font-medium ${transformationStatus.color}`}>
                                        {transformationsPercentage.toFixed(1)}%
                                    </span>
                                </div>
                                <Progress
                                    value={transformationsPercentage}
                                    className="h-2 bg-secondary"
                                />
                            </div>
                            <div className="space-y-1 pt-2 border-t border-border/50">
                                <div className={`text-xs flex items-center gap-1 ${transformationStatus.color}`}>
                                    <transformationStatus.icon className="h-3 w-3" />
                                    {transformationStatus.message}
                                </div>
                                {isTransformationsExhausted && (
                                    <div className="text-xs text-muted-foreground">
                                        Raw uploads still available
                                    </div>
                                )}
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Resets in {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Uploads This Month */}
                <Card className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/30 bg-gradient-to-br from-card to-card/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium">Videos Uploaded</CardTitle>
                        <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                            <Upload className="h-4 w-4 text-green-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                {usage.uploadsCount}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                videos this month
                            </p>
                            <div className="pt-2 border-t border-border/50">
                                <div className="text-xs text-green-500 flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    Unlimited video uploads
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Current Plan */}
                <Card className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/30 bg-gradient-to-br from-card to-card/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                        <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                            {plan.name === 'Free' ? (
                                <TrendingUp className="h-4 w-4 text-purple-500" />
                            ) : (
                                <Crown className="h-4 w-4 text-purple-500" />
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                {plan.name}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {plan.priceEGP > 0 ? `${plan.priceEGP} EGP/month` : 'Free forever'}
                            </p>
                            <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                <Badge
                                    variant={plan.name === 'Free' ? 'secondary' : 'default'}
                                    className="text-xs"
                                >
                                    {plan.name === 'Free' ? 'Starter' : 'Premium'}
                                </Badge>
                                {plan.name === 'Free' && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs h-6 px-2 border-primary/20 hover:bg-primary/10 cursor-pointer"
                                    >
                                        Upgrade
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}