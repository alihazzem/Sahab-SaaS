'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, useUser, SignInButton } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Users, Mail, Calendar, Shield, UserCheck, Crown } from 'lucide-react';

// Utility function to mask email for security
const maskEmail = (email: string): string => {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
        return `${localPart[0]}***@${domain}`;
    }
    const visibleChars = Math.min(3, Math.floor(localPart.length / 3));
    const masked = localPart.substring(0, visibleChars) + '***';
    return `${masked}@${domain}`;
};

interface InvitationData {
    id: string;
    email: string;
    role: string;
    teamOwnerId: string;
    status: string;
    invitedAt: string;
    organizationName: string;
    inviterEmail: string;
}

export default function InvitationPage() {
    const { token } = useParams();
    const router = useRouter();
    const { isSignedIn, userId } = useAuth();
    const { user } = useUser();

    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [declining, setDeclining] = useState(false);
    const [invitation, setInvitation] = useState<InvitationData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const validateInvitation = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`/api/invite/validate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to validate invitation');
                }

                setInvitation(data.invitation);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to validate invitation');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            validateInvitation();
        }
    }, [token]);

    const handleAcceptInvitation = async () => {
        if (!isSignedIn || !userId) {
            // User needs to sign in first
            return;
        }

        try {
            setAccepting(true);
            setError(null);

            const response = await fetch(`/api/invite/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to accept invitation');
            }

            setSuccess('Successfully joined the team! Redirecting to dashboard...');

            // Redirect to dashboard after success
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to accept invitation');
        } finally {
            setAccepting(false);
        }
    };

    const handleDeclineInvitation = async () => {
        try {
            setDeclining(true);
            setError(null);

            const response = await fetch(`/api/invite/decline`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to decline invitation');
            }

            setSuccess('Invitation declined successfully.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to decline invitation');
        } finally {
            setDeclining(false);
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role.toUpperCase()) {
            case 'ADMIN': return Crown;
            case 'MANAGER': return Shield;
            case 'MEMBER': return UserCheck;
            default: return UserCheck;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role.toUpperCase()) {
            case 'ADMIN': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'MEMBER': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-muted-foreground">Validating invitation...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error && !invitation) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <XCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <CardTitle className="text-xl text-red-600">Invalid Invitation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                        <div className="mt-6 text-center">
                            <Button
                                variant="outline"
                                onClick={() => router.push('/')}
                                className="cursor-pointer"
                            >
                                Go to Homepage
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle className="text-xl text-green-600">Success!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Alert>
                            <AlertDescription>{success}</AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!invitation) {
        return null;
    }

    const RoleIcon = getRoleIcon(invitation.role);

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Users className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Team Invitation</CardTitle>
                    <p className="text-muted-foreground">
                        You&apos;ve been invited to join a team on Sahab
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Invitation Details */}
                    <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Organization</span>
                            <span className="font-semibold">{invitation.organizationName}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Your Role</span>
                            <Badge className={`${getRoleColor(invitation.role)} border`}>
                                <RoleIcon className="h-3 w-3 mr-1" />
                                {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1).toLowerCase()}
                            </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Invited To</span>
                            <span className="font-medium flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {maskEmail(invitation.email)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Invited</span>
                            <span className="text-sm flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(invitation.invitedAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    {/* Role Permissions Info */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <h4 className="font-semibold text-sm mb-2">Your {invitation.role} permissions will include:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            {invitation.role.toUpperCase() === 'ADMIN' && (
                                <>
                                    <li>• Full team management access</li>
                                    <li>• Upload, edit, and delete media</li>
                                    <li>• Invite/remove team members</li>
                                    <li>• Access billing information</li>
                                </>
                            )}
                            {invitation.role.toUpperCase() === 'MANAGER' && (
                                <>
                                    <li>• Upload and edit media</li>
                                    <li>• Organize and manage content</li>
                                    <li>• View team analytics</li>
                                    <li>• Moderate team content</li>
                                </>
                            )}
                            {invitation.role.toUpperCase() === 'MEMBER' && (
                                <>
                                    <li>• View team media library</li>
                                    <li>• Upload new content</li>
                                    <li>• Basic editing capabilities</li>
                                    <li>• Collaborate on projects</li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Authentication & Action Buttons */}
                    {!isSignedIn ? (
                        <div className="space-y-4">
                            <div className="text-center text-sm text-muted-foreground">
                                Sign in to accept this invitation
                            </div>
                            <div className="space-y-2">
                                <SignInButton mode="modal">
                                    <Button className="w-full cursor-pointer">
                                        Sign In to Accept
                                    </Button>
                                </SignInButton>
                                <Button
                                    variant="outline"
                                    className="w-full cursor-pointer"
                                    onClick={handleDeclineInvitation}
                                    disabled={declining}
                                >
                                    {declining ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Declining...
                                        </>
                                    ) : (
                                        'Decline Invitation'
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Email check */}
                            {user?.emailAddresses.some(email => email.emailAddress === invitation.email) ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <div className="flex items-center text-green-800 text-sm">
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Email verified: {maskEmail(invitation.email)}
                                    </div>
                                </div>
                            ) : (
                                <Alert>
                                    <AlertDescription>
                                        This invitation was sent to {maskEmail(invitation.email)}.
                                        Make sure this matches your account email.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    onClick={handleAcceptInvitation}
                                    disabled={accepting}
                                    className="cursor-pointer"
                                >
                                    {accepting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Accepting...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Accept
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleDeclineInvitation}
                                    disabled={declining}
                                    className="cursor-pointer"
                                >
                                    {declining ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Declining...
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Decline
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="text-center text-xs text-muted-foreground">
                        This invitation link is secure and expires in 7 days.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}