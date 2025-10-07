import { NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/admin'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

// Valid team roles
const VALID_ROLES = ['MEMBER', 'MANAGER', 'ADMIN'] as const
type TeamRole = typeof VALID_ROLES[number]

// PATCH - Edit team member role
export async function PATCH(request: Request) {
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

        const { teamMemberId, role } = body

        if (!teamMemberId || typeof teamMemberId !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Valid team member ID is required' },
                { status: 400 }
            )
        }

        if (!role || !VALID_ROLES.includes(role as TeamRole)) {
            return NextResponse.json(
                { success: false, error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
                { status: 400 }
            )
        }

        // Verify the team member belongs to this team owner
        const teamMember = await prisma.teamMember.findFirst({
            where: {
                id: teamMemberId,
                teamOwnerId: userId
            }
        })

        if (!teamMember) {
            return NextResponse.json(
                { success: false, error: 'Team member not found or not authorized' },
                { status: 404 }
            )
        }

        // Update the team member role
        const updatedTeamMember = await prisma.teamMember.update({
            where: { id: teamMemberId },
            data: { role: role as TeamRole }
        })

        return NextResponse.json({
            success: true,
            teamMember: updatedTeamMember,
            message: 'Team member role updated successfully'
        })
    } catch (error) {
        console.error('Error updating team member:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update team member' },
            { status: 500 }
        )
    }
}