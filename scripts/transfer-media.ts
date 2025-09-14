import prisma from '@/lib/prisma'

async function transferMedia() {
    const oldUserId = "user_32JKZk7hp6iFv4Ylz6ym3pPmLR6"
    const newUserId = "user_32hyt038lGK5bzAMagEmCbLpXZS"

    console.log('🔄 Transferring media ownership...')
    console.log(`From: ${oldUserId}`)
    console.log(`To: ${newUserId}`)

    try {
        // Update all media records
        const result = await prisma.media.updateMany({
            where: { userId: oldUserId },
            data: { userId: newUserId }
        })

        console.log(`✅ Successfully transferred ${result.count} media records`)

        // Also update any subscription records if they exist
        const subResult = await prisma.subscription.updateMany({
            where: { userId: oldUserId },
            data: { userId: newUserId }
        })

        console.log(`✅ Transferred ${subResult.count} subscription records`)

        // Update usage tracking
        const usageResult = await prisma.usageTracking.updateMany({
            where: { userId: oldUserId },
            data: { userId: newUserId }
        })

        console.log(`✅ Transferred ${usageResult.count} usage tracking records`)

        console.log('\n🎉 Transfer complete! Your media should now appear in the dashboard.')

    } catch (error) {
        console.error('❌ Transfer failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

transferMedia()