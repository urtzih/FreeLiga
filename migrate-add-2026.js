#!/usr/bin/env node

/**
 * Migration script: Add 2026 to all players' annual fees
 * 
 * This script adds year 2026 to all existing players who don't already have it.
 * Handles null values and ensures proper JSON array formatting.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateAnnualFees() {
  try {
    console.log('🔄 Starting migration: Adding 2026 to all players...\n');

    // Get all players
    const players = await prisma.player.findMany();
    console.log(`📊 Found ${players.length} players total\n`);

    let updated = 0;
    let skipped = 0;
    const errors = [];

    // Process each player
    for (const player of players) {
      try {
        let fees = [];
        
        // Parse existing fees
        if (player.annualFeesPaid) {
          try {
            fees = JSON.parse(player.annualFeesPaid);
            if (!Array.isArray(fees)) {
              fees = [];
            }
          } catch (e) {
            console.warn(`⚠️  Invalid JSON for player ${player.id} (${player.name}): ${player.annualFeesPaid}`);
            fees = [];
          }
        }

        // Check if 2026 is already present
        if (fees.includes(2026)) {
          skipped++;
          continue;
        }

        // Add 2026 and sort
        fees.push(2026);
        fees = fees.sort((a, b) => a - b);

        // Update player
        await prisma.player.update({
          where: { id: player.id },
          data: { 
            annualFeesPaid: JSON.stringify(fees)
          },
        });

        updated++;
        console.log(`✅ Updated: ${player.name} - Fees: [${fees.join(', ')}]`);
      } catch (error) {
        errors.push({
          playerId: player.id,
          playerName: player.name,
          error: error.message
        });
        console.error(`❌ Error updating ${player.name}: ${error.message}`);
      }
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped (already have 2026): ${skipped}`);
    console.log(`   ❌ Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log(`\n⚠️  Error Details:`);
      errors.forEach(e => {
        console.log(`   - ${e.playerName}: ${e.error}`);
      });
    }

    console.log(`\n✨ Migration completed!\n`);

    // Show sample of updated players
    console.log('📋 Sample of updated players:');
    const samples = await prisma.player.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        annualFeesPaid: true,
      }
    });

    samples.forEach(p => {
      const fees = p.annualFeesPaid ? JSON.parse(p.annualFeesPaid) : [];
      console.log(`   - ${p.name}: [${fees.join(', ')}]`);
    });

  } catch (error) {
    console.error('💥 Fatal error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateAnnualFees();
