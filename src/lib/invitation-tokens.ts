import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { notifyTeamMemberJoined } from '@/lib/notifications';
import { clerkClient } from '@clerk/nextjs/server';

/**
 * Generate a secure invitation token
 */
export function generateInvitationToken(): string {
    // Generate a cryptographically secure random token
    const buffer = crypto.randomBytes(32);
    return buffer.toString('hex');
}

/**
 * Generate invitation URL with token
 */
export function generateInvitationUrl(token: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/invite/${token}`;
}

/**
 * Calculate token expiration date (default: 7 days from now)
 */
export function calculateTokenExpiry(daysFromNow: number = 7): Date {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysFromNow);
    return expiryDate;
}

/**
 * Validate invitation token format
 */
export function isValidTokenFormat(token: string): boolean {
    // Check if token is a valid hex string of expected length (64 characters for 32 bytes)
    return /^[a-f0-9]{64}$/i.test(token);
}

/**
 * Find team member by invitation token
 */
export async function findInvitationByToken(token: string): Promise<{
    success: boolean;
    invitation?: {
        id: string;
        email: string;
        role: string;
        teamOwnerId: string;
        status: string;
        invitedAt: Date;
        tokenExpiresAt: Date | null;
        organizationName?: string;
        inviterEmail?: string;
    };
    error?: string;
}> {
    try {
        if (!isValidTokenFormat(token)) {
            return {
                success: false,
                error: 'Invalid token format'
            };
        }

        const invitation = await prisma.teamMember.findUnique({
            where: {
                inviteToken: token
            }
        });

        if (!invitation) {
            return {
                success: false,
                error: 'Invitation not found'
            };
        }

        // Get team owner details separately to avoid TypeScript issues
        const teamOwner = await prisma.subscription.findFirst({
            where: {
                userId: invitation.teamOwnerId,
                status: 'ACTIVE'
            },
            include: {
                plan: true
            }
        });

        // Check if invitation has expired
        if (invitation.tokenExpiresAt && invitation.tokenExpiresAt < new Date()) {
            // Update status to expired
            await prisma.teamMember.update({
                where: { id: invitation.id },
                data: { status: 'EXPIRED' }
            });

            return {
                success: false,
                error: 'Invitation has expired'
            };
        }

        // Check if invitation is still pending
        if (invitation.status !== 'PENDING') {
            return {
                success: false,
                error: `Invitation has been ${invitation.status.toLowerCase()}`
            };
        }

        return {
            success: true,
            invitation: {
                id: invitation.id,
                email: invitation.email,
                role: invitation.role,
                teamOwnerId: invitation.teamOwnerId,
                status: invitation.status,
                invitedAt: invitation.invitedAt,
                tokenExpiresAt: invitation.tokenExpiresAt,
                organizationName: teamOwner?.plan?.name ? `${teamOwner.plan.name} Team` : 'Team',
                inviterEmail: invitation.teamOwnerId // We'll use userId as fallback, can be enhanced with Clerk
            }
        };
    } catch (error) {
        console.error('Error finding invitation by token:', error);
        return {
            success: false,
            error: 'Failed to validate invitation'
        };
    }
}

/**
 * Accept invitation and update team member
 */
export async function acceptInvitation(token: string, userId: string): Promise<{
    success: boolean;
    teamMember?: {
        id: string;
        userId: string | null;
        email: string;
        role: string;
        teamOwnerId: string;
        status: string;
    };
    error?: string;
}> {
    try {
        // First validate the invitation
        const validation = await findInvitationByToken(token);
        if (!validation.success || !validation.invitation) {
            return {
                success: false,
                error: validation.error || 'Invalid invitation'
            };
        }

        // Check if user is already a team member somewhere
        const existingMembership = await prisma.teamMember.findUnique({
            where: { userId }
        });

        if (existingMembership && existingMembership.status === 'ACCEPTED') {
            return {
                success: false,
                error: 'You are already a member of a team'
            };
        }

        // Update the team member record
        const updatedTeamMember = await prisma.teamMember.update({
            where: {
                inviteToken: token
            },
            data: {
                userId,
                status: 'ACCEPTED',
                acceptedAt: new Date(),
                inviteToken: null, // Clear the token after acceptance
                tokenExpiresAt: null
            }
        });

        // Send notification to team owner
        try {
            // Get member name from Clerk
            const clerk = await clerkClient();
            const user = await clerk.users.getUser(userId);
            const memberName = user.firstName
                ? `${user.firstName} ${user.lastName || ''}`.trim()
                : user.emailAddresses[0]?.emailAddress || 'New member';

            // Get team owner name
            const owner = await clerk.users.getUser(validation.invitation.teamOwnerId);
            const teamName = owner.firstName
                ? `${owner.firstName}'s Team`
                : 'Your Team';

            await notifyTeamMemberJoined(
                validation.invitation.teamOwnerId,
                memberName,
                teamName
            );
        } catch (notifError) {
            console.error('Failed to send team member joined notification:', notifError);
            // Don't fail the acceptance if notification fails
        }

        return {
            success: true,
            teamMember: updatedTeamMember
        };
    } catch (error) {
        console.error('Error accepting invitation:', error);
        return {
            success: false,
            error: 'Failed to accept invitation'
        };
    }
}

