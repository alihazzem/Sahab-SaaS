import { NextResponse } from 'next/server'
import { requireAdminAccess, inviteTeamMember, removeTeamMember } from '@/lib/admin'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Valid team roles
const VALID_ROLES = ['MEMBER', 'MANAGER', 'ADMIN'] as const
type TeamRole = typeof VALID_ROLES[number]

// GET - Fetch team members
export async function GET() {
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

        const teamMembers = await prisma.teamMember.findMany({
            where: {
                teamOwnerId: userId
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({
            success: true,
            teamMembers
        })
    } catch (error) {
        console.error('Error fetching team members:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch team members' },
            { status: 500 }
        )
    }
}

// POST - Invite team member
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

        const { email, role = 'MEMBER', permissions = [] } = body

        // Validate email
        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Valid email is required' },
                { status: 400 }
            )
        }

        if (!EMAIL_REGEX.test(email)) {
            return NextResponse.json(
                { success: false, error: 'Invalid email format' },
                { status: 400 }
            )
        }

        // Validate role
        if (!VALID_ROLES.includes(role as TeamRole)) {
            return NextResponse.json(
                { success: false, error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
                { status: 400 }
            )
        }

        // Validate permissions (should be array of strings)
        if (!Array.isArray(permissions) || !permissions.every(p => typeof p === 'string')) {
            return NextResponse.json(
                { success: false, error: 'Permissions must be an array of strings' },
                { status: 400 }
            )
        }

        // Check if email is already invited
        const existingInvite = await prisma.teamMember.findFirst({
            where: {
                teamOwnerId: userId,
                email: email.toLowerCase(),
                status: { in: ['PENDING', 'ACCEPTED'] }
            }
        })

        if (existingInvite) {
            return NextResponse.json(
                { success: false, error: 'This email is already invited or is a team member' },
                { status: 409 }
            )
        }

        const result = await inviteTeamMember(userId, email.toLowerCase(), role as TeamRole, permissions)

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            teamMember: result.teamMember
        })
    } catch (error) {
        console.error('Error inviting team member:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to invite team member' },
            { status: 500 }
        )
    }
}

// DELETE - Remove team member
export async function DELETE(request: Request) {
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

        const { memberUserId } = body

        if (!memberUserId || typeof memberUserId !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Valid member user ID is required' },
                { status: 400 }
            )
        }

        // Verify the team member belongs to this team owner
        const teamMember = await prisma.teamMember.findFirst({
            where: {
                userId: memberUserId,
                teamOwnerId: userId
            }
        })

        if (!teamMember) {
            return NextResponse.json(
                { success: false, error: 'Team member not found or not authorized' },
                { status: 404 }
            )
        }

        const success = await removeTeamMember(userId, memberUserId)

        if (!success) {
            return NextResponse.json(
                { success: false, error: 'Failed to remove team member' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Team member removed successfully'
        })
    } catch (error) {
        console.error('Error removing team member:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to remove team member' },
            { status: 500 }
        )
    }
}