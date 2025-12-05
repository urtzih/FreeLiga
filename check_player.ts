import { prisma } from '@freesquash/database';

async function checkPlayerAndSeason() {
    try {
        // Buscar la temporada 2025-Nov-Dic
        const season = await prisma.season.findFirst({
            where: {
                name: {
                    contains: '2025'
                }
            },
            include: {
                groups: {
                    include: {
                        groupPlayers: {
                            include: {
                                player: {
                                    include: {
                                        user: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        console.log('\n=== TEMPORADA ===');
        if (season) {
            console.log(`Nombre: ${season.name}`);
            console.log(`Activa: ${season.isActive}`);
            console.log(`Inicio: ${season.startDate}`);
            console.log(`Fin: ${season.endDate}`);
        } else {
            console.log('No se encontró la temporada');
            return;
        }

        // Buscar el jugador
        const user = await prisma.user.findFirst({
            where: {
                email: 'jon.toña.example@freesquash.com'
            },
            include: {
                player: {
                    include: {
                        groupPlayers: {
                            include: {
                                group: {
                                    include: {
                                        season: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        console.log('\n=== JUGADOR ===');
        if (user?.player) {
            console.log(`Nombre: ${user.player.name}`);
            console.log(`Email: ${user.email}`);
            console.log(`Grupos: ${user.player.groupPlayers.length}`);
            
            console.log('\nGrupos por temporada:');
            for (const gp of user.player.groupPlayers) {
                console.log(`  - ${gp.group.name} (${gp.group.season.name})`);
                console.log(`    Temporada activa: ${gp.group.season.isActive}`);
            }

            // Grupo actual (temporada activa)
            const currentGroupPlayer = user.player.groupPlayers.find(gp => gp.group.season.isActive);
            console.log(`\nGrupo actual (temporada activa): ${currentGroupPlayer ? currentGroupPlayer.group.name : 'NINGUNO'}`);
        } else {
            console.log('Jugador no encontrado');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPlayerAndSeason();
