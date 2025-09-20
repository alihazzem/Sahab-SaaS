/**
 * Fix storage units in UsageTracking table
 * 
 * Issue: Storage was being stored in bytes instead of MB
 * Solution: Convert all existing storage values from bytes to MB
 * 
 * Run with: npx tsx scripts/fix-storage-units.ts
 */

import prisma from '../src/lib/prisma'

async function fixStorageUnits() {
    console.log('🔍 Checking for usage records with incorrect storage units...')

    try {
        // Get all usage tracking records
        const allUsage = await prisma.usageTracking.findMany()

        console.log(`📊 Found ${allUsage.length} usage tracking records`)

        let fixedCount = 0

        for (const usage of allUsage) {
            // If storageUsed is very large (> 10GB = 10,000 MB), it's likely in bytes
            const suspiciouslyLarge = usage.storageUsed > 10000

            if (suspiciouslyLarge) {
                // Convert from bytes to MB
                const storageInMB = usage.storageUsed / (1024 * 1024)

                console.log(`🔧 Fixing record for user ${usage.userId}:`)
                console.log(`   Before: ${usage.storageUsed.toLocaleString()} (likely bytes)`)
                console.log(`   After:  ${storageInMB.toFixed(2)} MB`)

                await prisma.usageTracking.update({
                    where: { id: usage.id },
                    data: {
                        storageUsed: Math.round(storageInMB * 100) / 100 // Round to 2 decimal places
                    }
                })

                fixedCount++
            }
        }

        console.log(`✅ Fixed ${fixedCount} records with incorrect storage units`)
        console.log(`📝 ${allUsage.length - fixedCount} records were already correct`)

    } catch (error) {
        console.error('❌ Error fixing storage units:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Run the fix
fixStorageUnits().catch((error: Error) => {
    console.error('Script failed:', error)
    process.exit(1)
})