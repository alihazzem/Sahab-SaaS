import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = global as unknown as {
    prisma: PrismaClient
}

// Strip quotes from environment variables if they exist
const cleanEnvVar = (value: string | undefined): string | undefined => {
    if (!value) return value
    // Remove surrounding quotes if present
    return value.replace(/^["']|["']$/g, '')
}

// Clean the DATABASE_URL if it has quotes
if (process.env.DATABASE_URL) {
    const cleaned = cleanEnvVar(process.env.DATABASE_URL)
    if (cleaned !== process.env.DATABASE_URL) {
        console.log('⚠️  Removed quotes from DATABASE_URL')
        process.env.DATABASE_URL = cleaned
    }
}

if (process.env.DIRECT_URL) {
    const cleaned = cleanEnvVar(process.env.DIRECT_URL)
    if (cleaned !== process.env.DIRECT_URL) {
        console.log('⚠️  Removed quotes from DIRECT_URL')
        process.env.DIRECT_URL = cleaned
    }
}

// Add helpful error logging
if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in environment variables!')
}

// Log database connection info (without exposing password)
if (process.env.DATABASE_URL) {
    const dbUrlWithoutPassword = process.env.DATABASE_URL.replace(/:([^:@]{8})[^:@]+@/, ':****@')
    console.log('🔗 Database URL format:', dbUrlWithoutPassword)
    console.log('🔗 DIRECT_URL present:', !!process.env.DIRECT_URL)

    // Validate URL format
    const url = process.env.DATABASE_URL
    const startsCorrectly = url.startsWith('postgres://') || url.startsWith('postgresql://')
    
    console.log('🔍 URL starts with postgres(ql)://?', startsCorrectly)
    console.log('🔍 First 15 chars:', url.substring(0, 15))
    
    if (!startsCorrectly) {
        console.error('❌ DATABASE_URL must start with postgres:// or postgresql://')
        console.error('   First 20 chars:', JSON.stringify(url.substring(0, 20)))
    } else {
        console.log('✅ Database URL format is correct')
    }
}

const prisma = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}

export default prisma