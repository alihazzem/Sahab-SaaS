'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import {
    Users,
    UserPlus,
    Shield,
    Search,
    Filter,
    Mail,
    Calendar,
    CheckCircle,
    Clock,
    XCircle,
    Edit,
    Trash2,
    Crown,
    UserCheck,
    Settings,
    RefreshCw
} from 'lucide-react';

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
    subscription?: {
        id: string;
        planName: string;
        status: string;
        teamMembersAllowed: number;
    } | null;
    teamMembersCount: number;
}

export default function AdminDashboardClient({
    subscription,
    teamMembersCount
}: AdminDashboardClientProps) {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'MEMBER' | 'MANAGER' | 'ADMIN'>('MEMBER');
    const [inviting, setInviting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<'ALL' | 'MEMBER' | 'MANAGER' | 'ADMIN'>('ALL');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'>('ALL');

    const { success, error: showError } = useToast();

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
            success('Team member invited successfully', 'An invitation email has been sent.');
        } catch (err) {
            showError('Invitation failed', (err as Error).message || 'Failed to invite team member');
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
            success('Team member removed', 'The team member has been removed successfully.');
        } catch (err) {
            showError('Remove failed', 'Failed to remove team member');
            console.error('Remove error:', err);
        }
    };

    const canAddMoreMembers = (subscription?.teamMembersAllowed || 0) === -1 || teamMembersCount < (subscription?.teamMembersAllowed || 0);
    const isUnlimitedPlan = (subscription?.teamMembersAllowed || 0) === -1;
    const remainingSlots = isUnlimitedPlan ? 'Unlimited' : Math.max(0, (subscription?.teamMembersAllowed || 0) - teamMembersCount);

    // Filter team members based on search and filter criteria
    const filteredTeamMembers = teamMembers.filter(member => {
        const matchesSearch = member.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'ALL' || member.role === filterRole;
        const matchesStatus = filterStatus === 'ALL' || member.status === filterStatus;
        return matchesSearch && matchesRole && matchesStatus;
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ACCEPTED': return CheckCircle;
            case 'PENDING': return Clock;
            case 'DECLINED': return XCircle;
            case 'EXPIRED': return XCircle;
            default: return Clock;
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'ADMIN': return Crown;
            case 'MANAGER': return Shield;
            case 'MEMBER': return UserCheck;
            default: return UserCheck;
        }
    };

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
                <Card className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/30 bg-gradient-to-br from-card to-card/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                        <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                            <Crown className="h-4 w-4 text-purple-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            {subscription?.planName}
                        </div>
                        <p className="text-sm text-muted-foreground">Status: {subscription?.status}</p>
                        <div className="mt-3 pt-3 border-t border-border/50">
                            <Badge variant={subscription?.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                                {subscription?.status === 'ACTIVE' ? 'Active' : subscription?.status}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/30 bg-gradient-to-br from-card to-card/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                        <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                            <Users className="h-4 w-4 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            {teamMembersCount} / {isUnlimitedPlan ? '∞' : subscription?.teamMembersAllowed || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {isUnlimitedPlan ? 'Unlimited team members' : `${remainingSlots} slots available`}
                        </p>
                        <div className="mt-3 pt-3 border-t border-border/50">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Active members</span>
                                <Badge variant="secondary" className="text-xs">
                                    {teamMembers.filter(m => m.status === 'ACCEPTED').length}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/30 bg-gradient-to-br from-card to-card/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-sm font-medium">Your Role</CardTitle>
                        <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                            <Shield className="h-4 w-4 text-green-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Team Owner
                        </div>
                        <p className="text-sm text-muted-foreground">Administrator</p>
                        <div className="mt-3 pt-3 border-t border-border/50">
                            <Badge variant="default" className="text-xs">
                                Full Access
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Invite New Member */}
            {canAddMoreMembers && (
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-primary" />
                            Invite Team Member
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Send an invitation to add a new member to your team
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Enter email address"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    type="email"
                                    className="w-full"
                                />
                            </div>
                            <div className="sm:w-40">
                                <Select
                                    value={inviteRole}
                                    onValueChange={(value) => setInviteRole(value as 'MEMBER' | 'MANAGER' | 'ADMIN')}
                                    options={[
                                        { value: 'MEMBER', label: 'Member' },
                                        { value: 'MANAGER', label: 'Manager' },
                                        { value: 'ADMIN', label: 'Admin' }
                                    ]}
                                    placeholder="Select role"
                                />
                            </div>
                            <Button
                                onClick={handleInviteTeamMember}
                                disabled={!inviteEmail || inviting}
                                className="cursor-pointer"
                            >
                                {inviting ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Inviting...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="h-4 w-4 mr-2" />
                                        Send Invite
                                    </>
                                )}
                            </Button>
                        </div>
                        <div className="mt-4 p-3 bg-background/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                <strong>Role permissions:</strong> Member (basic access), Manager (content management), Admin (full access including team management)
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {!canAddMoreMembers && !isUnlimitedPlan && (
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <CardTitle>Team Members ({filteredTeamMembers.length})</CardTitle>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchTeamMembers}
                            disabled={loading}
                            className="cursor-pointer"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>

                    {/* Search and Filter */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select
                                value={filterRole}
                                onValueChange={(value) => setFilterRole(value as 'ALL' | 'MEMBER' | 'MANAGER' | 'ADMIN')}
                                options={[
                                    { value: 'ALL', label: 'All Roles' },
                                    { value: 'MEMBER', label: 'Member' },
                                    { value: 'MANAGER', label: 'Manager' },
                                    { value: 'ADMIN', label: 'Admin' }
                                ]}
                                className="min-w-[120px]"
                            />
                            <Select
                                value={filterStatus}
                                onValueChange={(value) => setFilterStatus(value as 'ALL' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED')}
                                options={[
                                    { value: 'ALL', label: 'All Status' },
                                    { value: 'PENDING', label: 'Pending' },
                                    { value: 'ACCEPTED', label: 'Accepted' },
                                    { value: 'DECLINED', label: 'Declined' },
                                    { value: 'EXPIRED', label: 'Expired' }
                                ]}
                                className="min-w-[120px]"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredTeamMembers.length === 0 ? (
                        <div className="text-center py-12">
                            {teamMembers.length === 0 ? (
                                <>
                                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground text-lg font-medium mb-2">
                                        No team members yet
                                    </p>
                                    <p className="text-muted-foreground text-sm">
                                        Invite your first team member to get started with collaboration
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground text-lg font-medium mb-2">
                                        No members match your filters
                                    </p>
                                    <p className="text-muted-foreground text-sm">
                                        Try adjusting your search or filter criteria
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredTeamMembers.map((member) => {
                                const StatusIcon = getStatusIcon(member.status);
                                const RoleIcon = getRoleIcon(member.role);

                                return (
                                    <div key={member.id} className="group p-4 border border-border rounded-lg hover:border-primary/30 transition-all duration-200 bg-gradient-to-r from-background to-background/50">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-primary/10 rounded-lg">
                                                        <Mail className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-medium text-foreground truncate">{member.email}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge
                                                                variant={member.role === 'ADMIN' ? 'default' : member.role === 'MANAGER' ? 'secondary' : 'outline'}
                                                                className="text-xs"
                                                            >
                                                                <RoleIcon className="h-3 w-3 mr-1" />
                                                                {member.role === 'ADMIN' ? 'Admin' : member.role === 'MANAGER' ? 'Manager' : 'Member'}
                                                            </Badge>
                                                            <Badge
                                                                variant={
                                                                    member.status === 'ACCEPTED' ? 'default' :
                                                                        member.status === 'PENDING' ? 'secondary' : 'destructive'
                                                                }
                                                                className="text-xs"
                                                            >
                                                                <StatusIcon className="h-3 w-3 mr-1" />
                                                                {member.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 text-xs text-muted-foreground ml-11">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        Invited: {new Date(member.invitedAt).toLocaleDateString()}
                                                    </div>
                                                    {member.acceptedAt && (
                                                        <div className="flex items-center gap-1">
                                                            <CheckCircle className="h-3 w-3" />
                                                            Joined: {new Date(member.acceptedAt).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 sm:ml-4">
                                                {member.status === 'PENDING' && (
                                                    <Button size="sm" variant="outline" className="cursor-pointer">
                                                        <Mail className="h-4 w-4 mr-1" />
                                                        Resend
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="outline" className="cursor-pointer">
                                                    <Edit className="h-4 w-4 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleRemoveTeamMember(member.userId)}
                                                    className="cursor-pointer"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Team Permissions Guide */}
            <Card className="border-secondary/20 bg-gradient-to-r from-secondary/5 to-primary/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        Role Permissions Guide
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Understanding what each role can do in your team
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3 p-4 border border-border rounded-lg bg-background/50">
                            <div className="flex items-center gap-2">
                                <UserCheck className="h-5 w-5 text-blue-500" />
                                <h4 className="font-medium text-sm text-foreground">Member</h4>
                            </div>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Upload and manage own media files</li>
                                <li>• View basic analytics</li>
                                <li>• Access personal dashboard</li>
                                <li>• Comment on shared content</li>
                            </ul>
                        </div>

                        <div className="space-y-3 p-4 border border-border rounded-lg bg-background/50">
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-orange-500" />
                                <h4 className="font-medium text-sm text-foreground">Manager</h4>
                            </div>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• All member permissions</li>
                                <li>• Manage all team media</li>
                                <li>• Access detailed analytics</li>
                                <li>• Organize team content</li>
                                <li>• Review team activity</li>
                            </ul>
                        </div>

                        <div className="space-y-3 p-4 border border-border rounded-lg bg-background/50">
                            <div className="flex items-center gap-2">
                                <Crown className="h-5 w-5 text-purple-500" />
                                <h4 className="font-medium text-sm text-foreground">Admin</h4>
                            </div>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• All manager permissions</li>
                                <li>• Invite/remove team members</li>
                                <li>• Manage team roles</li>
                                <li>• Access billing information</li>
                                <li>• Full team administration</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="flex items-start gap-3">
                            <Crown className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                                <h5 className="font-medium text-sm text-foreground mb-1">Team Owner (You)</h5>
                                <p className="text-sm text-muted-foreground">
                                    As the team owner, you have unlimited access to all features and can manage the entire team.
                                    You cannot be removed from the team and have full administrative privileges.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}