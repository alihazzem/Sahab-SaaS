"use client"

import { PLAN_LIMITS as SERVER_PLAN_LIMITS } from '@/lib/plan-limits'
import type { StorageInfo, ClientUsageValidation } from '@/types'

// Client-side plan limits mapping (converted from server format)
export const PLAN_LIMITS: Record<string, { maxFileSize: number; storage: number }> = {
    'FREE': {
        maxFileSize: SERVER_PLAN_LIMITS.FREE.maxUploadSize * 1024 * 1024, // Convert MB to bytes
        storage: SERVER_PLAN_LIMITS.FREE.storageLimit * 1024 * 1024, // Convert MB to bytes
    },
    'PRO': {
        maxFileSize: SERVER_PLAN_LIMITS.PRO.maxUploadSize * 1024 * 1024, // Convert MB to bytes
        storage: SERVER_PLAN_LIMITS.PRO.storageLimit * 1024 * 1024, // Convert MB to bytes
    },
    'ENTERPRISE': {
        maxFileSize: SERVER_PLAN_LIMITS.ENTERPRISE.maxUploadSize * 1024 * 1024, // Convert MB to bytes
        storage: SERVER_PLAN_LIMITS.ENTERPRISE.storageLimit * 1024 * 1024, // Convert MB to bytes
    },
}

export function validateFileSize(file: File, plan: string): ClientUsageValidation {
    const normalizedPlan = plan.toUpperCase()
    const limits = PLAN_LIMITS[normalizedPlan] || PLAN_LIMITS['FREE']

    console.log('Validating file size:', {
        fileName: file.name,
        fileSize: file.size,
        fileSizeFormatted: formatFileSize(file.size),
        plan: plan,
        normalizedPlan: normalizedPlan,
        maxFileSize: limits.maxFileSize,
        maxFileSizeFormatted: formatFileSize(limits.maxFileSize)
    })

    if (file.size > limits.maxFileSize) {
        return {
            isValid: false,
            error: `File size (${formatFileSize(file.size)}) exceeds ${normalizedPlan} plan limit of ${formatFileSize(limits.maxFileSize)}`
        }
    }

    // Warning if file is close to limit (80% or more)
    if (file.size > limits.maxFileSize * 0.8) {
        return {
            isValid: true,
            warning: `File size is close to your ${normalizedPlan} plan limit`
        }
    }

    return { isValid: true }
}

export function validateStorageCapacity(fileSize: number, storageInfo: StorageInfo): ClientUsageValidation {
    if (fileSize > storageInfo.available) {
        return {
            isValid: false,
            error: `Not enough storage space. Need ${formatFileSize(fileSize)}, but only ${formatFileSize(storageInfo.available)} available`
        }
    }

    // Warning if this upload will use more than 90% of storage
    const afterUpload = storageInfo.current + fileSize
    if (afterUpload > storageInfo.limit * 0.9) {
        return {
            isValid: true,
            warning: `This upload will use ${Math.round((afterUpload / storageInfo.limit) * 100)}% of your storage`
        }
    }

    return { isValid: true }
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    const value = bytes / Math.pow(k, i)

    // Handle special case for 1000 MB = 1 GB
    if (i === 2 && value >= 1000) {
        return '1 GB'
    }

    return parseFloat(value.toFixed(2)) + ' ' + sizes[i]
}

export async function fetchStorageInfo(): Promise<StorageInfo | null> {
    try {
        const response = await fetch('/api/subscription/status', {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        if (!response.ok) return null

        const data = await response.json()
        if (data.success && data.subscription) {
            const { plan, usage } = data.subscription
            return {
                current: (usage?.storageUsed || 0) * 1024 * 1024, // Convert MB to bytes
                limit: plan.storageLimit * 1024 * 1024, // Convert MB to bytes
                available: Math.max(0, (plan.storageLimit - (usage?.storageUsed || 0)) * 1024 * 1024)
            }
        }
        return null
    } catch (error) {
        console.error('Failed to fetch storage info:', error)
        return null
    }
}

export async function fetchUserPlan(): Promise<string> {
    try {
        console.log('Fetching user plan from API...')
        const response = await fetch('/api/subscription/status', {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        if (!response.ok) {
            console.log('API response not OK:', response.status, response.statusText)
            return 'FREE'
        }

        const data = await response.json()
        console.log('Full API response:', JSON.stringify(data, null, 2))

        if (data.success && data.subscription?.plan?.name) {
            const planName = data.subscription.plan.name.toUpperCase()
            console.log('Extracted plan name:', planName)
            return planName
        }

        console.log('No valid plan found in response, defaulting to FREE')
        return 'FREE'
    } catch (error) {
        console.error('Failed to fetch user plan:', error)
        return 'FREE'
    }
}