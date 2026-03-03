require('dotenv').config();
const path = require('path');
const { prisma } = require(path.join(__dirname, 'packages/database/dist/index.js'));
const { calculateGroupRankings } = require(path.join(__dirname, 'apps/api/dist/services/ranking.service.js'));

async function main() {
    try {
        console.log('\n🔄 RECALCULANDO TODOS LOS GRUPOS DE LA TEMPORADA ACTUAL\n');
        
        // Get active season
        const activeSeason = await prisma.season.findFirst({
            where: { isActive: true },
            include: { 
                groups: { 
                    include: { groupPlayers: { include: { player: true } } }
                }
            }
        });
        
        if (!activeSeason) {
            console.log('❌ No hay temporada activa');
            process.exit(1);
        }
        
        console.log(`📌 Temporada: ${activeSeason.name}`);
        console.log(`📊 Grupos: ${activeSeason.groups.length}\n`);
        
        // Recalculate each group
        for (const group of activeSeason.groups) {
            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`  Grupo: ${group.name.toUpperCase()} (${group.groupPlayers.length} jugadores)`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            
            // Recalculate
            await calculateGroupRankings(group.id);
            
            // Get updated rankings
            const updatedPlayers = await prisma.groupPlayer.findMany({
                where: { groupId: group.id },
                include: { player: true },
                orderBy: { rankingPosition: 'asc' }
            });
            
            // Get matches for statistics
            const matches = await prisma.match.findMany({
                where: { 
                    groupId: group.id,
                    matchStatus: 'PLAYED'
                }
            });
            
            // Display rankings
            console.log('\nPos | Jugador                      | V | D | Avg\n');
            
            for (const gp of updatedPlayers) {
                const playerMatches = matches.filter(m => 
                    m.player1Id === gp.playerId || m.player2Id === gp.playerId
                );
                
                const wins = playerMatches.filter(m => m.winnerId === gp.playerId).length;
                const losses = playerMatches.length - wins;
                
                let setsWon = 0, setsLost = 0;
                playerMatches.forEach(m => {
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
                const pos = gp.rankingPosition.toString().padStart(3);
                const name = gp.player.name.padEnd(28);
                const v = wins.toString().padStart(2);
                const d = losses.toString().padStart(2);
                const promedio = avg.toString().padStart(4);
                
                // Highlight promotions/relegations
                const isPromotion = gp.rankingPosition <= 2;
                const isRelegation = gp.rankingPosition > updatedPlayers.length - 2;
                
                let icon = '  ';
                if (isPromotion) icon = '⬆️ ';
                else if (isRelegation) icon = '⬇️ ';
                
                console.log(`${pos} | ${name} | ${v} | ${d} | ${promedio} ${icon}`);
            }
        }
        
        console.log('\n\n✅ Todos los grupos han sido recalculados exitosamente\n');
        
        // Summary
        console.log('📊 RESUMEN DE DESEMPATES APLICADOS:\n');
        console.log('✓ Victorias (criterio primario)');
        console.log('✓ Enfrentamientos directos (head-to-head)');
        console.log('✓ Average en mini-liga (para 3+ empatados)');
        console.log('✓ Average global (criterio secundario)');
        console.log('✓ Orden alfabético (desempate final)\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

main();
