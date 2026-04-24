import { prisma } from '@freesquash/database';

interface PlayerStanding {
    playerId: string;
    playerName: string;
    matchesWon: number;
    losses: number;
    setsWon: number;
    setsLost: number;
    average: number;
    injuryAsSelf: number;
    remainingPlayable: number;
    fairLosses: number;
    internalWins?: number;
    internalAverage?: number;
}

export interface RankingResult {
    id: string;
    name: string;
    level: string;
    played: number;
    won: number;
    lost: number;
    winPercentage: number;
    points: number;
}

/**
 * Calculate group rankings using the tie-breaking algorithm:
 * 1. Matches won (primary)
 * 2. If all tied players have no playable matches left:
 *    fewer adjusted losses first (losses + own injuries)
 * 3. Head-to-head (for exactly 2 players tied)
 * 4. Mini-league sets average (for 3+ players tied)
 *    - Internal sets average (only matches among tied players)
 * 5. Global sets average
 * 6. Alphabetical order (last resort)
 *
 * OPTIMIZED: Single DB call to get all data, batch updates
 */
const isPlayedWithResult = (match: any) =>
    match.matchStatus === 'PLAYED' && match.gamesP1 !== null && match.gamesP2 !== null;

const isClosedForProgress = (match: any) =>
    isPlayedWithResult(match) || match.matchStatus === 'INJURY';

function buildLegacyInjuryExposure(matches: any[]): Map<string, number> {
    const exposure = new Map<string, number>();
    matches.forEach((match) => {
        if (match.matchStatus !== 'INJURY' || match.winnerId) return;
        exposure.set(match.player1Id, (exposure.get(match.player1Id) ?? 0) + 1);
        exposure.set(match.player2Id, (exposure.get(match.player2Id) ?? 0) + 1);
    });
    return exposure;
}

function isPlayerInjuredInMatch(match: any, playerId: string, legacyExposure: Map<string, number>): boolean {
    if (match.matchStatus !== 'INJURY') return false;
    if (match.winnerId) {
        return (match.player1Id === playerId || match.player2Id === playerId) && match.winnerId !== playerId;
    }
    const p1Count = legacyExposure.get(match.player1Id) ?? 0;
    const p2Count = legacyExposure.get(match.player2Id) ?? 0;
    if (p1Count === p2Count) return match.player1Id === playerId;
    return (p1Count > p2Count ? match.player1Id : match.player2Id) === playerId;
}

function buildRankingContext(groupPlayers: any[], allGroupMatches: any[]) {
    const activePlayerIds = new Set(groupPlayers.map((gp) => gp.playerId));
    const matches = allGroupMatches.filter(
        (match) => activePlayerIds.has(match.player1Id) && activePlayerIds.has(match.player2Id),
    );
    const playedMatches = matches.filter(isPlayedWithResult);
    const legacyExposure = buildLegacyInjuryExposure(matches);
    const expectedMatches = Math.max(groupPlayers.length - 1, 0);

    const standings: PlayerStanding[] = groupPlayers.map((gp) => {
        const playerId = gp.playerId;
        const playerMatches = matches.filter((m) => m.player1Id === playerId || m.player2Id === playerId);
        const playedByPlayer = playedMatches.filter((m) => m.player1Id === playerId || m.player2Id === playerId);
        const matchesWon = playedByPlayer.filter((m) => m.winnerId === playerId).length;
        const losses = playedByPlayer.filter((m) => m.winnerId && m.winnerId !== playerId).length;
        const injuryAsSelf = playerMatches
            .filter((m) => m.matchStatus === 'INJURY')
            .filter((m) => isPlayerInjuredInMatch(m, playerId, legacyExposure))
            .length;

        let setsWon = 0;
        let setsLost = 0;
        playedByPlayer.forEach((match) => {
            if (match.player1Id === playerId) {
                setsWon += match.gamesP1;
                setsLost += match.gamesP2;
            } else {
                setsWon += match.gamesP2;
                setsLost += match.gamesP1;
            }
        });

        const closedOpponents = new Set<string>();
        playerMatches.forEach((match) => {
            if (!isClosedForProgress(match)) return;
            const opponentId = match.player1Id === playerId ? match.player2Id : match.player1Id;
            closedOpponents.add(opponentId);
        });

        const remainingPlayable = Math.max(expectedMatches - closedOpponents.size, 0);

        return {
            playerId,
            playerName: gp.player.name,
            matchesWon,
            losses,
            setsWon,
            setsLost,
            average: setsWon - setsLost,
            injuryAsSelf,
            remainingPlayable,
            fairLosses: losses + injuryAsSelf,
        };
    });

    return { standings, playedMatches };
}

