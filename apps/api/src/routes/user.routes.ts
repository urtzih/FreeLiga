import { FastifyInstance } from 'fastify';
import { prisma } from '@freesquash/database';
import { z } from 'zod';
import bcrypt from 'bcrypt';

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: any, reply: any) => Promise<void>;
    }
}

const updateRoleSchema = z.object({
    role: z.enum(['PLAYER', 'ADMIN']),
});

const resetPasswordSchema = z.object({
    newPassword: z.string().min(6),
});

const updateUserSchema = z.object({
    email: z.string().email().optional(),
    name: z.string().min(2).optional(),
    nickname: z.string().optional(),
    phone: z.string().optional(),
    role: z.enum(['PLAYER', 'ADMIN']).optional(),
    isActive: z.boolean().optional(),
});

export async function userRoutes(fastify: FastifyInstance) {
    // Get all users (admin only)
    fastify.get('/', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;

            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const { page = '1', limit = '50' } = request.query as { page?: string; limit?: string };
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    skip,
                    take: parseInt(limit),
                    include: {
                        player: {
                            include: {
                                currentGroup: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                }),
                prisma.user.count(),
            ]);

            return {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit)),
                },
            };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Get user by ID (admin only)
    fastify.get('/:id', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };

            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const user = await prisma.user.findUnique({
                where: { id },
                include: {
                    player: {
                        include: {
                            currentGroup: true,
                        },
                    },
                },
            });

            if (!user) {
                return reply.status(404).send({ error: 'User not found' });
            }

            // Don't send password hash
            const { password, ...userWithoutPassword } = user;

            return userWithoutPassword;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Update user (admin only)
    fastify.put('/:id', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };

            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const body = updateUserSchema.parse(request.body);

            // Buscar el usuario con su player
            const user = await prisma.user.findUnique({
                where: { id },
                include: { player: true },
            });

            if (!user) {
                return reply.status(404).send({ error: 'User not found' });
            }

            // Actualizar usuario y player en una transacción
            const updatedUser = await prisma.$transaction(async (tx: any) => {
                // Actualizar user (email, role, isActive)
                const userUpdate: any = {};
                if (body.email) userUpdate.email = body.email;
                if (body.role) userUpdate.role = body.role;
                if (body.isActive !== undefined) userUpdate.isActive = body.isActive;

                const updated = await tx.user.update({
                    where: { id },
                    data: userUpdate,
                    include: { player: true },
                });

                // Actualizar player si existe (name, nickname, phone)
                if (updated.player && (body.name || body.nickname !== undefined || body.phone !== undefined)) {
                    const playerUpdate: any = {};
                    if (body.name) playerUpdate.name = body.name;
                    if (body.nickname !== undefined) playerUpdate.nickname = body.nickname || null;
                    if (body.phone !== undefined) playerUpdate.phone = body.phone || null;
                    if (body.email) playerUpdate.email = body.email;

                    await tx.player.update({
                        where: { id: updated.player.id },
                        data: playerUpdate,
                    });
                }

                return updated;
            });

            const { password, ...userWithoutPassword } = updatedUser;

            return userWithoutPassword;
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Update user role (admin only)
    fastify.put('/:id/role', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };

            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const body = updateRoleSchema.parse(request.body);

            const user = await prisma.user.update({
                where: { id },
                data: {
                    role: body.role,
                },
            });

            const { password, ...userWithoutPassword } = user;

            return userWithoutPassword;
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Reset user password (admin only)
    fastify.post('/:id/reset-password', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };

            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const body = resetPasswordSchema.parse(request.body);

            const hashedPassword = await bcrypt.hash(body.newPassword, 10);

            await prisma.user.update({
                where: { id },
                data: {
                    password: hashedPassword,
                },
            });

            return { success: true, message: 'Password reset successfully' };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Delete user (admin only)
    fastify.delete('/:id', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { id } = request.params as { id: string };

            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            await prisma.user.delete({ where: { id } });

            return { success: true };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Bulk operations (admin only)
    fastify.post('/bulk', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;

            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const body = z.object({
                action: z.enum(['delete', 'setRole']),
                userIds: z.array(z.string()).min(1),
                role: z.enum(['PLAYER', 'ADMIN']).optional(),
            }).parse(request.body);

            if (body.action === 'delete') {
                await prisma.user.deleteMany({
                    where: { id: { in: body.userIds } },
                });
                return { success: true, count: body.userIds.length };
            }

            if (body.action === 'setRole' && body.role) {
                const result = await prisma.user.updateMany({
                    where: { id: { in: body.userIds } },
                    data: { role: body.role },
                });
                return { success: true, count: result.count };
            }

            return reply.status(400).send({ error: 'Invalid action' });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
