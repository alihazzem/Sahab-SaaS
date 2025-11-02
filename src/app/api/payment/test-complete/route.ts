import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { clerkClient } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { orderId, success: paymentSuccess = true } = body;

        if (!orderId) {
            return NextResponse.json(
                { success: false, error: 'Order ID is required' },
                { status: 400 }
            );
        }

        // Find the payment record
        const payment = await prisma.payment.findFirst({
            where: {
                providerTxnId: orderId.toString(),
                userId,
                status: 'PENDING'
            },
            include: {
                plan: true
            }
        });

        if (!payment) {
            return NextResponse.json(
                { success: false, error: 'Payment not found or already processed' },
                { status: 404 }
            );
        }

        // Update payment status
        const newStatus = paymentSuccess ? 'SUCCESS' : 'FAILED';
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: newStatus,
                metadata: {
                    ...payment.metadata as object,
                    testCompletion: true,
                    completedAt: new Date().toISOString(),
                    completedBy: 'test-mode'
                }
            }
        });

        // If successful, activate subscription
        if (paymentSuccess) {
            await activateTestSubscription(userId, payment.planId, payment.plan);
        }

        return NextResponse.json({
            success: true,
            message: `Test payment ${newStatus.toLowerCase()}`,
            paymentId: payment.id,
            subscriptionActivated: paymentSuccess
        });

    } catch (error) {
        console.error('Test payment completion error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

async function activateTestSubscription(userId: string, planId: string, plan: { name: string; price: number }) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Check if user has an existing subscription
    const existingSubscription = await prisma.subscription.findUnique({
        where: { userId }
    });

    if (existingSubscription) {
        await prisma.subscription.update({
            where: { userId },
            data: {
                planId,
                startDate,
                endDate,
                status: 'ACTIVE'
            }
        });
    } else {
        await prisma.subscription.create({
            data: {
                userId,
                planId,
                startDate,
                endDate,
                status: 'ACTIVE'
            }
        });
    }

    // Update Clerk metadata
    try {
        const clerk = await clerkClient();
        await clerk.users.updateUserMetadata(userId, {
            publicMetadata: {
                subscriptionPlan: plan.name,
                subscriptionStatus: 'ACTIVE',
                subscriptionEndDate: endDate.toISOString(),
                testMode: true
            }
        });
    } catch (clerkError) {
        console.error('Failed to update Clerk metadata:', clerkError);
    }
}
