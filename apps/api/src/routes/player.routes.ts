import { FastifyInstance } from 'fastify';
import { prisma } from '@freesquash/database';

export async function playerRoutes(fastify: FastifyInstance) {
    // Get all players
    fastify.get('/', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const players = await prisma.player.findMany({
                include: {
                    currentGroup: {
                        include: {
                            season: true,
                        },
                    },
                    groupPlayers: {
                        include: {
                            group: true,
                        },
                    },
                },
            });

            return players;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Get player by ID with statistics
    fastify.get('/:id', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };

            const player = await prisma.player.findUnique({
                where: { id },
                include: {
                    currentGroup: {
                        include: {
                            season: true,
                        },
                    },
                    user: {
                        select: {
                            email: true,
                            role: true,
                        },
                    },
                },
            });

            if (!player) {
                return reply.status(404).send({ error: 'Player not found' });
            }

            return player;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Get player statistics
    fastify.get('/:id/stats', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };

            // Get all matches for this player
            const matches = await prisma.match.findMany({
                where: {
                    OR: [
                        { player1Id: id },
                        { player2Id: id },
                    ],
                    matchStatus: 'PLAYED', // Only count played matches
                },
                include: {
                    player1: true,
                    player2: true,
                    winner: true,
                },
            });

            // Calculate statistics
            const wins = matches.filter(m => m.winnerId === id).length;
            const losses = matches.filter(m => m.winnerId && m.winnerId !== id).length;
            const totalMatches = wins + losses;
            const winPercentage = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

            // Calculate sets won and lost
            let setsWon = 0;
            let setsLost = 0;

            matches.forEach(match => {
                if (match.player1Id === id) {
                    setsWon += match.gamesP1;
                    setsLost += match.gamesP2;
                } else {
                    setsWon += match.gamesP2;
                    setsLost += match.gamesP1;
                }
            });

            const averas = setsWon - setsLost;

            // Calculate current streak
            const sortedMatches = matches
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            let currentStreak = 0;
            let lastResult = '';

            for (const match of sortedMatches) {
                const won = match.winnerId === id;
                const result = won ? 'W' : 'L';

                if (lastResult === '') {
                    lastResult = result;
                    currentStreak = 1;
                } else if (lastResult === result) {
                    currentStreak++;
                } else {
                    break;
                }
            }

            return {
                playerId: id,
                totalMatches,
                wins,
                losses,
                winPercentage: parseFloat(winPercentage.toFixed(2)),
                setsWon,
                setsLost,
                averas,
                currentStreak: lastResult === 'W' ? currentStreak : -currentStreak,
                recentMatches: sortedMatches.slice(0, 5),
            };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Update player (admin only)
    fastify.put('/:id', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };
            const body = request.body as any;

            // Check if user is admin
            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const player = await prisma.player.update({
                where: { id },
                data: {
                    name: body.name,
                    nickname: body.nickname,
                    phone: body.phone,
                    email: body.email,
                },
            });

            return player;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
