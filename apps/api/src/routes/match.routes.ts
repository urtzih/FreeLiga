import { FastifyInstance } from 'fastify';
import { prisma } from '@freesquash/database';
import { z } from 'zod';
import { calculateGroupRankings } from '../services/ranking.service';
import { cacheService } from '../services/cache.service';
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
    notes: z.string().max(200).optional(),
    // Campos de resultado
    date: z.string().datetime().optional(),
    gamesP1: z.number().int().min(0).max(3).optional(),
    gamesP2: z.number().int().min(0).max(3).optional(),
    matchStatus: z.enum(['PLAYED', 'INJURY', 'CANCELLED']).default('PLAYED'),
});

const updateMatchSchema = z.object({
    scheduledDate: z.string().datetime().optional(),
    location: z.string().optional(),
    notes: z.string().max(200).nullable().optional(),
    date: z.string().datetime().optional(),
    gamesP1: z.number().int().min(0).max(3).optional(),
    gamesP2: z.number().int().min(0).max(3).optional(),
    matchStatus: z.enum(['PLAYED', 'INJURY', 'CANCELLED']).optional(),
});

const markInjurySchema = z.object({
    playerId: z.string().optional(),
});

export async function matchRoutes(fastify: FastifyInstance) {
    const invalidatePlayerCache = (playerId: string) => {
        cacheService.invalidate(`private:player:${playerId}:profile`);
        cacheService.invalidate(`private:player:${playerId}:stats`);
        cacheService.invalidate(`private:player:${playerId}:progress`);
        cacheService.invalidate(`private:player:${playerId}:matches-by-date`);
        cacheService.invalidate(`private:player:${playerId}:movements`);
    };

    const invalidateMatchRelatedCache = async (groupId: string) => {
        cacheService.invalidate(`private:group:${groupId}:detail`);
        cacheService.invalidatePattern(`^private:classification:[^:]*:${groupId}:`);
        cacheService.invalidatePattern('^private:classification:[^:]*:all:');
    };

    const runDetachedTask = (
        taskName: string,
        task: () => Promise<void>,
        context: Record<string, unknown> = {}
    ) => {
        queueMicrotask(() => {
            void task().catch((error) => {
                logger.error({ error, taskName, ...context }, 'Background task failed');
            });
        });
    };

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

            where.player1 = {
                user: {
                    isActive: true,
                },
            };
            where.player2 = {
                user: {
                    isActive: true,
                },
            };

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

            logger.debug({
                groupId,
                playerId,
                scheduled,
                matchStatus,
                resultCount: matches.length
            }, 'Matches fetched');

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

            // Check if match already exists between these two players in this group
            // Allow if: (1) no match exists, (2) match is pending (for recording result), or (3) it's an admin recording a result
            const isAdmin = decoded.role === 'ADMIN';
            const existingMatch = await prisma.match.findFirst({
                where: {
                    groupId: body.groupId,
                    OR: [
                        { player1Id: body.player1Id, player2Id: body.player2Id },
                        { player1Id: body.player2Id, player2Id: body.player1Id }
                    ],
                }
            });

            // If a match exists, check if it's pending and the request is to record a result
            if (existingMatch) {
                const isPendingMatch = !existingMatch.gamesP1 && !existingMatch.gamesP2;
                const isRecordingResult = body.matchStatus === 'PLAYED' && body.gamesP1 !== undefined && body.gamesP2 !== undefined;
                
                // Allow: pending match being recorded OR admin creating new match entry
                if (!isPendingMatch && !isAdmin) {
                    return reply.status(400).send({ error: 'Ya existe un partido registrado entre estos jugadores en este grupo. Solo los administradores pueden crear múltiples partidos entre los mismos jugadores.' });
                }
                
                // If recording result and there's a pending match, the update logic will reuse it
                if (isPendingMatch && isRecordingResult) {
                    // This is OK - we'll update the pending match below
                } else if (!isPendingMatch && isAdmin) {
                    // Admin can create a new match even if one exists with result
                } else if (isPendingMatch && !isRecordingResult) {
                    // This would create a duplicate, prevent it
                    return reply.status(400).send({ error: 'Ya existe un partido pendiente entre estos jugadores. Registra el resultado del partido existente.' });
                }
            }


            // Determine winner (only for PLAYED matches with scores)
            let winnerId: string | null = null;
            const isRecordingResult = body.matchStatus === 'PLAYED' && body.gamesP1 !== undefined && body.gamesP2 !== undefined;

            if (isRecordingResult) {
                const gamesP1 = body.gamesP1 as number;
                const gamesP2 = body.gamesP2 as number;
                const validScore = (gamesP1 === 3 && gamesP2 >= 0 && gamesP2 <= 2) || (gamesP2 === 3 && gamesP1 >= 0 && gamesP1 <= 2);
                if (!validScore) {
                    return reply.status(400).send({ error: 'Resultado inválido: formato permitido 3-0, 3-1, 3-2 (o inverso). Un jugador debe llegar a 3.' });
                }
                if (gamesP1 > gamesP2) {
                    winnerId = body.player1Id;
                } else if (gamesP2 > gamesP1) {
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
                if (body.notes) {
                    matchData.notes = body.notes;
                }
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

            // Invalidate only match-related cache keys
            await invalidateMatchRelatedCache(body.groupId);
            invalidatePlayerCache(body.player1Id);
            invalidatePlayerCache(body.player2Id);
            fastify.log.info({ matchId: match.id }, 'Cache invalidated after match creation');

            // Sincronizar con Google Calendar solo para partidos programados (nunca al registrar resultado)
            if (match.isScheduled && !isRecordingResult) {
                runDetachedTask(
                    'sync_match_to_google_calendar_after_create',
                    async () => {
                        const integration = await GoogleCalendarService.getIntegration(decoded.id);
                        if (integration) {
                            await MatchSyncService.syncMatchToGoogleCalendar(match.id, decoded.id);
                        }
                    },
                    { matchId: match.id, userId: decoded.id }
                );
            }

            // Recalculate rankings in background to reduce response time
            if (isRecordingResult) {
                runDetachedTask(
                    'recalculate_group_rankings_after_match_create',
                    async () => {
                        await calculateGroupRankings(body.groupId);
                    },
                    { matchId: match.id, groupId: body.groupId }
                );
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
            const isRecordingResult = (body.gamesP1 !== undefined || body.gamesP2 !== undefined) && matchStatus === 'PLAYED';
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

            // Sincronizar cambios con Google Calendar solo para cambios de programación, nunca al registrar resultado
            if ((scheduledDateChanged || locationChanged) && match.googleEventId && match.isScheduled && !isRecordingResult) {
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

            // Invalidate only match-related cache keys
            await invalidateMatchRelatedCache(existingMatch.groupId);
            invalidatePlayerCache(existingMatch.player1Id);
            invalidatePlayerCache(existingMatch.player2Id);
            fastify.log.info({ matchId: id }, 'Cache invalidated after match update');

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

    // Mark player as injured for active season (self or admin)
    fastify.post('/mark-injury', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const body = markInjurySchema.parse(request.body || {});

            const targetPlayerId = body.playerId ?? decoded.playerId;
            if (!targetPlayerId) {
                return reply.status(400).send({ error: 'PlayerId is required' });
            }

            if (body.playerId && decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const currentGroup = await getPlayerCurrentGroupId(targetPlayerId);
            if (!currentGroup) {
                return reply.status(404).send({ error: 'Player has no active group' });
            }

            const group = await prisma.group.findUnique({
                where: { id: currentGroup },
                include: {
                    groupPlayers: true,
                },
            });

            if (!group) {
                return reply.status(404).send({ error: 'Group not found' });
            }

            const expectedMatches = Math.max(group.groupPlayers.length - 1, 0);

            const playerMatches = await prisma.match.findMany({
                where: {
                    groupId: group.id,
                    OR: [
                        { player1Id: targetPlayerId },
                        { player2Id: targetPlayerId },
                    ],
                },
                include: {
                    player1: { select: { id: true, userId: true } },
                    player2: { select: { id: true, userId: true } },
                },
            });

            const playedMatches = playerMatches.filter((m) =>
                m.matchStatus === 'PLAYED' && m.gamesP1 !== null && m.gamesP2 !== null
            ).length;

            const isPartialMode = playedMatches > expectedMatches / 2;

            const matchesToUpdate = isPartialMode
                ? playerMatches.filter((m) =>
                    m.gamesP1 === null ||
                    m.gamesP2 === null ||
                    m.isScheduled ||
                    !!m.scheduledDate ||
                    !!m.googleEventId
                )
                : playerMatches;

            let updatedCount = 0;
            for (const match of matchesToUpdate) {
                if (match.googleEventId) {
                    const candidateUserIds = [
                        decoded.id,
                        match.player1?.userId,
                        match.player2?.userId,
                    ].filter(Boolean) as string[];

                    for (const userId of candidateUserIds) {
                        try {
                            await MatchSyncService.deleteMatchFromGoogleCalendar(match.id, userId);
                            break;
                        } catch (error) {
                            logger.warn({ error, matchId: match.id, userId }, 'Failed to delete match from Google Calendar');
                        }
                    }
                }

                await prisma.match.update({
                    where: { id: match.id },
                    data: {
                        matchStatus: 'INJURY',
                        gamesP1: null,
                        gamesP2: null,
                        winnerId: null,
                        isScheduled: false,
                        scheduledDate: null,
                        location: null,
                        notes: null,
                        googleEventId: null,
                        googleCalendarSyncStatus: null,
                    },
                });
                updatedCount += 1;
            }

            const opponentIds = group.groupPlayers
                .map((gp) => gp.playerId)
                .filter((id) => id !== targetPlayerId);

            const missingOpponentIds = opponentIds.filter((opponentId) => {
                return !playerMatches.some((m) =>
                    (m.player1Id === targetPlayerId && m.player2Id === opponentId) ||
                    (m.player1Id === opponentId && m.player2Id === targetPlayerId)
                );
            });

            let createdCount = 0;
            if (missingOpponentIds.length > 0) {
                const createData = missingOpponentIds.map((opponentId) => ({
                    groupId: group.id,
                    player1Id: targetPlayerId,
                    player2Id: opponentId,
                    matchStatus: 'INJURY' as const,
                    gamesP1: null,
                    gamesP2: null,
                    winnerId: null,
                    isScheduled: false,
                    date: new Date(),
                }));

                await prisma.match.createMany({ data: createData });
                createdCount = createData.length;
            }

            await calculateGroupRankings(group.id);
            await invalidateMatchRelatedCache(group.id);

            logger.info({
                playerId: targetPlayerId,
                groupId: group.id,
                expectedMatches,
                playedMatches,
                mode: isPartialMode ? 'partial' : 'total',
                updatedCount,
                createdCount,
            }, 'Player marked as injured');

            return {
                mode: isPartialMode ? 'partial' : 'total',
                expectedMatches,
                playedMatches,
                updatedCount,
                createdCount,
            };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            logger.error({ error }, 'Failed to mark player as injured');
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

            await invalidateMatchRelatedCache(groupId);
            invalidatePlayerCache(match.player1Id);
            invalidatePlayerCache(match.player2Id);
            fastify.log.info({ matchId: id }, 'Cache invalidated after match delete');

            return { success: true };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}

