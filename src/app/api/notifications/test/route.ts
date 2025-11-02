import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic';

/**
 * POST /api/notifications/test
 * Create test notifications for development/testing
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const { type = 'UPLOAD_SUCCESS' } = body

        let notification

        switch (type) {
            case 'upload_success':
                notification = await createNotification({
                    userId,
                    type: 'UPLOAD_SUCCESS',
                    title: '✅ Upload Complete',
                    message: 'test-image.jpg has been uploaded successfully',
                    actionUrl: '/dashboard',
                    actionLabel: 'View File'
                })
                break

            case 'usage_warning':
                notification = await createNotification({
                    userId,
                    type: 'USAGE_WARNING',
                    title: '📊 Storage Usage Alert',
                    message: "You've used 85% of your storage",
                    actionUrl: '/dashboard',
                    actionLabel: 'View Usage'
                })
                break

            case 'usage_critical':
                notification = await createNotification({
                    userId,
                    type: 'USAGE_CRITICAL',
                    title: '⚠️ Storage Usage Alert',
                    message: "You've used 95% of your storage",
                    actionUrl: '/subscription',
                    actionLabel: 'Upgrade Plan'
                })
                break

            default:
                return NextResponse.json(
                    { error: 'Invalid notification type' },
                    { status: 400 }
                )
        }

        return NextResponse.json({
            success: true,
            notification
        })
    } catch (error) {
        console.error('Failed to create test notification:', error)
        return NextResponse.json(
            { error: 'Failed to create notification' },
            { status: 500 }
        )
    }
}
