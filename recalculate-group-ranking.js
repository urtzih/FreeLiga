#!/usr/bin/env node
/**
 * Script para recalcular el ranking de un grupo
 * Uso: node recalculate-group-ranking.js <groupId>
 */

const groupId = process.argv[2] || 'cmk3056vx007k3a0ukginzyl9';

async function main() {
    try {
        // Import Prisma and ranking service
        const { prisma } = require('./packages/database/dist/index.js');
        const { calculateGroupRankings } = require('./apps/api/dist/services/ranking.service.js');
        
        console.log(`📊 Recalculando ranking para el grupo: ${groupId}`);
        
        await calculateGroupRankings(groupId);
        
        console.log('✅ Ranking recalculado exitosamente');
        
        // Get and display the new rankings
        const groupPlayers = await prisma.groupPlayer.findMany({
            where: { groupId },
            include: { player: true },
            orderBy: { rankingPosition: 'asc' }
        });
        
        console.log('\n🏆 Nueva Clasificación:\n');
        groupPlayers.forEach((gp, idx) => {
            console.log(`${idx + 1}. ${gp.player.name} (Posición: ${gp.rankingPosition})`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
