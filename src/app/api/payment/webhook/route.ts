import { NextRequest, NextResponse } from 'next/server';
import { PaymobClient } from '@/lib/paymob';
import prisma from '@/lib/prisma';
import { clerkClient } from '@clerk/nextjs/server';
import { notifyPaymentSuccess, notifyPaymentFailed } from '@/lib/notifications';

// Create Paymob client instance
const paymobClientInstance = new PaymobClient();

export async function POST(request: NextRequest) {
    try {
        // Get the raw body as string for HMAC verification
        const rawBody = await request.text();
        const hmacHeader = request.headers.get('X-HMAC') || request.headers.get('hmac');

        // Verify webhook signature if HMAC is provided
        if (hmacHeader && !paymobClientInstance.verifyWebhookSignature(rawBody, hmacHeader)) {
            console.error('Invalid webhook signature');
            return NextResponse.json(
                { success: false, error: 'Invalid signature' },
                { status: 401 }
            );
        }

        // Parse the webhook data
        let webhookData;
        try {
            webhookData = JSON.parse(rawBody);
        } catch (parseError) {
            console.error('Invalid webhook JSON:', parseError);
            return NextResponse.json(
                { success: false, error: 'Invalid JSON payload' },
                { status: 400 }
            );
        }

        // Process the webhook data using our utility
        const processedData = paymobClientInstance.processWebhookData(webhookData);

        console.log('Processing Paymob webhook:', {
            transactionId: processedData.transactionId,
            orderId: processedData.orderId,
            success: processedData.success,
            amountEGP: processedData.amountEGP
        });

        // Find the payment record in our database using the Paymob order ID
        const payment = await prisma.payment.findFirst({
            where: {
                providerTxnId: processedData.orderId.toString(),
                provider: 'paymob'
            },
            include: {
                plan: true
            }
        });

        if (!payment) {
            console.error('Payment record not found for order ID:', processedData.orderId);
            // Still return success to Paymob to avoid retries
            return NextResponse.json({ success: true, message: 'Payment record not found' });
        }

        // Prevent duplicate processing
        if (payment.status !== 'PENDING') {
            console.log('Payment already processed:', payment.id, 'Status:', payment.status);
            return NextResponse.json({ success: true, message: 'Payment already processed' });
        }

        // Update payment status based on webhook result
        const newPaymentStatus = processedData.success ? 'SUCCESS' : 'FAILED';

        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: newPaymentStatus,
                metadata: {
                    ...payment.metadata as object,
                    webhookData: processedData,
                    processedAt: new Date().toISOString()
                }
            }
        });

        // If payment was successful, activate the subscription
        if (processedData.success) {
            try {
                await activateSubscription(payment.userId, payment.planId, payment.plan);
                console.log('Subscription activated for user:', payment.userId, 'Plan:', payment.plan.name);

                // Send payment success notification
                try {
                    await notifyPaymentSuccess(payment.userId, payment.plan.name, processedData.amountEGP);
                } catch (notifError) {
                    console.error('Failed to send payment success notification:', notifError);
                }
            } catch (subscriptionError) {
                console.error('Failed to activate subscription:', subscriptionError);

                // Mark payment as failed if subscription activation fails
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: 'FAILED',
                        metadata: {
                            ...payment.metadata as object,
                            error: 'Subscription activation failed',
                            errorDetails: String(subscriptionError),
                            failedAt: new Date().toISOString()
                        }
                    }
                });

                return NextResponse.json(
                    { success: false, error: 'Subscription activation failed' },
                    { status: 500 }
                );
            }
        } else {
            console.log('Payment failed for user:', payment.userId, 'Order:', processedData.orderId);

            // Send payment failed notification
            try {
                await notifyPaymentFailed(
                    payment.userId,
                    payment.plan.name,
                    'Payment processing failed'
                );
            } catch (notifError) {
                console.error('Failed to send payment failed notification:', notifError);
            }

            // TODO: Send failure notification email
            // TODO: Log for admin dashboard
        }

        // Return success to Paymob
        return NextResponse.json({
            success: true,
            message: `Payment ${newPaymentStatus.toLowerCase()} processed successfully`
        });

    } catch (error) {
        console.error('Webhook processing error:', error);

        // Return success to avoid Paymob retries for our internal errors
        // Log the error for investigation
        return NextResponse.json(
            { success: true, message: 'Webhook received but processing failed' },
            { status: 200 }
        );
    }
}

// Activate subscription for a user
async function activateSubscription(userId: string, planId: string, plan: { name: string; price: number }) {
    // Calculate subscription end date (30 days from now)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Check if user has an existing subscription
    const existingSubscription = await prisma.subscription.findUnique({
        where: { userId }
    });

    if (existingSubscription) {
        // Update existing subscription
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
        // Create new subscription
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

    // Update user's plan information in Clerk metadata
    try {
        const clerk = await clerkClient();
        await clerk.users.updateUserMetadata(userId, {
            publicMetadata: {
                subscriptionPlan: plan.name,
                subscriptionStatus: 'ACTIVE',
                subscriptionEndDate: endDate.toISOString()
            }
        });
    } catch (clerkError) {
        console.error('Failed to update Clerk metadata:', clerkError);
        // Don't throw error as subscription is still active in our database
    }

    // TODO: Initialize usage tracking for the new billing period
    // TODO: Send welcome email for new subscription
    // TODO: Log subscription change for analytics
}

// Handle GET requests (for webhook verification during setup)
export async function GET() {
    // This can be used by Paymob to verify the webhook URL is accessible
    return NextResponse.json({
        success: true,
        message: 'Paymob webhook endpoint is active',
        timestamp: new Date().toISOString()
    });
}

// Handle other HTTP methods
export async function PUT() {
    return NextResponse.json(
        { success: false, error: 'Method not allowed' },
        { status: 405 }
    );
}

export async function DELETE() {
    return NextResponse.json(
        { success: false, error: 'Method not allowed' },
        { status: 405 }
    );
}