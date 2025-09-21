import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import AdminDashboardClient from './admin-dashboard-client';
import { BarChart3 } from 'lucide-react';

export default async function AdminDashboard() {
    // Check if user is authenticated
    const { userId } = await auth();

    if (!userId) {
        redirect('/auth/sign-in');
    }

    // Check if user has an active subscription
    const subscription = await prisma.subscription.findFirst({
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
    });

    if (!subscription) {
        redirect('/dashboard');
    }

    // Get team members count
    const teamMembersCount = await prisma.teamMember.count({
        where: { teamOwnerId: userId }
    });

    const adminCheck = {
        isAdmin: true,
        role: 'team_owner',
        userId,
        subscription: {
            id: subscription.id,
            planName: subscription.plan.name,
            status: subscription.status,
            teamMembersAllowed: subscription.plan.teamMembers
        },
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