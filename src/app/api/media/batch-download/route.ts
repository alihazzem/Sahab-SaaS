import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

/**
 * POST /api/media/batch-download
 * Get download URLs for multiple media items
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

        // Limit to 100 items at once
        if (ids.length > 100) {
            return NextResponse.json(
                { success: false, error: 'Cannot download more than 100 items at once' },
                { status: 400 }
            )
        }

        // Fetch all media items to verify ownership
        const mediaItems = await prisma.media.findMany({
            where: {
                id: { in: ids },
                userId: userId
            },
            select: {
                id: true,
                title: true,
                url: true,
                type: true,
                originalSize: true
            }
        })

        if (mediaItems.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No media items found or you do not have permission' },
                { status: 404 }
            )
        }

        // Return download URLs
        return NextResponse.json({
            success: true,
            data: {
                items: mediaItems.map(item => ({
                    id: item.id,
                    title: item.title || 'Untitled',
                    url: item.url,
                    type: item.type,
                    size: item.originalSize
                })),
                count: mediaItems.length
            }
        })

    } catch (error) {
        console.error('Batch download error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to prepare downloads'
            },
            { status: 500 }
        )
    }
}
