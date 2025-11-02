import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { nanoid } from 'nanoid'

export const dynamic = 'force-dynamic';

/**
 * POST /api/media/share/create
 * Create a shareable link for a media item
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
        const { mediaId, title, description, expiresInDays } = body as {
            mediaId: string
            title?: string
            description?: string
            expiresInDays?: number
        }

        if (!mediaId) {
            return NextResponse.json(
                { success: false, error: 'Media ID is required' },
                { status: 400 }
            )
        }

        // Verify media ownership
        const media = await prisma.media.findUnique({
            where: { id: mediaId },
            select: { id: true, userId: true, title: true, type: true }
        })

        if (!media || media.userId !== userId) {
            return NextResponse.json(
                { success: false, error: 'Media not found or access denied' },
                { status: 404 }
            )
        }

        // Generate unique share token
        const shareToken = nanoid(12)

        // Calculate expiration date if provided
        let expiresAt: Date | undefined
        if (expiresInDays && expiresInDays > 0) {
            expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + expiresInDays)
        }

        // Create shared link
        const sharedMedia = await prisma.sharedMedia.create({
            data: {
                mediaId,
                userId,
                shareToken,
                title: title || media.title,
                description,
                expiresAt,
                isActive: true
            },
            include: {
                media: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        url: true
                    }
                }
            }
        })

        // Generate share URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const shareUrl = `${baseUrl}/share/${shareToken}`

        return NextResponse.json({
            success: true,
            data: {
                id: sharedMedia.id,
                shareToken: sharedMedia.shareToken,
                shareUrl,
                title: sharedMedia.title,
                description: sharedMedia.description,
                views: sharedMedia.views,
                expiresAt: sharedMedia.expiresAt,
                isActive: sharedMedia.isActive,
                media: sharedMedia.media
            }
        })

    } catch (error) {
        console.error('Create share link error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create share link'
            },
            { status: 500 }
        )
    }
}

/**
 * GET /api/media/share/create
 * Get all shared links for the current user
 */
export async function GET() {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const sharedLinks = await prisma.sharedMedia.findMany({
            where: { userId },
            include: {
                media: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        url: true,
                        createdAt: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        return NextResponse.json({
            success: true,
            data: sharedLinks.map(link => ({
                id: link.id,
                shareToken: link.shareToken,
                shareUrl: `${baseUrl}/share/${link.shareToken}`,
                title: link.title,
                description: link.description,
                views: link.views,
                expiresAt: link.expiresAt,
                isActive: link.isActive,
                media: link.media,
                createdAt: link.createdAt
            }))
        })

    } catch (error) {
        console.error('Get shared links error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch shared links'
            },
            { status: 500 }
        )
    }
}
