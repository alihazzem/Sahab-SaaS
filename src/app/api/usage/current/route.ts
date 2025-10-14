import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get current month usage and plan in parallel
        const currentDate = new Date()
        const currentMonth = currentDate.getMonth() + 1
        const currentYear = currentDate.getFullYear()

        const [usageResult, subscription] = await Promise.all([
            prisma.usageTracking.findFirst({
                where: {
                    userId,
                    month: currentMonth,
                    year: currentYear
                }
            }),
            prisma.subscription.findFirst({
                where: {
                    userId,
                    status: 'ACTIVE'
                },
                include: {
                    plan: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })
        ])

        // If no usage record exists, create one
        let usage = usageResult
        if (!usage) {
            usage = await prisma.usageTracking.create({
                data: {
                    userId: userId,
                    month: currentMonth,
                    year: currentYear,
                    storageUsed: 0,
                    transformationsUsed: 0,
                    uploadsCount: 0
                }
            })
        }

        // Default to Free plan if no subscription
        const currentPlan = subscription?.plan || await prisma.plan.findFirst({
            where: { name: 'Free' }
        })

        if (!currentPlan) {
            return NextResponse.json(
                { success: false, error: 'No plan found' },
                { status: 500 }
            )
        }

        // Calculate usage stats
        const storageUsed = usage.storageUsed
        const transformationsUsed = usage.transformationsUsed
        const uploadsCount = usage.uploadsCount

        const storageRemaining = Math.max(0, currentPlan.storageLimit - storageUsed)
        const transformationsRemaining = Math.max(0, currentPlan.transformationsLimit - transformationsUsed)

        // Calculate percentages
        const storagePercentage = Math.round((storageUsed / currentPlan.storageLimit) * 100)
        const transformationsPercentage = Math.round((transformationsUsed / currentPlan.transformationsLimit) * 100)

        // Get usage status
        const getUsageStatus = (percentage: number) => {
            if (percentage >= 95) return 'critical'
            if (percentage >= 80) return 'warning'
            if (percentage >= 60) return 'moderate'
            return 'good'
        }

        return NextResponse.json({
            success: true,
            data: {
                // Current month usage
                current: {
                    month: currentMonth,
                    year: currentYear,
                    storage: {
                        used: storageUsed,
                        limit: currentPlan.storageLimit,
                        remaining: storageRemaining,
                        percentage: storagePercentage,
                        status: getUsageStatus(storagePercentage)
                    },
                    transformations: {
                        used: transformationsUsed,
                        limit: currentPlan.transformationsLimit,
                        remaining: transformationsRemaining,
                        percentage: transformationsPercentage,
                        status: getUsageStatus(transformationsPercentage)
                    },
                    uploads: {
                        count: uploadsCount
                    }
                },

                // Plan information
                plan: {
                    id: currentPlan.id,
                    name: currentPlan.name,
                    price: currentPlan.price / 100, // Convert to EGP
                    limits: {
                        storage: currentPlan.storageLimit,
                        transformations: currentPlan.transformationsLimit,
                        maxUploadSize: currentPlan.maxUploadSize,
                        teamMembers: currentPlan.teamMembers
                    }
                },

                // Subscription status
                subscription: {
                    status: subscription?.status || 'FREE',
                    startDate: subscription?.startDate,
                    endDate: subscription?.endDate,
                    isActive: subscription?.status === 'ACTIVE'
                }
            }
        })

    } catch (error) {
        console.error('Error fetching current usage:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch usage data'
            },
            { status: 500 }
        )
    }
}