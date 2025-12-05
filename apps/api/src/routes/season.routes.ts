import { FastifyInstance } from 'fastify';
import { prisma } from '@freesquash/database';
import { z } from 'zod';
import { computeSeasonClosure } from '../services/ranking.service';
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
            const seasons = await prisma.season.findMany({
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
                    groups: { include: { groupPlayers: { include: { player: true } }, _count: { select: { matches: true } } } },
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
                    }
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

            const body = request.body as { entries: Array<{ id: string; movementType: string; toGroupId: string | null }> };

            // Update each entry
            await prisma.$transaction(
                body.entries.map(entry =>
                    prisma.seasonClosureEntry.update({
                        where: { id: entry.id },
                        data: {
                            movementType: entry.movementType as any,
                            toGroupId: entry.toGroupId
                        }
                    })
                )
            );

            // Return updated closure
            const closure = await prisma.seasonClosure.findUnique({
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

            return closure;
        } catch (error) {
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
                for (const entry of closure.entries) {
                    // Ya no es necesario actualizar currentGroupId - se calcula dinámicamente
                    await tx.playerGroupHistory.create({
                        data: {
                            playerId: entry.playerId,
                            seasonId: id,
                            groupId: entry.toGroupId ?? entry.fromGroupId ?? null,
                            finalRank: entry.finalRank,
                            movementType: entry.movementType,
                        }
                    });
                }
                await tx.seasonClosure.update({
                    where: { id: closure.id },
                    data: { status: 'APPROVED', approvedAt: new Date() }
                });
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
                        data: { name: g.name, seasonId: newSeason.id }
                    });
                    newGroups.push(newGroup);
                }

                // Import players if closure is approved
                if (season.closure && season.closure.status === 'APPROVED' && season.closure.entries.length > 0) {
                    for (const entry of season.closure.entries) {
                        // Verificar si el usuario del jugador está activo
                        const player = await tx.player.findUnique({
                            where: { id: entry.playerId },
                            include: { user: { select: { isActive: true } } }
                        });

                        // Solo importar jugadores con usuario activo
                        if (!player || !player.user.isActive) {
                            continue; // Saltar jugadores desactivados
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
                                await tx.groupPlayer.create({
                                    data: {
                                        playerId: entry.playerId,
                                        groupId: newGroup.id
                                    }
                                });
                            }
                        }
                    }
                }

                return newSeason;
            });

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
            await prisma.season.delete({ where: { id } });
            return { success: true };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
