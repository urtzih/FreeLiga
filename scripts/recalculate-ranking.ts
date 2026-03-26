#!/usr/bin/env ts-node
/**
 * Script para recalcular el ranking de un grupo
 */

import { calculateGroupRankings } from '../apps/api/src/services/ranking.service.ts';
import { prisma } from '@freesquash/database/src/index.ts';

async function main() {
    try {
        const groupId = 'cmk3056vx007k3a0ukginzyl9';
        
        console.log(`📊 Recalculando ranking para el grupo: ${groupId}\n`);
        
        // Get group info
        const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: { season: true }
        });
        
        if (!group) {
            console.log('❌ Grupo no encontrado');
            process.exit(1);
        }
        
        console.log(`📌 Grupo: ${group.name} (Temporada: ${group.season.name})`);
        
        // Recalculate
        await calculateGroupRankings(groupId);
        
        console.log('✅ Ranking recalculado exitosamente\n');
        
        // Get and display new rankings
        const groupPlayers = await prisma.groupPlayer.findMany({
            where: { groupId },
            include: { player: true },
            orderBy: { rankingPosition: 'asc' }
        });
        
        console.log('🏆 Nueva Clasificación:\n');
        console.log('Pos | Jugador                      | Victorias | Derrotas | Avg');
        console.log('----+---------+------+---------+--+--+--+--------+---');
        
        for (const gp of groupPlayers) {
            const matches = await prisma.match.findMany({
                where: {
                    groupId,
                    matchStatus: 'PLAYED',
                    OR: [
                        { player1Id: gp.playerId },
                        { player2Id: gp.playerId }
                    ]
                }
            });
            
            const wins = matches.filter(m => m.winnerId === gp.playerId).length;
            const losses = matches.length - wins;
            
            let setsWon = 0, setsLost = 0;
            matches.forEach(m => {
                if (m.gamesP1 !== null && m.gamesP2 !== null) {
                    if (m.player1Id === gp.playerId) {
                        setsWon += m.gamesP1;
                        setsLost += m.gamesP2;
                    } else {
                        setsWon += m.gamesP2;
                        setsLost += m.gamesP1;
                    }
                }
            });
            
            const avg = setsWon - setsLost;
            console.log(`${gp.rankingPosition.toString().padStart(3)} | ${gp.player.name.padEnd(28)} | ${wins.toString().padStart(9)} | ${losses.toString().padStart(8)} | ${avg.toString().padStart(3)}`);
        }
        
        console.log('\n✨ Clasificación actualizada en la base de datos');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

main();
