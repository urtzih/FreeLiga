import { prisma } from '@freesquash/database';

interface PlayerStanding {
    playerId: string;
    playerName: string;
    matchesWon: number;
    setsWon: number;
    setsLost: number;
    average: number;
}

/**
 * Calculate group rankings using the 4-tier tie-breaking algorithm:
 * 1. Matches won (primary)
 * 2. Head-to-head (for exactly 2 players tied)
 * 3. Mini-league (for 3+ players tied)
 *    - Internal wins
 *    - Internal sets averás
 * 4. Global sets averás
 * 5. Alphabetical order (last resort)
 * 
 * OPTIMIZED: Single DB call to get all data, batch updates
 */
export async function calculateGroupRankings(groupId: string): Promise<void> {
    try {
        // Single query to get all groupPlayers and all PLAYED matches at once
        const [groupPlayers, matches] = await Promise.all([
            prisma.groupPlayer.findMany({
                where: { groupId },
                include: { player: true },
            }),
            prisma.match.findMany({
                where: { groupId, matchStatus: 'PLAYED' },
                include: { player1: true, player2: true },
            })
        ]);

        if (groupPlayers.length === 0) return;

        // Calculate standings in-memory (no DB queries in loop)
        const standings: PlayerStanding[] = groupPlayers.map(gp => {
            const playerId = gp.playerId;
            const playerMatches = matches.filter(m => m.player1Id === playerId || m.player2Id === playerId);
            const matchesWon = playerMatches.filter(m => m.winnerId === playerId).length;
            let setsWon = 0; 
            let setsLost = 0;
            playerMatches.forEach(match => {
                // Solo contar partidos con resultado
                if (match.gamesP1 !== null && match.gamesP2 !== null) {
                    if (match.player1Id === playerId) { 
                        setsWon += match.gamesP1; 
                        setsLost += match.gamesP2; 
                    } else { 
                        setsWon += match.gamesP2; 
                        setsLost += match.gamesP1; 
                    }
                }
            });
            return { playerId, playerName: gp.player.name, matchesWon, setsWon, setsLost, average: setsWon - setsLost };
        });

        const sorted = [...standings].sort((a, b) => b.matchesWon - a.matchesWon);
        const rankedPlayers = resolveTies(sorted, matches);

        // Batch update all positions at once instead of individual updates
        const updateOperations = rankedPlayers.map((player, index) =>
            prisma.groupPlayer.update({
                where: { groupId_playerId: { groupId, playerId: player.playerId } },
                data: { rankingPosition: index + 1 },
            })
        );

        await Promise.all(updateOperations);
    } catch (error) {
        console.error('Error in calculateGroupRankings:', error);
        throw error;
    }
}

function resolveTies(standings: PlayerStanding[], matches: any[]): PlayerStanding[] {
    const result: PlayerStanding[] = []; let i = 0;
    while (i < standings.length) {
        const currentWins = standings[i].matchesWon; const tiedPlayers: PlayerStanding[] = []; let j = i;
        while (j < standings.length && standings[j].matchesWon === currentWins) { tiedPlayers.push(standings[j]); j++; }
        if (tiedPlayers.length === 1) result.push(tiedPlayers[0]);
        else if (tiedPlayers.length === 2) result.push(...resolveHeadToHead(tiedPlayers, matches));
        else result.push(...resolveMiniLeague(tiedPlayers, matches));
        i = j;
    }
    return result;
}

function resolveHeadToHead(players: PlayerStanding[], matches: any[]): PlayerStanding[] {
    const [p1, p2] = players;
    const h2hMatch = matches.find(m => (m.player1Id === p1.playerId && m.player2Id === p2.playerId) || (m.player1Id === p2.playerId && m.player2Id === p1.playerId));
    if (h2hMatch && h2hMatch.winnerId) return h2hMatch.winnerId === p1.playerId ? [p1, p2] : [p2, p1];
    return resolveByGlobalAverage(players);
}

function resolveMiniLeague(players: PlayerStanding[], allMatches: any[]): PlayerStanding[] {
    const playerIds = players.map(p => p.playerId);
    const internalMatches = allMatches.filter(m => playerIds.includes(m.player1Id) && playerIds.includes(m.player2Id));
    const miniLeagueStandings = players.map(player => {
        const internalWins = internalMatches.filter(m => m.winnerId === player.playerId).length;
        let internalSetsWon = 0; let internalSetsLost = 0;
        internalMatches.forEach(match => {
            if (match.player1Id === player.playerId) { internalSetsWon += match.gamesP1; internalSetsLost += match.gamesP2; }
            else if (match.player2Id === player.playerId) { internalSetsWon += match.gamesP2; internalSetsLost += match.gamesP1; }
        });
        return { ...player, internalWins, internalAverage: internalSetsWon - internalSetsLost };
    });
    const sorted = [...miniLeagueStandings].sort((a, b) => {
        if (b.internalWins !== a.internalWins) return b.internalWins - a.internalWins;
        if (b.internalAverage !== a.internalAverage) return b.internalAverage - a.internalAverage;
        if (b.average !== a.average) return b.average - a.average;
        return a.playerName.localeCompare(b.playerName);
    });
    return sorted;
}

