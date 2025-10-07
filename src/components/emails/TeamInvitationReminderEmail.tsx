import React from 'react';
import {
    Html,
    Head,
    Font,
    Preview,
    Body,
    Container,
    Section,
    Row,
    Column,
    Heading,
    Text,
    Link,
    Button,
    Hr,
} from '@react-email/components';

export interface TeamInvitationReminderEmailProps {
    inviterName?: string;
    inviterEmail: string;
    organizationName: string;
    role: string;
    invitationUrl: string;
    recipientEmail: string;
    daysLeft?: number;
}

export const TeamInvitationReminderEmail = ({
    inviterName,
    inviterEmail,
    organizationName,
    role,
    invitationUrl,
    recipientEmail,
    daysLeft = 3,
}: TeamInvitationReminderEmailProps) => {
    const previewText = `Reminder: Your invitation to join ${organizationName} expires soon`;

    const formatRole = (userRole: string) => {
        return userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase();
    };

    const getRoleColor = (userRole: string) => {
        const roleUpper = userRole.toUpperCase();
        switch (roleUpper) {
            case 'ADMIN':
                return '#7c3aed'; // purple
            case 'MANAGER':
                return '#2563eb'; // blue
            case 'MEMBER':
            default:
                return '#059669'; // green
        }
    };

    return (
        <Html>
            <Head>
                <Font
                    fontFamily="Inter"
                    fallbackFontFamily="Helvetica"
                    webFont={{
                        url: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
                        format: 'woff2',
                    }}
                    fontWeight={400}
                    fontStyle="normal"
                />
            </Head>
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header Section */}
                    <Section style={header}>
                        <Row>
                            <Column>
                                <Heading style={headerTitle}>⏰ Invitation Reminder</Heading>
                                <Text style={headerSubtitle}>
                                    Your invitation to {organizationName} expires soon
                                </Text>
                            </Column>
                        </Row>
                    </Section>

                    {/* Main Content */}
                    <Section style={content}>
                        <Text style={greeting}>Hi there! 👋</Text>

                        <Text style={paragraph}>
                            This is a friendly reminder that you have a pending invitation from{' '}
                            {inviterName ? (
                                <>
                                    <strong>{inviterName}</strong> ({inviterEmail})
                                </>
                            ) : (
                                <>someone ({inviterEmail})</>
                            )}{' '}
                            to join <strong>{organizationName}</strong> on Sahab.
                        </Text>

                        {/* Urgency Notice */}
                        <Section style={urgencyNotice}>
                            <Text style={urgencyText}>
                                <strong>⚠️ Your invitation expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}!</strong>
                            </Text>
                            <Text style={urgencySubtext}>
                                Don&apos;t miss out on joining the team. Accept your invitation now.
                            </Text>
                        </Section>

                        {/* Invitation Details Card */}
                        <Section style={detailsCard}>
                            <Row style={detailRow}>
                                <Column style={detailLabel}>
                                    <Text style={detailLabelText}>Organization:</Text>
                                </Column>
                                <Column style={detailValue}>
                                    <Text style={detailValueText}>{organizationName}</Text>
                                </Column>
                            </Row>

                            <Row style={detailRow}>
                                <Column style={detailLabel}>
                                    <Text style={detailLabelText}>Your Role:</Text>
                                </Column>
                                <Column style={detailValue}>
                                    <Text style={{
                                        ...roleBadge,
                                        backgroundColor: getRoleColor(role),
                                    }}>
                                        {formatRole(role)}
                                    </Text>
                                </Column>
                            </Row>

                            <Row style={detailRow}>
                                <Column style={detailLabel}>
                                    <Text style={detailLabelText}>Invited by:</Text>
                                </Column>
                                <Column style={detailValue}>
                                    <Text style={detailValueText}>{inviterEmail}</Text>
                                </Column>
                            </Row>
                        </Section>

                        {/* Call to Action */}
                        <Section style={ctaSection}>
                            <Button style={ctaButton} href={invitationUrl}>
                                Accept Invitation Now
                            </Button>
                        </Section>

                        <Text style={paragraph}>
                            If you&apos;re not interested in joining this team, you can safely ignore this email or
                            click the invitation link to decline.
                        </Text>

                        {/* Alternative Link */}
                        <Section style={alternativeLink}>
                            <Text style={alternativeLinkText}>
                                Can&apos;t click the button? Copy and paste this link into your browser:
                            </Text>
                            <Link href={invitationUrl} style={alternativeLinkUrl}>
                                {invitationUrl}
                            </Link>
                        </Section>
                    </Section>

                    <Hr style={hr} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerTitle}>Sahab Media Platform</Text>
                        <Text style={footerSubtitle}>Powerful media management for modern teams</Text>
                        <Text style={footerNote}>
                            This reminder was sent to {recipientEmail}. If you have any questions,
                            please contact {inviterEmail}.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

// Styles (many shared with main invitation email)
const main = {
    backgroundColor: '#f9fafb',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    lineHeight: '1.6',
    color: '#374151',
};

const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
    width: '100%',
    maxWidth: '600px',
};

const header = {
    background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
    borderRadius: '12px 12px 0 0',
    padding: '40px 30px',
    textAlign: 'center' as const,
};

const headerTitle = {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: '700',
    margin: '0 0 8px 0',
};

const headerSubtitle = {
    color: '#fef3c7',
    fontSize: '16px',
    margin: '0',
};

const content = {
    backgroundColor: '#ffffff',
    padding: '40px 30px',
    borderRadius: '0 0 12px 12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

const greeting = {
    fontSize: '18px',
    color: '#111827',
    margin: '0 0 24px 0',
    fontWeight: '600',
};

const paragraph = {
    fontSize: '16px',
    color: '#374151',
    margin: '0 0 24px 0',
    lineHeight: '1.6',
};

const urgencyNotice = {
    backgroundColor: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
    textAlign: 'center' as const,
};

const urgencyText = {
    fontSize: '16px',
    color: '#dc2626',
    margin: '0 0 8px 0',
    fontWeight: '600',
};

const urgencySubtext = {
    fontSize: '14px',
    color: '#7f1d1d',
    margin: '0',
};

const detailsCard = {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '24px',
    margin: '24px 0',
    borderLeft: '4px solid #f59e0b',
};

const detailRow = {
    marginBottom: '12px',
};

const detailLabel = {
    width: '30%',
    verticalAlign: 'top',
};

const detailValue = {
    width: '70%',
    verticalAlign: 'top',
};

const detailLabelText = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    margin: '0',
};

const detailValueText = {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500',
    margin: '0',
};

const roleBadge = {
    color: '#ffffff',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    display: 'inline-block',
    margin: '0',
};

const ctaSection = {
    textAlign: 'center' as const,
    margin: '32px 0',
};

const ctaButton = {
    backgroundColor: '#f59e0b',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '16px 32px',
    cursor: 'pointer',
};

const alternativeLink = {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '16px',
    margin: '20px 0',
    textAlign: 'center' as const,
};

const alternativeLinkText = {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 8px 0',
};

const alternativeLinkUrl = {
    color: '#f59e0b',
    fontSize: '14px',
    wordBreak: 'break-all' as const,
    textDecoration: 'underline',
};

const hr = {
    borderColor: '#e5e7eb',
    margin: '20px 0',
};

const footer = {
    textAlign: 'center' as const,
    padding: '20px 30px',
};

const footerTitle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 8px 0',
};

const footerSubtitle = {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 16px 0',
};

const footerNote = {
    fontSize: '12px',
    color: '#9ca3af',
    margin: '0',
    lineHeight: '1.4',
};

export default TeamInvitationReminderEmail;