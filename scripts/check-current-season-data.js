require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCurrentSeasonData() {
    try {
        console.log('\n🔍 VERIFICANDO DATOS DE LA TEMPORADA ACTUAL\n');
        console.log('═'.repeat(60));

        // 1. Obtener temporada activa
        const activeSeason = await prisma.season.findFirst({
            where: { isActive: true },
            orderBy: { startDate: 'desc' }
        });

        if (!activeSeason) {
            console.log('❌ No hay temporada activa');
            return;
        }

        console.log(`\n✅ Temporada Activa: ${activeSeason.name}`);
        console.log(`   ID: ${activeSeason.id}`);
        console.log(`   Inicio: ${activeSeason.startDate.toISOString().split('T')[0]}`);
        console.log(`   Fin: ${activeSeason.endDate.toISOString().split('T')[0]}`);

        // 2. Obtener grupos de esta temporada
        const groups = await prisma.group.findMany({
            where: { seasonId: activeSeason.id },
            include: {
                groupPlayers: {
                    include: {
                        player: true
                    }
                },
                matches: {
                    where: {
                        matchStatus: 'PLAYED',
                        gamesP1: { not: null },
                        gamesP2: { not: null }
                    }
                },
                _count: {
                    select: {
                        matches: true,
                        groupPlayers: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        console.log(`\n📊 Total de grupos en temporada activa: ${groups.length}`);
        console.log('─'.repeat(60));

        for (const group of groups) {
            const playedMatches = group.matches.filter(m => 
                m.matchStatus === 'PLAYED' && m.gamesP1 !== null && m.gamesP2 !== null
            );
            const totalPossibleMatches = (group.groupPlayers.length * (group.groupPlayers.length - 1)) / 2;
            
            console.log(`\n🏆 ${group.name} (ID: ${group.id.substring(0, 15)}...)`);
            console.log(`   Jugadores: ${group.groupPlayers.length}`);
            console.log(`   Partidos posibles: ${totalPossibleMatches}`);
            console.log(`   Partidos jugados: ${playedMatches.length}`);
            console.log(`   Partidos totales en BD: ${group._count.matches}`);
            
            if (playedMatches.length > 0) {
                console.log('   ⚠️  HAY PARTIDOS JUGADOS:');
                playedMatches.slice(0, 3).forEach(m => {
                    console.log(`      • ${m.date.toISOString().split('T')[0]}: ${m.gamesP1}-${m.gamesP2}`);
                });
                if (playedMatches.length > 3) {
                    console.log(`      ... y ${playedMatches.length - 3} más`);
                }
            } else {
                console.log('   ✅ No hay partidos jugados');
            }

            // Mostrar jugadores
            console.log('   Jugadores:');
            group.groupPlayers.slice(0, 3).forEach((gp, idx) => {
                console.log(`      ${idx + 1}. ${gp.player.name}`);
            });
            if (group.groupPlayers.length > 3) {
                console.log(`      ... y ${group.groupPlayers.length - 3} más`);
            }
        }

        // 3. Verificar si hay partidos en grupos de temporadas ANTERIORES
        console.log('\n═'.repeat(60));
        console.log('\n🕐 VERIFICANDO TEMPORADAS ANTERIORES\n');

        const previousSeasons = await prisma.season.findMany({
            where: { 
                isActive: false,
                id: { not: activeSeason.id }
            },
            orderBy: { startDate: 'desc' },
            take: 2,
            include: {
                groups: {
                    include: {
                        matches: {
                            where: {
                                matchStatus: 'PLAYED',
                                gamesP1: { not: null },
                                gamesP2: { not: null }
                            }
                        },
                        _count: {
                            select: {
                                matches: true,
                                groupPlayers: true
                            }
                        }
                    }
                }
            }
        });

        for (const season of previousSeasons) {
            console.log(`\n📅 ${season.name}:`);
            const totalMatches = season.groups.reduce((sum, g) => sum + g.matches.length, 0);
            console.log(`   Grupos: ${season.groups.length}`);
            console.log(`   Partidos jugados en total: ${totalMatches}`);
            
            season.groups.forEach(g => {
                if (g.matches.length > 0) {
                    console.log(`      • ${g.name}: ${g.matches.length} partidos`);
                }
            });
        }

        console.log('\n═'.repeat(60));
        console.log('\n✅ Verificación completada\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCurrentSeasonData();
