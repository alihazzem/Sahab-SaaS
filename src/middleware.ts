import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();
    const currentUrl = new URL(req.url)

    const isAuthPage = currentUrl.pathname.startsWith("/auth/")
    const isApiRoute = currentUrl.pathname.startsWith("/api/")
    const isProtectedAppRoute = currentUrl.pathname.startsWith("/dashboard") ||
        currentUrl.pathname.startsWith("/subscription")
    const isAdminRoute = currentUrl.pathname.startsWith("/admin")
    const isAdminApiRoute = currentUrl.pathname.startsWith("/api/admin")
    const isProtectedApiRoute = currentUrl.pathname.startsWith("/api/media") ||
        currentUrl.pathname.startsWith("/api/payment") ||
        currentUrl.pathname.startsWith("/api/subscription") ||
        isAdminApiRoute

    // For admin routes, just check if user is authenticated
    // The subscription check will be done in the admin page itself
    if (isAdminRoute) {
        if (!userId) {
            return NextResponse.redirect(new URL('/auth/sign-in', req.url))
        }
        // Let authenticated users through - subscription check happens in the component
    }

    // For admin API routes, also just check authentication
    if (isAdminApiRoute) {
        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Authentication required" },
                { status: 401 }
            )
        }
    }

    // Protect app routes - redirect unauthenticated users to sign-in
    if (!userId && isProtectedAppRoute) {
        const signInUrl = new URL("/auth/sign-in", req.url)
        signInUrl.searchParams.set("redirect_url", currentUrl.pathname)
        return NextResponse.redirect(signInUrl)
    }

    // Protect API routes - return 401 for unauthenticated users
    if (!userId && isProtectedApiRoute) {
        return NextResponse.json(
            { success: false, error: "Authentication required" },
            { status: 401 }
        )
    }

    // Apply rate limiting based on route type
    if (isApiRoute) {
        let rateLimitConfig = RATE_LIMITS.api // Default

        if (currentUrl.pathname.startsWith("/api/auth/")) {
            rateLimitConfig = RATE_LIMITS.auth
        } else if (currentUrl.pathname.startsWith("/api/media/upload")) {
            rateLimitConfig = RATE_LIMITS.upload
        } else if (currentUrl.pathname.startsWith("/api/payment")) {
            rateLimitConfig = RATE_LIMITS.payment
        } else if (currentUrl.pathname.startsWith("/api/plans") || currentUrl.pathname.startsWith("/api/health")) {
            rateLimitConfig = RATE_LIMITS.public
        }

        const rateLimitResponse = await rateLimit(req, rateLimitConfig, userId || undefined)
        if (rateLimitResponse) {
            return rateLimitResponse
        }
    }

    // Handle authenticated users on auth pages - redirect to dashboard
    if (userId && isAuthPage) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Create response with security headers
    const response = NextResponse.next()

    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

    // Only set X-Frame-Options and CSP for non-auth pages to avoid CAPTCHA issues
    if (!isAuthPage) {
        response.headers.set('X-Frame-Options', 'DENY')

        // Content Security Policy
        const csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.dev https://*.clerk.accounts.dev https://www.google.com https://www.gstatic.com https://www.recaptcha.net https://js.hcaptcha.com https://*.hcaptcha.com https://challenges.cloudflare.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.google.com https://www.gstatic.com https://www.recaptcha.net https://*.hcaptcha.com https://challenges.cloudflare.com",
            "font-src 'self' https://fonts.gstatic.com https://www.gstatic.com",
            "img-src 'self' data: blob: https://res.cloudinary.com https://images.clerk.dev https://www.google.com https://www.gstatic.com https://www.recaptcha.net https://*.hcaptcha.com https://challenges.cloudflare.com",
            "media-src 'self' blob: https://res.cloudinary.com",
            "connect-src 'self' https://api.clerk.dev https://*.clerk.accounts.dev https://api.cloudinary.com https://accept.paymob.com https://www.google.com https://www.gstatic.com https://www.recaptcha.net https://*.hcaptcha.com https://challenges.cloudflare.com",
            "frame-src 'self' https://*.clerk.accounts.dev https://accept.paymob.com https://www.google.com https://www.gstatic.com https://www.recaptcha.net https://*.hcaptcha.com https://newassets.hcaptcha.com https://challenges.cloudflare.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self' https://accept.paymob.com"
        ].join('; ')

        response.headers.set('Content-Security-Policy', csp)
    } else {
        // More permissive frame options for auth pages to allow CAPTCHA
        response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    }

    return response
})

export const config = {
    matcher: [
        // Match all routes except static files and Next.js internals
        "/((?!.*\\..*|_next).*)",
        "/",
        // Match all API routes
        "/(api|trpc)(.*)",
        // Explicitly match protected app routes
        "/dashboard/:path*",
        "/subscription/:path*",
        "/admin/:path*"
    ],
};