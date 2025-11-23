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
    fastify.get('/', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const seasons = await prisma.season.findMany({
                include: { groups: { include: { _count: { select: { groupPlayers: true, matches: true } } } }, closure: true },
                orderBy: { startDate: 'desc' },
            });
            return seasons;
        } catch (error) {
            fastify.log.error(error); return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    fastify.get('/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };
            const season = await prisma.season.findUnique({
                where: { id },
                include: {
                    groups: { include: { groupPlayers: { include: { player: true } }, _count: { select: { matches: true } } } },
                    closure: { include: { entries: { include: { player: true, fromGroup: true, toGroup: true } } } }
                },
            });
            if (!season) return reply.status(404).send({ error: 'Season not found' });
            return season;
        } catch (error) {
            fastify.log.error(error); return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    fastify.post('/', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            if (decoded.role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });
            const body = createSeasonSchema.parse(request.body);
            const season = await prisma.season.create({ data: { name: body.name, startDate: new Date(body.startDate), endDate: new Date(body.endDate) } });
            return season;
        } catch (error) {
            if (error instanceof z.ZodError) return reply.status(400).send({ error: error.errors });
            fastify.log.error(error); return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    fastify.put('/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const decoded = request.user as any; const { id } = request.params as { id: string };
            if (decoded.role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });
            const body = createSeasonSchema.parse(request.body);
            const season = await prisma.season.update({ where: { id }, data: { name: body.name, startDate: new Date(body.startDate), endDate: new Date(body.endDate) } });
            return season;
        } catch (error) {
            if (error instanceof z.ZodError) return reply.status(400).send({ error: error.errors });
            fastify.log.error(error); return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Preview / generate closure
    fastify.post('/:id/closure/preview', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const decoded = request.user as any; const { id } = request.params as { id: string };
            if (decoded.role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });
            const closure = await computeSeasonClosure(id);
            return closure;
        } catch (error) {
            fastify.log.error(error); return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Approve closure
    fastify.post('/:id/closure/approve', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const decoded = request.user as any; const { id } = request.params as { id: string };
            if (decoded.role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });
            const closure = await prisma.seasonClosure.findUnique({ where: { seasonId: id }, include: { entries: true } });
            if (!closure) return reply.status(404).send({ error: 'Closure not found' });
            if (closure.status === 'APPROVED') return closure;

            // Aplicar movimientos y crear historiales
            await prisma.$transaction(async tx => {
                for (const entry of closure.entries) {
                    if (entry.movementType === 'PROMOTION' || entry.movementType === 'RELEGATION') {
                        if (entry.toGroupId) {
                            await tx.player.update({ where: { id: entry.playerId }, data: { currentGroupId: entry.toGroupId } });
                        }
                    }
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
                await tx.seasonClosure.update({ where: { id: closure.id }, data: { status: 'APPROVED', approvedAt: new Date() } });
            });

            const updated = await prisma.seasonClosure.findUnique({ where: { seasonId: id }, include: { entries: { include: { player: true, fromGroup: true, toGroup: true } } } });
            return updated;
        } catch (error) {
            fastify.log.error(error); return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Rollover season -> create next season cloning group names
    fastify.post('/:id/rollover', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const decoded = request.user as any; const { id } = request.params as { id: string };
            if (decoded.role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });
            const body = (request.body as any) || {};
            const nMonths: number = parseInt(body.nMonths || '3');
            const season = await prisma.season.findUnique({ where: { id }, include: { groups: true } });
            if (!season) return reply.status(404).send({ error: 'Season not found' });
            // Derivar nombre siguiente de forma inteligente
            const newStart = addMonths(season.startDate, nMonths);
            const newEnd = addMonths(season.endDate, nMonths);
            const startYear = newStart.getFullYear();
            const endYear = newEnd.getFullYear();
            const monthSpan = (newEnd.getMonth() - newStart.getMonth() + 12 * (endYear - startYear)) + 1;
            // Si abarca cambio de año usar formato YYYY-YYYY, si no YYYY (Nm)
            let newName: string;
            if (startYear !== endYear) {
                newName = `${startYear}-${endYear}`;
            } else {
                newName = `${startYear} (${monthSpan}m)`;
            }
            // Evitar colisión de nombres existentes añadiendo sufijo incremental si ya existe
            let finalName = newName;
            let counter = 2;
            while (await prisma.season.findFirst({ where: { name: finalName } })) {
                finalName = `${newName} #${counter}`;
                counter++;
                if (counter > 10) break; // evitar bucle infinito raro
            }
            const next = await prisma.season.create({ data: { name: finalName, startDate: newStart, endDate: newEnd, previousSeasonId: season.id } });
            // Clonar grupos
            for (const g of season.groups) {
                await prisma.group.create({ data: { name: g.name, seasonId: next.id } });
            }
            const created = await prisma.season.findUnique({ where: { id: next.id }, include: { groups: true } });
            return created;
        } catch (error) {
            fastify.log.error(error); return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Delete season (admin)
    fastify.delete('/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        try {
            const decoded = request.user as any; const { id } = request.params as { id: string };
            if (decoded.role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' });
            await prisma.season.delete({ where: { id } });
            return { success: true };
        } catch (error) {
            fastify.log.error(error); return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}

