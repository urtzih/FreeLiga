require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simular la función getGroupRankings
async function testApiLogic() {
    try {
        console.log('\n🔍 SIMULANDO RESPUESTA DEL API\n');
        console.log('═'.repeat(60));

        // 1. Obtener temporada activa
        const activeSeason = await prisma.season.findFirst({
            where: { isActive: true },
            orderBy: { startDate: 'desc' },
        });

        if (!activeSeason) {
            console.log('❌ No hay temporada activa');
            return;
        }

        console.log(`\n✅ Temporada Activa: ${activeSeason.name}`);
        console.log(`   ID: ${activeSeason.id}`);

        // 2. Obtener grupos con sus datos
        const groups = await prisma.group.findMany({
            where: { seasonId: activeSeason.id },
            include: {
                groupPlayers: {
                    include: {
                        player: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: {
                        rankingPosition: 'asc',
                    },
                },
                matches: {
                    where: {
                        matchStatus: 'PLAYED',
                        gamesP1: { not: null },
                        gamesP2: { not: null },
                    },
                    include: {
                        player1: true,
                        player2: true,
                        winner: true,
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
            take: 3 // Solo los primeros 3 grupos para la prueba
        });

        console.log(`\n📊 Grupos encontrados: ${groups.length}`);
        console.log('─'.repeat(60));

        // 3. Por cada grupo, simular getGroupRankings
        for (const group of groups) {
            console.log(`\n🏆 ${group.name}`);
            console.log(`   Jugadores: ${group.groupPlayers.length}`);
            console.log(`   Partidos PLAYED en BD: ${group.matches.length}`);

            // Simular getGroupRankings para este grupo
            const [groupPlayers, matches] = await Promise.all([
                prisma.groupPlayer.findMany({
                    where: {
                        groupId: group.id,
                        player: {
                            user: {
                                isActive: true,
                            },
                        },
                    },
                    include: { player: true },
                }),
                prisma.match.findMany({
                    where: {
                        groupId: group.id,
                        matchStatus: 'PLAYED',
                        player1: {
                            user: {
                                isActive: true,
                            },
                        },
                        player2: {
                            user: {
                                isActive: true,
                            },
                        },
                    },
                    include: { player1: true, player2: true },
                })
            ]);

            console.log(`   ✓ GroupPlayers con user activo: ${groupPlayers.length}`);
            console.log(`   ✓ Matches PLAYED con players activos: ${matches.length}`);

            // Calcular rankings
            const rankings = groupPlayers.map((gp, index) => {
                const playerId = gp.playerId;
                const playerMatches = matches.filter(m => m.player1Id === playerId || m.player2Id === playerId);
                const matchesWon = playerMatches.filter(m => m.winnerId === playerId).length;
                const totalMatches = playerMatches.length;
                const winPercentage = totalMatches > 0 ? (matchesWon / totalMatches) * 100 : 0;

                return {
                    id: playerId,
                    name: gp.player.name,
                    played: totalMatches,
                    won: matchesWon,
                    lost: totalMatches - matchesWon,
                    winPercentage: Number(winPercentage.toFixed(2)),
                    points: index + 1,
                };
            });

            console.log('\n   📊 Rankings calculados (Top 3):');
            rankings.slice(0, 3).forEach((r, idx) => {
                console.log(`      ${idx + 1}. ${r.name}: ${r.won}V/${r.lost}D (${r.played} partidos, ${r.winPercentage}%)`);
            });

            if (rankings.some(r => r.played > 0)) {
                console.log('\n   ⚠️  ALERTA: Este grupo tiene jugadores con partidos jugados');
            } else {
                console.log('\n   ✅ Este grupo NO tiene partidos jugados (correcto)');
            }
        }

        console.log('\n═'.repeat(60));

        // 4. Verificar si hay matches en grupos de temporada activa que no deberían estar
        const invalidMatches = await prisma.match.findMany({
            where: {
                matchStatus: 'PLAYED',
                gamesP1: { not: null },
                gamesP2: { not: null },
                group: {
                    seasonId: activeSeason.id
                }
            },
            include: {
                group: true,
                player1: true,
                player2: true
            },
            take: 10
        });

        if (invalidMatches.length > 0) {
            console.log('\n⚠️  PARTIDOS JUGADOS EN LA TEMPORADA ACTUAL:');
            console.log('─'.repeat(60));
            invalidMatches.forEach(m => {
                console.log(`\n   • ${m.group.name}`);
                console.log(`     ${m.player1.name} vs ${m.player2.name}`);
                console.log(`     Resultado: ${m.gamesP1}-${m.gamesP2}`);
                console.log(`     Fecha: ${m.date.toISOString().split('T')[0]}`);
            });
        } else {
            console.log('\n✅ NO hay partidos jugados en la temporada actual (correcto)\n');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testApiLogic();
