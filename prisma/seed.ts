import prisma from '@/lib/prisma'

async function main() {
    console.log('🌱 Starting seed...')

    // Create plans if they don't exist
    const plans = [
        {
            name: 'Free',
            price: 0, // 0 EGP
            currency: 'EGP',
            storageLimit: 500, // 500MB
            maxUploadSize: 5, // 5MB
            transformationsLimit: 50,
            teamMembers: 1,
            supportLevel: 'community',
        },
        {
            name: 'Pro',
            price: 19900, // 199 EGP in piastres
            currency: 'EGP',
            storageLimit: 10000, // 10GB
            maxUploadSize: 100, // 100MB
            transformationsLimit: 5000,
            teamMembers: 5,
            supportLevel: 'email',
        },
        {
            name: 'Enterprise',
            price: 99900, // 999 EGP in piastres
            currency: 'EGP',
            storageLimit: 100000, // 100GB
            maxUploadSize: 1000, // 1GB
            transformationsLimit: 50000,
            teamMembers: -1, // unlimited
            supportLevel: 'priority',
        },
    ]

    for (const planData of plans) {
        const plan = await prisma.plan.upsert({
            where: { name: planData.name },
            update: {
                price: planData.price,
                currency: planData.currency,
                storageLimit: planData.storageLimit,
                maxUploadSize: planData.maxUploadSize,
                transformationsLimit: planData.transformationsLimit,
                teamMembers: planData.teamMembers,
                supportLevel: planData.supportLevel,
            },
            create: planData,
        })

        console.log(`✅ Created/Updated plan: ${plan.name} (${plan.price} piastres)`)
    }

    console.log('🎉 Seeding completed!')
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e)
        process.exit(1)
    })