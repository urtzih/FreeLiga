import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Lista correcta de nombres y grupos
const rawData = `
Grupo 1 Taldea
1	Oier Quesada
1	Santi Tobias
1	Jon Toña
1	Aitor García
1	David Gancedo
1	Bikendi Otálora
1	Itzel Reguero
1	Iñigo Alonso
Grupo 2 Taldea
2	Cesar Berganzo
2	Eneko Izquierdo
2	Javier Pacheco
2	Alexander Egido
2	Javier Guinea
2	Eneko Uriarte
2	Gari Suárez 
2	Pedro A. García
Grupo 3 Taldea
3	Javier Crespo
3	Ruben García
3	Enrique Oquiñena
3	Vicente Avila
3	Héctor Velasco
3	Jon Barrena
3	Sergio Barquín
3	Asier Renobales
Grupo 4 Taldea
4	Luis M. Rodríguez
4	Sergio Basconcillos
4	Iker Estibariz
4	Iñigo Ullibarri
4	Aritz Ruiz de Azua
4	Yeray Olgado
4	Alberto García S.m
4	Javier Uribe
4	Urtzi Diaz
Grupo 5 Taldea
5	Antonio Perez
5	Fernando Alonso
5	Miguel Ricarte
5	Javier Fuente
5	Víctor Cirre
5	Ander Leyún
5	Aratz Mugica
5	Patxi Minguez
5	Jon Ander Calleja
Grupo 6 Taldea
6	Alberto García  Alvaro
6	Mikel Fernandez
6	Gorka Ramirez
6	José Andrés Gil
6	Axier Plaza
6	Asier Etxenike
6	Enekoitz Arregi
6	Ricardo Alvarez
6	Jon Ander Errasti 
Grupo 7 Taldea
7	Felix Martín
7	Íñigo Hernández
7	Roberto Mediavilla
7	Aitor de la Fuente
7	Chesco Angulo
7	Ahmad F. Hamam
7	Josu Jauregui
7	Asier Usunaga
Grupo 8 Taldea
8	David Arias
8	Cristian Chaves
8	Aitor Alonso
8	Markel Santamaría
8	Damián Escobero
8	Julen Arejolaleiba
8	Jon Narváez
8	Iñigo Viana
8	Guillermo Fortan
8	Juan Lopez
8	Enrique Estibariz
8	Asier Barrieta
8	Simon García
8	Iñaki Hualde
8	Xabi Fndz. De Gaceo
`;

function normalizeEmail(name: string) {
    return name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
        .replace(/ñ/g, "n")
        .replace(/[^a-z0-9]/g, ".") // Caracteres raros a puntos
        .replace(/\.+/g, ".") // Puntos múltiples a uno
        .replace(/^\.|\.$/g, "") // Quitar puntos inicio/fin
        + "@freesquash.com";
}

async function main() {
    console.log('🚀 Iniciando corrección de datos y generación de partidos...');

    const lines = rawData.split('\n').filter(l => l.trim());
    let currentGroupId = '';

    // 1. Corregir Nombres
    console.log('📝 Corrigiendo nombres...');
    for (const line of lines) {
        if (line.includes('Taldea')) {
            const groupNum = line.trim().match(/\d+/)?.[0];
            currentGroupId = `group_${groupNum}`;
            continue;
        }

        const parts = line.trim().split(/\t+/);
        if (parts.length < 2) continue;

        const name = parts[1].trim();
        const email = normalizeEmail(name);

        // Actualizar nombre correcto (con tildes y ñ)
        try {
            await prisma.player.updateMany({
                where: { email: email },
                data: { name: name }
            });
            // console.log(`✅ Corregido: ${name}`);
        } catch (e) {
            console.error(`❌ Error corrigiendo ${name}:`, e);
        }
    }
    console.log('✨ Nombres corregidos.');

    // 2. Generar Partidos para Grupo 1
    console.log('🎾 Generando partidos para Grupo 1...');

    // Obtener jugadores del Grupo 1
    const group1Players = await prisma.player.findMany({
        where: { currentGroupId: 'group_1' }
    });

    if (group1Players.length < 2) {
        console.error('❌ No hay suficientes jugadores en Grupo 1');
        return;
    }

    console.log(`Found ${group1Players.length} players in Group 1`);

    // Generar partidos (Liga Ida)
    let matchesCreated = 0;
    const startDate = new Date('2024-09-01');

    for (let i = 0; i < group1Players.length; i++) {
        for (let j = i + 1; j < group1Players.length; j++) {
            const p1 = group1Players[i];
            const p2 = group1Players[j];

            // Decidir resultado aleatorio
            // 3-0, 3-1, 3-2, o no jugado (20% chance)
            const played = Math.random() > 0.2;

            if (played) {
                const p1Wins = Math.random() > 0.5;
                const gamesWinner = 3;
                const gamesLoser = Math.floor(Math.random() * 3); // 0, 1, 2

                const gamesP1 = p1Wins ? gamesWinner : gamesLoser;
                const gamesP2 = p1Wins ? gamesLoser : gamesWinner;
                const winnerId = p1Wins ? p1.id : p2.id;

                // Fecha aleatoria en los últimos 2 meses
                const matchDate = new Date(startDate.getTime() + Math.random() * (60 * 24 * 60 * 60 * 1000));

                await prisma.match.create({
                    data: {
                        groupId: 'group_1',
                        player1Id: p1.id,
                        player2Id: p2.id,
                        date: matchDate,
                        gamesP1: gamesP1,
                        gamesP2: gamesP2,
                        winnerId: winnerId,
                        matchStatus: 'PLAYED'
                    }
                });
                matchesCreated++;
            }
        }
    }

    console.log(`✅ ${matchesCreated} partidos creados para el Grupo 1.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
