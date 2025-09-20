import { NextResponse } from 'next/server';

// This endpoint is deprecated - admin access is now subscription-based
// Pro and Enterprise plan holders automatically get team management access
export async function POST() {
    return NextResponse.json(
        {
            error: 'This endpoint is deprecated. Admin access is now subscription-based.',
            message: 'Subscribe to Pro or Enterprise plan to get team management access.'
        },
        { status: 410 } // Gone
    );
}