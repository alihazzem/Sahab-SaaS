"use client"

import { useState, useEffect, useCallback } from 'react'
import { USAGE_ENDPOINTS, validateUsageData } from '@/lib/analytics-utils'
import type { UsageAnalytics, CurrentUsage } from '@/types'

interface UseUsageAnalyticsOptions {
    months?: number
    autoRefresh?: boolean
    refreshInterval?: number
}

interface UseUsageAnalyticsReturn {
    analyticsData: UsageAnalytics | null
    currentUsage: CurrentUsage | null
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
    syncUsage: () => Promise<void>
}

export function useUsageAnalytics(options: UseUsageAnalyticsOptions = {}): UseUsageAnalyticsReturn {
    const {
        months = 6,
        autoRefresh = false,
        refreshInterval = 5 * 60 * 1000 // 5 minutes
    } = options

    const [analyticsData, setAnalyticsData] = useState<UsageAnalytics | null>(null)
    const [currentUsage, setCurrentUsage] = useState<CurrentUsage | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch analytics data
    const fetchAnalyticsData = useCallback(async () => {
        try {
            const response = await fetch(`${USAGE_ENDPOINTS.ANALYTICS}?months=${months}`)
            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch analytics data')
            }

            if (!result.success || !validateUsageData(result.data)) {
                throw new Error('Invalid analytics data received')
            }

            setAnalyticsData(result.data)
            setError(null)
        } catch (err) {
            console.error('Failed to fetch analytics data:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch analytics data')
        }
    }, [months])

    // Fetch current usage
    const fetchCurrentUsage = useCallback(async () => {
        try {
            const response = await fetch(USAGE_ENDPOINTS.CURRENT)
            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch current usage')
            }

            if (!result.success) {
                throw new Error('Invalid current usage data received')
            }

            setCurrentUsage(result.data)
            setError(null)
        } catch (err) {
            console.error('Failed to fetch current usage:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch current usage')
        }
    }, [])

    // Fetch all data
    const refetch = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            await Promise.all([
                fetchAnalyticsData(),
                fetchCurrentUsage()
            ])
        } finally {
            setLoading(false)
        }
    }, [fetchAnalyticsData, fetchCurrentUsage])

    // Sync usage with actual data
    const syncUsage = useCallback(async () => {
        try {
            const response = await fetch(USAGE_ENDPOINTS.SYNC, {
                method: 'POST'
            })
            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to sync usage data')
            }

            // Refetch data after sync
            await refetch()
        } catch (err) {
            console.error('Failed to sync usage:', err)
            setError(err instanceof Error ? err.message : 'Failed to sync usage data')
        }
    }, [refetch])

    // Initial data fetch
    useEffect(() => {
        refetch()
    }, [refetch])

    // Auto-refresh functionality
    useEffect(() => {
        if (!autoRefresh) return

        const interval = setInterval(() => {
            refetch()
        }, refreshInterval)

        return () => clearInterval(interval)
    }, [autoRefresh, refreshInterval, refetch])

    return {
        analyticsData,
        currentUsage,
        loading,
        error,
        refetch,
        syncUsage
    }
}

// Hook for updating usage in real-time (for upload/delete operations)
export function useUsageUpdater() {
    const [updating, setUpdating] = useState(false)

    const updateUsage = useCallback(async (
        action: 'upload' | 'delete',
        options: {
            mediaId?: string
            fileSize?: number
            transformations?: number
        }
    ) => {
        setUpdating(true)

        try {
            const response = await fetch(USAGE_ENDPOINTS.UPDATE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action,
                    ...options
                })
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update usage')
            }

            return result.data
        } catch (err) {
            console.error('Failed to update usage:', err)
            throw err
        } finally {
            setUpdating(false)
        }
    }, [])

    return {
        updateUsage,
        updating
    }
}

// Simple hook for just current usage (lighter weight)
export function useCurrentUsage() {
    const [data, setData] = useState<CurrentUsage | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const response = await fetch(USAGE_ENDPOINTS.CURRENT)
            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch usage')
            }

            setData(result.data)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch usage')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    return { data, loading, error, refetch: fetchData }
}