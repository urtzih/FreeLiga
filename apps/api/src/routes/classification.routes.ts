import { FastifyInstance } from 'fastify';
import { prisma } from '@freesquash/database';
import { getPlayerCurrentGroup } from '../utils/playerHelpers';

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

            // Build match filter
            const matchWhere: any = {
                matchStatus: 'PLAYED', // Only count played matches
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
                    where: { groupId },
                    include: { player: true }
                });
                players = groupPlayers.map(gp => gp.player);
                fastify.log.info({ groupId, playerCount: players.length }, 'Players found in group');
            } else {
                // Otherwise get all players
                players = await prisma.player.findMany();
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

            // Sort by wins (descending), then by win percentage, then by average, then alphabetically
            const sorted = classification.sort((a, b) => {
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

            return filtered;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
