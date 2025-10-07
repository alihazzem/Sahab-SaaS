import prisma from '@/lib/prisma'
import { PLAN_LIMITS, type PlanType } from '@/lib/plan-limits'

/**
 * Get user's current storage usage in MB
 */
export async function getUserStorageUsage(userId: string): Promise<number> {
    try {
        const result = await prisma.media.aggregate({
            where: {
                userId,
                // isDeleted: false, // Remove if field doesn't exist yet
            },
            _sum: {
                originalSize: true,
            },
        })

        // Convert bytes to MB
        const totalBytes = result._sum?.originalSize || 0
        return totalBytes / (1024 * 1024)
    } catch (error) {
        console.error('Failed to get user storage usage:', error)
        return 0
    }
}

/**
 * Get user's plan limits based on subscription
 */
export async function getUserPlanLimits(userId: string): Promise<typeof PLAN_LIMITS[PlanType]> {
    try {
        // Get user's current subscription
        const subscription = await prisma.subscription.findFirst({
            where: {
                userId: userId,
                status: 'ACTIVE'
            },
            include: {
                plan: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        if (subscription?.plan) {
            const planName = subscription.plan.name.toUpperCase() as PlanType
            if (planName in PLAN_LIMITS) {
                console.log(`User ${userId} has ${planName} plan with limits:`, PLAN_LIMITS[planName])
                return PLAN_LIMITS[planName]
            }
        }

        console.log(`User ${userId} has no active subscription, using FREE plan limits`)
        return PLAN_LIMITS.FREE
    } catch (error) {
        console.error('Failed to get user plan limits:', error)
        return PLAN_LIMITS.FREE
    }
}

/**
 * Check if user can upload a file of given size
 */
export async function checkStorageLimit(
    userId: string,
    newFileSize: number
): Promise<{ canUpload: boolean; reason?: string; usage?: StorageUsage }> {
    try {
        const [currentUsageMB, planLimits] = await Promise.all([
            getUserStorageUsage(userId),
            getUserPlanLimits(userId)
        ])

        const newFileSizeMB = newFileSize / (1024 * 1024)
        const projectedUsage = currentUsageMB + newFileSizeMB

        const usage: StorageUsage = {
            current: currentUsageMB,
            limit: planLimits.storageLimit,
            projected: projectedUsage,
            percentage: (currentUsageMB / planLimits.storageLimit) * 100,
            remaining: Math.max(0, planLimits.storageLimit - currentUsageMB)
        }

        if (projectedUsage > planLimits.storageLimit) {
            return {
                canUpload: false,
                reason: `Storage limit exceeded. Need ${(projectedUsage - planLimits.storageLimit).toFixed(1)}MB more space. Consider upgrading your plan.`,
                usage
            }
        }

        return { canUpload: true, usage }
    } catch (error) {
        console.error('Failed to check storage limit:', error)
        return {
            canUpload: false,
            reason: 'Unable to verify storage limits. Please try again.'
        }
    }
}

/**
 * Check if file size is within plan limits
 */
export async function checkFileSizeLimit(
    userId: string,
    fileSize: number
): Promise<{ isValid: boolean; reason?: string; maxAllowed?: number }> {
    try {
        const planLimits = await getUserPlanLimits(userId)
        const fileSizeMB = fileSize / (1024 * 1024)
        const maxAllowedMB = planLimits.maxUploadSize

        if (fileSizeMB > maxAllowedMB) {
            return {
                isValid: false,
                reason: `File too large. Maximum size for your plan: ${maxAllowedMB}MB. Current file: ${fileSizeMB.toFixed(1)}MB.`,
                maxAllowed: maxAllowedMB
            }
        }

        return { isValid: true, maxAllowed: maxAllowedMB }
    } catch (error) {
        console.error('Failed to check file size limit:', error)
        return {
            isValid: false,
            reason: 'Unable to verify file size limits. Please try again.'
        }
    }
}

/**
 * Get user's current transformation usage
 */
export async function getTransformationUsage(userId: string): Promise<{
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
}> {
    try {
        const planLimits = await getUserPlanLimits(userId)

        // Get current month usage from database
        const currentDate = new Date()
        const currentMonth = currentDate.getMonth() + 1
        const currentYear = currentDate.getFullYear()

        const usage = await prisma.usageTracking.findFirst({
            where: {
                userId: userId,
                month: currentMonth,
                year: currentYear
            }
        })

        const used = usage?.transformationsUsed || 0
        const limit = planLimits.transformationsLimit
        const remaining = Math.max(0, limit - used)
        const percentage = (used / limit) * 100

        return { used, limit, remaining, percentage }
    } catch (error) {
        console.error('Failed to get transformation usage:', error)
        // Return safe defaults based on FREE plan in case of error
        return { used: 0, limit: 50, remaining: 50, percentage: 0 }
    }
}

/**
 * Check if user can perform video transformations
 */
export async function checkTransformationLimit(
    userId: string,
    transformationsNeeded: number = 3 // Default for video processing (3 resolutions)
): Promise<{ canProcess: boolean; reason?: string; remaining?: number }> {
    try {
        const usage = await getTransformationUsage(userId)

        if (usage.remaining < transformationsNeeded) {
            return {
                canProcess: false,
                reason: `Insufficient transformation quota. Need ${transformationsNeeded}, have ${usage.remaining} remaining. Video will be uploaded without processing.`,
                remaining: usage.remaining
            }
        }

        return { canProcess: true, remaining: usage.remaining }
    } catch (error) {
        console.error('Failed to check transformation limit:', error)
        return {
            canProcess: false,
            reason: 'Unable to verify transformation limits. Video will be uploaded without processing.'
        }
    }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Get usage warning level based on percentage
 */
export function getUsageWarningLevel(percentage: number): 'safe' | 'warning' | 'critical' | 'exceeded' {
    if (percentage >= 100) return 'exceeded'
    if (percentage >= 95) return 'critical'
    if (percentage >= 80) return 'warning'
    return 'safe'
}

/**
 * Get upgrade suggestion based on current usage
 */
export function getUpgradeSuggestion(currentPlan: PlanType, usageType: 'storage' | 'transformations'): string {
    if (currentPlan === 'FREE') {
        return usageType === 'storage'
            ? 'Upgrade to Pro for 10GB storage and 100MB uploads'
            : 'Upgrade to Pro for 5,000 monthly transformations'
    }

    if (currentPlan === 'PRO') {
        return usageType === 'storage'
            ? 'Upgrade to Enterprise for 100GB storage and 1GB uploads'
            : 'Upgrade to Enterprise for 50,000 monthly transformations'
    }

    return 'Contact support for custom enterprise solutions'
}

// Types
export interface StorageUsage {
    current: number // MB
    limit: number // MB
    projected: number // MB
    percentage: number
    remaining: number // MB
}

export interface UsageLimits {
    storage: StorageUsage
    transformations: {
        used: number
        limit: number
        remaining: number
        percentage: number
    }
    plan: {
        name: string
        maxUploadSize: number
    }
}