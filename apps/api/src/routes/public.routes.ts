/**
 * Public API Routes - Sin autenticación
 * Endpoints públicos para partidos recientes, grupos y clasificación con caché de 24h
 */

import { FastifyInstance } from 'fastify';
import { prisma } from '@freesquash/database';
import { cacheService } from '../services/cache.service';
import { getGroupRankings } from '../services/ranking.service';

export async function publicRoutes(fastify: FastifyInstance) {
    /**
     * GET /api/public/recent-matches
     * Obtener últimos 10 partidos jugados (sin autenticación)
     */
    fastify.get('/recent-matches', async (request, reply) => {
        try {
            // Intentar obtener del caché
            const cached = cacheService.get<any>('public:recent-matches');
            if (cached) {
                fastify.log.info('📦 Recent matches from cache');
                return cached;
            }

            // Obtener últimos 10 partidos con resultado
            const matches = await prisma.match.findMany({
                where: {
                    matchStatus: 'PLAYED',
                    gamesP1: { not: null },
                    gamesP2: { not: null },
                },
                include: {
                    player1: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    player2: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    group: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    winner: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: {
                    date: 'desc',
                },
                take: 10,
            });

            const response = {
                data: matches,
                cached: false,
                updatedAt: new Date().toISOString(),
            };

            // Guardar en caché por 24h
            cacheService.set('public:recent-matches', response, 24);
            fastify.log.info('💾 Recent matches cached for 24h');

            return response;
        } catch (error) {
            fastify.log.error(error, 'Error fetching recent matches');
            return reply.status(500).send({ error: 'Failed to fetch recent matches' });
        }
    });

    /**
     * GET /api/public/groups-summary
     * Obtener resumen de todos los grupos con clasificación (sin autenticación)
     */
    fastify.get('/groups-summary', async (request, reply) => {
        try {
            // Intentar obtener del caché
            const cached = cacheService.get<any>('public:groups-summary');
            if (cached) {
                fastify.log.info('📦 Groups summary from cache');
                return cached;
            }

            // Obtener temporada activa
            const activeSeason = await prisma.season.findFirst({
                where: { isActive: true },
                orderBy: { startDate: 'desc' },
            });

            if (!activeSeason) {
                return reply.status(404).send({ error: 'No active season' });
            }

            // Obtener grupos de la temporada activa
            const groups = await prisma.group.findMany({
                where: { seasonId: activeSeason.id },
                include: {
                    groupPlayers: {
                        include: {
                            player: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                        orderBy: {
                            rankingPosition: 'asc',
                        },
                    },
                    matches: {
                        where: {
                            matchStatus: 'PLAYED',
                            gamesP1: { not: null },
                            gamesP2: { not: null },
                        },
                        include: {
                            player1: true,
                            player2: true,
                            winner: true,
                        },
                    },
                },
                orderBy: {
                    name: 'asc',
                },
            });

            // Calcular rankings para cada grupo
            const groupsWithRankings = await Promise.all(
                groups.map(async (group) => {
                    const rankings = await getGroupRankings(group.id);

                    return {
                        id: group.id,
                        name: group.name,
                        playerCount: group.groupPlayers.length,
                        matchCount: group.matches.length,
                        rankings: rankings.slice(0, 5), // Top 5 jugadores
                    };
                })
            );

            const response = {
                seasonName: activeSeason.name,
                groups: groupsWithRankings,
                cached: false,
                updatedAt: new Date().toISOString(),
            };

            // Guardar en caché por 24h
            cacheService.set('public:groups-summary', response, 24);
            fastify.log.info('💾 Groups summary cached for 24h');

            return response;
        } catch (error) {
            fastify.log.error(error, 'Error fetching groups summary');
            return reply.status(500).send({ error: 'Failed to fetch groups summary' });
        }
    });

    /**
     * GET /api/public/group/:id/classification
     * Obtener clasificación completa de un grupo (sin autenticación)
     */
    fastify.get('/group/:id/classification', async (request, reply) => {
        try {
            const { id: groupId } = request.params as { id: string };

            // Intentar obtener del caché
            const cacheKey = `public:group:${groupId}:classification:v2`;
            const cached = cacheService.get<any>(cacheKey);
            if (cached) {
                fastify.log.info(`📦 Group ${groupId} classification from cache`);
                return cached;
            }

            // Obtener grupo
            const group = await prisma.group.findUnique({
                where: { id: groupId },
                include: {
                    groupPlayers: {
                        where: {
                            player: {
                                user: {
                                    isActive: true,
                                },
                            },
                        },
                        include: {
                            player: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                        orderBy: {
                            rankingPosition: 'asc',
                        },
                    },
                    matches: {
                        where: {
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
                        include: {
                            player1: true,
                            player2: true,
                            winner: true,
                        },
                    },
                    season: {
                        select: {
                            name: true,
                        },
                    },
                },
            });

            if (!group) {
                return reply.status(404).send({ error: 'Group not found' });
            }

            // Calcular rankings
            const rankings = await getGroupRankings(groupId);

            const playedMatches = [...group.matches].sort(
                (matchA, matchB) => new Date(matchB.date).getTime() - new Date(matchA.date).getTime()
            );

            const recentMatches = playedMatches.slice(0, 6).map((match) => ({
                id: match.id,
                date: match.date,
                gamesP1: match.gamesP1,
                gamesP2: match.gamesP2,
                player1: {
                    id: match.player1.id,
                    name: match.player1.name,
                },
                player2: {
                    id: match.player2.id,
                    name: match.player2.name,
                },
                winnerId: match.winnerId,
            }));

            const players = group.groupPlayers.map((groupPlayer) => ({
                id: groupPlayer.player.id,
                name: groupPlayer.player.name,
            }));

            const hasPlayedBetween = (playerAId: string, playerBId: string) => {
                return playedMatches.some((match) => (
                    (match.player1Id === playerAId && match.player2Id === playerBId) ||
                    (match.player1Id === playerBId && match.player2Id === playerAId)
                ));
            };

            const remainingMatches: Array<{
                id: string;
                player1: { id: string; name: string };
                player2: { id: string; name: string };
            }> = [];

            for (let indexA = 0; indexA < players.length; indexA++) {
                for (let indexB = indexA + 1; indexB < players.length; indexB++) {
                    const playerA = players[indexA];
                    const playerB = players[indexB];

                    if (!hasPlayedBetween(playerA.id, playerB.id)) {
                        remainingMatches.push({
                            id: `${playerA.id}_${playerB.id}`,
                            player1: playerA,
                            player2: playerB,
                        });
                    }
                }
            }

            const response = {
                id: group.id,
                name: group.name,
                seasonName: group.season.name,
                totalMatches: playedMatches.length,
                rankings,
                recentMatches,
                remainingMatches,
                totalRemainingMatches: remainingMatches.length,
                cached: false,
                updatedAt: new Date().toISOString(),
            };

            // Guardar en caché por 24h
            cacheService.set(cacheKey, response, 24);
            fastify.log.info(`💾 Group ${groupId} classification cached for 24h`);

            return response;
        } catch (error) {
            fastify.log.error(error, 'Error fetching group classification');
            return reply.status(500).send({ error: 'Failed to fetch group classification' });
        }
    });

    /**
     * GET /api/public/stats
     * Obtener estadísticas generales públicas (sin autenticación)
     */
    fastify.get('/stats', async (request, reply) => {
        try {
            // Intentar obtener del caché
            const cached = cacheService.get<any>('public:stats');
            if (cached) {
                fastify.log.info('📦 Stats from cache');
                return cached;
            }

            // Obtener temporada activa
            const activeSeason = await prisma.season.findFirst({
                where: { isActive: true },
                orderBy: { startDate: 'desc' },
            });

            if (!activeSeason) {
                return reply.status(404).send({ error: 'No active season' });
            }

            // Estadísticas
            const totalPlayers = await prisma.player.count();
            const totalMatches = await prisma.match.count({
                where: {
                    matchStatus: 'PLAYED',
                    gamesP1: { not: null },
                    gamesP2: { not: null },
                    group: { seasonId: activeSeason.id },
                },
            });
            const totalGroups = await prisma.group.count({
                where: { seasonId: activeSeason.id },
            });

            const response = {
                seasonName: activeSeason.name,
                totalPlayers,
                totalMatches,
                totalGroups,
                cached: false,
                updatedAt: new Date().toISOString(),
            };

            // Guardar en caché por 24h
            cacheService.set('public:stats', response, 24);
            fastify.log.info('💾 Stats cached for 24h');

            return response;
        } catch (error) {
            fastify.log.error(error, 'Error fetching stats');
            return reply.status(500).send({ error: 'Failed to fetch stats' });
        }
    });

    /**
     * GET /api/public/stats/historical
     * Obtener estadísticas históricas globales (sin autenticación)
     */
    fastify.get('/stats/historical', async (request, reply) => {
        try {
            const cacheKey = 'public:stats:historical';

            // Intentar obtener del caché
            const cached = cacheService.get<any>(cacheKey);
            if (cached) {
                fastify.log.info('📦 Historical stats from cache');
                return cached;
            }

            const [
                totalSeasons,
                totalPlayers,
                activePlayers,
                inactivePlayers,
                totalGroups,
                totalPlayedMatches,
            ] = await Promise.all([
                prisma.season.count(),
                prisma.player.count(),
                prisma.player.count({
                    where: {
                        user: {
                            isActive: true,
                        },
                    },
                }),
                prisma.player.count({
                    where: {
                        user: {
                            isActive: false,
                        },
                    },
                }),
                prisma.group.count(),
                prisma.match.count({
                    where: {
                        matchStatus: 'PLAYED',
                        gamesP1: { not: null },
                        gamesP2: { not: null },
                    },
                }),
            ]);

            const response = {
                totalSeasons,
                totalPlayers,
                activePlayers,
                inactivePlayers,
                totalGroups,
                totalPlayedMatches,
                cached: false,
                updatedAt: new Date().toISOString(),
            };

            // Guardar en caché por 24h
            cacheService.set(cacheKey, response, 24);
            fastify.log.info('💾 Historical stats cached for 24h');

            return response;
        } catch (error) {
            fastify.log.error(error, 'Error fetching historical stats');
            return reply.status(500).send({ error: 'Failed to fetch historical stats' });
        }
    });

    /**
     * Endpoint para invalidar caché (solo para admin, via webhook o interna)
     * Este endpoint se puede llamar cuando se registra un nuevo partido
     */
    fastify.post('/cache/invalidate', async (request, reply) => {
        try {
            const token = request.headers['x-cache-token'];
            const expectedToken = process.env.CACHE_INVALIDATE_TOKEN || 'dev-token';

            if (!token || token !== expectedToken) {
                return reply.status(401).send({ error: 'Unauthorized' });
            }

            // Invalidar caché público
            cacheService.invalidatePattern('public:');
            fastify.log.info('🔄 Public cache invalidated');

            return { success: true, message: 'Cache invalidated' };
        } catch (error) {
            fastify.log.error(error, 'Error invalidating cache');
            return reply.status(500).send({ error: 'Failed to invalidate cache' });
        }
    });

    /**
     * POST /api/public/cache/invalidate/admin
     * Invalidar caché público desde UI admin autenticada
     */
    fastify.post('/cache/invalidate/admin', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            cacheService.invalidatePattern('public:');
            fastify.log.info({ userId: decoded.id }, '🔄 Public cache invalidated by admin UI');

            return {
                success: true,
                message: 'Public cache invalidated',
                scope: 'public',
                invalidatedBy: decoded.id,
                at: new Date().toISOString(),
            };
        } catch (error) {
            fastify.log.error(error, 'Error invalidating cache from admin UI');
            return reply.status(500).send({ error: 'Failed to invalidate cache' });
        }
    });

    /**
     * POST /api/public/cache/invalidate/private/admin
     * Invalidar caché privado desde UI admin autenticada
     */
    fastify.post('/cache/invalidate/private/admin', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            cacheService.invalidatePattern('private:');
            fastify.log.info({ userId: decoded.id }, '🔄 Private cache invalidated by admin UI');

            return {
                success: true,
                message: 'Private cache invalidated',
                scope: 'private',
                invalidatedBy: decoded.id,
                at: new Date().toISOString(),
            };
        } catch (error) {
            fastify.log.error(error, 'Error invalidating private cache from admin UI');
            return reply.status(500).send({ error: 'Failed to invalidate private cache' });
        }
    });

    /**
     * POST /api/public/cache/invalidate/all/admin
     * Invalidar caché público y privado desde UI admin autenticada
     */
    fastify.post('/cache/invalidate/all/admin', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            cacheService.invalidatePattern('public:');
            cacheService.invalidatePattern('private:');
            fastify.log.info({ userId: decoded.id }, '🔄 All cache (public + private) invalidated by admin UI');

            return {
                success: true,
                message: 'All cache invalidated (public + private)',
                scope: 'all',
                invalidatedBy: decoded.id,
                at: new Date().toISOString(),
            };
        } catch (error) {
            fastify.log.error(error, 'Error invalidating all cache from admin UI');
            return reply.status(500).send({ error: 'Failed to invalidate all cache' });
        }
    });

    /**
     * POST /api/public/cache/invalidate/key/:key
     * Invalidar una sola clave de caché
     */
    fastify.post('/cache/invalidate/key/:key', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const { key } = request.params as { key: string };
            const decodedKey = decodeURIComponent(key);

            cacheService.invalidate(decodedKey);
            fastify.log.info({ userId: decoded.id, key: decodedKey }, '🔄 Cache key invalidated by admin UI');

            return {
                success: true,
                message: `Cache key invalidated: ${decodedKey}`,
                invalidatedBy: decoded.id,
                key: decodedKey,
                at: new Date().toISOString(),
            };
        } catch (error) {
            fastify.log.error(error, 'Error invalidating cache key from admin UI');
            return reply.status(500).send({ error: 'Failed to invalidate cache key' });
        }
    });

    /**
     * GET /api/public/cache/stats
     * Información del caché (solo admin)
     */
    fastify.get('/cache/stats', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            return cacheService.getStats();
        } catch (error) {
            fastify.log.error(error, 'Error getting cache stats');
            return reply.status(500).send({ error: 'Failed to get cache stats' });
        }
    });
}
