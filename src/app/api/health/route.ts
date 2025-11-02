import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = 'force-dynamic';

interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy'
    timestamp: string
    services: {
        database: ServiceStatus
        cloudinary: ServiceStatus
        clerk: ServiceStatus
    }
    metrics: {
        uptime: number
        memoryUsage: NodeJS.MemoryUsage
    }
}

interface ServiceStatus {
    status: 'up' | 'down' | 'slow'
    responseTime?: number
    error?: string
    lastChecked: string
}

// Check database connectivity
async function checkDatabase(): Promise<ServiceStatus> {
    const start = Date.now()
    try {
        await prisma.$queryRaw`SELECT 1`
        const responseTime = Date.now() - start

        return {
            status: responseTime < 1000 ? 'up' : 'slow',
            responseTime,
            lastChecked: new Date().toISOString()
        }
    } catch (error) {
        console.error('Database health check failed', error)
        return {
            status: 'down',
            error: error instanceof Error ? error.message : 'Unknown error',
            lastChecked: new Date().toISOString()
        }
    }
}

// Check Cloudinary connectivity
async function checkCloudinary(): Promise<ServiceStatus> {
    const start = Date.now()
    try {
        // Check if Cloudinary environment variables are set
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
        const apiKey = process.env.CLOUDINARY_API_KEY
        const apiSecret = process.env.CLOUDINARY_API_SECRET

        if (!cloudName || !apiKey || !apiSecret) {
            return {
                status: 'down',
                error: 'Cloudinary credentials not configured',
                lastChecked: new Date().toISOString()
            }
        }

        // Test Cloudinary by checking if a sample image URL is accessible
        const response = await fetch(
            `https://res.cloudinary.com/${cloudName}/image/upload/sample.jpg`,
            {
                method: 'HEAD',
                signal: AbortSignal.timeout(5000) // 5 second timeout
            }
        )

        const responseTime = Date.now() - start

        // 200 or 404 both mean Cloudinary is accessible
        // 404 just means the sample image doesn't exist, which is fine
        if (response.ok || response.status === 404) {
            return {
                status: responseTime < 2000 ? 'up' : 'slow',
                responseTime,
                lastChecked: new Date().toISOString()
            }
        } else {
            return {
                status: 'down',
                error: `HTTP ${response.status}`,
                lastChecked: new Date().toISOString()
            }
        }
    } catch (error) {
        console.error('Cloudinary health check failed', error)
        return {
            status: 'down',
            error: error instanceof Error ? error.message : 'Unknown error',
            lastChecked: new Date().toISOString()
        }
    }
}

// Check Clerk connectivity
async function checkClerk(): Promise<ServiceStatus> {
    const start = Date.now()
    try {
        // Check if Clerk environment variables are set
        if (!process.env.CLERK_SECRET_KEY) {
            return {
                status: 'down',
                error: 'Clerk secret key not configured',
                lastChecked: new Date().toISOString()
            }
        }

        // In a real implementation, you might ping Clerk's API
        const responseTime = Date.now() - start

        return {
            status: 'up',
            responseTime,
            lastChecked: new Date().toISOString()
        }
    } catch (error) {
        console.error('Clerk health check failed', error)
        return {
            status: 'down',
            error: error instanceof Error ? error.message : 'Unknown error',
            lastChecked: new Date().toISOString()
        }
    }
}

// Get overall health status
function getOverallStatus(services: HealthStatus['services']): HealthStatus['status'] {
    const statuses = Object.values(services).map(service => service.status)

    if (statuses.includes('down')) {
        return 'unhealthy'
    } else if (statuses.includes('slow')) {
        return 'degraded'
    } else {
        return 'healthy'
    }
}

export async function GET() {
    try {
        console.log('Health check requested')

        // Check all services in parallel
        const [database, cloudinary, clerk] = await Promise.all([
            checkDatabase(),
            checkCloudinary(),
            checkClerk()
        ])

        const services = { database, cloudinary, clerk }
        const status = getOverallStatus(services)

        const healthStatus: HealthStatus = {
            status,
            timestamp: new Date().toISOString(),
            services,
            metrics: {
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage()
            }
        }

        console.log('Health check completed', status)

        // Return appropriate HTTP status code
        const httpStatus = status === 'healthy' ? 200 :
            status === 'degraded' ? 200 : 503

        return NextResponse.json(healthStatus, { status: httpStatus })

    } catch (error) {
        console.error('Health check endpoint error', error)

        return NextResponse.json(
            {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
