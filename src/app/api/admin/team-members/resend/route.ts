import { NextResponse } from 'next/server'
import { requireAdminAccess, resendInvitation } from '@/lib/admin'
import { auth } from '@clerk/nextjs/server'

// POST - Resend invitation email
export async function POST(request: Request) {
    const adminCheck = await requireAdminAccess()
    if (adminCheck) return adminCheck

    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User not authenticated' },
                { status: 401 }
            )
        }

        let body
        try {
            body = await request.json()
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid JSON body' },
                { status: 400 }
            )
        }

        const { teamMemberId } = body

        if (!teamMemberId || typeof teamMemberId !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Valid team member ID is required' },
                { status: 400 }
            )
        }

        const result = await resendInvitation(userId, teamMemberId)

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Invitation resent successfully'
        })
    } catch (error) {
        console.error('Error resending invitation:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to resend invitation' },
            { status: 500 }
        )
    }
}