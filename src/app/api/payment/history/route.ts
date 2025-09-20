import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Fetch payment history for the user
        const payments = await prisma.payment.findMany({
            where: {
                userId: userId
            },
            include: {
                plan: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50 // Limit to last 50 payments
        });

        // Format payments for frontend
        const formattedPayments = payments.map((payment) => ({
            id: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            planName: payment.plan.name,
            createdAt: payment.createdAt.toISOString(),
            providerTxnId: payment.providerTxnId
        }));

        return NextResponse.json({
            success: true,
            payments: formattedPayments
        });

    } catch (error) {
        console.error("Error fetching payment history:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}