import { FastifyInstance } from 'fastify';
import { prisma } from '@freesquash/database';
import { getPlayerCurrentGroup } from '../utils/playerHelpers';
import { cacheService } from '../services/cache.service';
import { getGroupRankings } from '../services/ranking.service';

export async function classificationRoutes(fastify: FastifyInstance) {
    // Get global classification with filters
    fastify.get('/', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const {
                seasonId,
                groupId,
                opponentId,
                startDate,
                endDate,
            } = request.query as {
                seasonId?: string;
                groupId?: string;
                opponentId?: string;
                startDate?: string;
                endDate?: string;
            };

            const cacheKey = `private:classification:${seasonId || 'all'}:${groupId || 'all'}:${opponentId || 'all'}:${startDate || 'all'}:${endDate || 'all'}`;
            const cached = cacheService.get<any>(cacheKey);
            if (cached) {
                return cached;
            }

            // Group standings (no extra filters): use the same ranking algorithm
            // as rankingPosition (wins -> tie-breakers) to keep all UIs aligned.
            if (groupId && !opponentId && !startDate && !endDate) {
                const [groupPlayers, matches, rankings] = await Promise.all([
                    prisma.groupPlayer.findMany({
                        where: {
                            groupId,
                            player: {
                                user: {
                                    isActive: true,
                                },
                            },
                        },
                        include: {
                            player: true,
                        },
                    }),
                    prisma.match.findMany({
                        where: {
                            groupId,
                            matchStatus: 'PLAYED',
                            gamesP1: { not: null },
                            gamesP2: { not: null },
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
                    }),
                    getGroupRankings(groupId),
                ]);

                const rankingIndex = new Map<string, number>();
                rankings.forEach((row, index) => {
                    rankingIndex.set(row.id, index);
                });

                const statsByPlayer = new Map<string, {
                    totalMatches: number;
                    wins: number;
                    losses: number;
                    setsWon: number;
                    setsLost: number;
                }>();

                groupPlayers.forEach((groupPlayer) => {
                    statsByPlayer.set(groupPlayer.playerId, {
                        totalMatches: 0,
                        wins: 0,
                        losses: 0,
                        setsWon: 0,
                        setsLost: 0,
                    });
                });

                matches.forEach((match) => {
                    const player1Stats = statsByPlayer.get(match.player1Id);
                    const player2Stats = statsByPlayer.get(match.player2Id);

                    if (player1Stats) {
                        player1Stats.totalMatches += 1;
                        if (match.winnerId === match.player1Id) player1Stats.wins += 1;
                        if (match.winnerId === match.player2Id) player1Stats.losses += 1;
                        player1Stats.setsWon += match.gamesP1 ?? 0;
                        player1Stats.setsLost += match.gamesP2 ?? 0;
                    }

                    if (player2Stats) {
                        player2Stats.totalMatches += 1;
                        if (match.winnerId === match.player2Id) player2Stats.wins += 1;
                        if (match.winnerId === match.player1Id) player2Stats.losses += 1;
                        player2Stats.setsWon += match.gamesP2 ?? 0;
                        player2Stats.setsLost += match.gamesP1 ?? 0;
                    }
                });

                const response = groupPlayers
                    .map((groupPlayer) => {
                        const stats = statsByPlayer.get(groupPlayer.playerId) ?? {
                            totalMatches: 0,
                            wins: 0,
                            losses: 0,
                            setsWon: 0,
                            setsLost: 0,
                        };
                        const average = stats.setsWon - stats.setsLost;
                        const winPercentage = stats.totalMatches > 0
                            ? (stats.wins / stats.totalMatches) * 100
                            : 0;

                        return {
                            playerId: groupPlayer.playerId,
                            playerName: groupPlayer.player.name,
                            nickname: groupPlayer.player.nickname,
                            currentGroup: null,
                            totalMatches: stats.totalMatches,
                            wins: stats.wins,
                            losses: stats.losses,
                            draws: 0,
                            winPercentage: parseFloat(winPercentage.toFixed(2)),
                            setsWon: stats.setsWon,
                            setsLost: stats.setsLost,
                            average,
                        };
                    })
                    .sort((a, b) => {
                        const aIdx = rankingIndex.get(a.playerId) ?? Number.MAX_SAFE_INTEGER;
                        const bIdx = rankingIndex.get(b.playerId) ?? Number.MAX_SAFE_INTEGER;
                        if (aIdx !== bIdx) return aIdx - bIdx;
                        return a.playerName.localeCompare(b.playerName);
                    });

                cacheService.set(cacheKey, response, 24);
                return response;
            }

            // Build match filter
            const matchWhere: any = {
                matchStatus: 'PLAYED', // Only count played matches
                gamesP1: { not: null },
                gamesP2: { not: null },
            };

            if (groupId) {
                matchWhere.groupId = groupId;
            } else if (seasonId) {
                matchWhere.group = {
                    seasonId,
                };
            }

            if (startDate || endDate) {
                matchWhere.date = {};
                if (startDate) {
                    matchWhere.date.gte = new Date(startDate);
                }
                if (endDate) {
                    matchWhere.date.lte = new Date(endDate);
                }
            }

            if (opponentId) {
                matchWhere.OR = [
                    { player1Id: opponentId },
                    { player2Id: opponentId },
                ];
            }

            // Get players based on groupId filter
            let players;
            if (groupId) {
                // If filtering by group, get only players in that group
                const groupPlayers = await prisma.groupPlayer.findMany({
                    where: {
                        groupId,
                        player: {
                            user: {
                                isActive: true,
                            },
                        },
                    },
                    include: { player: true }
                });
                players = groupPlayers.map(gp => gp.player);
                fastify.log.info({ groupId, playerCount: players.length }, 'Players found in group');
            } else {
                // Otherwise get all players
                players = await prisma.player.findMany({
                    where: {
                        user: {
                            isActive: true,
                        },
                    },
                });
            }

            // Get all matches with filters
            const matches = await prisma.match.findMany({
                where: matchWhere,
            });

            // Get current groups for all players (only if not filtering by groupId)
            const playersWithGroups = groupId 
                ? players.map(p => ({ ...p, currentGroup: null }))
                : await Promise.all(
                    players.map(async (player) => {
                        const currentGroup = await getPlayerCurrentGroup(player.id);
                        return { ...player, currentGroup };
                    })
                );

            // Calculate statistics for each player
            const classification = playersWithGroups.map(player => {
                // Filter matches for this player
                let playerMatches = matches.filter(
                    m => m.player1Id === player.id || m.player2Id === player.id
                );

                // If opponentId is specified, further filter to only matches against that opponent
                if (opponentId) {
                    playerMatches = playerMatches.filter(
                        m =>
                            (m.player1Id === player.id && m.player2Id === opponentId) ||
                            (m.player2Id === player.id && m.player1Id === opponentId)
                    );
                }

                const totalMatches = playerMatches.length;
                const wins = playerMatches.filter(m => m.winnerId === player.id).length;
                const losses = playerMatches.filter(
                    m => m.winnerId && m.winnerId !== player.id
                ).length;
                const draws = playerMatches.filter(m => !m.winnerId).length;

                let setsWon = 0;
                let setsLost = 0;

                playerMatches.forEach(match => {
                    // Solo contar partidos con resultado
                    if (match.gamesP1 !== null && match.gamesP2 !== null) {
                        if (match.player1Id === player.id) {
                            setsWon += match.gamesP1;
                            setsLost += match.gamesP2;
                        } else {
                            setsWon += match.gamesP2;
                            setsLost += match.gamesP1;
                        }
                    }
                });

                const average = setsWon - setsLost;
                const winPercentage = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

                return {
                    playerId: player.id,
                    playerName: player.name,
                    nickname: player.nickname,
                    currentGroup: player.currentGroup?.name,
                    totalMatches,
                    wins,
                    losses,
                    draws,
                    winPercentage: parseFloat(winPercentage.toFixed(2)),
                    setsWon,
                    setsLost,
                    average,
                };
            });

            // Sort by wins (desc), win percentage, average, then alphabetically.
            // Players with 0 total matches always go last.
            const sorted = classification.sort((a, b) => {
                const aHasPlayed = a.totalMatches > 0;
                const bHasPlayed = b.totalMatches > 0;
                if (aHasPlayed !== bHasPlayed) {
                    return aHasPlayed ? -1 : 1;
                }
                if (b.wins !== a.wins) {
                    return b.wins - a.wins;
                }
                if (b.winPercentage !== a.winPercentage) {
                    return b.winPercentage - a.winPercentage;
                }
                if (b.average !== a.average) {
                    return b.average - a.average;
                }
                // If all stats are equal, sort alphabetically by name
                return a.playerName.localeCompare(b.playerName);
            });

            // Filter out players with no matches ONLY if not filtering by groupId
            // When viewing a specific group, show all players even if they haven't played
            const filtered = groupId ? sorted : sorted.filter(p => p.totalMatches > 0);

            fastify.log.info({ 
                groupId, 
                totalClassification: classification.length, 
                afterFilter: filtered.length 
            }, 'Classification results');

            cacheService.set(cacheKey, filtered, 24);

            return filtered;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
