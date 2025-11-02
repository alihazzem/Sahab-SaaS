import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const currentDate = new Date()
        const currentMonth = currentDate.getMonth() + 1
        const currentYear = currentDate.getFullYear()

        // Calculate actual usage from media files
        const mediaStats = await prisma.media.aggregate({
            where: {
                userId,
                createdAt: {
                    gte: new Date(currentYear, currentMonth - 1, 1),
                    lt: new Date(currentYear, currentMonth, 1)
                }
            },
            _sum: {
                originalSize: true
            },
            _count: {
                id: true
            }
        })

        const actualStorageUsed = Math.round((mediaStats._sum.originalSize || 0) / (1024 * 1024)) // Convert to MB
        const actualUploadsCount = mediaStats._count.id

        // TODO: Calculate actual transformations used (would need transformation tracking in media table)
        // For now, we'll keep the existing transformations count
        const existingUsage = await prisma.usageTracking.findUnique({
            where: {
                userId_month_year: {
                    userId,
                    month: currentMonth,
                    year: currentYear
                }
            }
        })

        const actualTransformationsUsed = existingUsage?.transformationsUsed || 0

        // Update or create usage record with calculated values
        const updatedUsage = await prisma.usageTracking.upsert({
            where: {
                userId_month_year: {
                    userId,
                    month: currentMonth,
                    year: currentYear
                }
            },
            update: {
                storageUsed: actualStorageUsed,
                uploadsCount: actualUploadsCount,
                updatedAt: new Date()
            },
            create: {
                userId,
                month: currentMonth,
                year: currentYear,
                storageUsed: actualStorageUsed,
                transformationsUsed: actualTransformationsUsed,
                uploadsCount: actualUploadsCount
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                message: 'Usage synchronized successfully',
                before: existingUsage ? {
                    storageUsed: existingUsage.storageUsed,
                    uploadsCount: existingUsage.uploadsCount,
                    transformationsUsed: existingUsage.transformationsUsed
                } : null,
                after: {
                    storageUsed: updatedUsage.storageUsed,
                    uploadsCount: updatedUsage.uploadsCount,
                    transformationsUsed: updatedUsage.transformationsUsed
                },
                differences: {
                    storage: actualStorageUsed - (existingUsage?.storageUsed || 0),
                    uploads: actualUploadsCount - (existingUsage?.uploadsCount || 0)
                }
            }
        })

    } catch (error) {
        console.error('Error synchronizing usage:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to synchronize usage data'
            },
            { status: 500 }
        )
    }
}
