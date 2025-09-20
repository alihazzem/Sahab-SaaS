import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
    windowMs: number // Time window in milliseconds
    maxRequests: number // Maximum requests per window
}

interface RateLimitEntry {
    count: number
    resetTime: number
}

class RateLimiter {
    private static cache = new Map<string, RateLimitEntry>()

    static async checkLimit(
        identifier: string,
        config: RateLimitConfig
    ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
        const now = Date.now()
        const key = identifier

        // Clean up expired entries
        this.cleanupExpired(now)

        const entry = this.cache.get(key)
        const resetTime = now + config.windowMs

        if (!entry || now > entry.resetTime) {
            // First request or window expired
            this.cache.set(key, { count: 1, resetTime })
            return {
                allowed: true,
                remaining: config.maxRequests - 1,
                resetTime
            }
        }

        if (entry.count >= config.maxRequests) {
            // Rate limit exceeded
            return {
                allowed: false,
                remaining: 0,
                resetTime: entry.resetTime
            }
        }

        // Increment counter
        entry.count++
        this.cache.set(key, entry)

        return {
            allowed: true,
            remaining: config.maxRequests - entry.count,
            resetTime: entry.resetTime
        }
    }

    private static cleanupExpired(now: number) {
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.resetTime) {
                this.cache.delete(key)
            }
        }
    }
}

// Rate limit configurations for different endpoints
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
    // Authentication endpoints
    auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 requests per 15 minutes

    // API endpoints
    api: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute

    // Upload endpoints
    upload: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 uploads per minute

    // Payment endpoints
    payment: { windowMs: 60 * 1000, maxRequests: 10 }, // 5 payment requests per minute

    // Public endpoints
    public: { windowMs: 60 * 1000, maxRequests: 200 }, // 200 requests per minute
}

export async function rateLimit(
    request: NextRequest,
    config: RateLimitConfig,
    identifier?: string
): Promise<NextResponse | null> {
    // Get identifier (IP address or user ID)
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
    const key = identifier || ip

    const result = await RateLimiter.checkLimit(key, config)

    if (!result.allowed) {
        return NextResponse.json(
            {
                success: false,
                error: 'Rate limit exceeded',
                message: 'Too many requests. Please try again later.',
                resetTime: result.resetTime
            },
            {
                status: 429,
                headers: {
                    'X-RateLimit-Limit': config.maxRequests.toString(),
                    'X-RateLimit-Remaining': result.remaining.toString(),
                    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
                    'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
                }
            }
        )
    }

    return null // No rate limit hit
}

// Helper function to get rate limit headers
export function getRateLimitHeaders(
    config: RateLimitConfig,
    remaining: number,
    resetTime: number
) {
    return {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString()
    }
}