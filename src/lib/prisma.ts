import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = global as unknown as {
    prisma: PrismaClient
}

// Add helpful error logging
if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in environment variables!')
}

// Log database connection info (without exposing password)
if (process.env.DATABASE_URL) {
    const dbUrlWithoutPassword = process.env.DATABASE_URL.replace(/:([^:@]{8})[^:@]+@/, ':****@')
    console.log('🔗 Database URL format:', dbUrlWithoutPassword)

    // Validate URL format
    if (!process.env.DATABASE_URL.startsWith('postgres://') &&
        !process.env.DATABASE_URL.startsWith('postgresql://')) {
        console.error('❌ DATABASE_URL must start with postgres:// or postgresql://')
        console.error('   Current format:', process.env.DATABASE_URL.split(':')[0] + '://')
    }
}

const prisma = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}

export default prisma