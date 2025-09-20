'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TeamMember {
    id: string;
    userId: string;
    email: string;
    role: 'MEMBER' | 'MANAGER' | 'ADMIN';
    permissions: string[];
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
    invitedAt: string;
    acceptedAt?: string;
}

interface AdminDashboardClientProps {
    adminRole: string;
    subscription?: {
        id: string;
        planName: string;
        status: string;
        teamMembersAllowed: number;
    } | null;
    teamMembersCount: number;
}

export default function AdminDashboardClient({
    adminRole,
    subscription,
    teamMembersCount
}: AdminDashboardClientProps) {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'MEMBER' | 'MANAGER' | 'ADMIN'>('MEMBER');
    const [inviting, setInviting] = useState(false);

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    const fetchTeamMembers = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/admin/team-members');

            if (!response.ok) {
                throw new Error('Failed to fetch team members');
            }

            const data = await response.json();
            setTeamMembers(data.teamMembers || []);
        } catch (err) {
            setError('Failed to load team members');
            console.error('Team members fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInviteTeamMember = async () => {
        if (!inviteEmail) return;

        try {
            setInviting(true);
            const response = await fetch('/api/admin/team-members', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: inviteEmail,
                    role: inviteRole
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to invite team member');
            }

            setInviteEmail('');
            setInviteRole('MEMBER');
            fetchTeamMembers();
        } catch (err) {
            setError((err as Error).message || 'Failed to invite team member');
            console.error('Invite error:', err);
        } finally {
            setInviting(false);
        }
    };

    const handleRemoveTeamMember = async (memberUserId: string) => {
        try {
            const response = await fetch('/api/admin/team-members', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ memberUserId }),
            });

            if (!response.ok) {
                throw new Error('Failed to remove team member');
            }

            fetchTeamMembers();
        } catch (err) {
            setError('Failed to remove team member');
            console.error('Remove error:', err);
        }
    };

    const canAddMoreMembers = teamMembersCount < (subscription?.teamMembersAllowed || 0);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg">Loading team management...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <Alert>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Team Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Current Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{subscription?.planName}</div>
                        <p className="text-sm text-muted-foreground">Status: {subscription?.status}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Team Members</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {teamMembersCount} / {subscription?.teamMembersAllowed || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {(subscription?.teamMembersAllowed || 0) - teamMembersCount} slots available
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Your Role</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">{adminRole.replace('_', ' ')}</div>
                        <p className="text-sm text-muted-foreground">Team Owner</p>
                    </CardContent>
                </Card>
            </div>

            {/* Invite New Member */}
            {canAddMoreMembers && (
                <Card>
                    <CardHeader>
                        <CardTitle>Invite Team Member</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex space-x-4">
                            <Input
                                placeholder="Enter email address"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                type="email"
                                className="flex-1"
                            />
                            <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value as 'MEMBER' | 'MANAGER' | 'ADMIN')}
                                className="px-3 py-2 border rounded-md"
                            >
                                <option value="MEMBER">Member</option>
                                <option value="MANAGER">Manager</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                            <Button
                                onClick={handleInviteTeamMember}
                                disabled={!inviteEmail || inviting}
                            >
                                {inviting ? 'Inviting...' : 'Invite'}
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            Available roles: Member (basic access), Manager (can manage content), Admin (full access)
                        </p>
                    </CardContent>
                </Card>
            )}

            {!canAddMoreMembers && (
                <Alert>
                    <AlertDescription>
                        You have reached the maximum number of team members for your {subscription?.planName} plan.
                        Upgrade your plan to add more members.
                    </AlertDescription>
                </Alert>
            )}

            {/* Team Members List */}
            <Card>
                <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                </CardHeader>
                <CardContent>
                    {teamMembers.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No team members yet. Invite your first team member above.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {teamMembers.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <h3 className="font-medium">{member.email}</h3>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <Badge variant={member.role === 'ADMIN' ? 'default' : 'secondary'}>
                                                {member.role}
                                            </Badge>
                                            <Badge
                                                variant={
                                                    member.status === 'ACCEPTED' ? 'default' :
                                                        member.status === 'PENDING' ? 'secondary' : 'destructive'
                                                }
                                            >
                                                {member.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Invited: {new Date(member.invitedAt).toLocaleDateString()}
                                            {member.acceptedAt && ` • Joined: ${new Date(member.acceptedAt).toLocaleDateString()}`}
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        {member.status === 'PENDING' && (
                                            <Button size="sm" variant="outline">
                                                Resend Invite
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleRemoveTeamMember(member.userId)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Team Permissions Guide */}
            <Card>
                <CardHeader>
                    <CardTitle>Role Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium text-sm">MEMBER</h4>
                            <p className="text-sm text-muted-foreground">
                                Can upload and manage their own media files. View basic analytics.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-sm">MANAGER</h4>
                            <p className="text-sm text-muted-foreground">
                                All member permissions plus: manage all team media, access detailed analytics.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-sm">ADMIN</h4>
                            <p className="text-sm text-muted-foreground">
                                All manager permissions plus: invite/remove team members, access billing information.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}