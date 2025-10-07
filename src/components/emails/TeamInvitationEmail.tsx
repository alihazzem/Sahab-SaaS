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

export interface TeamInvitationEmailProps {
    inviterName?: string;
    inviterEmail: string;
    organizationName: string;
    role: string;
    invitationUrl: string;
    recipientEmail: string;
}

export const TeamInvitationEmail = ({
    inviterName,
    inviterEmail,
    organizationName,
    role,
    invitationUrl,
    recipientEmail,
}: TeamInvitationEmailProps) => {
    const previewText = `You've been invited to join ${organizationName} on Sahab`;

    const getRolePermissions = (userRole: string) => {
        const roleUpper = userRole.toUpperCase();
        switch (roleUpper) {
            case 'ADMIN':
                return [
                    'Full team management access',
                    'Upload, edit, and delete media',
                    'Invite/remove team members',
                    'Access billing information',
                ];
            case 'MANAGER':
                return [
                    'Upload and edit media',
                    'Organize and manage content',
                    'View team analytics',
                    'Moderate team content',
                ];
            case 'MEMBER':
            default:
                return [
                    'View team media library',
                    'Upload new content',
                    'Basic editing capabilities',
                    'Collaborate on projects',
                ];
        }
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

    const formatRole = (userRole: string) => {
        return userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase();
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
                                <Heading style={headerTitle}>🎉 You&apos;re Invited!</Heading>
                                <Text style={headerSubtitle}>
                                    Join {organizationName} on Sahab
                                </Text>
                            </Column>
                        </Row>
                    </Section>

                    {/* Main Content */}
                    <Section style={content}>
                        <Text style={greeting}>Hi there! 👋</Text>

                        <Text style={paragraph}>
                            {inviterName ? (
                                <>
                                    <strong>{inviterName}</strong> ({inviterEmail})
                                </>
                            ) : (
                                <>Someone ({inviterEmail})</>
                            )}{' '}
                            has invited you to join their team on{' '}
                            <strong>Sahab</strong>, a powerful media management platform.
                        </Text>

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

                            <Row style={detailRow}>
                                <Column style={detailLabel}>
                                    <Text style={detailLabelText}>Invited to:</Text>
                                </Column>
                                <Column style={detailValue}>
                                    <Text style={detailValueText}>{recipientEmail}</Text>
                                </Column>
                            </Row>
                        </Section>

                        {/* Call to Action */}
                        <Section style={ctaSection}>
                            <Button style={ctaButton} href={invitationUrl}>
                                Accept Invitation & Join Team
                            </Button>
                        </Section>

                        {/* Role Permissions */}
                        <Section style={permissionsCard}>
                            <Text style={permissionsTitle}>
                                Your {formatRole(role)} permissions will include:
                            </Text>
                            {getRolePermissions(role).map((permission, index) => (
                                <Text key={index} style={permissionItem}>
                                    • {permission}
                                </Text>
                            ))}
                        </Section>

                        {/* Security Notice */}
                        <Section style={securityNotice}>
                            <Text style={securityText}>
                                <strong>Security Notice:</strong> This invitation link is unique to you and expires in 7 days.
                                If you didn&apos;t expect this invitation, please ignore this email.
                            </Text>
                        </Section>

                        <Text style={paragraph}>
                            Once you accept, you&apos;ll have access to the team&apos;s media library and collaboration tools
                            based on your assigned role permissions.
                        </Text>

                        <Text style={closingText}>
                            Welcome to the team! 🚀
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
                            This invitation was sent to {recipientEmail}. If you have any questions,
                            please contact {inviterEmail}.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

// Styles
const main = {
    backgroundColor: '#f9fafb',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    lineHeight: '1.6',
    color: '#374151',
    margin: '0',
    padding: '0',
    width: '100%',
};

const container = {
    margin: '0 auto',
    padding: '10px',
    width: '100%',
    maxWidth: '600px',
};

const header = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px 12px 0 0',
    padding: '20px 15px',
    textAlign: 'center' as const,
};

const headerTitle = {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 8px 0',
    lineHeight: '1.2',
};

const headerSubtitle = {
    color: '#e0e7ff',
    fontSize: '14px',
    margin: '0',
    lineHeight: '1.4',
};

const content = {
    backgroundColor: '#ffffff',
    padding: '20px 15px',
    borderRadius: '0 0 12px 12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

const greeting = {
    fontSize: '16px',
    color: '#111827',
    margin: '0 0 20px 0',
    fontWeight: '600',
};

const paragraph = {
    fontSize: '14px',
    color: '#374151',
    margin: '0 0 20px 0',
    lineHeight: '1.6',
};

const detailsCard = {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '15px',
    margin: '20px 0',
    borderLeft: '4px solid #667eea',
};

const detailRow = {
    marginBottom: '10px',
    display: 'block',
};

const detailLabel = {
    width: '100%',
    verticalAlign: 'top',
    display: 'block',
    marginBottom: '4px',
};

const detailValue = {
    width: '100%',
    verticalAlign: 'top',
    display: 'block',
};

const detailLabelText = {
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    margin: '0',
    display: 'block',
};

const detailValueText = {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500',
    margin: '0',
    display: 'block',
    wordBreak: 'break-word' as const,
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
    margin: '25px 0',
};

const ctaButton = {
    backgroundColor: '#667eea',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 20px',
    cursor: 'pointer',
    minWidth: '200px',
    boxSizing: 'border-box' as const,
};

const permissionsCard = {
    backgroundColor: '#f0f9ff',
    border: '1px solid #0ea5e9',
    borderRadius: '8px',
    padding: '15px',
    margin: '20px 0',
};

const permissionsTitle = {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0c4a6e',
    margin: '0 0 10px 0',
};

const permissionItem = {
    fontSize: '12px',
    color: '#0369a1',
    margin: '0 0 4px 0',
    lineHeight: '1.4',
};

const securityNotice = {
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '6px',
    padding: '12px',
    margin: '20px 0',
};

const securityText = {
    color: '#92400e',
    fontSize: '12px',
    margin: '0',
    lineHeight: '1.4',
};

const closingText = {
    fontSize: '14px',
    color: '#374151',
    margin: '20px 0',
    fontWeight: '500',
};

const alternativeLink = {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '12px',
    margin: '15px 0',
    textAlign: 'center' as const,
};

const alternativeLinkText = {
    fontSize: '12px',
    color: '#6b7280',
    margin: '0 0 8px 0',
};

const alternativeLinkUrl = {
    color: '#667eea',
    fontSize: '12px',
    wordBreak: 'break-all' as const,
    textDecoration: 'underline',
};

const hr = {
    borderColor: '#e5e7eb',
    margin: '15px 0',
};

const footer = {
    textAlign: 'center' as const,
    padding: '15px 10px',
};

const footerTitle = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 6px 0',
};

const footerSubtitle = {
    fontSize: '12px',
    color: '#6b7280',
    margin: '0 0 12px 0',
};

const footerNote = {
    fontSize: '11px',
    color: '#9ca3af',
    margin: '0',
    lineHeight: '1.4',
    wordBreak: 'break-word' as const,
};

export default TeamInvitationEmail;