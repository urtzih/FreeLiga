#!/usr/bin/env node

/**
 * Migration script: Enable push notifications for all existing users
 * 
 * This script sets pushNotificationsEnabled to true for all users
 * who don't already have it set.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function enablePushNotifications() {
  try {
    console.log('🔄 Starting migration: Enabling push notifications for all users...\n');

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        pushNotificationsEnabled: true,
      }
    });
    console.log(`📊 Found ${users.length} users total\n`);

    let updated = 0;
    let skipped = 0;
    const errors = [];

    // Process each user
    for (const user of users) {
      try {
        // Check if already enabled
        if (user.pushNotificationsEnabled === true) {
          skipped++;
          continue;
        }

        // Enable push notifications
        await prisma.user.update({
          where: { id: user.id },
          data: { pushNotificationsEnabled: true }
        });

        updated++;
        console.log(`✅ Enabled for: ${user.email}`);
      } catch (error) {
        errors.push({ userId: user.id, email: user.email, error: error.message });
        console.error(`❌ Error updating user ${user.id} (${user.email}):`, error.message);
      }
    }

    // Print summary
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Updated: ${updated} users`);
    console.log(`   ⏭️  Skipped: ${skipped} users (already enabled)`);
    console.log(`   ❌ Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(err => {
        console.log(`   - ${err.email} (${err.userId}): ${err.error}`);
      });
    }

    console.log('\n✅ Migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
enablePushNotifications()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
