#!/usr/bin/env node

/**
 * Production Admin Setup Script
 * 
 * This script creates the first admin user in production.
 * Run with: node scripts/create-admin.js <email>
 * 
 * Example: node scripts/create-admin.js admin@yourcompany.com
 */

const { PrismaClient } = require('../src/generated/prisma');

async function createAdmin() {
    const email = process.argv[2];

    if (!email) {
        console.error('❌ Error: Please provide an email address');
        console.log('Usage: node scripts/create-admin.js <email>');
        console.log('Example: node scripts/create-admin.js admin@yourcompany.com');
        process.exit(1);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.error('❌ Error: Invalid email format');
        process.exit(1);
    }

    const prisma = new PrismaClient();

    try {
        console.log('🔍 Setting up admin user...');

        // Note: In production, you'll need to get the userId from Clerk
        // This script assumes the user has already signed up in Clerk
        console.log('📧 Email:', email);
        console.log('⚠️  Note: The user with this email must have already signed up in your app');
        console.log('⚠️  You will need to manually get their Clerk userId and update this script');

        // For now, this script just shows the process
        // In a real production setup, you would:
        // 1. Query Clerk API to find the user by email
        // 2. Get their userId
        // 3. Insert into the admin table

        console.log('\n🔧 Manual Steps Required:');
        console.log('1. Find the user in your Clerk dashboard');
        console.log('2. Copy their User ID');
        console.log('3. Run this SQL query in your database:');
        console.log(`   INSERT INTO "Admin" (id, "userId", email, role, "createdAt", "updatedAt") VALUES`);
        console.log(`   (gen_random_uuid(), 'USER_ID_FROM_CLERK', '${email}', 'ADMIN', NOW(), NOW());`);
        console.log('\n✅ Replace USER_ID_FROM_CLERK with the actual Clerk User ID');

    } catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();