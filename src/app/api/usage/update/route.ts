import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { action, mediaId, fileSize, transformations } = body

        if (!action || !['upload', 'delete'].includes(action)) {
            return NextResponse.json(
                { success: false, error: 'Invalid action. Must be "upload" or "delete"' },
                { status: 400 }
            )
        }

        const currentDate = new Date()
        const currentMonth = currentDate.getMonth() + 1
        const currentYear = currentDate.getFullYear()

        // Get or create current month usage record
        const existingUsage = await prisma.usageTracking.findUnique({
            where: {
                userId_month_year: {
                    userId,
                    month: currentMonth,
                    year: currentYear
                }
            }
        })

        let updatedUsage

        if (action === 'upload') {
            const fileSizeMB = Math.round((fileSize || 0) / (1024 * 1024))
            const transformationCount = transformations || 0

            if (existingUsage) {
                // Update existing record
                updatedUsage = await prisma.usageTracking.update({
                    where: { id: existingUsage.id },
                    data: {
                        storageUsed: existingUsage.storageUsed + fileSizeMB,
                        transformationsUsed: existingUsage.transformationsUsed + transformationCount,
                        uploadsCount: existingUsage.uploadsCount + 1,
                        updatedAt: new Date()
                    }
                })
            } else {
                // Create new record
                updatedUsage = await prisma.usageTracking.create({
                    data: {
                        userId,
                        month: currentMonth,
                        year: currentYear,
                        storageUsed: fileSizeMB,
                        transformationsUsed: transformationCount,
                        uploadsCount: 1
                    }
                })
            }

        } else if (action === 'delete' && mediaId) {
            // Get the media file to know its size
            const mediaFile = await prisma.media.findUnique({
                where: { id: mediaId }
            })

            if (!mediaFile) {
                return NextResponse.json(
                    { success: false, error: 'Media file not found' },
                    { status: 404 }
                )
            }

            if (mediaFile.userId !== userId) {
                return NextResponse.json(
                    { success: false, error: 'Unauthorized to delete this file' },
                    { status: 403 }
                )
            }

            const fileSizeMB = Math.round(mediaFile.originalSize / (1024 * 1024))

            if (existingUsage) {
                // Update existing record (subtract storage, but keep upload count for historical accuracy)
                updatedUsage = await prisma.usageTracking.update({
                    where: { id: existingUsage.id },
                    data: {
                        storageUsed: Math.max(0, existingUsage.storageUsed - fileSizeMB),
                        updatedAt: new Date()
                    }
                })
            } else {
                // If no usage record exists, create one with zero values
                updatedUsage = await prisma.usageTracking.create({
                    data: {
                        userId,
                        month: currentMonth,
                        year: currentYear,
                        storageUsed: 0,
                        transformationsUsed: 0,
                        uploadsCount: 0
                    }
                })
            }

            // Actually delete the media record
            await prisma.media.delete({
                where: { id: mediaId }
            })
        }

        if (!updatedUsage) {
            return NextResponse.json(
                { success: false, error: 'Failed to update usage record' },
                { status: 500 }
            )
        }

        // Get updated plan limits for response
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

        if (!currentPlan) {
            return NextResponse.json(
                { success: false, error: 'No plan found' },
                { status: 500 }
            )
        }

        // Calculate remaining allowances
        const storageRemaining = Math.max(0, currentPlan.storageLimit - updatedUsage.storageUsed)
        const transformationsRemaining = Math.max(0, currentPlan.transformationsLimit - updatedUsage.transformationsUsed)

        return NextResponse.json({
            success: true,
            data: {
                action,
                usage: {
                    storageUsed: updatedUsage.storageUsed,
                    transformationsUsed: updatedUsage.transformationsUsed,
                    uploadsCount: updatedUsage.uploadsCount,
                    storageRemaining,
                    transformationsRemaining
                },
                plan: {
                    name: currentPlan.name,
                    storageLimit: currentPlan.storageLimit,
                    transformationsLimit: currentPlan.transformationsLimit
                }
            }
        })

    } catch (error) {
        console.error('Error updating usage:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to update usage'
            },
            { status: 500 }
        )
    }
}