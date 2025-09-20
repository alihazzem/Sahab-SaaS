import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // Check admin access
        const adminCheck = await requireAdminAccess();
        if (adminCheck) {
            return adminCheck;
        }

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        // Get system analytics
        const [
            totalUsers,
            activeSubscriptions,
            totalRevenue,
            totalMedia,
            totalStorageUsed,
            currentMonthUsage,
            recentPayments,
            planDistribution
        ] = await Promise.all([
            // Total users count (from subscriptions/usage as proxy)
            prisma.usageTracking.groupBy({
                by: ['userId'],
                _count: {
                    userId: true
                }
            }),

            // Active subscriptions
            prisma.subscription.count({
                where: {
                    status: 'ACTIVE'
                }
            }),

            // Total revenue
            prisma.payment.aggregate({
                where: {
                    status: 'SUCCESS'
                },
                _sum: {
                    amount: true
                }
            }),

            // Total media files
            prisma.media.count(),

            // Total storage used across all users
            prisma.usageTracking.aggregate({
                _sum: {
                    storageUsed: true
                }
            }),

            // Current month usage
            prisma.usageTracking.findMany({
                where: {
                    month: currentMonth,
                    year: currentYear
                },
                select: {
                    userId: true,
                    storageUsed: true,
                    transformationsUsed: true,
                    uploadsCount: true
                }
            }),

            // Recent payments (last 10)
            prisma.payment.findMany({
                take: 10,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    plan: true
                }
            }),

            // Plan distribution
            prisma.subscription.groupBy({
                by: ['planId'],
                where: {
                    status: 'ACTIVE'
                },
                _count: {
                    planId: true
                }
            })
        ]);

        // Calculate metrics
        const totalUsersCount = totalUsers.length;
        const revenueInEGP = (totalRevenue._sum.amount || 0) / 100;
        const totalStorageGB = Math.round(((totalStorageUsed._sum.storageUsed || 0) / 1024) * 100) / 100;

        // Current month totals
        const monthlyStats = currentMonthUsage.reduce((acc, usage) => ({
            totalStorage: acc.totalStorage + usage.storageUsed,
            totalTransformations: acc.totalTransformations + usage.transformationsUsed,
            totalUploads: acc.totalUploads + usage.uploadsCount
        }), {
            totalStorage: 0,
            totalTransformations: 0,
            totalUploads: 0
        });

        // Top users by storage usage this month
        const topUsers = currentMonthUsage
            .sort((a, b) => b.storageUsed - a.storageUsed)
            .slice(0, 5);

        // Growth metrics (compare with last month)
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

        const lastMonthUsage = await prisma.usageTracking.aggregate({
            where: {
                month: lastMonth,
                year: lastMonthYear
            },
            _sum: {
                storageUsed: true,
                transformationsUsed: true,
                uploadsCount: true
            }
        });

        const storageGrowth = lastMonthUsage._sum.storageUsed
            ? Math.round(((monthlyStats.totalStorage - lastMonthUsage._sum.storageUsed) / lastMonthUsage._sum.storageUsed) * 100)
            : 0;

        // Get plan names for distribution
        const plans = await prisma.plan.findMany({
            select: {
                id: true,
                name: true
            }
        });

        const planMap = plans.reduce((acc, plan) => {
            acc[plan.id] = plan.name;
            return acc;
        }, {} as Record<string, string>);

        return NextResponse.json({
            overview: {
                totalUsers: totalUsersCount,
                activeSubscriptions,
                totalRevenue: revenueInEGP,
                totalMedia,
                totalStorageGB,
                storageGrowth
            },
            currentMonth: {
                storage: monthlyStats.totalStorage,
                transformations: monthlyStats.totalTransformations,
                uploads: monthlyStats.totalUploads,
                month: currentMonth,
                year: currentYear
            },
            topUsers,
            recentPayments: recentPayments.map(payment => ({
                id: payment.id,
                userId: payment.userId,
                amount: payment.amount / 100,
                currency: payment.currency,
                planName: payment.plan.name,
                status: payment.status,
                createdAt: payment.createdAt
            })),
            planDistribution: planDistribution.map(dist => ({
                planId: dist.planId,
                planName: planMap[dist.planId] || 'Unknown',
                count: dist._count.planId
            }))
        });

    } catch (error) {
        console.error('Admin analytics error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}