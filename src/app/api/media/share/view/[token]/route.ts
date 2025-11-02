import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic';

/**
 * GET /api/media/share/view/[token]
 * View a shared media item (public endpoint - no auth required)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params

        // Find the shared media
        const sharedMedia = await prisma.sharedMedia.findUnique({
            where: { shareToken: token },
            include: {
                media: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        type: true,
                        url: true,
                        width: true,
                        height: true,
                        duration: true,
                        createdAt: true
                    }
                }
            }
        })

        if (!sharedMedia) {
            return NextResponse.json(
                { success: false, error: 'Shared link not found' },
                { status: 404 }
            )
        }

        // Check if link is active
        if (!sharedMedia.isActive) {
            return NextResponse.json(
                { success: false, error: 'This link has been disabled' },
                { status: 403 }
            )
        }

        // Check if link is expired
        if (sharedMedia.expiresAt && new Date() > sharedMedia.expiresAt) {
            return NextResponse.json(
                { success: false, error: 'This link has expired' },
                { status: 410 }
            )
        }

        // Increment view count
        await prisma.sharedMedia.update({
            where: { id: sharedMedia.id },
            data: { views: { increment: 1 } }
        })

        return NextResponse.json({
            success: true,
            data: {
                id: sharedMedia.id,
                title: sharedMedia.title,
                description: sharedMedia.description,
                views: sharedMedia.views + 1, // Return incremented count
                media: sharedMedia.media
            }
        })

    } catch (error) {
        console.error('View shared media error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to load shared media'
            },
            { status: 500 }
        )
    }
}
