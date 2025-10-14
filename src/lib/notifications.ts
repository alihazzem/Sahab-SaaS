import prisma from '@/lib/prisma'

export type NotificationType =
    | 'TEAM_INVITATION'
    | 'USAGE_WARNING'
    | 'USAGE_CRITICAL'
    | 'USAGE_EXCEEDED'
    | 'UPLOAD_SUCCESS'
    | 'UPLOAD_FAILED'
    | 'PLAN_UPGRADE_SUGGESTION'
    | 'TEAM_MEMBER_JOINED'
    | 'TEAM_MEMBER_LEFT'
    | 'SUBSCRIPTION_EXPIRING'
    | 'PAYMENT_SUCCESS'
    | 'PAYMENT_FAILED'
    | 'SYSTEM_ANNOUNCEMENT'

export interface CreateNotificationParams {
    userId: string
    type: NotificationType
    title: string
    message: string
    actionUrl?: string
    actionLabel?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: any
}

/**
 * Create a new notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId: params.userId,
                type: params.type,
                title: params.title,
                message: params.message,
                actionUrl: params.actionUrl,
                actionLabel: params.actionLabel,
                metadata: params.metadata
            }
        })

        return { success: true, notification }
    } catch (error) {
        console.error('Error creating notification:', error)
        return { success: false, error: 'Failed to create notification' }
    }
}

/**
 * Create a team invitation notification
 */
export async function notifyTeamInvitation(
    userId: string,
    inviterName: string,
    teamName: string,
    inviteToken: string
) {
    return createNotification({
        userId,
        type: 'TEAM_INVITATION',
        title: 'Team Invitation',
        message: `${inviterName} invited you to join ${teamName}`,
        actionUrl: `/invite/${inviteToken}`,
        actionLabel: 'View Invitation',
        metadata: {
            inviterName,
            teamName,
            inviteToken
        }
    })
}

/**
 * Create a usage warning notification
 */
export async function notifyUsageWarning(
    userId: string,
    resourceType: 'storage' | 'transformations',
    percentage: number,
    current: number,
    limit: number
) {
    const type = percentage >= 100 ? 'USAGE_EXCEEDED' : percentage >= 90 ? 'USAGE_CRITICAL' : 'USAGE_WARNING'
    const emoji = percentage >= 100 ? '🚫' : percentage >= 90 ? '⚠️' : '📊'

    const messages = {
        storage: {
            title: `${emoji} Storage Usage Alert`,
            message: `You've used ${percentage.toFixed(0)}% of your storage (${current}MB / ${limit}MB)`,
            actionLabel: 'View Usage'
        },
        transformations: {
            title: `${emoji} Transformations Usage Alert`,
            message: `You've used ${percentage.toFixed(0)}% of your transformations (${current} / ${limit})`,
            actionLabel: 'View Usage'
        }
    }

    const config = messages[resourceType]

    return createNotification({
        userId,
        type,
        title: config.title,
        message: config.message,
        actionUrl: '/dashboard',
        actionLabel: config.actionLabel,
        metadata: {
            resourceType,
            percentage,
            current,
            limit
        }
    })
}

/**
 * Create an upload success notification
 */
export async function notifyUploadSuccess(
    userId: string,
    fileName: string,
    fileType: 'video' | 'image'
) {
    return createNotification({
        userId,
        type: 'UPLOAD_SUCCESS',
        title: '✅ Upload Complete',
        message: `${fileName} has been uploaded successfully`,
        actionUrl: '/dashboard',
        actionLabel: 'View File',
        metadata: {
            fileName,
            fileType
        }
    })
}

/**
 * Create an upload failed notification
 */
export async function notifyUploadFailed(
    userId: string,
    fileName: string,
    reason: string
) {
    return createNotification({
        userId,
        type: 'UPLOAD_FAILED',
        title: '❌ Upload Failed',
        message: `Failed to upload ${fileName}: ${reason}`,
        actionUrl: '/dashboard',
        actionLabel: 'Try Again',
        metadata: {
            fileName,
            reason
        }
    })
}

/**
 * Create a plan upgrade suggestion notification
 */
export async function notifyPlanUpgrade(
    userId: string,
    currentPlan: string,
    suggestedPlan: string,
    reason: string
) {
    return createNotification({
        userId,
        type: 'PLAN_UPGRADE_SUGGESTION',
        title: '⬆️ Upgrade Available',
        message: `Consider upgrading to ${suggestedPlan} for ${reason}`,
        actionUrl: '/subscription',
        actionLabel: 'View Plans',
        metadata: {
            currentPlan,
            suggestedPlan,
            reason
        }
    })
}

/**
 * Create a team member joined notification
 */
export async function notifyTeamMemberJoined(
    userId: string,
    memberName: string,
    memberEmail: string
) {
    return createNotification({
        userId,
        type: 'TEAM_MEMBER_JOINED',
        title: '👥 Team Member Joined',
        message: `${memberName} (${memberEmail}) has joined your team`,
        actionUrl: '/admin',
        actionLabel: 'View Team',
        metadata: {
            memberName,
            memberEmail
        }
    })
}

/**
 * Create a payment success notification
 */
export async function notifyPaymentSuccess(
    userId: string,
    planName: string,
    amount: number
) {
    return createNotification({
        userId,
        type: 'PAYMENT_SUCCESS',
        title: '💳 Payment Successful',
        message: `Your payment for ${planName} plan (${amount} EGP) was successful`,
        actionUrl: '/subscription',
        actionLabel: 'View Subscription',
        metadata: {
            planName,
            amount
        }
    })
}

/**
 * Create a payment failed notification
 */
export async function notifyPaymentFailed(
    userId: string,
    planName: string,
    reason: string
) {
    return createNotification({
        userId,
        type: 'PAYMENT_FAILED',
        title: '❌ Payment Failed',
        message: `Payment for ${planName} failed: ${reason}`,
        actionUrl: '/subscription',
        actionLabel: 'Try Again',
        metadata: {
            planName,
            reason
        }
    })
}
