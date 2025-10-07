// Format bytes to human readable format
export function formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Format storage usage for display (MB to human readable)
export function formatStorageUsage(mb: number): string {
    return formatBytes(mb * 1024 * 1024)
}

// Calculate usage percentage with safety checks
export function calculateUsagePercentage(used: number, limit: number): number {
    if (limit === 0) return 0
    return Math.min((used / limit) * 100, 100)
}

// Get usage status based on percentage
export function getUsageStatus(percentage: number): {
    status: 'good' | 'moderate' | 'warning' | 'critical'
    color: string
    message: string
} {
    if (percentage >= 95) {
        return {
            status: 'critical',
            color: 'text-red-500',
            message: 'Usage critically high'
        }
    }
    if (percentage >= 80) {
        return {
            status: 'warning',
            color: 'text-yellow-500',
            message: 'Usage high - consider upgrading'
        }
    }
    if (percentage >= 60) {
        return {
            status: 'moderate',
            color: 'text-orange-500',
            message: 'Usage moderate'
        }
    }
    return {
        status: 'good',
        color: 'text-green-500',
        message: 'Usage healthy'
    }
}

// Format month names for charts
export function formatMonthName(month: number, year: number): string {
    const date = new Date(year, month - 1)
    return date.toLocaleDateString('en-US', {
        month: 'short',
        year: year === new Date().getFullYear() ? undefined : 'numeric'
    })
}

// Calculate growth percentage
export function calculateGrowth(current: number, previous: number): {
    percentage: number
    isPositive: boolean
    isNeutral: boolean
} {
    if (previous === 0) {
        return {
            percentage: current > 0 ? 100 : 0,
            isPositive: current > 0,
            isNeutral: current === 0
        }
    }

    const percentage = ((current - previous) / previous) * 100
    return {
        percentage: Math.abs(percentage),
        isPositive: percentage > 0,
        isNeutral: percentage === 0
    }
}

// Format growth for display
export function formatGrowth(growth: ReturnType<typeof calculateGrowth>): {
    text: string
    color: string
    icon: string
} {
    if (growth.isNeutral) {
        return {
            text: 'No change',
            color: 'text-gray-500',
            icon: '→'
        }
    }

    return {
        text: `${growth.isPositive ? '+' : '-'}${growth.percentage.toFixed(1)}%`,
        color: growth.isPositive ? 'text-green-500' : 'text-red-500',
        icon: growth.isPositive ? '↗' : '↘'
    }
}

// Get time until next reset (first of next month)
export function getTimeUntilReset(): {
    days: number
    hours: number
    resetDate: Date
} {
    const now = new Date()
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const timeDiff = nextReset.getTime() - now.getTime()

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    return { days, hours, resetDate: nextReset }
}

// Generate chart colors for different data series
export function getChartColors() {
    return {
        storage: {
            primary: '#3b82f6',   // blue-500
            light: '#93c5fd',     // blue-300
            bg: '#dbeafe'         // blue-100
        },
        transformations: {
            primary: '#eab308',   // yellow-500  
            light: '#fde047',     // yellow-300
            bg: '#fef3c7'         // yellow-100
        },
        uploads: {
            primary: '#10b981',   // emerald-500
            light: '#6ee7b7',     // emerald-300  
            bg: '#d1fae5'         // emerald-100
        },
        gradient: [
            '#3b82f6', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b'
        ]
    }
}

// Validate and sanitize usage data
export function validateUsageData(data: unknown): boolean {
    try {
        if (!data || typeof data !== 'object') return false

        const dataObj = data as Record<string, unknown>

        // Check required fields
        const requiredFields = ['historical', 'growth', 'fileTypes', 'dailyActivity', 'summary']
        for (const field of requiredFields) {
            if (!dataObj[field]) return false
        }

        // Validate historical data structure
        if (!Array.isArray(dataObj.historical)) return false

        // Validate growth data
        const growth = dataObj.growth as Record<string, unknown>
        if (!growth ||
            typeof growth.storage !== 'number' ||
            typeof growth.transformations !== 'number' ||
            typeof growth.uploads !== 'number') {
            return false
        }

        return true
    } catch {
        return false
    }
}

// Cache keys for usage data
export const CACHE_KEYS = {
    CURRENT_USAGE: 'usage_current',
    ANALYTICS_DATA: 'usage_analytics',
    CACHE_DURATION: 5 * 60 * 1000 // 5 minutes
} as const

// API endpoints
export const USAGE_ENDPOINTS = {
    CURRENT: '/api/usage/current',
    ANALYTICS: '/api/usage/analytics',
    UPDATE: '/api/usage/update',
    SYNC: '/api/usage/sync'
} as const