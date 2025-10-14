import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { generateInvitationToken } from '@/lib/invitation-tokens'
import { sendInvitationEmail } from '@/lib/email'
import { notifyTeamInvitation } from '@/lib/notifications'

// Admin role constants
export const TEAM_OWNER_ROLE = 'team_owner'
export const TEAM_ADMIN_ROLE = 'team_admin'
export const TEAM_MANAGER_ROLE = 'team_manager'
export const TEAM_MEMBER_ROLE = 'team_member'
export const USER_ROLE = 'user'

// Admin plans that get team management privileges
export const ADMIN_PLANS = ['Pro', 'Enterprise', 'pro', 'enterprise'];

// Type definitions
export interface UserRole {
    role: string
    permissions?: string[]
}

export interface AdminCheckResult {
    isAdmin: boolean
    role: string
    userId?: string
    subscription?: {
        id: string
        planName: string
        status: string
        teamMembersAllowed: number
    } | null
    teamMembers?: number
}

/**
 * Check if a specific user has admin privileges (for use in middleware)
 * Admin = User with active Pro/Enterprise subscription
 * @param userId - The user ID to check
 * @returns Promise<AdminCheckResult> - Object containing admin status and role info
 */
export async function checkAdminAccessByUserId(userId: string): Promise<AdminCheckResult> {
    try {
        if (!userId) {
            return {
                isAdmin: false,
                role: 'unauthenticated'
            }
        }

        // Check if user has an active subscription to Pro/Enterprise plan
        let subscription;
        try {
            subscription = await prisma.subscription.findFirst({
                where: {
                    userId,
                    status: 'ACTIVE'
                },
                include: {
                    plan: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })
        } catch (dbError) {
            console.error('Error fetching subscription:', dbError)
            throw dbError
        }

        if (!subscription) {
            return {
                isAdmin: false,
                role: USER_ROLE,
                userId
            }
        }

        // Check if plan qualifies for admin privileges (case-insensitive)
        const planNameLower = subscription.plan.name.toLowerCase()
        const isAdminPlan = ['pro', 'enterprise'].includes(planNameLower)

        if (!isAdminPlan) {
            return {
                isAdmin: false,
                role: USER_ROLE,
                userId,
                subscription: {
                    id: subscription.id,
                    planName: subscription.plan.name,
                    status: subscription.status,
                    teamMembersAllowed: subscription.plan.teamMembers
                }
            }
        }

        // Count current team members
        let teamMembersCount = 0;
        try {
            teamMembersCount = await prisma.teamMember.count({
                where: {
                    teamOwnerId: userId,
                    status: 'ACCEPTED'
                }
            })
        } catch (dbError) {
            console.error('Error counting team members:', dbError)
            // Don't throw here, just use 0 as default
        }

        return {
            isAdmin: true,
            role: TEAM_OWNER_ROLE,
            userId,
            subscription: {
                id: subscription.id,
                planName: subscription.plan.name,
                status: subscription.status,
                teamMembersAllowed: subscription.plan.teamMembers
            },
            teamMembers: teamMembersCount
        }
    } catch (error) {
        console.error('Error checking admin access by userId:', error)
        return {
            isAdmin: false,
            role: 'error'
        }
    }
}

/**
 * Check if the current authenticated user has admin privileges
 * Admin = User with active Pro/Enterprise subscription
 * @returns Promise<AdminCheckResult> - Object containing admin status and role info
 */
export async function checkAdminAccess(): Promise<AdminCheckResult> {
    try {
        const { userId } = await auth()
        return await checkAdminAccessByUserId(userId || '')
    } catch (error) {
        console.error('Error checking admin access:', error)
        return {
            isAdmin: false,
            role: 'error'
        }
    }
}

/**
 * Check if user is a team member with specific permissions
 */
export async function checkTeamMemberAccess(userId: string): Promise<{
    isTeamMember: boolean
    role: string
    teamOwnerId?: string
    permissions?: string[]
}> {
    try {
        const teamMember = await prisma.teamMember.findUnique({
            where: {
                userId,
                status: 'ACCEPTED'
            }
        })

        if (!teamMember) {
            return { isTeamMember: false, role: USER_ROLE }
        }

        return {
            isTeamMember: true,
            role: teamMember.role.toLowerCase(),
            teamOwnerId: teamMember.teamOwnerId,
            permissions: teamMember.permissions
        }
    } catch (error) {
        console.error('Error checking team member access:', error)
        return { isTeamMember: false, role: 'error' }
    }
}

/**
 * Simple admin check function - returns boolean
 * @returns Promise<boolean> - True if user has admin privileges (Pro/Enterprise subscription)
 */
export async function isAdmin(): Promise<boolean> {
    const { isAdmin } = await checkAdminAccess()
    return isAdmin
}

/**
 * Check if user has team management access (either team owner or team admin)
 */
export async function hasTeamManagementAccess(): Promise<boolean> {
    const { userId } = await auth()
    if (!userId) return false

    // Check if user is team owner (has admin subscription)
    const adminCheck = await checkAdminAccess()
    if (adminCheck.isAdmin) return true

    // Check if user is team member with admin role
    const teamCheck = await checkTeamMemberAccess(userId)
    return teamCheck.isTeamMember && ['admin', 'manager'].includes(teamCheck.role)
}

/**
 * Middleware helper to check admin access and return appropriate response
 * @param requireAdmin - Whether to require admin access
 * @returns Promise<NextResponse | null> - Error response if access denied, null if allowed
 */
export async function checkAdminMiddleware(requireAdmin: boolean = true): Promise<NextResponse | null> {
    const { isAdmin, userId } = await checkAdminAccess()

    // If admin access is required but user is not admin
    if (requireAdmin && !isAdmin) {
        if (!userId) {
            // Redirect unauthenticated users to sign in
            return NextResponse.redirect(new URL('/auth/sign-in', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
        } else {
            // Redirect authenticated non-admin users to dashboard
            return NextResponse.redirect(new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
        }
    }

    return null // Access allowed
}

/**
 * Check access for admin dashboard - allows all authenticated users
 * but distinguishes between admin privileges and regular users
 */
export async function checkAdminDashboardAccess(): Promise<AdminCheckResult & { canAccessDashboard: boolean }> {
    try {
        const { userId } = await auth()

        if (!userId) {
            return {
                isAdmin: false,
                role: 'unauthenticated',
                canAccessDashboard: false
            }
        }

        // All authenticated users can access the dashboard
        const baseResult = await checkAdminAccessByUserId(userId)

        return {
            ...baseResult,
            canAccessDashboard: true // Allow all authenticated users
        }
    } catch (error) {
        console.error('Error checking admin dashboard access:', error)
        return {
            isAdmin: false,
            role: 'error',
            canAccessDashboard: false
        }
    }
}

/**
 * API route helper to protect admin endpoints
 * Usage: const adminCheck = await requireAdminAccess(); if (adminCheck) return adminCheck;
 * @returns Promise<NextResponse | null> - Error response if access denied, null if allowed
 */
export async function requireAdminAccess(): Promise<NextResponse | null> {
    const { isAdmin, userId } = await checkAdminAccess()

    // For API routes, return JSON errors instead of redirects
    if (!isAdmin) {
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            )
        } else {
            return NextResponse.json(
                { success: false, error: 'Pro or Enterprise subscription required for team management' },
                { status: 403 }
            )
        }
    }

    return null // Access allowed
}

/**
 * Component helper to check admin access and redirect if needed
 * Use this in page components that require admin access
 */
export async function requireAdminOrRedirect(): Promise<AdminCheckResult> {
    const adminCheck = await checkAdminAccess()

    if (!adminCheck.isAdmin) {
        if (!adminCheck.userId) {
            redirect('/auth/sign-in')
        } else {
            redirect('/subscription') // Redirect to subscription page instead of dashboard
        }
    }

    return adminCheck
}

/**
 * Add a team member (invite)
 */
export async function inviteTeamMember(
    teamOwnerId: string,
    email: string,
    role: 'MEMBER' | 'MANAGER' | 'ADMIN' = 'MEMBER',
    permissions: string[] = []
): Promise<{ success: boolean; error?: string; teamMember?: object }> {
    try {
        // Check if team owner has admin privileges
        const adminCheck = await checkAdminAccess()
        console.log('Admin check result:', adminCheck)

        if (!adminCheck.isAdmin || adminCheck.userId !== teamOwnerId) {
            console.log('Admin check failed:', { isAdmin: adminCheck.isAdmin, userId: adminCheck.userId, teamOwnerId })
            return { success: false, error: 'Insufficient privileges' }
        }

        // Check team limit
        const currentMembers = await prisma.teamMember.count({
            where: {
                teamOwnerId,
                status: 'ACCEPTED'
            }
        })
        console.log('Current members count:', currentMembers)

        const teamLimit = adminCheck.subscription?.teamMembersAllowed || 0
        console.log('Team limit:', teamLimit)

        // Check if team limit is reached (skip check if unlimited: -1)
        if (teamLimit !== -1 && currentMembers >= teamLimit) {
            console.log('Team limit reached:', { currentMembers, teamLimit })
            return { success: false, error: 'Team member limit reached for your plan' }
        }

        // Generate invitation token
        console.log('Generating invitation token...')
        const invitationToken = generateInvitationToken()
        const tokenExpiry = new Date()
        tokenExpiry.setDate(tokenExpiry.getDate() + 7) // 7 days expiry
        console.log('Token generated:', invitationToken.substring(0, 10) + '...')

        // Create team member invitation
        console.log('Creating team member record...')
        const teamMember = await prisma.teamMember.create({
            data: {
                email,
                teamOwnerId,
                role,
                permissions,
                status: 'PENDING',
                inviteToken: invitationToken,
                tokenExpiresAt: tokenExpiry
                // userId is omitted - will be null by default for pending invitations
            }
        })
        console.log('Team member created:', teamMember.id)

        // Generate invitation URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const invitationUrl = `${baseUrl}/invite/${invitationToken}`
        console.log('Invitation URL:', invitationUrl)

        // Get inviter details from Clerk
        const { userId } = await auth()
        let inviterEmail = 'admin@sahab.com' // fallback
        let inviterName = 'Team Owner' // fallback
        let organizationName = 'Your Team' // fallback

        if (userId) {
            try {
                const clerk = await clerkClient()
                const user = await clerk.users.getUser(userId)

                // Use user's first name or full name for organization
                const firstName = user.firstName || 'Team'
                const lastName = user.lastName || ''
                organizationName = lastName ? `${firstName} ${lastName}'s Organization` : `${firstName}'s Organization`

                // Enhanced inviter details
                inviterEmail = user.emailAddresses[0]?.emailAddress || `user-${userId.slice(-8)}@sahab.com`
                inviterName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Team Owner'
            } catch (error) {
                console.error('Failed to get inviter details:', error)
                // Fallback to previous logic
                inviterEmail = `user-${userId.slice(-8)}@sahab.com`
                inviterName = 'Team Owner'
                organizationName = 'Your Team'
            }
        }

        // Send invitation email
        try {
            console.log('Sending invitation email...')
            await sendInvitationEmail({
                to: email,
                inviterName,
                inviterEmail,
                organizationName,
                role,
                invitationToken,
                invitationUrl
            })
            console.log('Email sent successfully')
        } catch (emailError) {
            console.error('Error sending invitation email:', emailError)
            // Don't fail the invitation if email fails - log and continue
            // The invitation is still created and can be resent later
        }

        // Send notification to invitee if they have an account
        try {
            // Check if invitee already has an account (find by email in Clerk)
            const clerk = await clerkClient()
            const users = await clerk.users.getUserList({ emailAddress: [email] })

            if (users.data.length > 0) {
                const inviteeUserId = users.data[0].id
                console.log('Sending notification to existing user:', inviteeUserId)
                await notifyTeamInvitation(inviteeUserId, inviterName, organizationName, invitationToken)
                console.log('Notification sent successfully')
            } else {
                console.log('Invitee does not have an account yet, skipping notification')
            }
        } catch (notifError) {
            console.error('Failed to send invitation notification:', notifError)
            // Don't fail the invitation if notification fails
        }

        console.log('Invitation process completed successfully')
        return { success: true, teamMember }
    } catch (error) {
        console.error('Error inviting team member:', error)

        // Provide more specific error message
        let errorMessage = 'Failed to invite team member'
        if (error instanceof Error) {
            errorMessage = error.message
        }

        return { success: false, error: errorMessage }
    }
}

/**
 * Remove team member
 */
export async function removeTeamMember(teamOwnerId: string, memberUserId: string): Promise<boolean> {
    try {
        await prisma.teamMember.delete({
            where: {
                userId: memberUserId,
                teamOwnerId
            }
        })
        return true
    } catch (error) {
        console.error('Error removing team member:', error)
        return false
    }
}

/**
 * Resend invitation email
 */
export async function resendInvitation(teamOwnerId: string, teamMemberId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        // Check if team owner has admin privileges
        const adminCheck = await checkAdminAccess()
        if (!adminCheck.isAdmin || adminCheck.userId !== teamOwnerId) {
            return { success: false, error: 'Insufficient privileges' }
        }

        // Find the pending invitation
        const teamMember = await prisma.teamMember.findFirst({
            where: {
                id: teamMemberId,
                teamOwnerId,
                status: 'PENDING'
            }
        })

        if (!teamMember) {
            return { success: false, error: 'Invitation not found or already accepted' }
        }

        // Check if invitation is expired
        if (teamMember.tokenExpiresAt && teamMember.tokenExpiresAt < new Date()) {
            // Generate new token and extend expiry
            const newToken = generateInvitationToken()
            const newExpiry = new Date()
            newExpiry.setDate(newExpiry.getDate() + 7)

            await prisma.teamMember.update({
                where: { id: teamMemberId },
                data: {
                    inviteToken: newToken,
                    tokenExpiresAt: newExpiry
                }
            })

            teamMember.inviteToken = newToken
        }

        // Generate invitation URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const invitationUrl = `${baseUrl}/invite/${teamMember.inviteToken}`

        // Get inviter details
        let inviterEmail = 'admin@sahab.com' // fallback
        let inviterName = 'Team Owner' // fallback
        let organizationName = 'Your Team' // fallback

        if (teamOwnerId) {
            try {
                const clerk = await clerkClient()
                const user = await clerk.users.getUser(teamOwnerId)

                // Use user's first name or full name for organization
                const firstName = user.firstName || 'Team'
                const lastName = user.lastName || ''
                organizationName = lastName ? `${firstName} ${lastName}'s Team` : `${firstName}'s Team`

                // Enhanced inviter details
                inviterEmail = user.emailAddresses[0]?.emailAddress || `user-${teamOwnerId.slice(-8)}@sahab.com`
                inviterName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Team Owner'
            } catch (error) {
                console.error('Failed to get inviter details:', error)
                // Fallback to previous logic
                inviterEmail = `user-${teamOwnerId.slice(-8)}@sahab.com`
                inviterName = 'Team Owner'
                organizationName = 'Your Team'
            }
        }

        // Send invitation email
        await sendInvitationEmail({
            to: teamMember.email,
            inviterName,
            inviterEmail,
            organizationName,
            role: teamMember.role,
            invitationToken: teamMember.inviteToken!,
            invitationUrl
        })

        return { success: true }
    } catch (error) {
        console.error('Error resending invitation:', error)
        return { success: false, error: 'Failed to resend invitation' }
    }
}

/**
 * Cancel pending invitation
 */
export async function cancelInvitation(teamOwnerId: string, teamMemberId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        // Check if team owner has admin privileges
        const adminCheck = await checkAdminAccess()
        if (!adminCheck.isAdmin || adminCheck.userId !== teamOwnerId) {
            return { success: false, error: 'Insufficient privileges' }
        }

        // Remove the pending invitation
        const result = await prisma.teamMember.deleteMany({
            where: {
                id: teamMemberId,
                teamOwnerId,
                status: 'PENDING'
            }
        })

        if (result.count === 0) {
            return { success: false, error: 'Invitation not found or already accepted' }
        }

        return { success: true }
    } catch (error) {
        console.error('Error canceling invitation:', error)
        return { success: false, error: 'Failed to cancel invitation' }
    }
}

/**
 * List of team management permissions
 */
export const TEAM_PERMISSIONS = {
    MANAGE_MEDIA: 'manage_media',
    UPLOAD_MEDIA: 'upload_media',
    DELETE_MEDIA: 'delete_media',
    VIEW_ANALYTICS: 'view_analytics',
    MANAGE_TEAM: 'manage_team',
    VIEW_BILLING: 'view_billing'
} as const

/**
 * Check if current user has admin access (for use in components)
 * @returns Promise<boolean> - True if user has admin access
 */
export async function hasAdminAccess(): Promise<boolean> {
    try {
        const { isAdmin } = await checkAdminAccess()
        return isAdmin
    } catch (error) {
        console.error('Error checking admin access:', error)
        return false
    }
}

/**
 * Get current user's role
 * @returns Promise<string> - The user's role
 */
export async function getCurrentUserRole(): Promise<string> {
    try {
        const { role } = await checkAdminAccess()
        return role
    } catch (error) {
        console.error('Error getting user role:', error)
        return USER_ROLE
    }
}