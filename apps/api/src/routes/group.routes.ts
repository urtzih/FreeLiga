import { FastifyInstance } from 'fastify';
import { prisma } from '@freesquash/database';
import { z } from 'zod';
import { calculateGroupRankings } from '../services/ranking.service';

const createGroupSchema = z.object({
    name: z.string().min(1),
    seasonId: z.string(),
});

const assignPlayerSchema = z.object({
    playerId: z.string(),
});

const swapPlayersSchema = z.object({
    player1Id: z.string(),
    group1Id: z.string(),
    player2Id: z.string(),
    group2Id: z.string(),
});

export async function groupRoutes(fastify: FastifyInstance) {
    // Get all groups
    fastify.get('/', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const { seasonId } = request.query as { seasonId?: string };

            const where = seasonId ? { seasonId } : {};

            const groups = await prisma.group.findMany({
                where,
                include: {
                    season: true,
                    groupPlayers: {
                        include: {
                            player: true,
                        },
                        orderBy: {
                            rankingPosition: 'asc',
                        },
                    },
                    _count: {
                        select: {
                            groupPlayers: true,
                            matches: true,
                        },
                    },
                },
                orderBy: {
                    name: 'asc',
                },
            });

            return groups;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Get group by ID with rankings
    fastify.get('/:id', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const { id } = request.params as { id: string };

            const group = await prisma.group.findUnique({
                where: { id },
                include: {
                    season: true,
                    groupPlayers: {
                        include: {
                            player: {
                                include: {
                                    user: {
                                        select: {
                                            email: true,
                                            role: true,
                                        },
                                    },
                                },
                            },
                        },
                        orderBy: {
                            rankingPosition: 'asc',
                        },
                    },
                    matches: {
                        include: {
                            player1: true,
                            player2: true,
                            winner: true,
                        },
                        orderBy: {
                            date: 'desc',
                        },
                    },
                },
            });

            if (!group) {
                return reply.status(404).send({ error: 'Group not found' });
            }

            return group;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Create group (admin only)
    fastify.post('/', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;

            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const body = createGroupSchema.parse(request.body);

            const group = await prisma.group.create({
                data: {
                    name: body.name,
                    seasonId: body.seasonId,
                },
            });

            return group;
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Update group (admin only)
    fastify.put('/:id', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };

            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const body = request.body as { whatsappUrl?: string; name?: string };

            const group = await prisma.group.update({
                where: { id },
                data: {
                    ...(body.whatsappUrl !== undefined && { whatsappUrl: body.whatsappUrl }),
                    ...(body.name && { name: body.name }),
                },
            });

            return group;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Assign player to group (admin only)
    fastify.post('/:id/players', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };

            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const body = assignPlayerSchema.parse(request.body);

            // Check if player is already in group
            const existing = await prisma.groupPlayer.findUnique({
                where: {
                    groupId_playerId: {
                        groupId: id,
                        playerId: body.playerId,
                    },
                },
            });

            if (existing) {
                return reply.status(400).send({ error: 'Player already in group' });
            }

            // Get current player count to set initial ranking
            const playerCount = await prisma.groupPlayer.count({
                where: { groupId: id },
            });

            const groupPlayer = await prisma.groupPlayer.create({
                data: {
                    groupId: id,
                    playerId: body.playerId,
                    rankingPosition: playerCount + 1,
                },
                include: {
                    player: true,
                },
            });

            return groupPlayer;
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Remove player from group (admin only)
    fastify.delete('/:id/players/:playerId', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id, playerId } = request.params as { id: string; playerId: string };

            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            await prisma.groupPlayer.delete({
                where: {
                    groupId_playerId: {
                        groupId: id,
                        playerId,
                    },
                },
            });

            return { success: true };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Recalculate group rankings (admin only)
    fastify.post('/:id/recalculate', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };

            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            await calculateGroupRankings(id);

            return { success: true, message: 'Rankings recalculated' };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Delete group (admin only)
    fastify.delete('/:id', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };

            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            await prisma.group.delete({ where: { id } });

            return { success: true };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Swap players between groups (admin only)
    fastify.post('/swap-players', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;

            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const body = swapPlayersSchema.parse(request.body);
            const { player1Id, group1Id, player2Id, group2Id } = body;

            // Verify both players exist in their respective groups
            const groupPlayer1 = await prisma.groupPlayer.findUnique({
                where: {
                    groupId_playerId: {
                        groupId: group1Id,
                        playerId: player1Id,
                    },
                },
            });

            const groupPlayer2 = await prisma.groupPlayer.findUnique({
                where: {
                    groupId_playerId: {
                        groupId: group2Id,
                        playerId: player2Id,
                    },
                },
            });

            if (!groupPlayer1 || !groupPlayer2) {
                return reply.status(404).send({ error: 'One or both players not found in their groups' });
            }

            // Store ranking positions
            const rank1 = groupPlayer1.rankingPosition;
            const rank2 = groupPlayer2.rankingPosition;

            // Perform the swap in a transaction
            await prisma.$transaction([
                // Delete both players from their current groups
                prisma.groupPlayer.delete({
                    where: {
                        groupId_playerId: {
                            groupId: group1Id,
                            playerId: player1Id,
                        },
                    },
                }),
                prisma.groupPlayer.delete({
                    where: {
                        groupId_playerId: {
                            groupId: group2Id,
                            playerId: player2Id,
                        },
                    },
                }),
                // Add player1 to group2 with player2's ranking
                prisma.groupPlayer.create({
                    data: {
                        groupId: group2Id,
                        playerId: player1Id,
                        rankingPosition: rank2,
                    },
                }),
                // Add player2 to group1 with player1's ranking
                prisma.groupPlayer.create({
                    data: {
                        groupId: group1Id,
                        playerId: player2Id,
                        rankingPosition: rank1,
                    },
                }),
            ]);

            return { success: true, message: 'Players swapped successfully' };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
