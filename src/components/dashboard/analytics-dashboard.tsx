"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    BarChart3,
    TrendingUp,
    RefreshCw,
    Settings,
    Calendar,
    Loader2,
    AlertCircle
} from 'lucide-react'
import { UsageAnalytics } from '@/components/dashboard/usage-analytics'
import { UsageCharts } from '@/components/dashboard/usage-charts'
import { useUsageAnalytics } from '@/hooks/useUsageAnalytics'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { SubscriptionData } from '@/types'

interface AnalyticsDashboardProps {
    subscription?: SubscriptionData | null
}

export default function AnalyticsDashboard({ subscription }: AnalyticsDashboardProps) {
    const [selectedMonths, setSelectedMonths] = useState(6)
    const [selectedTab, setSelectedTab] = useState<'overview' | 'trends' | 'current'>('overview')

    const {
        analyticsData,
        currentUsage,
        loading,
        error,
        refetch,
        syncUsage
    } = useUsageAnalytics({
        months: selectedMonths,
        autoRefresh: true,
        refreshInterval: 5 * 60 * 1000 // Auto-refresh every 5 minutes
    })

    const handleRefresh = async () => {
        await refetch()
    }

    const handleSync = async () => {
        await syncUsage()
    }

    const monthOptions = [
        { value: 3, label: '3 Months' },
        { value: 6, label: '6 Months' },
        { value: 12, label: '1 Year' },
        { value: 24, label: '2 Years' }
    ]

    return (
        <div className="bg-gradient-to-br from-background via-background to-secondary/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-3">
                                <BarChart3 className="h-8 w-8 text-primary" />
                                Usage Analytics
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                Comprehensive insights into your storage, transformations, and usage patterns
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Time Range Selector */}
                            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                                {monthOptions.map(option => (
                                    <Button
                                        key={option.value}
                                        variant={selectedMonths === option.value ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setSelectedMonths(option.value)}
                                        className="text-xs h-8 cursor-pointer"
                                    >
                                        {option.label}
                                    </Button>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSync}
                                disabled={loading}
                                className="gap-2 cursor-pointer"
                            >
                                <Settings className="h-4 w-4" />
                                Sync Data
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={loading}
                                className="gap-2 cursor-pointer"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4" />
                                )}
                                Refresh
                            </Button>
                        </div>
                    </div>

                    {/* Plan Badge */}
                    {currentUsage?.plan && (
                        <div className="mt-4">
                            <Badge
                                variant={currentUsage.plan.name === 'Free' ? 'secondary' : 'default'}
                                className="text-sm px-3 py-1"
                            >
                                {currentUsage.plan.name} Plan • {currentUsage.plan.price > 0 ? `${currentUsage.plan.price} EGP/month` : 'Free'}
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Error Alert */}
                {error && (
                    <Alert className="mb-6" variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {error}. <Button variant="link" onClick={handleRefresh} className="p-0 h-auto text-destructive-foreground underline cursor-pointer">Try again</Button>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Loading State */}
                {loading && !analyticsData && (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                            <p className="text-muted-foreground">Loading analytics data...</p>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                {!loading || analyticsData ? (
                    <div className="space-y-6">
                        {/* Tab Navigation */}
                        <div className="flex flex-wrap gap-2 p-1 bg-muted rounded-lg">
                            <Button
                                variant={selectedTab === 'overview' ? 'default' : 'ghost'}
                                onClick={() => setSelectedTab('overview')}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <BarChart3 className="h-4 w-4" />
                                Overview
                            </Button>
                            <Button
                                variant={selectedTab === 'trends' ? 'default' : 'ghost'}
                                onClick={() => setSelectedTab('trends')}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <TrendingUp className="h-4 w-4" />
                                Trends
                            </Button>
                            <Button
                                variant={selectedTab === 'current' ? 'default' : 'ghost'}
                                onClick={() => setSelectedTab('current')}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <Calendar className="h-4 w-4" />
                                Current Period
                            </Button>
                        </div>

                        {/* Tab Content */}
                        {selectedTab === 'overview' && (
                            <div className="space-y-6">
                                {subscription && (
                                    <UsageAnalytics subscription={subscription} />
                                )}

                                {analyticsData && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <BarChart3 className="h-5 w-5" />
                                                Quick Stats ({selectedMonths} months)
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                        {analyticsData.summary.totalUploads.toLocaleString()}
                                                    </div>
                                                    <p className="text-sm text-blue-600/70 dark:text-blue-400/70">Total Uploads</p>
                                                </div>
                                                <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                        {Math.round(analyticsData.summary.totalStorageUsed)} MB
                                                    </div>
                                                    <p className="text-sm text-green-600/70 dark:text-green-400/70">Storage Used</p>
                                                </div>
                                                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                                                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                                        {analyticsData.summary.totalTransformations.toLocaleString()}
                                                    </div>
                                                    <p className="text-sm text-yellow-600/70 dark:text-yellow-400/70">Transformations</p>
                                                </div>
                                                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                                                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                                        {Math.round(analyticsData.summary.averageMonthlyStorage)} MB
                                                    </div>
                                                    <p className="text-sm text-purple-600/70 dark:text-purple-400/70">Avg Monthly</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {selectedTab === 'trends' && (
                            <div className="space-y-6">
                                {analyticsData ? (
                                    <UsageCharts data={analyticsData} />
                                ) : (
                                    <Card>
                                        <CardContent className="py-12 text-center">
                                            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                            <p className="text-muted-foreground">
                                                No analytics data available. Upload some files to see trends.
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {selectedTab === 'current' && (
                            <div className="space-y-6">
                                {currentUsage ? (
                                    <div className="space-y-6">
                                        {/* Current Usage Status Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <Card className="border-l-4 border-l-blue-500">
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-base">Storage Usage</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-end">
                                                            <span className="text-2xl font-bold">
                                                                {(() => {
                                                                    const used = currentUsage.current.storage.used;
                                                                    // Handle common plan values that should display as exact GB
                                                                    if (used >= 99000 && used <= 100000) return '100 GB';
                                                                    if (used >= 9900 && used <= 10000) return '10 GB';

                                                                    if (used >= 1024) {
                                                                        return `${(used / 1024).toFixed(1)} GB`;
                                                                    }
                                                                    return `${used} MB`;
                                                                })()}
                                                            </span>
                                                            <span className={`text-sm font-medium ${currentUsage.current.storage.status === 'critical' ? 'text-red-500' :
                                                                currentUsage.current.storage.status === 'warning' ? 'text-yellow-500' :
                                                                    currentUsage.current.storage.status === 'moderate' ? 'text-orange-500' :
                                                                        'text-green-500'
                                                                }`}>
                                                                {currentUsage.current.storage.percentage.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {(() => {
                                                                const remaining = currentUsage.current.storage.remaining;
                                                                // Handle common plan values that should display as exact GB
                                                                if (remaining >= 99000 && remaining <= 100000) return '100 GB remaining';
                                                                if (remaining >= 9900 && remaining <= 10000) return '10 GB remaining';

                                                                if (remaining >= 1024) {
                                                                    return `${(remaining / 1024).toFixed(1)} GB remaining`;
                                                                }
                                                                return `${remaining} MB remaining`;
                                                            })()}
                                                        </div>
                                                        <Badge variant={
                                                            currentUsage.current.storage.status === 'good' ? 'default' : 'secondary'
                                                        } className="capitalize text-xs">
                                                            {currentUsage.current.storage.status}
                                                        </Badge>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card className="border-l-4 border-l-yellow-500">
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-base">Transformations</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-end">
                                                            <span className="text-2xl font-bold">
                                                                {currentUsage.current.transformations.used}
                                                            </span>
                                                            <span className={`text-sm font-medium ${currentUsage.current.transformations.status === 'critical' ? 'text-red-500' :
                                                                currentUsage.current.transformations.status === 'warning' ? 'text-yellow-500' :
                                                                    currentUsage.current.transformations.status === 'moderate' ? 'text-orange-500' :
                                                                        'text-green-500'
                                                                }`}>
                                                                {currentUsage.current.transformations.percentage.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {currentUsage.current.transformations.remaining} remaining
                                                        </div>
                                                        <Badge variant={
                                                            currentUsage.current.transformations.status === 'good' ? 'default' : 'secondary'
                                                        } className="capitalize text-xs">
                                                            {currentUsage.current.transformations.status}
                                                        </Badge>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card className="border-l-4 border-l-green-500">
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="text-base">Uploads This Month</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2">
                                                        <span className="text-2xl font-bold">
                                                            {currentUsage.current.uploads.count}
                                                        </span>
                                                        <div className="text-sm text-muted-foreground">
                                                            Files uploaded in {new Date().toLocaleString('default', { month: 'long' })}
                                                        </div>
                                                        <Badge variant="default" className="text-xs">
                                                            Active
                                                        </Badge>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                ) : (
                                    <Card>
                                        <CardContent className="py-12 text-center">
                                            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                            <p className="text-muted-foreground">No current usage data available.</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    )
}