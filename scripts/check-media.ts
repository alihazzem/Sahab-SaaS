import prisma from '@/lib/prisma'

async function checkDatabase() {
    console.log('🔍 Checking database for media records...')

    try {
        // Count total media records
        const totalMedia = await prisma.media.count()
        console.log(`📊 Total media records: ${totalMedia}`)

        // Get all media with user info
        const allMedia = await prisma.media.findMany({
            select: {
                id: true,
                userId: true,
                type: true,
                title: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10 // Limit to 10 recent records
        })

        console.log('📝 Recent media records:')
        allMedia.forEach((media, index) => {
            console.log(`  ${index + 1}. ${media.type} - "${media.title}" by user ${media.userId}`)
        })

        if (totalMedia === 0) {
            console.log('❌ No media records found. Try uploading a video first.')
        }

    } catch (error) {
        console.error('❌ Database check failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkDatabase()