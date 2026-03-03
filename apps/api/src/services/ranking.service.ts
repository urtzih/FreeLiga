import { prisma } from '@freesquash/database';

interface PlayerStanding {
    playerId: string;
    playerName: string;
    matchesWon: number;
    setsWon: number;
    setsLost: number;
    average: number;
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
    
    // Calculate mini-league statistics
    const miniLeagueStandings = players.map(player => {
        const internalWins = internalMatches.filter(m => m.winnerId === player.playerId).length;
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
            internalWins, 
            internalAverage: internalSetsWon - internalSetsLost 
        };
    });
    
    // Sort by internal wins first
    const sortedByInternalWins = [...miniLeagueStandings].sort((a, b) => (b.internalWins ?? 0) - (a.internalWins ?? 0));
    
    // Recursively resolve ties using mini-league logic
    const result: PlayerStanding[] = [];
    let i = 0;
    
    while (i < sortedByInternalWins.length) {
        const currentInternalWins = sortedByInternalWins[i].internalWins ?? 0;
        const tiedByInternalWins: PlayerStanding[] = [];
        let j = i;
        
        while (j < sortedByInternalWins.length && ((sortedByInternalWins[j].internalWins ?? 0) === currentInternalWins)) {
            tiedByInternalWins.push(sortedByInternalWins[j]);
            j++;
        }
        
        // If only one player with this internal win count
        if (tiedByInternalWins.length === 1) {
            result.push(tiedByInternalWins[0]);
        } else {
            // Multiple players with same internal wins, sort by internal average
            const sortedByInternalAverage = [...tiedByInternalWins].sort((a, b) => {
                if ((b.internalAverage ?? 0) !== (a.internalAverage ?? 0)) return (b.internalAverage ?? 0) - (a.internalAverage ?? 0);
                // If still tied on internal average, use global average
                if (b.average !== a.average) return b.average - a.average;
                // If still tied, use alphabetical order
                return a.playerName.localeCompare(b.playerName);
            });
            result.push(...sortedByInternalAverage);
        }
        
        i = j;
    }
    
    return result;
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

        if (groupPlayers.length === 0) return [];

        // Calculate standings in-memory
        const standings: PlayerStanding[] = groupPlayers.map(gp => {
            const playerId = gp.playerId;
            const playerMatches = matches.filter(m => m.player1Id === playerId || m.player2Id === playerId);
            const matchesWon = playerMatches.filter(m => m.winnerId === playerId).length;
            let setsWon = 0;
            let setsLost = 0;
            playerMatches.forEach(match => {
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
            return {
                playerId,
                playerName: gp.player.name,
                matchesWon,
                setsWon,
                setsLost,
                average: setsWon - setsLost,
            };
        });

        // Sort by matches won first
        const sorted = [...standings].sort((a, b) => b.matchesWon - a.matchesWon);

        // Resolve ties using the same logic as calculateGroupRankings
        const resolved = resolveTies(sorted, matches);

        // Format for API response
        return resolved.map((standing, index) => {
            const totalMatches = matches.filter(m => 
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
