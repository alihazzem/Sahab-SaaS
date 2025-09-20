import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'

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
        if (!adminCheck.isAdmin || adminCheck.userId !== teamOwnerId) {
            return { success: false, error: 'Insufficient privileges' }
        }

        // Check team limit
        const currentMembers = await prisma.teamMember.count({
            where: {
                teamOwnerId,
                status: 'ACCEPTED'
            }
        })

        if (currentMembers >= (adminCheck.subscription?.teamMembersAllowed || 0)) {
            return { success: false, error: 'Team member limit reached for your plan' }
        }

        // Create team member invitation
        const teamMember = await prisma.teamMember.create({
            data: {
                userId: '', // Will be filled when user accepts
                email,
                teamOwnerId,
                role,
                permissions,
                status: 'PENDING'
            }
        })

        return { success: true, teamMember }
    } catch (error) {
        console.error('Error inviting team member:', error)
        return { success: false, error: 'Failed to invite team member' }
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