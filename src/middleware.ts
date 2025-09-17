import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export default clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();
    const currentUrl = new URL(req.url)
    const isAuthPage = currentUrl.pathname.startsWith("/auth/")

    // Handle authenticated users on auth pages - redirect to dashboard
    if (userId && isAuthPage) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
    }
})

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};