import { FastifyInstance } from 'fastify';
import { prisma } from '@freesquash/database';
import { z } from 'zod';
import { calculateGroupRankings } from '../services/ranking.service';
import { getPlayerCurrentGroupId } from '../utils/playerHelpers';
import { logger, logBusinessEvent, logError } from '../utils/logger';
import { GoogleCalendarService } from '../services/googleCalendar.service';
import { MatchSyncService } from '../services/matchSync.service';

const createMatchSchema = z.object({
    groupId: z.string(),
    player1Id: z.string(),
    player2Id: z.string(),
    // Campos de programación
    scheduledDate: z.string().datetime().optional(),
    location: z.string().optional(),
    // Campos de resultado
    date: z.string().datetime().optional(),
    gamesP1: z.number().int().min(0).max(3).optional(),
    gamesP2: z.number().int().min(0).max(3).optional(),
    matchStatus: z.enum(['PLAYED', 'INJURY', 'CANCELLED']).default('PLAYED'),
});

const updateMatchSchema = z.object({
    scheduledDate: z.string().datetime().optional(),
    location: z.string().optional(),
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
            const { groupId, playerId, scheduled, matchStatus, withResults } = request.query as {
                groupId?: string;
                playerId?: string;
                scheduled?: string;
                matchStatus?: string;
                withResults?: string;
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

            // Filtrar por partidos programados (sin resultado)
            if (scheduled === 'true') {
                where.isScheduled = true;
                where.gamesP1 = null; // Sin resultado aún
                where.gamesP2 = null;
            }

            // Filtrar solo los que tienen resultado
            if (withResults === 'true') {
                where.gamesP1 = { not: null };
                where.gamesP2 = { not: null };
            }

            // Filtrar por estado del partido
            if (matchStatus) {
                where.matchStatus = matchStatus;
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
                orderBy: [
                    { scheduledDate: 'asc' },
                    { date: 'desc' },
                ],
            });

            console.log('📊 GET /matches query:', { groupId, playerId, scheduled, matchStatus });
            console.log('📊 Matches found:', matches.length);
            console.log('📊 First 3 matches:', matches.slice(0, 3).map(m => ({
                id: m.id,
                player1: m.player1.name,
                player2: m.player2.name,
                scheduledDate: m.scheduledDate,
                isScheduled: m.isScheduled,
                gamesP1: m.gamesP1,
                gamesP2: m.gamesP2,
                matchStatus: m.matchStatus
            })));

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
            const decoded = request.user as any;

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

            // Check if match already exists between these two players in this group (ignore scheduled without result so they can be reused)
            const existingMatch = await prisma.match.findFirst({
                where: {
                    groupId: body.groupId,
                    OR: [
                        { player1Id: body.player1Id, player2Id: body.player2Id },
                        { player1Id: body.player2Id, player2Id: body.player1Id }
                    ],
                    NOT: {
                        AND: [
                            { isScheduled: true },
                            { gamesP1: null },
                            { gamesP2: null }
                        ]
                    }
                }
            });

            if (existingMatch) {
                return reply.status(400).send({ error: 'Ya existe un partido registrado entre estos jugadores en este grupo' });
            }

            // Determine winner (only for PLAYED matches with scores)
            let winnerId: string | null = null;

            if (body.matchStatus === 'PLAYED' && body.gamesP1 !== undefined && body.gamesP2 !== undefined) {
                const validScore = (body.gamesP1 === 3 && body.gamesP2 >= 0 && body.gamesP2 <= 2) || (body.gamesP2 === 3 && body.gamesP1 >= 0 && body.gamesP1 <= 2);
                if (!validScore) {
                    return reply.status(400).send({ error: 'Resultado inválido: formato permitido 3-0, 3-1, 3-2 (o inverso). Un jugador debe llegar a 3.' });
                }
                if (body.gamesP1 > body.gamesP2) {
                    winnerId = body.player1Id;
                } else if (body.gamesP2 > body.gamesP1) {
                    winnerId = body.player2Id;
                }
            }

            // If result is being recorded, try to reuse an existing scheduled match (same players in the group without result)
            let reusedScheduledMatch = null;
            if (body.matchStatus === 'PLAYED' && body.gamesP1 !== undefined && body.gamesP2 !== undefined) {
                reusedScheduledMatch = await prisma.match.findFirst({
                    where: {
                        groupId: body.groupId,
                        isScheduled: true,
                        gamesP1: null,
                        gamesP2: null,
                        OR: [
                            { player1Id: body.player1Id, player2Id: body.player2Id },
                            { player1Id: body.player2Id, player2Id: body.player1Id },
                        ],
                    },
                    orderBy: [{ scheduledDate: 'asc' }],
                });
            }

            // Determinar datos según si es programado o jugado
            const isScheduled = !!(body.scheduledDate && body.location);
            const matchData: any = {
                group: {
                    connect: { id: body.groupId }
                },
                player1: {
                    connect: { id: body.player1Id }
                },
                player2: {
                    connect: { id: body.player2Id }
                },
                date: body.date ? new Date(body.date) : new Date(),
                isScheduled,
            };

            // Solo agregar campos de programación si es un partido programado
            if (isScheduled) {
                matchData.scheduledDate = new Date(body.scheduledDate!);
                matchData.location = body.location;
                matchData.matchStatus = 'PLAYED'; // Default status
                matchData.googleCalendarSyncStatus = 'NOT_SYNCED';
            }

            // Solo agregar campos de resultado si es un partido jugado
            if (body.matchStatus === 'PLAYED' && body.gamesP1 !== undefined && body.gamesP2 !== undefined) {
                matchData.gamesP1 = body.gamesP1;
                matchData.gamesP2 = body.gamesP2;
                matchData.matchStatus = body.matchStatus;
                if (winnerId) {
                    matchData.winner = {
                        connect: { id: winnerId }
                    };
                }
            }

            // If there is a scheduled match, update it with the result instead of creating a new one
            const match = reusedScheduledMatch
                ? await prisma.match.update({
                    where: { id: reusedScheduledMatch.id },
                    data: {
                        gamesP1: body.gamesP1,
                        gamesP2: body.gamesP2,
                        winner: winnerId ? { connect: { id: winnerId } } : undefined,
                        matchStatus: body.matchStatus,
                        date: body.date ? new Date(body.date) : reusedScheduledMatch.date,
                        isScheduled: false,
                    },
                    include: {
                        player1: true,
                        player2: true,
                        winner: true,
                    },
                })
                : await prisma.match.create({
                    data: matchData,
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
                isScheduled: match.isScheduled,
            }, 'Match created successfully');

            logBusinessEvent('match_created', {
                matchId: match.id,
                groupId: body.groupId,
                isScheduled: match.isScheduled,
                scheduledDate: body.scheduledDate,
            });

            // Sincronizar con Google Calendar si está programado
            if (match.isScheduled) {
                try {
                    const integration = await GoogleCalendarService.getIntegration(decoded.id);
                    if (integration) {
                        await MatchSyncService.syncMatchToGoogleCalendar(match.id, decoded.id);
                    }
                } catch (error) {
                    logger.error({ error, matchId: match.id }, 'Failed to sync with Google Calendar');
                }
            }

            // Recalculate rankings if match was PLAYED with scores
            if (body.matchStatus === 'PLAYED' && body.gamesP1 !== undefined && body.gamesP2 !== undefined) {
                await calculateGroupRankings(body.groupId);
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
            const decoded = request.user as any;

            const existingMatch = await prisma.match.findUnique({
                where: { id },
                include: {
                    player1: true,
                    player2: true,
                },
            });

            if (!existingMatch) {
                return reply.status(404).send({ error: 'Match not found' });
            }

            // Check permissions: Solo los jugadores del partido pueden editar o admin
            if (decoded.role !== 'ADMIN') {
                if (!decoded.playerId || (decoded.playerId !== existingMatch.player1Id && decoded.playerId !== existingMatch.player2Id)) {
                    return reply.status(403).send({ error: 'No tienes permiso para editar este partido' });
                }
            }

            // Determine new winner if games are updated
            let winnerId = existingMatch.winnerId;
            const gamesP1 = body.gamesP1 ?? existingMatch.gamesP1;
            const gamesP2 = body.gamesP2 ?? existingMatch.gamesP2;
            const matchStatus = body.matchStatus ?? existingMatch.matchStatus;
            const scheduledDateChanged = body.scheduledDate && new Date(body.scheduledDate).getTime() !== (existingMatch.scheduledDate?.getTime() ?? 0);
            const locationChanged = body.location !== undefined && body.location !== existingMatch.location;

            if (matchStatus === 'PLAYED' && gamesP1 !== null && gamesP2 !== null) {
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
            
            const isScheduled = !!(body.scheduledDate || existingMatch.scheduledDate) && !!(body.location || existingMatch.location);
            
            const match = await prisma.match.update({
                where: { id },
                data: {
                    gamesP1: body.gamesP1 !== undefined ? body.gamesP1 : existingMatch.gamesP1,
                    gamesP2: body.gamesP2 !== undefined ? body.gamesP2 : existingMatch.gamesP2,
                    winnerId,
                    matchStatus,
                    date: body.date ? new Date(body.date) : existingMatch.date,
                    scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : existingMatch.scheduledDate,
                    location: body.location !== undefined ? body.location : existingMatch.location,
                    isScheduled,
                },
                include: {
                    player1: true,
                    player2: true,
                    winner: true,
                },
            });

            // Sincronizar cambios con Google Calendar
            if ((scheduledDateChanged || locationChanged) && match.googleEventId) {
                try {
                    await MatchSyncService.updateMatchInGoogleCalendar(id, decoded.id);
                } catch (error) {
                    logger.error({ error, matchId: id }, 'Failed to sync update to Google Calendar');
                }
            }

            // Recalculate rankings if score changed
            if ((body.gamesP1 !== undefined || body.gamesP2 !== undefined) && matchStatus === 'PLAYED') {
                await calculateGroupRankings(existingMatch.groupId);
            }

            logBusinessEvent('match_updated', {
                matchId: id,
                userId: decoded.id,
                scheduledDateChanged,
                locationChanged,
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

            const isAdmin = decoded.role === 'ADMIN';
            const isPlayerInMatch = match.player1Id === decoded.playerId || match.player2Id === decoded.playerId;

            if (!isAdmin && !isPlayerInMatch) {
                return reply.status(403).send({ error: 'No tienes permiso para eliminar este partido' });
            }

            if (!isAdmin) {
                const currentGroupId = await getPlayerCurrentGroupId(decoded.playerId);
                if (!currentGroupId || match.groupId !== currentGroupId) {
                    return reply.status(403).send({ error: 'Solo puedes eliminar partidos de tu grupo activo' });
                }
            }

            const groupId = match.groupId;

            // Eliminar de Google Calendar si existe
            if (match.googleEventId) {
                try {
                    await MatchSyncService.deleteMatchFromGoogleCalendar(id, decoded.id);
                } catch (error) {
                    logger.error({ error, matchId: id }, 'Failed to delete from Google Calendar');
                }
            }

            await prisma.match.delete({
                where: { id },
            });

            logger.info({ matchId: id, groupId }, 'Match deleted');
            logBusinessEvent('match_deleted', {
                matchId: id,
                groupId,
                hasGoogleEvent: !!match.googleEventId,
            });

            await calculateGroupRankings(groupId);

            return { success: true };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
