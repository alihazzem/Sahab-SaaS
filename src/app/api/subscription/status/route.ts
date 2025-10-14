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

        // Get current month usage
        const currentDate = new Date()
        const currentMonth = currentDate.getMonth() + 1
        const currentYear = currentDate.getFullYear()

        let usage = await prisma.usageTracking.findFirst({
            where: {
                userId: userId,
                month: currentMonth,
                year: currentYear
            }
        })

        // If no usage record exists, create one
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

        // Calculate remaining allowances
        const storageUsed = usage.storageUsed
        const transformationsUsed = usage.transformationsUsed
        const uploadsCount = usage.uploadsCount

        const storageRemaining = Math.max(0, currentPlan.storageLimit - storageUsed)
        const transformationsRemaining = Math.max(0, currentPlan.transformationsLimit - transformationsUsed)

        return NextResponse.json({
            success: true,
            subscription: {
                plan: {
                    ...currentPlan,
                    priceEGP: currentPlan.price / 100 // Convert to EGP
                },
                status: subscription?.status || 'FREE',
                startDate: subscription?.startDate,
                endDate: subscription?.endDate,
                usage: {
                    storageUsed,
                    transformationsUsed,
                    uploadsCount,
                    storageRemaining,
                    transformationsRemaining
                }
            }
        })
    } catch (error) {
        console.error('Error fetching subscription status:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch subscription status'
            },
            { status: 500 }
        )
    }
}