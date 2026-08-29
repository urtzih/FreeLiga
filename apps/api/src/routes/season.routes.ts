import { FastifyInstance } from 'fastify';
import { prisma } from '@freesquash/database';
import { z } from 'zod';
import { computeSeasonClosure } from '../services/ranking.service';
import { cacheService } from '../services/cache.service';
import { addMonths } from '../utils/date';

const createSeasonSchema = z.object({
    name: z.string().min(1),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
});

export async function seasonRoutes(fastify: FastifyInstance) {
    // List all seasons
    fastify.get('/', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            // Set no-cache headers for admin endpoints
            reply.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            reply.header('Pragma', 'no-cache');
            reply.header('Expires', '0');
            
            // Return all seasons for authenticated users so historical filters work
            const whereClause = {};
            
            const seasons = await prisma.season.findMany({
                where: whereClause,
                include: { groups: { include: { _count: { select: { groupPlayers: true, matches: true } } } }, closure: true },
                orderBy: { startDate: 'desc' },
            });
            return seasons;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Get season by ID
    fastify.get('/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const season = await prisma.season.findUnique({
                where: { id },
                include: {
                    groups: { 
                        include: { 
                            groupPlayers: { include: { player: true } },
                            matches: {
                                where: { matchStatus: 'PLAYED' },
                                select: {
                                    id: true,
                                    player1Id: true,
                                    player2Id: true,
                                    winnerId: true,
                                    matchStatus: true,
                                }
                            },
                            _count: { select: { matches: true } } 
                        } 
                    },
                    closure: {
                        include: {
                            entries: {
                                include: {
                                    player: {
                                        include: { user: { select: { isActive: true, id: true } } }
                                    },
                                    fromGroup: true,
                                    toGroup: true
                                }
                            }
                        }
                    },
                    nextSeasons: {
                        select: { id: true, name: true, startDate: true, endDate: true },
                        orderBy: { createdAt: 'asc' },
                    },
                },
            });
            if (!season) return reply.status(404).send({ error: 'Season not found' });
            return season;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Create season
    fastify.post('/', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            if (decoded.role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });
            const body = createSeasonSchema.parse(request.body);
            const season = await prisma.season.create({
                data: { name: body.name, startDate: new Date(body.startDate), endDate: new Date(body.endDate) }
            });
            return season;
        } catch (error) {
            if (error instanceof z.ZodError) return reply.status(400).send({ error: error.errors });
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Update season
    fastify.put('/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };
            if (decoded.role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });
            const body = createSeasonSchema.parse(request.body);
            const season = await prisma.season.update({
                where: { id },
                data: { name: body.name, startDate: new Date(body.startDate), endDate: new Date(body.endDate) }
            });
            return season;
        } catch (error) {
            if (error instanceof z.ZodError) return reply.status(400).send({ error: error.errors });
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Set active season (only one can be active)
    fastify.post('/:id/set-active', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };
            if (decoded.role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });

            await prisma.$transaction(async (tx) => {
                // Desactivar todas las temporadas
                await tx.season.updateMany({
                    data: { isActive: false }
                });
                // Activar solo esta
                await tx.season.update({
                    where: { id },
                    data: { isActive: true }
                });
            });

            // Invalidar cache público automáticamente
            cacheService.invalidatePattern('public:');
            cacheService.invalidatePattern('private:');
            fastify.log.info(`🔄 All caches invalidated after season change to ${id}`);

            const season = await prisma.season.findUnique({ where: { id } });
            return season;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // GET closure - fetch existing or compute new
    fastify.get('/:id/closure', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };
            if (decoded.role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });

            // Try to get existing closure
            let closure = await prisma.seasonClosure.findUnique({
                where: { seasonId: id },
                include: {
                    entries: {
                        include: {
                            player: { include: { user: { select: { isActive: true, id: true } } } },
                            fromGroup: true,
                            toGroup: true
                        }
                    }
                }
            });

            // If doesn't exist, or if entries lack matchesWon, compute it
            if (!closure || (closure.entries && closure.entries.length > 0 && closure.entries[0].matchesWon === null)) {
                closure = await computeSeasonClosure(id);
            }

            return closure;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // PUT closure/entries - update manual changes
    fastify.put('/:id/closure/entries', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };
            if (decoded.role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });

            const body = z.object({
                entries: z.array(z.object({
                    id: z.string().min(1),
                    movementType: z.enum(['STAY', 'PROMOTION', 'RELEGATION']),
                    toGroupId: z.string().min(1).nullable(),
                })).min(1),
            }).parse(request.body);

            const closure = await prisma.seasonClosure.findUnique({
                where: { seasonId: id },
                include: {
                    entries: {
                        include: { player: { include: { user: { select: { isActive: true } } } } },
                    },
                    season: { include: { groups: true } },
                },
            });

            if (!closure) return reply.status(404).send({ error: 'Propuesta no encontrada' });
            if (closure.status !== 'PENDING') {
                return reply.status(400).send({ error: 'Una propuesta aprobada ya no se puede editar' });
            }

            const entryIds = new Set(body.entries.map(entry => entry.id));
            if (entryIds.size !== body.entries.length || body.entries.length !== closure.entries.length) {
                return reply.status(400).send({ error: 'La propuesta debe incluir una única actualización para cada jugador' });
            }

            const existingById = new Map(closure.entries.map(entry => [entry.id, entry]));
            const orderedGroups = [...closure.season.groups].sort((a, b) =>
                a.name.localeCompare(b.name, 'es', { numeric: true, sensitivity: 'base' })
            );
            const groupIndexById = new Map(orderedGroups.map((group, index) => [group.id, index]));

            const normalizedEntries = body.entries.map(entry => {
                const existing = existingById.get(entry.id);
                if (!existing || !existing.fromGroupId) {
                    throw new Error('INVALID_CLOSURE_ENTRY');
                }

                const fromIndex = groupIndexById.get(existing.fromGroupId);
                if (fromIndex === undefined) throw new Error('INVALID_FROM_GROUP');

                const isEligible = existing.player.user.isActive && existing.player.competitionStatus === 'ACTIVE';
                if (!isEligible && entry.movementType !== 'STAY') {
                    throw new Error('INELIGIBLE_PLAYER_MOVEMENT');
                }

                if (entry.movementType === 'STAY') {
                    return { ...entry, toGroupId: null };
                }

                const targetIndex = entry.movementType === 'PROMOTION' ? fromIndex - 1 : fromIndex + 1;
                const expectedGroupId = orderedGroups[targetIndex]?.id;
                if (!expectedGroupId || entry.toGroupId !== expectedGroupId) {
                    throw new Error('INVALID_MOVEMENT_TARGET');
                }

                return entry;
            });

            await prisma.$transaction(
                normalizedEntries.map(entry =>
                    prisma.seasonClosureEntry.update({
                        where: { id: entry.id },
                        data: {
                            movementType: entry.movementType,
                            toGroupId: entry.toGroupId
                        }
                    })
                )
            );

            // Return updated closure
            const updatedClosure = await prisma.seasonClosure.findUnique({
                where: { seasonId: id },
                include: {
                    entries: {
                        include: {
                            player: { include: { user: { select: { isActive: true, id: true } } } },
                            fromGroup: true,
                            toGroup: true
                        }
                    }
                }
            });

            return updatedClosure;
        } catch (error: any) {
            if (error instanceof z.ZodError) return reply.status(400).send({ error: error.errors });
            const validationErrors: Record<string, string> = {
                INVALID_CLOSURE_ENTRY: 'La propuesta contiene jugadores que no pertenecen a este cierre',
                INVALID_FROM_GROUP: 'El grupo de origen no pertenece a esta temporada',
                INELIGIBLE_PLAYER_MOVEMENT: 'Los jugadores inactivos o en nevera deben permanecer sin movimiento',
                INVALID_MOVEMENT_TARGET: 'Los ascensos y descensos solo pueden hacerse al grupo adyacente',
            };
            if (validationErrors[error?.message]) {
                return reply.status(400).send({ error: validationErrors[error.message] });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Add a new player entry to the closure (e.g., inactive or without group)
    fastify.post('/:id/closure/entries/add', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };
            if (decoded.role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });

            const body = z.object({
                playerId: z.string().min(1),
                toGroupId: z.string().min(1),
                movementType: z.enum(['STAY', 'PROMOTION', 'RELEGATION']).optional()
            }).parse(request.body);

            // Ensure closure exists
            let closure = await prisma.seasonClosure.findUnique({ where: { seasonId: id } });
            if (!closure) {
                closure = await prisma.seasonClosure.create({ data: { seasonId: id, status: 'PENDING' } });
            }
            if (closure.status !== 'PENDING') {
                return reply.status(400).send({ error: 'Una propuesta aprobada ya no se puede editar' });
            }

            const [targetGroup, player, existingEntry] = await Promise.all([
                prisma.group.findFirst({ where: { id: body.toGroupId, seasonId: id }, select: { id: true } }),
                prisma.player.findUnique({
                    where: { id: body.playerId },
                    include: { user: { select: { isActive: true } } },
                }),
                prisma.seasonClosureEntry.findFirst({
                    where: { closureId: closure.id, playerId: body.playerId },
                    select: { id: true },
                }),
            ]);

            if (!targetGroup) return reply.status(400).send({ error: 'El grupo destino no pertenece a esta temporada' });
            if (!player) return reply.status(404).send({ error: 'Jugador no encontrado' });
            if (!player.user.isActive || player.competitionStatus !== 'ACTIVE') {
                return reply.status(400).send({ error: 'El jugador debe estar activo y fuera de la nevera' });
            }
            if (existingEntry) return reply.status(409).send({ error: 'El jugador ya está incluido en la propuesta' });

            // Determine a final rank placing this player at the end of the target group list
            const rank = (await prisma.seasonClosureEntry.count({
                where: { closureId: closure.id, fromGroupId: body.toGroupId }
            })) + 1;

            const created = await prisma.seasonClosureEntry.create({
                data: {
                    closureId: closure.id,
                    playerId: body.playerId,
                    fromGroupId: body.toGroupId,
                    toGroupId: body.toGroupId,
                    movementType: body.movementType || 'STAY',
                    finalRank: rank,
                    matchesWon: 0,
                },
                include: {
                    player: { include: { user: { select: { isActive: true, id: true } } } },
                    fromGroup: true,
                    toGroup: true
                }
            });

            return created;
        } catch (error) {
            if (error instanceof z.ZodError) return reply.status(400).send({ error: error.errors });
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Preview / generate closure
    fastify.post('/:id/closure/preview', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };
            if (decoded.role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });
            const closure = await computeSeasonClosure(id);
            return closure;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Approve closure
    fastify.post('/:id/closure/approve', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };
            if (decoded.role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });
            const closure = await prisma.seasonClosure.findUnique({
                where: { seasonId: id },
                include: { entries: true }
            });
            if (!closure) return reply.status(404).send({ error: 'Closure not found' });
            if (closure.status === 'APPROVED') return closure;

            // Aplicar movimientos y crear historiales
            await prisma.$transaction(async tx => {
                // Usar createMany en lugar de loop para mejor rendimiento
                await tx.playerGroupHistory.createMany({
                    data: closure.entries.map(entry => ({
                        playerId: entry.playerId,
                        seasonId: id,
                        groupId: entry.toGroupId ?? entry.fromGroupId ?? null,
                        finalRank: entry.finalRank,
                        movementType: entry.movementType,
                    }))
                });
                
                await tx.seasonClosure.update({
                    where: { id: closure.id },
                    data: { status: 'APPROVED', approvedAt: new Date() }
                });
            }, {
                timeout: 15000 // Aumentar timeout a 15 segundos para manejar muchos jugadores
            });

            const updated = await prisma.seasonClosure.findUnique({
                where: { seasonId: id },
                include: {
                    entries: {
                        include: {
                            player: { include: { user: { select: { isActive: true, id: true } } } },
                            fromGroup: true,
                            toGroup: true
                        }
                    }
                }
            });
            return updated;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Reopen an approved closure, removing only the history created by that approval.
    fastify.post('/:id/closure/reopen', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };
            if (decoded.role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });

            const reset = await prisma.$transaction(async (tx) => {
                const season = await tx.season.findUnique({
                    where: { id },
                    include: {
                        closure: { include: { entries: true } },
                        nextSeasons: {
                            include: {
                                groups: { select: { id: true } },
                                closure: { select: { id: true } },
                                nextSeasons: { select: { id: true } },
                            },
                            orderBy: { createdAt: 'asc' },
                        },
                    },
                });

                if (!season) throw new Error('SEASON_NOT_FOUND');
                if (!season.closure) throw new Error('CLOSURE_NOT_FOUND');
                if (season.closure.status !== 'APPROVED') throw new Error('CLOSURE_NOT_APPROVED');
                if (season.nextSeasons.length > 1) throw new Error('MULTIPLE_NEXT_SEASONS');

                const nextSeason = season.nextSeasons[0] ?? null;
                if (nextSeason) {
                    const nextGroupIds = nextSeason.groups.map(group => group.id);
                    const [matches, histories, stats, promotionRecords] = await Promise.all([
                        tx.match.count({ where: { groupId: { in: nextGroupIds } } }),
                        tx.playerGroupHistory.count({ where: { seasonId: nextSeason.id } }),
                        tx.playerSeasonStats.count({ where: { seasonId: nextSeason.id } }),
                        nextGroupIds.length > 0
                            ? tx.promotionRecord.count({
                                where: {
                                    OR: [
                                        { fromGroupId: { in: nextGroupIds } },
                                        { toGroupId: { in: nextGroupIds } },
                                    ],
                                },
                            })
                            : Promise.resolve(0),
                    ]);

                    if (nextSeason.isActive) throw new Error('NEXT_SEASON_ACTIVE');
                    if (nextSeason.closure) throw new Error('NEXT_SEASON_HAS_CLOSURE');
                    if (nextSeason.nextSeasons.length > 0) throw new Error('NEXT_SEASON_HAS_SUCCESSOR');
                    if (matches > 0) throw new Error('NEXT_SEASON_HAS_MATCHES');
                    if (histories > 0 || stats > 0 || promotionRecords > 0) {
                        throw new Error('NEXT_SEASON_HAS_HISTORY');
                    }
                }

                const approvalHistories = await tx.playerGroupHistory.findMany({
                    where: { seasonId: id },
                    select: {
                        id: true,
                        playerId: true,
                        groupId: true,
                        finalRank: true,
                        movementType: true,
                    },
                });

                if (approvalHistories.length !== season.closure.entries.length) {
                    throw new Error('APPROVAL_HISTORY_MISMATCH');
                }

                const historyBySignature = new Map<string, string[]>();
                for (const history of approvalHistories) {
                    const signature = [
                        history.playerId,
                        history.groupId ?? '',
                        history.finalRank ?? '',
                        history.movementType ?? '',
                    ].join('|');
                    const ids = historyBySignature.get(signature) ?? [];
                    ids.push(history.id);
                    historyBySignature.set(signature, ids);
                }

                const historyIds: string[] = [];
                for (const entry of season.closure.entries) {
                    const signature = [
                        entry.playerId,
                        entry.toGroupId ?? entry.fromGroupId ?? '',
                        entry.finalRank,
                        entry.movementType,
                    ].join('|');
                    const ids = historyBySignature.get(signature);
                    if (!ids || ids.length !== 1) throw new Error('APPROVAL_HISTORY_MISMATCH');
                    historyIds.push(ids[0]);
                    historyBySignature.delete(signature);
                }

                if (historyBySignature.size > 0) throw new Error('APPROVAL_HISTORY_MISMATCH');

                if (nextSeason) {
                    await tx.season.delete({ where: { id: nextSeason.id } });
                }
                await tx.playerGroupHistory.deleteMany({ where: { id: { in: historyIds } } });
                // Dejar la propuesta limpia para que el recálculo posterior no
                // conserve movimientos de la aprobación anterior.
                await tx.seasonClosureEntry.deleteMany({ where: { closureId: season.closure.id } });
                await tx.seasonClosure.update({
                    where: { id: season.closure.id },
                    data: { status: 'PENDING', approvedAt: null },
                });

                return {
                    deletedSeason: nextSeason
                        ? { id: nextSeason.id, name: nextSeason.name }
                        : null,
                    deletedHistoryCount: historyIds.length,
                };
            }, { timeout: 30000 });

            // El recálculo actualiza el ranking de todos los grupos y puede
            // superar el timeout de una transacción interactiva en Railway.
            // La reversión queda protegida por la transacción corta anterior;
            // si el recálculo falla, la propuesta permanece PENDING y se puede
            // volver a generar sin repetir la eliminación del historial.
            let closure;
            try {
                closure = await computeSeasonClosure(id);
            } catch (error) {
                fastify.log.error(error, 'Closure reopened but recalculation failed');
                throw new Error('CLOSURE_RECALCULATION_FAILED');
            }

            cacheService.invalidatePattern('public:');
            cacheService.invalidatePattern('private:');
            return { ...reset, closure };
        } catch (error: any) {
            const errors: Record<string, { status: number; message: string }> = {
                SEASON_NOT_FOUND: { status: 404, message: 'Temporada no encontrada' },
                CLOSURE_NOT_FOUND: { status: 404, message: 'Propuesta no encontrada' },
                CLOSURE_NOT_APPROVED: { status: 409, message: 'Solo se puede reabrir una propuesta aprobada' },
                MULTIPLE_NEXT_SEASONS: { status: 409, message: 'Hay varias temporadas generadas desde este cierre y no se puede determinar cuál eliminar' },
                NEXT_SEASON_ACTIVE: { status: 409, message: 'No se puede reabrir porque la temporada siguiente está activa' },
                NEXT_SEASON_HAS_CLOSURE: { status: 409, message: 'No se puede reabrir porque la temporada siguiente ya tiene un cierre' },
                NEXT_SEASON_HAS_SUCCESSOR: { status: 409, message: 'No se puede reabrir porque la temporada siguiente ya generó otra temporada' },
                NEXT_SEASON_HAS_MATCHES: { status: 409, message: 'No se puede reabrir porque la temporada siguiente contiene partidos' },
                NEXT_SEASON_HAS_HISTORY: { status: 409, message: 'No se puede reabrir porque la temporada siguiente contiene datos históricos' },
                APPROVAL_HISTORY_MISMATCH: { status: 409, message: 'El historial no coincide exactamente con esta aprobación. No se ha modificado ningún dato' },
                CLOSURE_RECALCULATION_FAILED: { status: 503, message: 'La propuesta se ha reabierto, pero no se pudo recalcular. Puedes volver a generar la propuesta' },
            };
            const knownError = errors[error?.message];
            if (knownError) return reply.status(knownError.status).send({ error: knownError.message });
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Error interno al reabrir la propuesta' });
        }
    });

    // Rollover season -> create next season cloning groups and importing players
    fastify.post('/:id/rollover', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };
            if (decoded.role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });
            const body = (request.body as any) || {};
            const nMonths: number = parseInt(body.nMonths || '3');

            const season = await prisma.season.findUnique({
                where: { id },
                include: {
                    groups: { orderBy: { name: 'asc' } },
                    closure: { include: { entries: true } }
                }
            });

            if (!season) return reply.status(404).send({ error: 'Season not found' });
            if (!season.closure || season.closure.status !== 'APPROVED') {
                return reply.status(400).send({ error: 'Debes aprobar la propuesta antes de generar la siguiente temporada' });
            }

            const existingNextSeason = await prisma.season.findFirst({
                where: { previousSeasonId: id },
                select: { id: true, name: true, startDate: true, endDate: true },
                orderBy: { createdAt: 'asc' },
            });
            if (existingNextSeason) {
                return reply.status(409).send({
                    error: `Ya existe una temporada generada desde este cierre: ${existingNextSeason.name}`,
                    season: existingNextSeason,
                });
            }

            // Derive next season name intelligently
            const newStart = addMonths(season.startDate, nMonths);
            const newEnd = addMonths(season.endDate, nMonths);
            const startYear = newStart.getFullYear();
            const endYear = newEnd.getFullYear();
            const monthSpan = (newEnd.getMonth() - newStart.getMonth() + 12 * (endYear - startYear)) + 1;

            let newName: string;
            if (startYear !== endYear) {
                newName = `${startYear}-${endYear}`;
            } else {
                newName = `${startYear} (${monthSpan}m)`;
            }

            // Avoid name collision
            let finalName = newName;
            let counter = 2;
            while (await prisma.season.findFirst({ where: { name: finalName } })) {
                finalName = `${newName} #${counter}`;
                counter++;
                if (counter > 10) break;
            }

            // Create new season and groups, then assign players
            // Pre-fetch active players to avoid queries inside transaction
            let eligiblePlayers: Set<string> = new Set();
            if (season.closure && season.closure.status === 'APPROVED' && season.closure.entries.length > 0) {
                const playerIds = season.closure.entries.map(e => e.playerId);
                const players = await prisma.player.findMany({
                    where: { 
                        id: { in: playerIds },
                        competitionStatus: 'ACTIVE',
                        user: { isActive: true }
                    },
                    select: { id: true }
                });
                eligiblePlayers = new Set(players.map(p => p.id));
            }

            const next = await prisma.$transaction(async (tx) => {
                // Create season
                const newSeason = await tx.season.create({
                    data: {
                        name: finalName,
                        startDate: newStart,
                        endDate: newEnd,
                        previousSeasonId: season.id
                    }
                });

                // Clone groups
                const newGroups: any[] = [];
                for (const g of season.groups) {
                    const newGroup = await tx.group.create({
                        data: { 
                            name: g.name, 
                            seasonId: newSeason.id,
                            whatsappUrl: g.whatsappUrl
                        }
                    });
                    newGroups.push(newGroup);
                }

                // Import players if closure is approved
                if (season.closure && season.closure.status === 'APPROVED' && season.closure.entries.length > 0) {
                    const groupPlayerData: any[] = [];
                    
                    for (const entry of season.closure.entries) {
                        // Verificar si el jugador está activo (ya pre-filtrado)
                        if (!eligiblePlayers.has(entry.playerId)) {
                            continue;
                        }

                        // Find target group in new season
                        const targetGroupName = entry.toGroupId
                            ? season.groups.find(g => g.id === entry.toGroupId)?.name
                            : entry.fromGroupId
                                ? season.groups.find(g => g.id === entry.fromGroupId)?.name
                                : null;

                        if (targetGroupName) {
                            const newGroup = newGroups.find(g => g.name === targetGroupName);
                            if (newGroup) {
                                groupPlayerData.push({
                                    playerId: entry.playerId,
                                    groupId: newGroup.id
                                });
                            }
                        }
                    }

                    // Batch insert all group players
                    if (groupPlayerData.length > 0) {
                        await tx.groupPlayer.createMany({
                            data: groupPlayerData,
                            skipDuplicates: true
                        });
                    }
                }

                return newSeason;
            }, {
                timeout: 20000 // Aumentar timeout a 20 segundos para el rollover
            });

            // Invalidate all caches to ensure fresh data
            cacheService.invalidatePattern('public:');
            cacheService.invalidatePattern('private:');

            const created = await prisma.season.findUnique({
                where: { id: next.id },
                include: { groups: { include: { groupPlayers: { include: { player: true } } } } }
            });

            return created;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Delete season (admin)
    fastify.delete('/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };
            if (decoded.role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });
            
            // Check if season exists
            const season = await prisma.season.findUnique({
                where: { id },
                include: {
                    groups: {
                        include: {
                            _count: {
                                select: {
                                    groupPlayers: true,
                                    matches: true,
                                }
                            }
                        }
                    },
                    closure: true,
                }
            });

            if (!season) {
                return reply.status(404).send({ error: 'Temporada no encontrada' });
            }

            const totalPlayers = season.groups.reduce((sum, group) => sum + group._count.groupPlayers, 0);
            const totalMatches = season.groups.reduce((sum, group) => sum + group._count.matches, 0);

            // Protect season history when it already has match data
            if (totalMatches > 0) {
                return reply.status(400).send({
                    error: 'No se puede eliminar esta temporada porque contiene:\n\n' +
                           '• ' + season.groups.length + ' grupo(s)\n' +
                           '• ' + totalPlayers + ' inscripción(es) de jugadores\n' +
                           '• ' + totalMatches + ' partido(s)\n\n' +
                           'Para proteger el historial de la liga, no se pueden eliminar temporadas con partidos registrados. ' +
                           'Si deseas ocultar esta temporada, márcala como inactiva en lugar de eliminarla.'
                });
            }

            // Check if season has closure (historical data)
            if (season.closure) {
                return reply.status(400).send({
                    error: 'No se puede eliminar esta temporada porque tiene un cierre de temporada guardado con datos históricos de ascensos/descensos.\n\n' +
                           'Para proteger el historial de la liga, no se pueden eliminar temporadas cerradas.'
                });
            }

            const groupIds = season.groups.map(group => group.id);
            const [historyEntriesCount, promotionRecordsCount] = await Promise.all([
                prisma.playerGroupHistory.count({ where: { seasonId: id } }),
                groupIds.length > 0
                    ? prisma.promotionRecord.count({
                        where: {
                            OR: [
                                { fromGroupId: { in: groupIds } },
                                { toGroupId: { in: groupIds } },
                            ],
                        },
                    })
                    : Promise.resolve(0),
            ]);

            if (historyEntriesCount > 0 || promotionRecordsCount > 0) {
                return reply.status(400).send({
                    error: 'No se puede eliminar esta temporada porque tiene datos históricos asociados.\n\n' +
                           '• Historial de jugadores: ' + historyEntriesCount + '\n' +
                           '• Registros de ascenso/descenso: ' + promotionRecordsCount + '\n\n' +
                           'Para proteger el historial de la liga, no se pueden eliminar temporadas con historial.'
                });
            }

            await prisma.$transaction(async (tx) => {
                // Avoid FK conflict in season rollover chain
                await tx.season.updateMany({
                    where: { previousSeasonId: id },
                    data: { previousSeasonId: null },
                });

                await tx.season.delete({ where: { id } });
            });

            cacheService.invalidatePattern('public:');
            cacheService.invalidatePattern('private:');

            return {
                success: true,
                deleted: {
                    groups: season.groups.length,
                    groupPlayers: totalPlayers,
                    matches: totalMatches,
                }
            };
        } catch (error: any) {
            fastify.log.error(error);
            
            // Handle foreign key constraint errors
            if (error.code === 'P2003') {
                return reply.status(400).send({
                    error: 'No se puede eliminar esta temporada porque tiene datos históricos relacionados (partidos, cierres o referencias cruzadas).'
                });
            }
            
            return reply.status(500).send({ error: 'Error interno del servidor' });
        }
    });
}
