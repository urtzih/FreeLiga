import { FastifyInstance } from 'fastify';
import { prisma } from '@freesquash/database';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { getPlayerCurrentGroup } from '../utils/playerHelpers';
import { logger, logBusinessEvent, logOperation } from '../utils/logger';

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

const updateEmailSchema = z.object({
    newEmail: z.string().email(),
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6),
});

const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    nickname: z.string().optional(),
    phone: z.string().optional(),
    role: z.enum(['PLAYER', 'ADMIN']).default('PLAYER'),
    groupId: z.string().optional(),
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

            const { page = '1', limit = '50', search = '' } = request.query as { page?: string; limit?: string; search?: string };
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const where: any = {};
            if (search) {
                where.OR = [
                    { email: { contains: search } }, // Removed mode: 'insensitive' for compatibility if needed, but usually safe in recent Prisma/MySQL
                    { player: { name: { contains: search } } },
                    { player: { nickname: { contains: search } } },
                ];
            }

            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    skip,
                    take: parseInt(limit),
                    include: {
                        player: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                }),
                prisma.user.count({ where }),
            ]);

            // Añadir currentGroup para cada usuario
            const usersWithGroups = await Promise.all(
                users.map(async (user) => {
                    let currentGroup = null;
                    if (user.player) {
                        currentGroup = await getPlayerCurrentGroup(user.player.id);
                    }
                    return {
                        ...user,
                        player: user.player ? { ...user.player, currentGroup } : undefined,
                    };
                })
            );

            return {
                users: usersWithGroups,
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

    // Create user (admin only)
    fastify.post('/', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;

            if (decoded.role !== 'ADMIN') {
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const body = createUserSchema.parse(request.body);

            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email: body.email },
            });

            if (existingUser) {
                return reply.status(400).send({ error: 'El email ya está registrado' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(body.password, 10);

            // Create user with player if role is PLAYER
            const userData: any = {
                email: body.email,
                password: hashedPassword,
                role: body.role,
                isActive: true,
            };

            if (body.role === 'PLAYER') {
                userData.player = {
                    create: {
                        name: body.name,
                        nickname: body.nickname,
                        phone: body.phone,
                    },
                };
            }

            const user = await prisma.user.create({
                data: userData,
                include: {
                    player: true,
                },
            });

            // If groupId is provided, add player to group
            if (body.groupId && user.player) {
                await prisma.groupPlayer.create({
                    data: {
                        groupId: body.groupId,
                        playerId: user.player.id,
                    },
                });
            }

            // Get current group
            let currentGroup = null;
            if (user.player) {
                currentGroup = await getPlayerCurrentGroup(user.player.id);
            }

            return {
                ...user,
                player: user.player ? { ...user.player, currentGroup } : null,
            };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
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
                    player: true,
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
        const startTime = Date.now();
        const { id } = request.params as { id: string };
        
        try {
            const decoded = request.user as any;

            if (decoded.role !== 'ADMIN') {
                logger.warn({
                    type: 'authorization_denied',
                    operation: 'update_user',
                    userId: decoded.userId,
                    targetUserId: id,
                    reason: 'not_admin'
                }, 'Non-admin user attempted to update user');
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const body = updateUserSchema.parse(request.body);

            // Buscar el usuario con su player
            const user = await prisma.user.findUnique({
                where: { id },
                include: { player: true },
            });

            if (!user) {
                logger.warn({
                    type: 'resource_not_found',
                    operation: 'update_user',
                    userId: decoded.userId,
                    targetUserId: id
                }, 'User not found for update');
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

                    await tx.player.update({
                        where: { id: updated.player.id },
                        data: playerUpdate,
                    });
                }

                return updated;
            });

            // Log del evento de negocio
            logBusinessEvent('user_updated', {
                userId: decoded.userId,
                adminEmail: decoded.email,
                targetUserId: id,
                targetEmail: updatedUser.email,
                playerName: updatedUser.player?.name,
                changes: {
                    email: body.email ? { from: user.email, to: body.email } : undefined,
                    role: body.role ? { from: user.role, to: body.role } : undefined,
                    isActive: body.isActive !== undefined ? { from: user.isActive, to: body.isActive } : undefined,
                    name: body.name ? { from: user.player?.name, to: body.name } : undefined,
                    nickname: body.nickname !== undefined ? { from: user.player?.nickname, to: body.nickname } : undefined,
                    phone: body.phone !== undefined ? { from: user.player?.phone, to: body.phone } : undefined,
                },
                duration: Date.now() - startTime
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

    // Toggle user active status (admin only)
    fastify.post('/:id/toggle-active', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        const startTime = Date.now();
        const { id } = request.params as { id: string };
        
        try {
            const decoded = request.user as any;

            if (decoded.role !== 'ADMIN') {
                logger.warn({
                    type: 'authorization_denied',
                    operation: 'toggle_user_active',
                    userId: decoded.userId,
                    targetUserId: id,
                    reason: 'not_admin'
                }, 'Non-admin user attempted to toggle user active status');
                return reply.status(403).send({ error: 'Forbidden' });
            }

            const user = await prisma.user.findUnique({ 
                where: { id },
                include: { player: true }
            });
            
            if (!user) {
                logger.warn({
                    type: 'resource_not_found',
                    operation: 'toggle_user_active',
                    userId: decoded.userId,
                    targetUserId: id
                }, 'User not found for toggle active');
                return reply.status(404).send({ error: 'User not found' });
            }

            const newActiveStatus = !user.isActive;
            const updated = await prisma.user.update({
                where: { id },
                data: { isActive: newActiveStatus }
            });

            // Log del evento de negocio
            logBusinessEvent('user_active_toggled', {
                userId: decoded.userId,
                adminEmail: decoded.email,
                targetUserId: id,
                targetEmail: user.email,
                playerName: user.player?.name,
                previousStatus: user.isActive,
                newStatus: newActiveStatus,
                action: newActiveStatus ? 'activated' : 'deactivated',
                duration: Date.now() - startTime
            });

            logger.info({
                type: 'user_status_change',
                operation: 'toggle_user_active',
                userId: decoded.userId,
                targetUserId: id,
                targetEmail: user.email,
                from: user.isActive,
                to: newActiveStatus
            }, `User ${newActiveStatus ? 'activated' : 'deactivated'}: ${user.email}`);

            return { success: true, isActive: updated.isActive };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Update own email (players can update their own email)
    fastify.patch('/me/email', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        const startTime = Date.now();
        try {
            const decoded = request.user as any;
            const body = updateEmailSchema.parse(request.body);

            // Check if email already exists
            const existingUser = await prisma.user.findUnique({
                where: { email: body.newEmail }
            });

            if (existingUser && existingUser.id !== decoded.id) {
                logger.warn({
                    type: 'validation_error',
                    operation: 'update_email',
                    userId: decoded.id,
                    attemptedEmail: body.newEmail
                }, 'Email already in use');
                return reply.status(400).send({ error: 'Este email ya está en uso' });
            }

            // Get current user data
            const currentUser = await prisma.user.findUnique({
                where: { id: decoded.id },
                include: { player: true }
            });

            if (!currentUser) {
                return reply.status(404).send({ error: 'User not found' });
            }

            // Update email
            const updatedUser = await prisma.user.update({
                where: { id: decoded.id },
                data: { email: body.newEmail },
                include: { player: true }
            });

            // Log del evento de negocio
            logBusinessEvent('email_updated', {
                userId: decoded.id,
                playerName: currentUser.player?.name,
                oldEmail: currentUser.email,
                newEmail: body.newEmail,
                duration: Date.now() - startTime
            });

            logger.info({
                type: 'email_change',
                operation: 'update_email',
                userId: decoded.id,
                from: currentUser.email,
                to: body.newEmail
            }, `Email updated from ${currentUser.email} to ${body.newEmail}`);

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

    // Change own password (authenticated users)
    fastify.patch('/me/password', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const userId = decoded.id;

            const body = changePasswordSchema.parse(request.body);

            // Get current user with password
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                return reply.status(404).send({ error: 'Usuario no encontrado' });
            }

            // Verify current password
            const isValidPassword = await bcrypt.compare(body.currentPassword, user.password);
            if (!isValidPassword) {
                return reply.status(401).send({ error: 'Contraseña actual incorrecta' });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(body.newPassword, 10);

            // Update password
            await prisma.user.update({
                where: { id: userId },
                data: {
                    password: hashedPassword,
                },
            });

            logBusinessEvent('password_changed', {
                userId,
                userEmail: user.email,
            });

            return { success: true, message: 'Contraseña actualizada correctamente' };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
