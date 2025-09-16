import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
    '/',
    '/auth/sign-in(.*)',
    '/auth/sign-up(.*)',
    '/sso-callback(.*)',
]);

const isPublicApiRoute = createRouteMatcher([
    '/api/videos',
]);

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();
    const url = new URL(req.url);
    const pathname = url.pathname;

    const isApiRequest = pathname.startsWith('/api');
    // Check if this is a dashboard route that requires authentication
    const isDashboard = pathname.startsWith('/dashboard')

    // Redirect logged-in users away from auth pages to dashboard
    if (userId && isPublicRoute(req) && (pathname.includes('/auth/') || pathname.includes('/sso-callback'))) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Handle unauthenticated users
    if (!userId) {
        if (isApiRequest && !isPublicApiRoute(req)) {
            // For APIs, return 401 JSON instead of redirect
            return NextResponse.json(
                { success: false, error: 'Unauthorized Request' },
                { status: 401 }
            );
        }
        if (isDashboard) {
            // Redirect unauthenticated users trying to access dashboard to sign-in
            return NextResponse.redirect(new URL('/auth/sign-in', req.url));
        }
        // Allow access to public routes (including homepage)
        if (isPublicRoute(req)) {
            return NextResponse.next();
        }
        // For other protected routes, redirect to sign-in
        return NextResponse.redirect(new URL('/auth/sign-in', req.url));
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
