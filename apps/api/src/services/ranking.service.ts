import { prisma } from '@freesquash/database';

interface PlayerStanding {
    playerId: string;
    playerName: string;
    matchesWon: number;
    setsWon: number;
    setsLost: number;
    averas: number;
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
 */
export async function calculateGroupRankings(groupId: string): Promise<void> {
    // Get all players in the group
    const groupPlayers = await prisma.groupPlayer.findMany({
        where: { groupId },
        include: {
            player: true,
        },
    });

    if (groupPlayers.length === 0) {
        return;
    }

    // Get all PLAYED matches for this group (exclude INJURY and CANCELLED)
    const matches = await prisma.match.findMany({
        where: {
            groupId,
            matchStatus: 'PLAYED',
        },
        include: {
            player1: true,
            player2: true,
        },
    });

    // Calculate standings for each player
    const standings: PlayerStanding[] = groupPlayers.map(gp => {
        const playerId = gp.playerId;
        const playerMatches = matches.filter(
            m => m.player1Id === playerId || m.player2Id === playerId
        );

        const matchesWon = playerMatches.filter(m => m.winnerId === playerId).length;

        let setsWon = 0;
        let setsLost = 0;

        playerMatches.forEach(match => {
            if (match.player1Id === playerId) {
                setsWon += match.gamesP1;
                setsLost += match.gamesP2;
            } else {
                setsWon += match.gamesP2;
                setsLost += match.gamesP1;
            }
        });

        return {
            playerId,
            playerName: gp.player.name,
            matchesWon,
            setsWon,
            setsLost,
            averas: setsWon - setsLost,
        };
    });

    // Sort by matches won (primary criterion)
    const sorted = [...standings].sort((a, b) => b.matchesWon - a.matchesWon);

    // Apply tie-breaking logic
    const rankedPlayers = resolveTies(sorted, matches);

    // Update rankings in database
    for (let i = 0; i < rankedPlayers.length; i++) {
        await prisma.groupPlayer.update({
            where: {
                groupId_playerId: {
                    groupId,
                    playerId: rankedPlayers[i].playerId,
                },
            },
            data: {
                rankingPosition: i + 1,
            },
        });
    }
}

function resolveTies(
    standings: PlayerStanding[],
    matches: any[]
): PlayerStanding[] {
    const result: PlayerStanding[] = [];
    let i = 0;

    while (i < standings.length) {
        // Find all players with the same number of wins
        const currentWins = standings[i].matchesWon;
        const tiedPlayers: PlayerStanding[] = [];

        let j = i;
        while (j < standings.length && standings[j].matchesWon === currentWins) {
            tiedPlayers.push(standings[j]);
            j++;
        }

        if (tiedPlayers.length === 1) {
            // No tie, just add the player
            result.push(tiedPlayers[0]);
        } else if (tiedPlayers.length === 2) {
            // Tier 2: Head-to-head
            const resolved = resolveHeadToHead(tiedPlayers, matches);
            result.push(...resolved);
        } else {
            // Tier 3: Multi-player tie (mini-league)
            const resolved = resolveMiniLeague(tiedPlayers, matches);
            result.push(...resolved);
        }

        i = j;
    }

    return result;
}

function resolveHeadToHead(
    players: PlayerStanding[],
    matches: any[]
): PlayerStanding[] {
    const [p1, p2] = players;

    // Find match between these two players
    const h2hMatch = matches.find(
        m =>
            (m.player1Id === p1.playerId && m.player2Id === p2.playerId) ||
            (m.player1Id === p2.playerId && m.player2Id === p1.playerId)
    );

    if (h2hMatch && h2hMatch.winnerId) {
        // Winner of head-to-head ranks higher
        if (h2hMatch.winnerId === p1.playerId) {
            return [p1, p2];
        } else {
            return [p2, p1];
        }
    }

    // No head-to-head match or no winner, use global averás
    return resolveByGlobalAveras(players);
}

function resolveMiniLeague(
    players: PlayerStanding[],
    allMatches: any[]
): PlayerStanding[] {
    const playerIds = players.map(p => p.playerId);

    // Get matches between these players only (internal matches)
    const internalMatches = allMatches.filter(
        m =>
            playerIds.includes(m.player1Id) && playerIds.includes(m.player2Id)
    );

    // Calculate internal wins and internal sets for each player
    const miniLeagueStandings = players.map(player => {
        const internalWins = internalMatches.filter(
            m => m.winnerId === player.playerId
        ).length;

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
            internalAveras: internalSetsWon - internalSetsLost,
        };
    });

    // Sort by internal wins first
    const sorted = [...miniLeagueStandings].sort((a, b) => {
        if (b.internalWins !== a.internalWins) {
            return b.internalWins - a.internalWins;
        }

        // If internal wins are tied, use internal averás
        if (b.internalAveras !== a.internalAveras) {
            return b.internalAveras - a.internalAveras;
        }

        // If still tied, use global averás
        if (b.averas !== a.averas) {
            return b.averas - a.averas;
        }

        // Last resort: alphabetical order
        return a.playerName.localeCompare(b.playerName);
    });

    return sorted;
}

function resolveByGlobalAveras(players: PlayerStanding[]): PlayerStanding[] {
    return [...players].sort((a, b) => {
        if (b.averas !== a.averas) {
            return b.averas - a.averas;
        }

        // Last resort: alphabetical
        return a.playerName.localeCompare(b.playerName);
    });
}
