require('dotenv').config();
const path = require('path');
const { prisma } = require(path.join(__dirname, '..', 'packages/database/dist/index.js'));
const { calculateGroupRankings } = require(path.join(__dirname, '..', 'apps/api/dist/services/ranking.service.js'));

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
        
        console.log(`📌 Grupo: ${group.name} (Temporada: ${group.season.name})\n`);
        
        // Recalculate
        console.log('Procesando ecuáculo de desempates...');
        await calculateGroupRankings(groupId);
        
        console.log('✅ Ranking recalculado exitosamente\n');
        
        // Get and display new rankings with statistics
        const groupPlayers = await prisma.groupPlayer.findMany({
            where: { groupId },
            include: { player: true },
            orderBy: { rankingPosition: 'asc' }
        });
        
        console.log('🏆 Nueva Clasificación:\n');
        console.log('Pos | Jugador                      | Victorias | Derrotas | Avg');
        console.log('----+------------------------------+-----------+----------+------');
        
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
            const pos = gp.rankingPosition.toString().padStart(3);
            const name = gp.player.name.padEnd(28);
            const victorias = wins.toString().padStart(9);
            const derrotas = losses.toString().padStart(8);
            const promedio = avg.toString().padStart(4);
            
            console.log(`${pos} | ${name} | ${victorias} | ${derrotas} | ${promedio}`);
        }
        
        console.log('\n✨ Clasificación actualizada correctamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

main();
