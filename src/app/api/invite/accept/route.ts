import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { acceptInvitation } from '@/lib/invitation-tokens';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User not authenticated' },
                { status: 401 }
            );
        }

        const { token } = await request.json();

        if (!token || typeof token !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Valid token is required' },
                { status: 400 }
            );
        }

        const result = await acceptInvitation(token, userId);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            teamMember: result.teamMember
        });
    } catch (error) {
        console.error('Error accepting invitation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to accept invitation' },
            { status: 500 }
        );
    }
}
