import { FastifyInstance } from 'fastify';
import { prisma } from '@freesquash/database';
import { z } from 'zod';

const createSeasonSchema = z.object({
    name: z.string().min(1),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
});

export async function seasonRoutes(fastify: FastifyInstance) {
    // Get all seasons
    fastify.get('/', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const seasons = await prisma.season.findMany({
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
                orderBy: {
                    startDate: 'desc',
                },
            });

            return seasons;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Get season by ID
    fastify.get('/:id', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };

            const season = await prisma.season.findUnique({
                where: { id },
                include: {
                    groups: {
                        include: {
                            groupPlayers: {
                                include: {
                                    player: true,
                                },
                            },
                            _count: {
                                select: {
                                    matches: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!season) {
                return reply.status(404).send({ error: 'Season not found' });
            }

            return season;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Create season (admin only)
    fastify.post('/', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;

            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const body = createSeasonSchema.parse(request.body);

            const season = await prisma.season.create({
                data: {
                    name: body.name,
                    startDate: new Date(body.startDate),
                    endDate: new Date(body.endDate),
                },
            });

            return season;
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Update season (admin only)
    fastify.put('/:id', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };

            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const body = createSeasonSchema.parse(request.body);

            const season = await prisma.season.update({
                where: { id },
                data: {
                    name: body.name,
                    startDate: new Date(body.startDate),
                    endDate: new Date(body.endDate),
                },
            });

            return season;
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
