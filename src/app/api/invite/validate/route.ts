import { NextResponse } from 'next/server';
import { findInvitationByToken } from '@/lib/invitation-tokens';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { token } = await request.json();

        if (!token || typeof token !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Valid token is required' },
                { status: 400 }
            );
        }

        const result = await findInvitationByToken(token);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            invitation: result.invitation
        });
    } catch (error) {
        console.error('Error validating invitation:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to validate invitation' },
            { status: 500 }
        );
    }
}