export async function calculateGroupRankings(groupId: string): Promise<void> {
    try {
        // Single query to get all active groupPlayers and their matches at once
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
                    OR: [
                        { matchStatus: 'PLAYED' },
                        { matchStatus: 'INJURY' },
                    ],
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
                select: {
                    id: true,
                    player1Id: true,
                    player2Id: true,
                    matchStatus: true,
                    gamesP1: true,
                    gamesP2: true,
                    winnerId: true,
                },
            }),
        ]);

        if (groupPlayers.length === 0) return;

        const rankingContext = buildRankingContext(groupPlayers, matches);
        const sorted = [...rankingContext.standings].sort((a, b) => b.matchesWon - a.matchesWon);
        const rankedPlayers = resolveTies(sorted, rankingContext.playedMatches);

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
        if (tiedPlayers.length === 1) {
            result.push(tiedPlayers[0]);
        } else {
            result.push(...resolveByFairLossesWhenNoRemaining(tiedPlayers, matches));
        }
        i = j;
    }
    return result;
}

function resolveByFairLossesWhenNoRemaining(players: PlayerStanding[], matches: any[]): PlayerStanding[] {
    if (!players.every((player) => player.remainingPlayable === 0)) {
        return resolveByStandardTieBreak(players, matches);
    }

    const groupedByFairLoss = new Map<number, PlayerStanding[]>();
    players.forEach((player) => {
        const existing = groupedByFairLoss.get(player.fairLosses) ?? [];
        existing.push(player);
        groupedByFairLoss.set(player.fairLosses, existing);
    });

    const sortedFairLosses = [...groupedByFairLoss.keys()].sort((a, b) => a - b);
    if (sortedFairLosses.length === 1) {
        return resolveByStandardTieBreak(players, matches);
    }

    const resolved: PlayerStanding[] = [];
    sortedFairLosses.forEach((fairLoss) => {
        const bucket = groupedByFairLoss.get(fairLoss) ?? [];
        if (bucket.length === 1) {
            resolved.push(bucket[0]);
            return;
        }
        resolved.push(...resolveByStandardTieBreak(bucket, matches));
    });

    return resolved;
}

function resolveByStandardTieBreak(players: PlayerStanding[], matches: any[]): PlayerStanding[] {
    if (players.length === 2) return resolveHeadToHead(players, matches);
    return resolveMiniLeague(players, matches);
}

function resolveHeadToHead(players: PlayerStanding[], matches: any[]): PlayerStanding[] {
    const [p1, p2] = players;
    
    // Find all matches between these two players
    const h2hMatches = matches.filter(m => 
        (m.player1Id === p1.playerId && m.player2Id === p2.playerId) || 
        (m.player1Id === p2.playerId && m.player2Id === p1.playerId)
    );
    
    // If no matches between them, use global average
    if (h2hMatches.length === 0) {
        return resolveByGlobalAverage(players);
    }
    
    // Calculate head-to-head wins and average
    const p1H2hWins = h2hMatches.filter(m => m.winnerId === p1.playerId).length;
    const p2H2hWins = h2hMatches.filter(m => m.winnerId === p2.playerId).length;
    
    let p1H2hSetsWon = 0, p1H2hSetsLost = 0;
    let p2H2hSetsWon = 0, p2H2hSetsLost = 0;
    
    h2hMatches.forEach(match => {
        if (match.gamesP1 !== null && match.gamesP2 !== null) {
            if (match.player1Id === p1.playerId) {
                p1H2hSetsWon += match.gamesP1;
                p1H2hSetsLost += match.gamesP2;
            } else {
                p1H2hSetsWon += match.gamesP2;
                p1H2hSetsLost += match.gamesP1;
            }
        }
    });
    
    h2hMatches.forEach(match => {
        if (match.gamesP1 !== null && match.gamesP2 !== null) {
            if (match.player1Id === p2.playerId) {
                p2H2hSetsWon += match.gamesP1;
                p2H2hSetsLost += match.gamesP2;
            } else {
                p2H2hSetsWon += match.gamesP2;
                p2H2hSetsLost += match.gamesP1;
            }
        }
    });
    
    const p1H2hAverage = p1H2hSetsWon - p1H2hSetsLost;
    const p2H2hAverage = p2H2hSetsWon - p2H2hSetsLost;
    
    // Resolve by head-to-head wins first
    if (p1H2hWins !== p2H2hWins) {
        return p1H2hWins > p2H2hWins ? [p1, p2] : [p2, p1];
    }
    
    // If tied on wins, resolve by head-to-head average
    if (p1H2hAverage !== p2H2hAverage) {
        return p1H2hAverage > p2H2hAverage ? [p1, p2] : [p2, p1];
    }
    
    // If still tied, use global average
    return resolveByGlobalAverage(players);
}

