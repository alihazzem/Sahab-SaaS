import prisma from '@/lib/prisma'

async function checkUserIds() {
    console.log('🔍 Checking userId formats...')

    try {
        // Get unique userIds from media
        const users = await prisma.media.findMany({
            select: {
                userId: true,
            },
            distinct: ['userId']
        })

        console.log('📝 UserIds in database:')
        users.forEach((user, index) => {
            console.log(`  ${index + 1}. "${user.userId}" (length: ${user.userId.length})`)
        })

        console.log('\n💡 If your Clerk userId doesn\'t match these exactly, that\'s the problem!')
        console.log('💡 You can check your Clerk userId by logging in and checking the API response debug info.')

    } catch (error) {
        console.error('❌ UserID check failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkUserIds()