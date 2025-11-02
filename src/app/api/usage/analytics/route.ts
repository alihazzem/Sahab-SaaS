import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const months = parseInt(searchParams.get('months') || '6') // Default to 6 months

        // Calculate date range
        const currentDate = new Date()
        const currentMonth = currentDate.getMonth() + 1
        const currentYear = currentDate.getFullYear()

        // Generate month/year pairs for the requested period
        const monthPairs = []
        for (let i = 0; i < months; i++) {
            let month = currentMonth - i
            let year = currentYear

            if (month <= 0) {
                month += 12
                year -= 1
            }

            monthPairs.push({ month, year })
        }

        // Get historical usage data
        const historicalUsage = await prisma.usageTracking.findMany({
            where: {
                userId,
                OR: monthPairs.map(({ month, year }) => ({ month, year }))
            },
            orderBy: [
                { year: 'asc' },
                { month: 'asc' }
            ]
        })

        // Get file type breakdown for current month
        const fileTypeBreakdown = await prisma.media.groupBy({
            by: ['type'],
            where: {
                userId,
                createdAt: {
                    gte: new Date(currentYear, currentMonth - 1, 1),
                    lt: new Date(currentYear, currentMonth, 1)
                }
            },
            _count: {
                type: true
            },
            _sum: {
                originalSize: true
            }
        })

        // Get daily upload activity for current month
        const dailyUploads = await prisma.$queryRaw<Array<{
            day: string;
            uploads: number;
            storage: number;
        }>>`
            SELECT 
                DATE_TRUNC('day', "createdAt")::date as day,
                COUNT(*)::int as uploads,
                SUM("originalSize")::int as storage
            FROM "Media"
            WHERE "userId" = ${userId}
                AND "createdAt" >= ${new Date(currentYear, currentMonth - 1, 1)}
                AND "createdAt" < ${new Date(currentYear, currentMonth, 1)}
            GROUP BY DATE_TRUNC('day', "createdAt")
            ORDER BY day ASC
        `

        // Get user's current plan for context
        const subscription = await prisma.subscription.findFirst({
            where: {
                userId,
                status: 'ACTIVE'
            },
            include: {
                plan: true
            }
        })

        const currentPlan = subscription?.plan || await prisma.plan.findFirst({
            where: { name: 'Free' }
        })

        // Fill missing months with zero data
        const completeHistory = monthPairs.reverse().map(({ month, year }) => {
            const existing = historicalUsage.find(h => h.month === month && h.year === year)
            return {
                month,
                year,
                monthName: new Date(year, month - 1).toLocaleString('default', { month: 'short', year: 'numeric' }),
                storageUsed: existing?.storageUsed || 0,
                transformationsUsed: existing?.transformationsUsed || 0,
                uploadsCount: existing?.uploadsCount || 0
            }
        })

        // Calculate growth trends
        const currentMonthData = completeHistory[completeHistory.length - 1]
        const previousMonthData = completeHistory[completeHistory.length - 2]

        const storageGrowth = previousMonthData?.storageUsed
            ? Math.round(((currentMonthData.storageUsed - previousMonthData.storageUsed) / previousMonthData.storageUsed) * 100)
            : 0

        const transformationGrowth = previousMonthData?.transformationsUsed
            ? Math.round(((currentMonthData.transformationsUsed - previousMonthData.transformationsUsed) / previousMonthData.transformationsUsed) * 100)
            : 0

        const uploadGrowth = previousMonthData?.uploadsCount
            ? Math.round(((currentMonthData.uploadsCount - previousMonthData.uploadsCount) / previousMonthData.uploadsCount) * 100)
            : 0

        return NextResponse.json({
            success: true,
            data: {
                // Historical trends
                historical: completeHistory,

                // Growth metrics
                growth: {
                    storage: storageGrowth,
                    transformations: transformationGrowth,
                    uploads: uploadGrowth
                },

                // File type breakdown (current month)
                fileTypes: fileTypeBreakdown.map(item => ({
                    type: item.type,
                    count: item._count.type,
                    size: Math.round((item._sum.originalSize || 0) / (1024 * 1024)), // Convert to MB
                    percentage: Math.round((item._count.type / (fileTypeBreakdown.reduce((acc, curr) => acc + curr._count.type, 0))) * 100)
                })),

                // Daily activity (current month)
                dailyActivity: dailyUploads.map(day => ({
                    date: day.day,
                    uploads: day.uploads,
                    storage: Math.round(day.storage / (1024 * 1024)) // Convert to MB
                })),

                // Summary stats
                summary: {
                    totalMonths: months,
                    totalStorageUsed: completeHistory.reduce((acc, month) => acc + month.storageUsed, 0),
                    totalTransformations: completeHistory.reduce((acc, month) => acc + month.transformationsUsed, 0),
                    totalUploads: completeHistory.reduce((acc, month) => acc + month.uploadsCount, 0),
                    averageMonthlyStorage: Math.round(completeHistory.reduce((acc, month) => acc + month.storageUsed, 0) / months),
                    planLimits: currentPlan ? {
                        storage: currentPlan.storageLimit,
                        transformations: currentPlan.transformationsLimit,
                        planName: currentPlan.name
                    } : null
                }
            }
        })

    } catch (error) {
        console.error('Error fetching usage analytics:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch usage analytics'
            },
            { status: 500 }
        )
    }
}
