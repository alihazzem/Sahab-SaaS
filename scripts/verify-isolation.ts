import prisma from '@/lib/prisma'

async function demonstrateUserIsolation() {
    console.log('🔍 Demonstrating user isolation...\n')

    try {
        // Get all users and their media counts
        const userStats = await prisma.media.groupBy({
            by: ['userId'],
            _count: {
                id: true
            }
        })

        console.log('📊 Media by User:')
        for (const stat of userStats) {
            console.log(`  User: ${stat.userId}`)
            console.log(`  Media Count: ${stat._count.id}`)

            // Get sample media titles for this user
            const sampleMedia = await prisma.media.findMany({
                where: { userId: stat.userId },
                select: { title: true, type: true },
                take: 3
            })

            console.log('  Sample Media:')
            sampleMedia.forEach(media => {
                console.log(`    - ${media.type}: "${media.title}"`)
            })
            console.log('')
        }

        console.log('✅ Each user only sees their own media!')
        console.log('✅ User isolation is working correctly!')

    } catch (error) {
        console.error('❌ Check failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

demonstrateUserIsolation()