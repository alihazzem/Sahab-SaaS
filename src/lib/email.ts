import { Resend } from 'resend';
import { render } from '@react-email/render';
import { TeamInvitationEmail, TeamInvitationReminderEmail } from '@/components/emails';
import type { TeamInvitationEmailProps, TeamInvitationReminderEmailProps } from '@/components/emails';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

export interface InvitationEmailData {
    to: string;
    inviterName?: string;
    inviterEmail: string;
    organizationName: string;
    role: string;
    invitationToken: string;
    invitationUrl: string;
}

export interface EmailTemplate {
    subject: string;
    html: string;
    text?: string;
}

/**
 * Generate invitation email template using React component
 */
export async function generateInvitationTemplate(data: InvitationEmailData): Promise<EmailTemplate> {
    const { inviterName, inviterEmail, organizationName, role, invitationUrl, to } = data;

    const subject = `You're invited to join ${organizationName} on Sahab`;

    const emailProps: TeamInvitationEmailProps = {
        inviterName,
        inviterEmail,
        organizationName,
        role,
        invitationUrl,
        recipientEmail: to,
    };

    // Render React component to HTML
    const html = await render(TeamInvitationEmail(emailProps));

    // Generate plain text version
    const text = `
You're invited to join ${organizationName} on Sahab!

${inviterName ? `${inviterName} (${inviterEmail})` : `Someone (${inviterEmail})`} has invited you to join their team as a ${role}.

To accept this invitation, visit: ${invitationUrl}

This invitation link expires in 7 days. If you didn't expect this invitation, please ignore this email.

Welcome to the team!

---
Sahab Media Platform
${to}
`;

    return { subject, html, text };
}

/**
 * Generate reminder email template using React component
 */
export async function generateReminderTemplate(data: InvitationEmailData, daysLeft: number = 3): Promise<EmailTemplate> {
    const { inviterName, inviterEmail, organizationName, role, invitationUrl, to } = data;

    const subject = `Reminder: Your invitation to join ${organizationName} expires soon`;

    const emailProps: TeamInvitationReminderEmailProps = {
        inviterName,
        inviterEmail,
        organizationName,
        role,
        invitationUrl,
        recipientEmail: to,
        daysLeft,
    };

    // Render React component to HTML
    const html = await render(TeamInvitationReminderEmail(emailProps));

    // Generate plain text version
    const text = `
Reminder: Your invitation to join ${organizationName} expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}!

${inviterName ? `${inviterName} (${inviterEmail})` : `Someone (${inviterEmail})`} invited you to join their team as a ${role}.

To accept this invitation, visit: ${invitationUrl}

Don't miss out on joining the team!

---
Sahab Media Platform
${to}
`;

    return { subject, html, text };
}

/**
 * Send team invitation email
 */
export async function sendInvitationEmail(data: InvitationEmailData): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
}> {
    try {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY environment variable is not set');
        }

        const template = await generateInvitationTemplate(data);

        const result = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Sahab <noreply@sahab.com>',
            to: data.to,
            subject: template.subject,
            html: template.html,
            text: template.text,
            replyTo: data.inviterEmail,
            headers: {
                'X-Priority': '3',
                'X-Mailer': 'Sahab Invitation System',
            },
        });

        return {
            success: true,
            messageId: result.data?.id,
        };
    } catch (error) {
        console.error('Failed to send invitation email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown email error',
        };
    }
}

/**
 * Send reminder email for pending invitations
 */
export async function sendInvitationReminder(data: InvitationEmailData, daysLeft: number = 3): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
}> {
    try {
        const template = await generateReminderTemplate(data, daysLeft);

        const result = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Sahab <noreply@sahab.com>',
            to: data.to,
            subject: template.subject,
            html: template.html,
            text: template.text,
            replyTo: data.inviterEmail,
            headers: {
                'X-Priority': '3',
                'X-Mailer': 'Sahab Invitation System',
            },
        });

        return {
            success: true,
            messageId: result.data?.id,
        };
    } catch (error) {
        console.error('Failed to send reminder email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown email error',
        };
    }
}

/**
 * Validate email configuration
 */
export function validateEmailConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!process.env.RESEND_API_KEY) {
        errors.push('RESEND_API_KEY environment variable is missing');
    }

    if (!process.env.RESEND_FROM_EMAIL) {
        errors.push('RESEND_FROM_EMAIL environment variable is missing');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

export default resend;