function resolveByGlobalAverage(players: PlayerStanding[]): PlayerStanding[] {
    return [...players].sort((a, b) => {
        if (b.average !== a.average) return b.average - a.average;
        return a.playerName.localeCompare(b.playerName);
    });
}

/**
 * Genera (o regenera) el cierre de temporada PENDING aplicando reglas de ascenso/descenso:
 * - Grupo superior (índice 0): solo descensos (últimos 2)
 * - Grupo inferior (último): solo ascensos (primeros 2)
 * - Intermedios: 2 ascensos (top 2) y 2 descensos (bottom 2)
 * - Resto STAY
 */
export async function computeSeasonClosure(seasonId: string) {
    const season = await prisma.season.findUnique({
        where: { id: seasonId },
        include: {
            groups: { include: { groupPlayers: true } },
            closure: { include: { entries: true } }
        }
    });
    if (!season) throw new Error(`Season not found: ${seasonId}`);
    if (!season.groups || season.groups.length === 0) throw new Error(`No groups found for season: ${seasonId}`);

    // Ordenar grupos por nombre (asumiendo jerarquía A,B,C,...)
    const orderedGroups = [...season.groups].sort((a, b) => a.name.localeCompare(b.name));

    // Recalcular ranking para cada grupo
    for (const g of orderedGroups) {
        await calculateGroupRankings(g.id);
    }

    // Releer grupos con posiciones actualizadas
    const refreshedGroups = await prisma.group.findMany({
        where: { seasonId },
        include: { groupPlayers: { include: { player: true }, orderBy: { rankingPosition: 'asc' } } }
    });
    const refreshedOrdered = [...refreshedGroups].sort((a, b) => a.name.localeCompare(b.name));

    // Obtener matches para calcular victorias por jugador
    const allMatches = await prisma.match.findMany({
        where: { group: { seasonId } }
    });

    // Preparar cierre (crear o limpiar existente PENDING)
    let closure = await prisma.seasonClosure.findUnique({ where: { seasonId } });
    if (!closure) {
        closure = await prisma.seasonClosure.create({ data: { seasonId, status: 'PENDING' } });
    } else if (closure.status === 'APPROVED') {
        // Si ya aprobado, devolver directamente con entries
        return await prisma.seasonClosure.findUnique({ where: { seasonId }, include: { entries: { include: { player: { include: { user: { select: { isActive: true, id: true } } } }, fromGroup: true, toGroup: true } } } });
    } else {
        await prisma.seasonClosureEntry.deleteMany({ where: { closureId: closure.id } });
    }

    const entriesData: any[] = [];

    for (let idx = 0; idx < refreshedOrdered.length; idx++) {
        const group = refreshedOrdered[idx];
        const players = [...group.groupPlayers].sort((a, b) => a.rankingPosition - b.rankingPosition);
        const isTop = idx === 0; 
        const isBottom = idx === refreshedOrdered.length - 1;
        const targetAbove = !isTop ? refreshedOrdered[idx - 1] : null;
        const targetBelow = !isBottom ? refreshedOrdered[idx + 1] : null;

        const promotions: string[] = [];
        const relegations: string[] = [];

        if (!isTop) { // grupos con ascensos
            promotions.push(...players.slice(0, 2).map(p => p.playerId));
        }
        if (!isBottom) { // grupos con descensos
            relegations.push(...players.slice(-2).map(p => p.playerId));
        }

        for (const gp of players) {
            const movementType = promotions.includes(gp.playerId) ? 'PROMOTION' : relegations.includes(gp.playerId) ? 'RELEGATION' : 'STAY';
            const playerMatches = allMatches.filter(m => m.groupId === group.id && (m.player1Id === gp.playerId || m.player2Id === gp.playerId) && m.matchStatus === 'PLAYED');
            const matchesWon = playerMatches.filter(m => m.winnerId === gp.playerId).length;
            entriesData.push({
                closureId: closure.id,
                playerId: gp.playerId,
                fromGroupId: group.id,
                toGroupId: movementType === 'PROMOTION' ? targetAbove?.id : movementType === 'RELEGATION' ? targetBelow?.id : null,
                movementType,
                finalRank: gp.rankingPosition,
                matchesWon,
            });
        }
    }

    if (entriesData.length > 0) {
        await prisma.seasonClosureEntry.createMany({ data: entriesData });
    }

    return await prisma.seasonClosure.findUnique({
        where: { seasonId },
        include: { entries: { include: { player: { include: { user: { select: { isActive: true, id: true } } } }, fromGroup: true, toGroup: true } } }
    });
}
