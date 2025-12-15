import { FastifyInstance } from 'fastify';
import { prisma } from '@freesquash/database';

export async function adminRoutes(fastify: FastifyInstance) {
    // Get admin statistics (admin only)
    fastify.get('/stats', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;

            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            // Get counts
            // Consideramos "activos" todos los grupos cuya temporada aún no ha terminado (endDate >= hoy).
            // Si todavía no ha llegado startDate, los tratamos como próximos pero se cuentan igualmente.
            const now = new Date();
            const [
                totalPlayers,
                totalGroups,
                totalSeasons,
                totalMatches,
                activeGroups,
                activeSeason,
            ] = await Promise.all([
                prisma.player.count(),
                prisma.group.count(),
                prisma.season.count(),
                prisma.match.count(),
                prisma.group.count({
                    where: {
                        season: {
                            isActive: true,
                        },
                    },
                }),
                prisma.season.findFirst({
                    where: {
                        isActive: true,
                    },
                    include: {
                        groups: {
                            include: {
                                _count: {
                                    select: {
                                        groupPlayers: true,
                                        matches: true,
                                    },
                                },
                            },
                        },
                    },
                }),
            ]);

            // Get recent matches across all groups
            const recentMatches = await prisma.match.findMany({
                take: 10,
                orderBy: {
                    date: 'desc',
                },
                include: {
                    player1: true,
                    player2: true,
                    winner: true,
                    group: {
                        include: {
                            season: true,
                        },
                    },
                },
            });

            return {
                totals: {
                    players: totalPlayers,
                    groups: totalGroups,
                    seasons: totalSeasons,
                    matches: totalMatches,
                    activeGroups,
                },
                activeSeason,
                recentMatches,
            };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });



    // Get player history (registration and activity timeline)
    fastify.get('/player-history', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;

            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            // Get all users with their players and group history
            const users = await prisma.user.findMany({
                include: {
                    player: {
                        include: {
                            groupHistories: {
                                include: {
                                    season: true,
                                    group: true,
                                },
                                orderBy: {
                                    createdAt: 'desc',
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            // Format response
            const playerHistory = users
                .filter(u => u.player) // Only users with player records
                .map(u => ({
                    playerId: u.player!.id,
                    playerName: u.player!.name,
                    email: u.email,
                    isActive: u.isActive,
                    registeredAt: u.createdAt,
                    seasonHistories: u.player!.groupHistories.map(gh => ({
                        season: gh.season.name,
                        seasonId: gh.season.id,
                        group: gh.group?.name || null,
                        finalRank: gh.finalRank,
                        movement: gh.movementType,
                        createdAt: gh.createdAt,
                    })),
                }));

            return playerHistory;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}