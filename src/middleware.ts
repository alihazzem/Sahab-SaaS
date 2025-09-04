import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
]);

const isPublicApiRoute = createRouteMatcher([
    '/api/auth',
]);

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();
    const url = new URL(req.url);

    const isDashboard = url.pathname.startsWith('/dashboard');
    const isApiRequest = url.pathname.startsWith('/api');

    // Redirect logged-in users away from public auth pages
    if (userId && isPublicRoute(req) && !isDashboard) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Handle unauthenticated users
    if (!userId) {
        if (isApiRequest && !isPublicApiRoute(req)) {
            // For APIs, return 401 JSON instead of redirect
            return new NextResponse('Unauthorized Request', { status: 401 });
        }
        if (!isPublicRoute(req) && !isPublicApiRoute(req)) {
            // For pages, redirect to homepage
            return NextResponse.redirect(new URL('/', req.url));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
