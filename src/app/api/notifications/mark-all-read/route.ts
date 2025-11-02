import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic';

// POST /api/notifications/mark-all-read - Mark all notifications as read
export async function POST() {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        await prisma.notification.updateMany({
            where: {
                userId: userId,
                isRead: false
            },
            data: {
                isRead: true
            }
        })

        return NextResponse.json({
            success: true,
            message: 'All notifications marked as read'
        })
    } catch (error) {
        console.error('Error marking notifications as read:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to mark notifications as read'
            },
            { status: 500 }
        )
    }
}
