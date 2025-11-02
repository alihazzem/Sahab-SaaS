import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { paymobSubscriptionHelper } from '@/lib/paymob';

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

        // Get user details from Clerk
        const user = await currentUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { planId } = body;

        if (!planId) {
            return NextResponse.json(
                { success: false, error: 'Plan ID is required' },
                { status: 400 }
            );
        }

        // Validate plan exists
        const plan = await prisma.plan.findUnique({
            where: { id: planId }
        });

        if (!plan) {
            return NextResponse.json(
                { success: false, error: 'Plan not found' },
                { status: 404 }
            );
        }

        // Check if user already has an active subscription
        const existingSubscription = await prisma.subscription.findUnique({
            where: { userId },
            include: { plan: true }
        });

        // Don't allow subscribing to the same plan
        if (existingSubscription && existingSubscription.planId === planId) {
            return NextResponse.json(
                {
                    success: false,
                    error: `You are already subscribed to the ${plan.name} plan`
                },
                { status: 400 }
            );
        }

        // Don't allow subscribing to Free plan if they already have it
        if (plan.name.toLowerCase() === 'free' || plan.price === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Free plan does not require payment. Contact support if you need to downgrade.'
                },
                { status: 400 }
            );
        }

        // Extract user information
        const userEmail = user.emailAddresses[0]?.emailAddress || '';
        const userFirstName = user.firstName || 'User';
        const userLastName = user.lastName || '';

        if (!userEmail) {
            return NextResponse.json(
                { success: false, error: 'User email is required for payment processing' },
                { status: 400 }
            );
        }

        // Create payment session with Paymob
        const amountEGP = plan.price / 100; // Convert from piastres to EGP

        try {
            const paymentSession = await paymobSubscriptionHelper.createSubscriptionPayment(
                planId,
                plan.name,
                amountEGP,
                userEmail,
                userFirstName,
                userLastName,
                userId
            );

            // Store pending payment record in database
            const payment = await prisma.payment.create({
                data: {
                    userId,
                    planId,
                    amount: plan.price, // Store in piastres
                    currency: 'EGP',
                    status: 'PENDING',
                    provider: 'paymob',
                    providerTxnId: paymentSession.orderId.toString(),
                    metadata: {
                        paymobOrderId: paymentSession.orderId,
                        paymentToken: paymentSession.paymentToken,
                        amountCents: paymentSession.amountCents,
                        planName: plan.name,
                        userEmail,
                        createdAt: new Date().toISOString()
                    }
                }
            });

            return NextResponse.json({
                success: true,
                data: {
                    paymentId: payment.id,
                    paymentUrl: paymentSession.paymentUrl,
                    orderId: paymentSession.orderId,
                    amount: {
                        egp: amountEGP,
                        piastres: plan.price
                    },
                    plan: {
                        id: plan.id,
                        name: plan.name,
                        price: plan.price
                    }
                }
            });

        } catch (paymobError) {
            console.error('Paymob payment creation error:', paymobError);

            // Return user-friendly error message
            return NextResponse.json(
                {
                    success: false,
                    error: 'Payment service is temporarily unavailable. Please try again later.'
                },
                { status: 503 }
            );
        }

    } catch (error) {
        console.error('Payment initiation error:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error. Please try again later.'
            },
            { status: 500 }
        );
    }
}

// Handle GET requests (for debugging in development)
export async function GET() {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
            { success: false, error: 'Method not allowed' },
            { status: 405 }
        );
    }

    try {
        // Return available plans for debugging
        const plans = await prisma.plan.findMany({
            where: {
                price: {
                    gt: 0 // Only paid plans
                }
            },
            orderBy: {
                price: 'asc'
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Payment initiation endpoint is working',
            availablePlans: plans.map((plan: { id: string; name: string; price: number }) => ({
                id: plan.id,
                name: plan.name,
                priceEGP: plan.price / 100,
                pricePiastres: plan.price
            }))
        });

    } catch (error) {
        console.error('Payment debug error:', error);

        return NextResponse.json(
            { success: false, error: 'Failed to fetch debug information' },
            { status: 500 }
        );
    }
}