/**
 * Decline invitation
 */
export async function declineInvitation(token: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        // Validate invitation exists and is pending
        const validation = await findInvitationByToken(token);
        if (!validation.success) {
            return {
                success: false,
                error: validation.error || 'Invalid invitation'
            };
        }

        // Update status to declined
        await prisma.teamMember.update({
            where: {
                inviteToken: token
            },
            data: {
                status: 'DECLINED',
                inviteToken: null, // Clear the token
                tokenExpiresAt: null
            }
        });

        return { success: true };
    } catch (error) {
        console.error('Error declining invitation:', error);
        return {
            success: false,
            error: 'Failed to decline invitation'
        };
    }
}

/**
 * Regenerate invitation token (for resending)
 */
export async function regenerateInvitationToken(invitationId: string): Promise<{
    success: boolean;
    token?: string;
    error?: string;
}> {
    try {
        const newToken = generateInvitationToken();
        const newExpiry = calculateTokenExpiry();

        await prisma.teamMember.update({
            where: { id: invitationId },
            data: {
                inviteToken: newToken,
                tokenExpiresAt: newExpiry,
                status: 'PENDING' // Reset to pending if it was expired
            }
        });

        return {
            success: true,
            token: newToken
        };
    } catch (error) {
        console.error('Error regenerating invitation token:', error);
        return {
            success: false,
            error: 'Failed to regenerate invitation token'
        };
    }
}

/**
 * Cleanup expired invitations (run periodically)
 */
export async function cleanupExpiredInvitations(): Promise<{
    success: boolean;
    expiredCount?: number;
    error?: string;
}> {
    try {
        const result = await prisma.teamMember.updateMany({
            where: {
                status: 'PENDING',
                tokenExpiresAt: {
                    lt: new Date()
                }
            },
            data: {
                status: 'EXPIRED',
                inviteToken: null,
                tokenExpiresAt: null
            }
        });

        return {
            success: true,
            expiredCount: result.count
        };
    } catch (error) {
        console.error('Error cleaning up expired invitations:', error);
        return {
            success: false,
            error: 'Failed to cleanup expired invitations'
        };
    }
}

/**
 * Get invitation statistics for admin dashboard
 */
export async function getInvitationStats(teamOwnerId: string): Promise<{
    success: boolean;
    stats?: {
        total: number;
        pending: number;
        accepted: number;
        declined: number;
        expired: number;
    };
    error?: string;
}> {
    try {
        const [total, pending, accepted, declined, expired] = await Promise.all([
            prisma.teamMember.count({ where: { teamOwnerId } }),
            prisma.teamMember.count({ where: { teamOwnerId, status: 'PENDING' } }),
            prisma.teamMember.count({ where: { teamOwnerId, status: 'ACCEPTED' } }),
            prisma.teamMember.count({ where: { teamOwnerId, status: 'DECLINED' } }),
            prisma.teamMember.count({ where: { teamOwnerId, status: 'EXPIRED' } })
        ]);

        return {
            success: true,
            stats: {
                total,
                pending,
                accepted,
                declined,
                expired
            }
        };
    } catch (error) {
        console.error('Error getting invitation stats:', error);
        return {
            success: false,
            error: 'Failed to get invitation statistics'
        };
    }
}

// Export utility functions and types