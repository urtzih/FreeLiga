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
                            endDate: { gte: now },
                        },
                    },
                }),
                prisma.season.findFirst({
                    where: {
                        endDate: { gte: now },
                    },
                    orderBy: {
                        startDate: 'asc',
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

    // Reparar currentGroupId de todos los jugadores (admin only)
    fastify.post('/repair-current-groups', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const now = new Date();
            // Temporada activa (la que comprende la fecha actual) o la última por fecha de inicio
            const seasons = await prisma.season.findMany({ orderBy: { startDate: 'asc' } });
            if (seasons.length === 0) {
                return { updated: 0, already: 0, totalPlayersWithActiveGroup: 0, message: 'No hay temporadas' };
            }
            const active = seasons.find(s => s.startDate <= now && s.endDate >= now) || seasons[seasons.length - 1];

            // Grupos y relaciones de la temporada activa
            const groupPlayersActive = await prisma.groupPlayer.findMany({
                where: { group: { seasonId: active.id } },
                include: { player: true, group: true }
            });

            const desiredMap: Record<string, { groupId: string; groupName: string }> = {};
            for (const gp of groupPlayersActive) {
                if (!desiredMap[gp.playerId]) {
                    desiredMap[gp.playerId] = { groupId: gp.groupId, groupName: gp.group.name };
                }
            }

            let updated = 0; let already = 0;
            for (const playerId of Object.keys(desiredMap)) {
                const player = await prisma.player.findUnique({ where: { id: playerId } });
                if (!player) continue;
                const desired = desiredMap[playerId].groupId;
                if (player.currentGroupId === desired) {
                    already++; continue;
                }
                await prisma.player.update({ where: { id: playerId }, data: { currentGroupId: desired } });
                updated++;
            }

            return {
                seasonUsed: active.name,
                updated,
                already,
                totalPlayersWithActiveGroup: Object.keys(desiredMap).length,
            };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
