import { FastifyInstance } from 'fastify';
import { prisma } from '@freesquash/database';
import { z } from 'zod';
import { calculateGroupRankings } from '../services/ranking.service';
import { getPlayerCurrentGroupId } from '../utils/playerHelpers';
import { logger, logBusinessEvent, logError } from '../utils/logger';

const createMatchSchema = z.object({
    groupId: z.string(),
    player1Id: z.string(),
    player2Id: z.string(),
    date: z.string().datetime().optional(),
    gamesP1: z.number().int().min(0).max(3),
    gamesP2: z.number().int().min(0).max(3),
    matchStatus: z.enum(['PLAYED', 'INJURY', 'CANCELLED']).default('PLAYED'),
});

const updateMatchSchema = z.object({
    date: z.string().datetime().optional(),
    gamesP1: z.number().int().min(0).max(3).optional(),
    gamesP2: z.number().int().min(0).max(3).optional(),
    matchStatus: z.enum(['PLAYED', 'INJURY', 'CANCELLED']).optional(),
});

export async function matchRoutes(fastify: FastifyInstance) {
    // Get all matches
    fastify.get('/', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const { groupId, playerId } = request.query as {
                groupId?: string;
                playerId?: string;
            };

            const where: any = {};

            if (groupId) {
                where.groupId = groupId;
            }

            if (playerId) {
                where.OR = [
                    { player1Id: playerId },
                    { player2Id: playerId },
                ];
            }

            const matches = await prisma.match.findMany({
                where,
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
                orderBy: {
                    date: 'desc',
                },
            });

            return matches;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Get match by ID
    fastify.get('/:id', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };

            const match = await prisma.match.findUnique({
                where: { id },
                include: {
                    player1: true,
                    player2: true,
                    winner: true,
                    group: true,
                },
            });

            if (!match) {
                return reply.status(404).send({ error: 'Match not found' });
            }

            return match;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Create match
    fastify.post('/', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const body = createMatchSchema.parse(request.body);

            // Validate that players are different
            if (body.player1Id === body.player2Id) {
                return reply.status(400).send({ error: 'Players must be different' });
            }

            // Validate that both players are in the group
            const groupPlayers = await prisma.groupPlayer.findMany({
                where: {
                    groupId: body.groupId,
                    playerId: {
                        in: [body.player1Id, body.player2Id],
                    },
                },
            });

            if (groupPlayers.length !== 2) {
                return reply.status(400).send({ error: 'Both players must be in the group' });
            }

            // Check if match already exists between these two players in this group
            const existingMatch = await prisma.match.findFirst({
                where: {
                    groupId: body.groupId,
                    OR: [
                        { player1Id: body.player1Id, player2Id: body.player2Id },
                        { player1Id: body.player2Id, player2Id: body.player1Id }
                    ]
                }
            });

            if (existingMatch) {
                return reply.status(400).send({ error: 'Ya existe un partido registrado entre estos jugadores en este grupo' });
            }

            // Determine winner (only for PLAYED matches)
            let winnerId: string | null = null;

            if (body.matchStatus === 'PLAYED') {
                // Enforce best-of-5: one player must reach 3, other 0-2
                const validScore = (body.gamesP1 === 3 && body.gamesP2 >= 0 && body.gamesP2 <= 2) || (body.gamesP2 === 3 && body.gamesP1 >= 0 && body.gamesP1 <= 2);
                if (!validScore) {
                    return reply.status(400).send({ error: 'Resultado inválido: formato permitido 3-0, 3-1, 3-2 (o inverso). Un jugador debe llegar a 3.' });
                }
                if (body.gamesP1 > body.gamesP2) {
                    winnerId = body.player1Id;
                } else if (body.gamesP2 > body.gamesP1) {
                    winnerId = body.player2Id;
                }
                // If equal, it's a draw (winnerId remains null)
            }

            // Create match
            const match = await prisma.match.create({
                data: {
                    groupId: body.groupId,
                    player1Id: body.player1Id,
                    player2Id: body.player2Id,
                    date: body.date ? new Date(body.date) : new Date(),
                    gamesP1: body.gamesP1,
                    gamesP2: body.gamesP2,
                    winnerId,
                    matchStatus: body.matchStatus,
                },
                include: {
                    player1: true,
                    player2: true,
                    winner: true,
                },
            });

            logger.info({ 
                matchId: match.id, 
                groupId: body.groupId,
                player1Id: body.player1Id,
                player2Id: body.player2Id,
                matchStatus: body.matchStatus,
            }, 'Match created successfully');

            logBusinessEvent('match_created', {
                matchId: match.id,
                groupId: body.groupId,
                player1: match.player1.name,
                player2: match.player2.name,
                score: `${body.gamesP1}-${body.gamesP2}`,
                winner: match.winner?.name,
                matchStatus: body.matchStatus,
            });

            // Recalculate rankings if match was PLAYED
            if (body.matchStatus === 'PLAYED') {
                await calculateGroupRankings(body.groupId);
                logger.info({ groupId: body.groupId }, 'Rankings recalculated after match creation');
            }

            return match;
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Update match
    fastify.put('/:id', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        
        try {
            const body = updateMatchSchema.parse(request.body);

            const existingMatch = await prisma.match.findUnique({
                where: { id },
            });

            if (!existingMatch) {
                return reply.status(404).send({ error: 'Match not found' });
            }

            // Check permissions: Admin or one of the players involved
            const decoded = request.user as any;
            if (decoded.role !== 'ADMIN') {
                // For non-admin users, they must be one of the players in the match
                if (!decoded.playerId || (decoded.playerId !== existingMatch.player1Id && decoded.playerId !== existingMatch.player2Id)) {
                    return reply.status(403).send({ error: 'No tienes permiso para editar este partido' });
                }
            }

            // Determine new winner if games are updated
            let winnerId = existingMatch.winnerId;
            const gamesP1 = body.gamesP1 ?? existingMatch.gamesP1;
            const gamesP2 = body.gamesP2 ?? existingMatch.gamesP2;
            const matchStatus = body.matchStatus ?? existingMatch.matchStatus;

            if (matchStatus === 'PLAYED') {
                const validScore = (gamesP1 === 3 && gamesP2 >= 0 && gamesP2 <= 2) || (gamesP2 === 3 && gamesP1 >= 0 && gamesP1 <= 2);
                if (!validScore) {
                    return reply.status(400).send({ error: 'Resultado inválido: formato permitido 3-0, 3-1, 3-2 (o inverso). Un jugador debe llegar a 3.' });
                }
                if (gamesP1 > gamesP2) {
                    winnerId = existingMatch.player1Id;
                } else if (gamesP2 > gamesP1) {
                    winnerId = existingMatch.player2Id;
                } else {
                    winnerId = null;
                }
            } else {
                winnerId = null;
            }

            logger.info({ matchId: id, userId: decoded.id }, 'Updating match');
            const match = await prisma.match.update({
                where: { id },
                data: {
                    gamesP1,
                    gamesP2,
                    winnerId,
                    matchStatus,
                    date: body.date ? new Date(body.date) : existingMatch.date,
                },
                include: {
                    player1: true,
                    player2: true,
                    winner: true,
                },
            });
            logger.info({ matchId: id }, 'Match updated in DB');

            // Recalculate rankings
            logger.info({ groupId: existingMatch.groupId }, 'Recalculating rankings for group');
            await calculateGroupRankings(existingMatch.groupId);
            logger.info({ groupId: existingMatch.groupId }, 'Rankings recalculated');

            logBusinessEvent('match_updated', {
                matchId: id,
                userId: decoded.id,
                groupId: existingMatch.groupId,
                gamesP1,
                gamesP2,
                matchStatus,
            });

            return match;
        } catch (error) {
            logError(error, { matchId: id, operation: 'update_match' });
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Delete match (admin or player from their active group)
    fastify.delete('/:id', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };

            const match = await prisma.match.findUnique({
                where: { id },
                include: {
                    player1: true,
                    player2: true,
                },
            });

            if (!match) {
                return reply.status(404).send({ error: 'Match not found' });
            }

            // Allow deletion if:
            // 1. User is admin, OR
            // 2. User is one of the players AND the match is in their current/active group
            const isAdmin = decoded.role === 'ADMIN';
            const isPlayerInMatch = match.player1Id === decoded.playerId || match.player2Id === decoded.playerId;

            if (!isAdmin && !isPlayerInMatch) {
                return reply.status(403).send({ error: 'No tienes permiso para eliminar este partido' });
            }

            // If not admin, verify it's from their active group
            if (!isAdmin) {
                const currentGroupId = await getPlayerCurrentGroupId(decoded.playerId);

                if (!currentGroupId || match.groupId !== currentGroupId) {
                    return reply.status(403).send({ error: 'Solo puedes eliminar partidos de tu grupo activo' });
                }
            }

            const groupId = match.groupId;

            await prisma.match.delete({
                where: { id },
            });

            logger.info({ matchId: id, groupId }, 'Match deleted');
            logBusinessEvent('match_deleted', {
                matchId: id,
                groupId,
                player1: match.player1.name,
                player2: match.player2.name,
                deletedBy: decoded.id,
            });

            // Recalculate rankings
            await calculateGroupRankings(groupId);

            return { success: true };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
