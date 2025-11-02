import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        const { sessionId } = await auth()

        if (!sessionId) {
            return NextResponse.json(
                { success: false, error: 'No active session found' },
                { status: 401 }
            )
        }

        const client = await clerkClient()
        await client.sessions.revokeSession(sessionId)

        const response = NextResponse.json(
            {
                success: true,
                message: 'Logged out successfully',
                redirectTo: '/'
            },
            { status: 200 }
        )

        response.cookies.delete('__clerk_session')
        response.cookies.delete('__clerk_db_jwt')

        return response
    } catch (error) {
        console.error('Logout error:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to logout',
                redirectTo: '/'
            },
            { status: 500 }
        )
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    })
}
