import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Check admin access
        const adminCheck = await requireAdminAccess();
        if (adminCheck) {
            return adminCheck;
        }

        // Get all subscriptions with plan details
        const subscriptions = await prisma.subscription.findMany({
            include: {
                plan: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Get subscription statistics
        const stats = await prisma.subscription.groupBy({
            by: ['status'],
            _count: {
                status: true
            }
        });

        // Get revenue by plan
        const revenueByPlan = await prisma.payment.groupBy({
            by: ['planId'],
            where: {
                status: 'SUCCESS'
            },
            _sum: {
                amount: true
            },
            _count: {
                planId: true
            }
        });

        // Get plan details for revenue mapping
        const plans = await prisma.plan.findMany();
        const planMap = plans.reduce((acc, plan) => {
            acc[plan.id] = plan;
            return acc;
        }, {} as Record<string, typeof plans[0]>);

        return NextResponse.json({
            subscriptions: subscriptions.map(sub => ({
                id: sub.id,
                userId: sub.userId,
                plan: {
                    id: sub.plan.id,
                    name: sub.plan.name,
                    price: sub.plan.price / 100, // Convert to EGP
                    currency: sub.plan.currency
                },
                status: sub.status,
                startDate: sub.startDate,
                endDate: sub.endDate,
                createdAt: sub.createdAt
            })),
            statistics: {
                byStatus: stats.reduce((acc, stat) => {
                    acc[stat.status] = stat._count.status;
                    return acc;
                }, {} as Record<string, number>),
                total: subscriptions.length
            },
            revenue: {
                byPlan: revenueByPlan.map(rev => ({
                    planId: rev.planId,
                    planName: planMap[rev.planId]?.name || 'Unknown',
                    totalRevenue: (rev._sum.amount || 0) / 100,
                    transactionCount: rev._count.planId
                })),
                total: revenueByPlan.reduce((sum, rev) => sum + (rev._sum.amount || 0), 0) / 100
            }
        });

    } catch (error) {
        console.error('Admin subscriptions error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch subscription data' },
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

        const { subscriptionId, action, endDate } = await request.json();

        if (!subscriptionId || !action) {
            return NextResponse.json(
                { error: 'Subscription ID and action are required' },
                { status: 400 }
            );
        }

        let updateData: {
            status?: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAST_DUE';
            endDate?: Date;
        } = {};

        switch (action) {
            case 'cancel':
                updateData = {
                    status: 'CANCELLED',
                    endDate: new Date() // Set end date to now
                };
                break;

            case 'activate':
                updateData = {
                    status: 'ACTIVE'
                };
                if (endDate) {
                    updateData.endDate = new Date(endDate);
                }
                break;

            case 'extend':
                if (!endDate) {
                    return NextResponse.json(
                        { error: 'End date is required for extension' },
                        { status: 400 }
                    );
                }
                updateData = {
                    endDate: new Date(endDate)
                };
                break;

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }

        const updatedSubscription = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: updateData,
            include: {
                plan: true
            }
        });

        return NextResponse.json({
            success: true,
            message: `Subscription ${action} successful`,
            subscription: {
                id: updatedSubscription.id,
                userId: updatedSubscription.userId,
                plan: updatedSubscription.plan,
                status: updatedSubscription.status,
                startDate: updatedSubscription.startDate,
                endDate: updatedSubscription.endDate
            }
        });

    } catch (error) {
        console.error('Admin subscription action error:', error);
        return NextResponse.json(
            { error: 'Failed to perform subscription action' },
            { status: 500 }
        );
    }
}
