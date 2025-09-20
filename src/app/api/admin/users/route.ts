import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { requireAdminAccess } from '@/lib/admin';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // Check admin access
        const adminCheck = await requireAdminAccess();
        if (adminCheck) {
            return adminCheck;
        }

        // Get all users from Clerk
        const clerk = await clerkClient();
        const clerkUsers = await clerk.users.getUserList({
            limit: 500,
            orderBy: '-created_at'
        });

        // Get subscription data from database
        const subscriptions = await prisma.subscription.findMany({
            include: {
                plan: true
            }
        });

        // Get usage data
        const usageData = await prisma.usageTracking.findMany({
            where: {
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear()
            }
        });

        // Combine user data
        const users = clerkUsers.data.map((user) => {
            const subscription = subscriptions.find(sub => sub.userId === user.id);
            const usage = usageData.find(u => u.userId === user.id);

            return {
                id: user.id,
                email: user.emailAddresses[0]?.emailAddress || 'N/A',
                firstName: user.firstName,
                lastName: user.lastName,
                imageUrl: user.imageUrl,
                createdAt: user.createdAt,
                lastSignInAt: user.lastSignInAt,
                role: 'user', // In new system, role is subscription-based
                subscription: subscription ? {
                    planName: subscription.plan.name,
                    status: subscription.status,
                    startDate: subscription.startDate,
                    endDate: subscription.endDate
                } : null,
                usage: usage ? {
                    storageUsed: usage.storageUsed,
                    transformationsUsed: usage.transformationsUsed
                } : {
                    storageUsed: 0,
                    transformationsUsed: 0
                }
            };
        });

        return NextResponse.json({
            users,
            total: clerkUsers.totalCount
        });

    } catch (error) {
        console.error('Admin users fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        // Check admin access
        const adminCheck = await requireAdminAccess();
        if (adminCheck) {
            return adminCheck;
        }

        const { userId, action } = await request.json();

        if (!userId || !action) {
            return NextResponse.json(
                { error: 'User ID and action are required' },
                { status: 400 }
            );
        }

        const clerk = await clerkClient();
        let result;

        switch (action) {
            case 'delete':
                result = await clerk.users.deleteUser(userId);
                // Also delete from our database
                await prisma.subscription.deleteMany({
                    where: { userId: userId }
                });
                await prisma.usageTracking.deleteMany({
                    where: { userId: userId }
                });
                await prisma.media.deleteMany({
                    where: { userId: userId }
                });
                await prisma.payment.deleteMany({
                    where: { userId: userId }
                });
                break;

            default:
                return NextResponse.json(
                    { error: 'Invalid action. Only delete is supported in subscription-based system.' },
                    { status: 400 }
                );
        }

        return NextResponse.json({
            success: true,
            message: `User ${action} successful`,
            data: result
        });

    } catch (error) {
        console.error('Admin user action error:', error);
        return NextResponse.json(
            { error: 'Failed to perform user action' },
            { status: 500 }
        );
    }
}