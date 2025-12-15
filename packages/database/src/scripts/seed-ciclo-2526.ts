import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const grupos = [
    {
        nombre: 'Grupo 1',
        jugadores: [
            'Oier Quesada',
            'Santi Tobias',
            'Jon Toña',
            'Aitor García',
            'David Gancedo',
            'Bikendi Otálora',
            'Itzel Reguero',
            'Iñigo Alonso'
        ]
    },
    {
        nombre: 'Grupo 2',
        jugadores: [
            'Cesar Berganzo',
            'Eneko Izquierdo',
            'Javier Pacheco',
            'Alexander Egido',
            'Javier Guinea',
            'Eneko Uriarte',
            'Gari Suárez',
            'Pedro A. García'
        ]
    },
    {
        nombre: 'Grupo 3',
        jugadores: [
            'Javier Crespo',
            'Ruben García',
            'Enrique Oquiñena',
            'Vicente Avila',
            'Héctor Velasco',
            'Jon Barrena',
            'Sergio Barquín',
            'Asier Renobales'
        ]
    },
    {
        nombre: 'Grupo 4',
        jugadores: [
            'Luis M. Rodríguez',
            'Sergio Basconcillos',
            'Iker Estibariz',
            'Iñigo Ullibarri',
            'Aritz Ruiz de Azua',
            'Yeray Olgado',
            'Alberto García S.m',
            'Javier Uribe',
            'Urtzi Diaz'
        ]
    },
    {
        nombre: 'Grupo 5',
        jugadores: [
            'Antonio Perez',
            'Fernando Alonso',
            'Miguel Ricarte',
            'Javier Fuente',
            'Víctor Cirre',
            'Ander Leyún',
            'Aratz Mugica',
            'Patxi Minguez',
            'Jon Ander Calleja'
        ]
    },
    {
        nombre: 'Grupo 6',
        jugadores: [
            'Alberto García Alvaro',
            'Mikel Fernandez',
            'Gorka Ramirez',
            'José Andrés Gil',
            'Axier Plaza',
            'Asier Etxenike',
            'Enekoitz Arregi',
            'Ricardo Alvarez',
            'Jon Ander Errasti'
        ]
    },
    {
        nombre: 'Grupo 7',
        jugadores: [
            'Felix Martín',
            'Íñigo Hernández',
            'Roberto Mediavilla',
            'Aitor de la Fuente',
            'Chesco Angulo',
            'Ahmad F. Hamam',
            'Josu Jauregui',
            'Asier Usunaga'
        ]
    },
    {
        nombre: 'Grupo 8',
        jugadores: [
            'David Arias',
            'Cristian Chaves',
            'Aitor Alonso',
            'Markel Santamaría',
            'Damián Escobero',
            'Julen Arejolaleiba',
            'Jon Narváez',
            'Iñigo Viana',
            'Guillermo Fortan',
            'Juan Lopez',
            'Enrique Estibariz',
            'Asier Barrieta',
            'Simon García',
            'Iñaki Hualde',
            'Xabi Fndz. De Gaceo'
        ]
    }
];

async function seed() {
    console.log('🌱 Iniciando seed de temporada y grupos...');

    try {
        // Crear temporada actual (25 Nov 2025 - 26 Ene 2026)
        console.log('\n📅 Creando temporada Ciclo 25-26/11-12...');
        const season = await prisma.season.create({
            data: {
                name: 'Ciclo 25-26/11-12',
                startDate: new Date('2025-11-25'),
                endDate: new Date('2026-01-26'),
            },
        });
        console.log(`✅ Temporada creada: ${season.name} (${season.id})`);

        // Obtener todos los jugadores existentes
        const allPlayers = await prisma.player.findMany({
            select: {
                id: true,
                name: true,
            },
        });
        console.log(`\n👥 Total de jugadores en base de datos: ${allPlayers.length}`);

        // Crear un map de nombre -> id para búsqueda rápida
        const playerMap = new Map<string, string>();
        allPlayers.forEach((player: { id: string; name: string }) => {
            playerMap.set(player.name.toLowerCase().trim(), player.id);
        });

        // Crear grupos y asignar jugadores
        for (const grupoData of grupos) {
            console.log(`\n🔵 Creando ${grupoData.nombre}...`);
            
            const group = await prisma.group.create({
                data: {
                    name: grupoData.nombre,
                    seasonId: season.id,
                },
            });
            console.log(`  ✓ Grupo creado con ID: ${group.id}`);

            let asignados = 0;
            let noEncontrados: string[] = [];

            // Asignar jugadores al grupo
            for (const nombreJugador of grupoData.jugadores) {
                const nombreLimpio = nombreJugador.toLowerCase().trim();
                const playerId = playerMap.get(nombreLimpio);

                if (playerId) {
                    // Asignar jugador al grupo
                    await prisma.groupPlayer.create({
                        data: {
                            groupId: group.id,
                            playerId: playerId,
                            rankingPosition: 0, // Se actualizará después con el ranking
                        },
                    });

                    // Actualizar el grupo actual del jugador
                    await prisma.player.update({
                        where: { id: playerId },
                        data: { currentGroupId: group.id },
                    });

                    asignados++;
                } else {
                    noEncontrados.push(nombreJugador);
                }
            }

            console.log(`  ✓ Jugadores asignados: ${asignados}/${grupoData.jugadores.length}`);
            
            if (noEncontrados.length > 0) {
                console.log(`  ⚠️  Jugadores NO encontrados en BD:`);
                noEncontrados.forEach(nombre => {
                    console.log(`     - ${nombre}`);
                });
            }
        }

        console.log('\n✅ Seed completado con éxito!');
        console.log(`\n📊 Resumen:`);
        console.log(`   - Temporada: ${season.name}`);
        console.log(`   - Grupos creados: ${grupos.length}`);
        console.log(`   - Total jugadores a asignar: ${grupos.reduce((sum, g) => sum + g.jugadores.length, 0)}`);

        // Mostrar resumen de grupos creados
        const groupsCreated = await prisma.group.findMany({
            where: { seasonId: season.id },
            include: {
                _count: {
                    select: { groupPlayers: true }
                }
            }
        });

        console.log('\n📋 Grupos creados:');
        groupsCreated.forEach((group: any) => {
            console.log(`   ${group.name}: ${group._count.groupPlayers} jugadores`);
        });

    } catch (error) {
        console.error('❌ Error durante el seed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seed()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
