// apps/api/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // -------------------------------------------------
    // 0️⃣  Cleanup existing data (avoid duplicate constraints)
    // -------------------------------------------------



    await prisma.match.deleteMany();
    await prisma.groupPlayer.deleteMany();
    await prisma.player.deleteMany();
    await prisma.group.deleteMany();
    await prisma.season.deleteMany();
    await prisma.user.deleteMany();

    // -------------------------------------------------
    // 1️⃣  Create current season (Nov‑Dec 2025)
    // -------------------------------------------------
    const season = await prisma.season.create({
        data: {
            name: 'Temporada 2025‑Nov‑Dic',
            startDate: new Date('2025-11-01T00:00:00Z'),
            endDate: new Date('2025-12-31T23:59:59Z'),
        },
    });

    // -------------------------------------------------
    // 2️⃣  Create admin user (password 123456)
    // -------------------------------------------------
    const adminPasswordHash = await bcrypt.hash('123456', 10);
    await prisma.user.create({
        data: {
            email: 'admin@freesquash.com',
            password: adminPasswordHash,
            role: Role.ADMIN,
            isActive: true,
        },
    });

    // -------------------------------------------------
    // 3️⃣  Create groups and players (all with password 123456)
    // -------------------------------------------------
    const grupos = [
        { name: 'Grupo 1 Taldea', players: ['Oier Quesada', 'Santi Tobias', 'Jon Toña', 'Aitor García', 'David Gancedo', 'Bikendi Otálora', 'Itzel Reguero', 'Iñigo Alonso'] },
        { name: 'Grupo 2 Taldea', players: ['Cesar Berganzo', 'Eneko Izquierdo', 'Javier Pacheco', 'Alexander Egido', 'Javier Guinea', 'Eneko Uriarte', 'Gari Suárez', 'Pedro A. García'] },
        { name: 'Grupo 3 Taldea', players: ['Javier Crespo', 'Ruben García', 'Enrique Oquiñena', 'Vicente Avila', 'Héctor Velasco', 'Jon Barrena', 'Sergio Barquín', 'Asier Renobales'] },
        { name: 'Grupo 4 Taldea', players: ['Luis M. Rodríguez', 'Sergio Basconcillos', 'Iker Estibariz', 'Iñigo Ullibarri', 'Aritz Ruiz de Azua', 'Yeray Olgado', 'Alberto García S.m', 'Javier Uribe', 'Urtzi Diaz'] },
        { name: 'Grupo 5 Taldea', players: ['Antonio Perez', 'Fernando Alonso', 'Miguel Ricarte', 'Javier Fuente', 'Víctor Cirre', 'Ander Leyún', 'Aratz Mugica', 'Patxi Minguez', 'Jon Ander Calleja'] },
        { name: 'Grupo 6 Taldea', players: ['Alberto García Alvaro', 'Mikel Fernandez', 'Gorka Ramirez', 'José Andrés Gil', 'Axier Plaza', 'Asier Etxenike', 'Enekoitz Arregi', 'Ricardo Alvarez', 'Jon Ander Errasti'] },
        { name: 'Grupo 7 Taldea', players: ['Felix Martín', 'Íñigo Hernández', 'Roberto Mediavilla', 'Aitor de la Fuente', 'Chesco Angulo', 'Ahmad F. Hamam', 'Josu Jauregui', 'Asier Usunaga'] },
        { name: 'Grupo 8 Taldea', players: ['David Arias', 'Cristian Chaves', 'Aitor Alonso', 'Markel Santamaría', 'Damián Escobero', 'Julen Arejolaleiba', 'Jon Narváez', 'Iñigo Viana', 'Guillermo Fortan', 'Juan Lopez', 'Enrique Estibariz', 'Asier Barrieta', 'Simon García', 'Iñaki Hualde', 'Xabi Fndz. De Gaceo'] },
    ];

    const passwordHash = await bcrypt.hash('123456', 10);

    for (const g of grupos) {
        const group = await prisma.group.create({
            data: { name: g.name, seasonId: season.id },
        });
        for (const playerName of g.players) {
            const email = `${playerName.toLowerCase().replace(/\s+/g, '.')}.example@freesquash.com`;
            const user = await prisma.user.create({
                data: { email, password: passwordHash, role: Role.PLAYER, isActive: true },
            });
            const player = await prisma.player.create({
                data: {
                    userId: user.id,
                    name: playerName,
                    nickname: null,
                    phone: null,
                    email,
                    currentGroupId: group.id,
                },
            });
            await prisma.groupPlayer.create({
                data: { groupId: group.id, playerId: player.id, rankingPosition: 0 },
            });
        }
    }

    // -------------------------------------------------
    // 5️⃣  Create past seasons (4 previous years) with data
    // -------------------------------------------------
    // -------------------------------------------------
    // 5️⃣  Create past seasons (4 previous years) with data
    // -------------------------------------------------
    const pastSeasons = [
        { name: 'Temporada 2024‑Nov‑Dic', start: new Date('2024-11-01T00:00:00Z'), end: new Date('2024-12-31T23:59:59Z') },
        { name: 'Temporada 2023‑Nov‑Dic', start: new Date('2023-11-01T00:00:00Z'), end: new Date('2023-12-31T23:59:59Z') },
        { name: 'Temporada 2022‑Nov‑Dic', start: new Date('2022-11-01T00:00:00Z'), end: new Date('2022-12-31T23:59:59Z') },
        { name: 'Temporada 2021‑Nov‑Dic', start: new Date('2021-11-01T00:00:00Z'), end: new Date('2021-12-31T23:59:59Z') },
    ];

    for (const past of pastSeasons) {
        const pastSeason = await prisma.season.create({
            data: {
                name: past.name,
                startDate: past.start,
                endDate: past.end,
            },
        });
        // Reuse the same grupos definition to create groups and players for each past season
        for (const g of grupos) {
            const group = await prisma.group.create({
                data: { name: g.name, seasonId: pastSeason.id },
            });
            for (const playerName of g.players) {
                // Use the SAME email format as the current season to find the existing user
                const email = `${playerName.toLowerCase().replace(/\s+/g, '.')}.example@freesquash.com`;

                let user = await prisma.user.findUnique({
                    where: { email },
                    include: { player: true },
                });

                // If user doesn't exist (shouldn't happen with identical lists, but safety first), create them
                if (!user) {
                    const newUser = await prisma.user.create({
                        data: { email, password: passwordHash, role: Role.PLAYER, isActive: true },
                    });
                    await prisma.player.create({
                        data: {
                            userId: newUser.id,
                            name: playerName,
                            nickname: null,
                            phone: null,
                            email,
                            currentGroupId: group.id, // If new, this is their current group
                        },
                    });
                    // Re-fetch to get the player relation
                    user = await prisma.user.findUnique({ where: { id: newUser.id }, include: { player: true } });
                }

                if (user && user.player) {
                    // Add to the past group via GroupPlayer
                    // Do NOT update currentGroupId as that should point to the ACTIVE season's group
                    await prisma.groupPlayer.create({
                        data: { groupId: group.id, playerId: user.player.id, rankingPosition: 0 },
                    });
                }
            }
        }
        // Generate matches for this past season (3 per group)
        const groupsPast = await prisma.group.findMany({ where: { seasonId: pastSeason.id }, include: { groupPlayers: true } });
        for (const g of groupsPast) {
            const playerIds = g.groupPlayers.map(gp => gp.playerId);
            for (let i = 0; i < 3; i++) {
                const [p1, p2] = shuffleArray(playerIds).slice(0, 2);
                await prisma.match.create({
                    data: {
                        groupId: g.id,
                        player1Id: p1,
                        player2Id: p2,
                        gamesP1: Math.floor(Math.random() * 4),
                        gamesP2: Math.floor(Math.random() * 4),
                        winnerId: Math.random() > 0.5 ? p1 : p2,
                        matchStatus: 'PLAYED',
                        date: randomDate(past.start, past.end),
                    },
                });
            }
        }
    }


    // -------------------------------------------------
    // 4️⃣  Generate random matches (3 per group)
    // -------------------------------------------------
    const groups = await prisma.group.findMany({ include: { groupPlayers: true } });
    for (const g of groups) {
        const playerIds = g.groupPlayers.map(gp => gp.playerId);
        for (let i = 0; i < 3; i++) {
            const [p1, p2] = shuffleArray(playerIds).slice(0, 2);
            await prisma.match.create({
                data: {
                    groupId: g.id,
                    player1Id: p1,
                    player2Id: p2,
                    gamesP1: Math.floor(Math.random() * 4),
                    gamesP2: Math.floor(Math.random() * 4),
                    winnerId: Math.random() > 0.5 ? p1 : p2,
                    matchStatus: 'PLAYED',
                    date: randomDate(season.startDate, season.endDate),
                },
            });
        }
    }

    console.log('✅ Seed data inserted successfully');
}

function shuffleArray<T>(array: T[]): T[] {
    return array.sort(() => Math.random() - 0.5);
}
function randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

main()
    .catch(e => { console.error('❌ Seed error:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
