import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

/**
 * PATCH /api/media/share/[id]
 * Update a shared link (toggle active, update title/description)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id } = await params
        const body = await request.json()
        const { isActive, title, description } = body as {
            isActive?: boolean
            title?: string
            description?: string
        }

        // Verify ownership
        const sharedMedia = await prisma.sharedMedia.findUnique({
            where: { id }
        })

        if (!sharedMedia || sharedMedia.userId !== userId) {
            return NextResponse.json(
                { success: false, error: 'Shared link not found or access denied' },
                { status: 404 }
            )
        }

        // Update shared link
        const updated = await prisma.sharedMedia.update({
            where: { id },
            data: {
                ...(isActive !== undefined && { isActive }),
                ...(title && { title }),
                ...(description !== undefined && { description })
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

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        return NextResponse.json({
            success: true,
            data: {
                id: updated.id,
                shareToken: updated.shareToken,
                shareUrl: `${baseUrl}/share/${updated.shareToken}`,
                title: updated.title,
                description: updated.description,
                views: updated.views,
                expiresAt: updated.expiresAt,
                isActive: updated.isActive,
                media: updated.media
            }
        })

    } catch (error) {
        console.error('Update share link error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update share link'
            },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/media/share/[id]
 * Delete a shared link
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id } = await params

        // Verify ownership
        const sharedMedia = await prisma.sharedMedia.findUnique({
            where: { id }
        })

        if (!sharedMedia || sharedMedia.userId !== userId) {
            return NextResponse.json(
                { success: false, error: 'Shared link not found or access denied' },
                { status: 404 }
            )
        }

        // Delete shared link
        await prisma.sharedMedia.delete({
            where: { id }
        })

        return NextResponse.json({
            success: true,
            message: 'Share link deleted successfully'
        })

    } catch (error) {
        console.error('Delete share link error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete share link'
            },
            { status: 500 }
        )
    }
}
