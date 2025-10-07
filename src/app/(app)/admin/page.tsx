import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import AdminDashboardClient from './admin-dashboard-client';
import { BarChart3, Lock, ArrowRight } from 'lucide-react';
import { checkAdminDashboardAccess } from '@/lib/admin';
import Link from 'next/link';

export default async function AdminDashboard() {
    // Check if user is authenticated and get their access level
    const { userId } = await auth();

    if (!userId) {
        redirect('/auth/sign-in');
    }

    // Check access level for admin dashboard
    const accessCheck = await checkAdminDashboardAccess();

    if (!accessCheck.canAccessDashboard) {
        redirect('/auth/sign-in');
    }

    // If user doesn't have admin privileges (free plan), show upgrade page
    if (!accessCheck.isAdmin) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
                <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-6">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <BarChart3 className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                        Team Management
                                    </h1>
                                    <p className="text-muted-foreground">
                                        Unlock powerful team collaboration features
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                            <Lock className="h-8 w-8 text-primary" />
                        </div>

                        <h2 className="text-3xl font-bold text-foreground mb-4">
                            Upgrade Your Plan
                        </h2>

                        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Team management features are available with Pro and Enterprise plans.
                            Upgrade now to invite team members, manage permissions, and collaborate effectively.
                        </p>

                        {accessCheck.subscription && (
                            <div className="bg-card border border-border rounded-lg p-6 mb-8 text-left max-w-md mx-auto">
                                <h3 className="font-semibold text-foreground mb-2">Current Plan</h3>
                                <p className="text-muted-foreground mb-4">
                                    <strong className="text-foreground">Plan:</strong> {accessCheck.subscription.planName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    You need a Pro or Enterprise subscription to access team management features.
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/subscription"
                                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                Upgrade to Pro
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>

                            <Link
                                href="/dashboard"
                                className="inline-flex items-center justify-center px-6 py-3 border border-border text-foreground font-medium rounded-lg hover:bg-accent transition-colors"
                            >
                                Back to Dashboard
                            </Link>
                        </div>

                        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                            <div className="p-6 bg-card border border-border rounded-lg">
                                <h4 className="font-semibold text-foreground mb-2">Team Collaboration</h4>
                                <p className="text-sm text-muted-foreground">
                                    Invite team members and collaborate on projects together.
                                </p>
                            </div>

                            <div className="p-6 bg-card border border-border rounded-lg">
                                <h4 className="font-semibold text-foreground mb-2">Permission Control</h4>
                                <p className="text-sm text-muted-foreground">
                                    Manage team member roles and control access to your resources.
                                </p>
                            </div>

                            <div className="p-6 bg-card border border-border rounded-lg">
                                <h4 className="font-semibold text-foreground mb-2">Advanced Features</h4>
                                <p className="text-sm text-muted-foreground">
                                    Access premium features and enhanced storage limits.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // User has admin privileges, show the full admin dashboard
    // Get team members count (only accepted members)
    const teamMembersCount = await prisma.teamMember.count({
        where: {
            teamOwnerId: userId,
            status: 'ACCEPTED'
        }
    });

    const adminCheck = {
        isAdmin: true,
        role: 'team_owner',
        userId,
        subscription: accessCheck.subscription,
        teamMembers: teamMembersCount
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
            <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <BarChart3 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                    Team Management
                                </h1>
                                <p className="text-muted-foreground">
                                    Manage your team members and control access to your organization
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <div className="p-4 bg-card border border-border rounded-lg">
                        <p className="text-sm text-muted-foreground">
                            <strong className="text-foreground">Plan:</strong> {adminCheck.subscription?.planName} |{' '}
                            <strong className="text-foreground">Team Members:</strong> {adminCheck.teamMembers || 0}/{adminCheck.subscription?.teamMembersAllowed === -1 ? '∞' : adminCheck.subscription?.teamMembersAllowed || 0}
                        </p>
                    </div>
                </div>

                <AdminDashboardClient
                    subscription={adminCheck.subscription}
                    teamMembersCount={adminCheck.teamMembers || 0}
                />
            </div>
        </div>
    );
}