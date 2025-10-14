import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

// PATCH /api/notifications/[id] - Mark notification as read
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const notificationId = params.id

        // Verify notification belongs to user
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId }
        })

        if (!notification || notification.userId !== userId) {
            return NextResponse.json(
                { success: false, error: 'Notification not found' },
                { status: 404 }
            )
        }

        const updatedNotification = await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        })

        return NextResponse.json({
            success: true,
            data: updatedNotification
        })
    } catch (error) {
        console.error('Error updating notification:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to update notification'
            },
            { status: 500 }
        )
    }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const notificationId = params.id

        // Verify notification belongs to user
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId }
        })

        if (!notification || notification.userId !== userId) {
            return NextResponse.json(
                { success: false, error: 'Notification not found' },
                { status: 404 }
            )
        }

        await prisma.notification.delete({
            where: { id: notificationId }
        })

        return NextResponse.json({
            success: true,
            message: 'Notification deleted'
        })
    } catch (error) {
        console.error('Error deleting notification:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to delete notification'
            },
            { status: 500 }
        )
    }
}
