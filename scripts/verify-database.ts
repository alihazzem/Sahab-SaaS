import prisma from '@/lib/prisma'

async function verifyDatabase() {
    console.log('🔍 Verifying database setup...')

    try {
        // Check if plans exist
        const plans = await prisma.plan.findMany()
        console.log(`✅ Found ${plans.length} plans in database:`)

        plans.forEach(plan => {
            const priceEGP = plan.price / 100
            console.log(`   - ${plan.name}: ${priceEGP} EGP (${plan.storageLimit}MB storage, ${plan.maxUploadSize}MB upload limit)`)
        })

        // Test creating a sample usage tracking record
        const testUserId = 'test-user-123'
        const currentDate = new Date()
        const month = currentDate.getMonth() + 1
        const year = currentDate.getFullYear()

        const usageRecord = await prisma.usageTracking.upsert({
            where: {
                userId_month_year: {
                    userId: testUserId,
                    month: month,
                    year: year
                }
            },
            create: {
                userId: testUserId,
                month: month,
                year: year,
                storageUsed: 0,
                transformationsUsed: 0,
                uploadsCount: 0
            },
            update: {}
        })

        console.log('✅ Usage tracking model working correctly')

        // Clean up test data
        await prisma.usageTracking.delete({
            where: { id: usageRecord.id }
        })

        console.log('✅ All database operations successful!')
        console.log('🎉 Phase 1 verification complete - Ready for Phase 2!')

    } catch (error) {
        console.error('❌ Database verification failed:', error)
        throw error
    }
}

verifyDatabase()
    .catch((e) => {
        console.error('❌ Verification error:', e)
        process.exit(1)
    })