import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic';

// GET /api/notifications - Get user's notifications
export async function GET(request: Request) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const unreadOnly = searchParams.get('unreadOnly') === 'true'
        const limit = parseInt(searchParams.get('limit') || '50')

        const notifications = await prisma.notification.findMany({
            where: {
                userId: userId,
                ...(unreadOnly && { isRead: false })
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        })

        const unreadCount = await prisma.notification.count({
            where: {
                userId: userId,
                isRead: false
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                notifications,
                unreadCount
            }
        })
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch notifications'
            },
            { status: 500 }
        )
    }
}

// POST /api/notifications - Create a notification (internal use)
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
        const { targetUserId, type, title, message, actionUrl, actionLabel, metadata } = body

        // Only allow creating notifications for yourself or if you're an admin
        const isAdmin = await prisma.admin.findUnique({
            where: { userId: userId }
        })

        if (!isAdmin && targetUserId !== userId) {
            return NextResponse.json(
                { success: false, error: 'Forbidden' },
                { status: 403 }
            )
        }

        const notification = await prisma.notification.create({
            data: {
                userId: targetUserId || userId,
                type,
                title,
                message,
                actionUrl,
                actionLabel,
                metadata
            }
        })

        return NextResponse.json({
            success: true,
            data: notification
        })
    } catch (error) {
        console.error('Error creating notification:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to create notification'
            },
            { status: 500 }
        )
    }
}