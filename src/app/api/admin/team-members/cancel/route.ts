import { NextResponse } from 'next/server'
import { requireAdminAccess, cancelInvitation } from '@/lib/admin'
import { auth } from '@clerk/nextjs/server'

// POST - Cancel pending invitation
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

        const result = await cancelInvitation(userId, teamMemberId)

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Invitation canceled successfully'
        })
    } catch (error) {
        console.error('Error canceling invitation:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to cancel invitation' },
            { status: 500 }
        )
    }
}

// DELETE - Cancel pending invitation (same functionality as POST for convenience)
export async function DELETE(request: Request) {
    return POST(request);
}