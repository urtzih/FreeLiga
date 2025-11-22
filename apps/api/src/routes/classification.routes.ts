import { FastifyInstance } from 'fastify';
import { prisma } from '@freesquash/database';

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

            // Get all players
            const players = await prisma.player.findMany({
                include: {
                    currentGroup: true,
                },
            });

            // Get all matches with filters
            const matches = await prisma.match.findMany({
                where: matchWhere,
            });

            // Calculate statistics for each player
            const classification = players.map(player => {
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
                    if (match.player1Id === player.id) {
                        setsWon += match.gamesP1;
                        setsLost += match.gamesP2;
                    } else {
                        setsWon += match.gamesP2;
                        setsLost += match.gamesP1;
                    }
                });

                const averas = setsWon - setsLost;
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
                    averas,
                };
            });

            // Sort by wins (descending), then by win percentage, then by averás
            const sorted = classification.sort((a, b) => {
                if (b.wins !== a.wins) {
                    return b.wins - a.wins;
                }
                if (b.winPercentage !== a.winPercentage) {
                    return b.winPercentage - a.winPercentage;
                }
                return b.averas - a.averas;
            });

            // Filter out players with no matches (optional, depending on requirement)
            const filtered = sorted.filter(p => p.totalMatches > 0);

            return filtered;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
