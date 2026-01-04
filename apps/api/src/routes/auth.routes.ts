import { FastifyInstance } from 'fastify';
import { prisma } from '@freesquash/database';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { getPlayerCurrentGroup } from '../utils/playerHelpers';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    nickname: z.string().optional(),
    phone: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
    // Register
    fastify.post('/register', async (request, reply) => {
        try {
            const body = registerSchema.parse(request.body);

            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email: body.email },
            });

            if (existingUser) {
                return reply.status(400).send({ error: 'User already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(body.password, 10);

            // Create user and player
            const user = await prisma.user.create({
                data: {
                    email: body.email,
                    password: hashedPassword,
                    role: 'PLAYER',
                    player: {
                        create: {
                            name: body.name,
                            nickname: body.nickname,
                            phone: body.phone,
                        },
                    },
                },
                include: {
                    player: true,
                },
            });

            // Obtener grupo actual basado en temporada activa
            let currentGroup = null;
            if (user.player) {
                currentGroup = await getPlayerCurrentGroup(user.player.id);
            }

            // Generate JWT
            const token = fastify.jwt.sign({
                id: user.id,
                email: user.email,
                role: user.role,
                playerId: user.player?.id || null,
            });

            return {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    player: user.player ? {
                        ...user.player,
                        currentGroup
                    } : null,
                },
            };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Login
    fastify.post('/login', async (request, reply) => {
        try {
            const body = loginSchema.parse(request.body);

            // Find user
            const user = await prisma.user.findUnique({
                where: { email: body.email },
                include: {
                    player: true,
                },
            });

            if (!user) {
                return reply.status(401).send({ error: 'Invalid credentials' });
            }

            // Check password
            const validPassword = await bcrypt.compare(body.password, user.password);

            if (!validPassword) {
                return reply.status(401).send({ error: 'Invalid credentials' });
            }

            // Check if user is active
            if (!user.isActive) {
                return reply.status(403).send({ error: 'Account is deactivated. Please contact an administrator.' });
            }

            // Obtener grupo actual basado en temporada activa
            let currentGroup = null;
            if (user.player) {
                currentGroup = await getPlayerCurrentGroup(user.player.id);
            }

            // Generate JWT
            const token = fastify.jwt.sign({
                id: user.id,
                email: user.email,
                role: user.role,
                playerId: user.player?.id || null,
            });

            return {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    player: user.player ? {
                        ...user.player,
                        currentGroup
                    } : null,
                },
            };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Get current user
    fastify.get('/me', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;

            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                include: {
                    player: true,
                },
            });

            if (!user) {
                return reply.status(404).send({ error: 'User not found' });
            }

            // Obtener grupo actual basado en temporada activa
            let currentGroup = null;
            if (user.player) {
                currentGroup = await getPlayerCurrentGroup(user.player.id);
            }

            return {
                id: user.id,
                email: user.email,
                role: user.role,
                player: user.player ? {
                    ...user.player,
                    currentGroup
                } : null,
            };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
}
