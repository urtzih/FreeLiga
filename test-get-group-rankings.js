require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Copiar la lógica de getGroupRankings para testear
async function testGetGroupRankings(groupId) {
    try {
        const [groupPlayers, matches] = await Promise.all([
            prisma.groupPlayer.findMany({
                where: {
                    groupId,
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
                    groupId,
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

        console.log(`\n📊 Grupo ID: ${groupId}`);
        console.log(`   Jugadores encontrados: ${groupPlayers.length}`);
        console.log(`   Partidos PLAYED encontrados: ${matches.length}`);

        if (matches.length > 0) {
            console.log('\n   ⚠️  PARTIDOS ENCONTRADOS:');
            matches.forEach((m, idx) => {
                console.log(`      ${idx + 1}. ${m.player1.name} vs ${m.player2.name}: ${m.gamesP1}-${m.gamesP2} (${m.date.toISOString().split('T')[0]})`);
            });
        }

        // Calcular estadísticas por jugador
        const playerStats = groupPlayers.map(gp => {
            const playerId = gp.playerId;
            const playerMatches = matches.filter(m => m.player1Id === playerId || m.player2Id === playerId);
            const matchesWon = playerMatches.filter(m => m.winnerId === playerId).length;
            const matchesLost = playerMatches.filter(m => m.winnerId && m.winnerId !== playerId).length;
            
            return {
                name: gp.player.name,
                played: playerMatches.length,
                won: matchesWon,
                lost: matchesLost
            };
        });

        console.log('\n   👥 Estadísticas de jugadores:');
        playerStats.forEach((stat, idx) => {
            if (stat.played > 0) {
                console.log(`      ${idx + 1}. ${stat.name}: ${stat.won}V/${stat.lost}D de ${stat.played} partidos`);
            }
        });

        return { groupPlayers, matches, playerStats };

    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

async function main() {
    try {
        console.log('\n🔍 VERIFICANDO FUNCIÓN getGroupRankings\n');
        console.log('═'.repeat(60));

        // Obtener temporada activa
        const activeSeason = await prisma.season.findFirst({
            where: { isActive: true },
            orderBy: { startDate: 'desc' },
            include: {
                groups: {
                    include: {
                        groupPlayers: true
                    },
                    take: 3
                }
            }
        });

        console.log(`\n✅ Temporada Activa: ${activeSeason.name}`);
        console.log(`   Grupos en temporada: ${activeSeason.groups.length}`);

        // Probar con el primer grupo
        if (activeSeason.groups.length > 0) {
            const firstGroup = activeSeason.groups[0];
            console.log(`\n🎯 Testeando con: ${firstGroup.name}`);
            console.log('─'.repeat(60));

            await testGetGroupRankings(firstGroup.id);
        }

        // Ahora probar con un grupo de la temporada ANTERIOR para ver la diferencia
        console.log('\n═'.repeat(60));
        console.log('\n🕐 COMPARANDO CON TEMPORADA ANTERIOR\n');

        const previousSeason = await prisma.season.findFirst({
            where: { 
                isActive: false 
            },
            orderBy: { startDate: 'desc' },
            include: {
                groups: {
                    include: {
                        groupPlayers: true
                    },
                    take: 1
                }
            }
        });

        if (previousSeason && previousSeason.groups.length > 0) {
            console.log(`\n📅 Temporada Anterior: ${previousSeason.name}`);
            const oldGroup = previousSeason.groups[0];
            console.log(`   Testeando con: ${oldGroup.name}`);
            console.log('─'.repeat(60));

            await testGetGroupRankings(oldGroup.id);
        }

        console.log('\n═'.repeat(60));
        console.log('\n✅ Verificación completada\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
