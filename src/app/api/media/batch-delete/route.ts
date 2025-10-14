import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { v2 as cloudinary } from 'cloudinary'
import { notifyUploadFailed } from '@/lib/notifications'

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * POST /api/media/batch-delete
 * Delete multiple media items at once
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { ids } = body as { ids: string[] }

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Media IDs are required' },
                { status: 400 }
            )
        }

        // Limit to 50 items at once to prevent abuse
        if (ids.length > 50) {
            return NextResponse.json(
                { success: false, error: 'Cannot delete more than 50 items at once' },
                { status: 400 }
            )
        }

        // Fetch all media items to verify ownership
        const mediaItems = await prisma.media.findMany({
            where: {
                id: { in: ids },
                userId: userId
            }
        })

        if (mediaItems.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No media items found or you do not have permission' },
                { status: 404 }
            )
        }

        // Track deletion results
        const results = {
            deleted: [] as string[],
            failed: [] as { id: string; error: string }[]
        }

        // Delete from Cloudinary and database
        for (const media of mediaItems) {
            try {
                // Delete from Cloudinary
                await cloudinary.uploader.destroy(media.publicId, {
                    resource_type: media.type === 'video' ? 'video' : 'image',
                    invalidate: true
                })

                // Delete from database
                await prisma.media.delete({
                    where: { id: media.id }
                })

                results.deleted.push(media.id)
            } catch (error) {
                console.error(`Failed to delete media ${media.id}:`, error)
                results.failed.push({
                    id: media.id,
                    error: error instanceof Error ? error.message : 'Unknown error'
                })
            }
        }

        // Update usage tracking (decrease storage used)
        if (results.deleted.length > 0) {
            const currentMonth = new Date().getMonth() + 1
            const currentYear = new Date().getFullYear()

            const deletedItems = mediaItems.filter(item => results.deleted.includes(item.id))
            const totalSizeReduction = deletedItems.reduce((sum, item) => sum + item.originalSize, 0)
            const storageMB = Math.ceil(totalSizeReduction / (1024 * 1024))

            await prisma.usageTracking.updateMany({
                where: {
                    userId: userId,
                    month: currentMonth,
                    year: currentYear
                },
                data: {
                    storageUsed: {
                        decrement: storageMB
                    },
                    uploadsCount: {
                        decrement: results.deleted.length
                    }
                }
            })
        }

        // Notify about any failures
        if (results.failed.length > 0) {
            await notifyUploadFailed(
                userId,
                `Batch Delete`,
                `Failed to delete ${results.failed.length} items`
            )
        }

        return NextResponse.json({
            success: true,
            data: {
                deleted: results.deleted.length,
                failed: results.failed.length,
                details: results
            },
            message: `Successfully deleted ${results.deleted.length} items${results.failed.length > 0 ? `, ${results.failed.length} failed` : ''}`
        })

    } catch (error) {
        console.error('Batch delete error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete media items'
            },
            { status: 500 }
        )
    }
}