function resolveMiniLeague(players: PlayerStanding[], allMatches: any[]): PlayerStanding[] {
    const playerIds = players.map(p => p.playerId);
    const internalMatches = allMatches.filter(m => playerIds.includes(m.player1Id) && playerIds.includes(m.player2Id));

    // Para 3+ empatados:
    // 1) average en mini-liga (solo entre empatados)
    // 2) average global
    // 3) orden alfabetico
    const miniLeagueStandings = players.map(player => {
        let internalSetsWon = 0;
        let internalSetsLost = 0;

        internalMatches.forEach(match => {
            if (match.player1Id === player.playerId) {
                internalSetsWon += match.gamesP1;
                internalSetsLost += match.gamesP2;
            } else if (match.player2Id === player.playerId) {
                internalSetsWon += match.gamesP2;
                internalSetsLost += match.gamesP1;
            }
        });

        return {
            ...player,
            internalAverage: internalSetsWon - internalSetsLost,
        };
    });

    return [...miniLeagueStandings].sort((a, b) => {
        if ((b.internalAverage ?? 0) !== (a.internalAverage ?? 0)) {
            return (b.internalAverage ?? 0) - (a.internalAverage ?? 0);
        }
        if (b.average !== a.average) {
            return b.average - a.average;
        }
        return a.playerName.localeCompare(b.playerName);
    });
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
        include: { 
            groupPlayers: { 
                include: { 
                    player: { 
                        include: { user: { select: { isActive: true } } }
                    } 
                },
                orderBy: { rankingPosition: 'asc' } 
            } 
        }
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

        // Players with isActive = false are automatic relegations (leaving the league)
        const inactivePlayers = players.filter(p => !p.player.user?.isActive);
        relegations.push(...inactivePlayers.map(p => p.playerId));

        // Regular relegations: last 2 active (non-relegated) players
        const activePlayers = players.filter(p => p.player.user?.isActive);
        if (!isTop && activePlayers.length > 0) { 
            // Get the last 2 active players for relegation
            relegations.push(...activePlayers.slice(-2).map(p => p.playerId));
        }

        // Promotions: first 2 active players
        if (!isBottom && activePlayers.length > 0) {
            promotions.push(...activePlayers.slice(0, 2).map(p => p.playerId));
        }

        for (const gp of players) {
            const isInactive = !gp.player.user?.isActive;
            let movementType = 'STAY';
            
            if (isInactive) {
                movementType = 'RELEGATION'; // Inactive players always relegate
            } else if (promotions.includes(gp.playerId)) {
                movementType = 'PROMOTION';
            } else if (relegations.includes(gp.playerId)) {
                movementType = 'RELEGATION';
            }
            
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

/**
 * Get group rankings without updating the database
 * Returns calculated rankings for public API
 */
export async function getGroupRankings(groupId: string): Promise<RankingResult[]> {
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
                    OR: [
                        { matchStatus: 'PLAYED' },
                        { matchStatus: 'INJURY' },
                    ],
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
                select: {
                    id: true,
                    player1Id: true,
                    player2Id: true,
                    matchStatus: true,
                    gamesP1: true,
                    gamesP2: true,
                    winnerId: true,
                },
            }),
        ]);

        if (groupPlayers.length === 0) return [];

        const rankingContext = buildRankingContext(groupPlayers, matches);

        // Sort by matches won first
        const sorted = [...rankingContext.standings].sort((a, b) => b.matchesWon - a.matchesWon);

        // Resolve ties using the same logic as calculateGroupRankings
        const resolved = resolveTies(sorted, rankingContext.playedMatches);

        // Format for API response
        return resolved.map((standing, index) => {
            const totalMatches = rankingContext.playedMatches.filter(m =>
                m.player1Id === standing.playerId || m.player2Id === standing.playerId
            ).length;
            const winPercentage = totalMatches > 0 ? (standing.matchesWon / totalMatches) * 100 : 0;

            return {
                id: standing.playerId,
                name: standing.playerName,
                level: 'Squash', // Default level
                played: totalMatches,
                won: standing.matchesWon,
                lost: totalMatches - standing.matchesWon,
                winPercentage,
                points: index + 1, // Ranking position as points
            };
        });
    } catch (error) {
        console.error('Error in getGroupRankings:', error);
        throw error;
    }
}

