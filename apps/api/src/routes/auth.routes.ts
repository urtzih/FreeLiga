import { FastifyInstance } from 'fastify';
import { prisma } from '@freesquash/database';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getPlayerCurrentGroup } from '../utils/playerHelpers';
import { GoogleCalendarService } from '../services/googleCalendar.service';
import { logger, logBusinessEvent } from '../utils/logger';
import { logAuthentication } from '../utils/httpLogger';
import { emailSender } from '../services/email.service';
import {
    createPasswordResetToken,
    consumePasswordResetToken,
    validatePasswordResetToken,
} from '../services/password-reset.service';

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

const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

const resetPasswordSchema = z.object({
    token: z.string().min(40),
    newPassword: z.string().min(8),
});

const genericResetMessage = 'If the email exists, a recovery link will be sent shortly';

export async function authRoutes(fastify: FastifyInstance) {
    const forgotPasswordConfig = {
        rateLimit: {
            max: 5,
            timeWindow: '15 minutes',
        },
    };
    const resetPasswordConfig = {
        rateLimit: {
            max: 10,
            timeWindow: '15 minutes',
        },
    };

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
                        annualFeesPaid: user.player.annualFeesPaid ? JSON.parse(user.player.annualFeesPaid) : [],
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
        const requestId = request.id;

        try {
            const body = loginSchema.parse(request.body);
            logger.info({ requestId, email: body.email, ip: request.ip }, 'Login attempt');

            // Find user
            const user = await prisma.user.findUnique({
                where: { email: body.email },
                include: {
                    player: true,
                },
            });

            if (!user) {
                logAuthentication(false, body.email, undefined, request.ip, 'user_not_found');
                return reply.status(401).send({ error: 'Invalid credentials' });
            }

            // Check password
            const validPassword = await bcrypt.compare(body.password, user.password);

            if (!validPassword) {
                logAuthentication(false, body.email, user.id, request.ip, 'invalid_password');
                return reply.status(401).send({ error: 'Invalid credentials' });
            }

            // Check if user is active
            if (!user.isActive) {
                logAuthentication(false, body.email, user.id, request.ip, 'inactive_account');
                return reply.status(403).send({ error: 'Account is deactivated. Please contact an administrator.' });
            }

            // Actualizar lastConnection
            await prisma.user.update({
                where: { id: user.id },
                data: { lastConnection: new Date() }
            });

            // Obtener grupo actual basado en temporada activa
            let currentGroup = null;
            if (user.player) {
                try {
                    currentGroup = await getPlayerCurrentGroup(user.player.id);
                } catch (err) {
                    logger.warn({ err, requestId, userId: user.id }, 'Failed to fetch current group (non-fatal)');
                    // No fallar el login si hay error al obtener grupo
                    currentGroup = null;
                }
            }

            const token = fastify.jwt.sign({
                id: user.id,
                email: user.email,
                role: user.role,
                playerId: user.player?.id || null,
            });
            logAuthentication(true, body.email, user.id, request.ip);

            return {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    player: user.player ? {
                        ...user.player,
                        annualFeesPaid: user.player.annualFeesPaid ? JSON.parse(user.player.annualFeesPaid) : [],
                        currentGroup
                    } : null,
                },
            };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }

            logger.error({ error, requestId }, 'Login failed');
            return reply.status(500).send({
                error: 'Internal server error',
                requestId
            });
        }
    });

    fastify.post('/forgot-password', {
        config: forgotPasswordConfig,
    }, async (request, reply) => {
        const requestId = request.id;
        const startedAt = Date.now();

        try {
            const body = forgotPasswordSchema.parse(request.body);
            const email = body.email.trim().toLowerCase();

            const user = await prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    isActive: true,
                },
            });

            if (user?.isActive) {
                const tokenData = await createPasswordResetToken({
                    userId: user.id,
                    requestIp: request.ip,
                    userAgent: typeof request.headers['user-agent'] === 'string' ? request.headers['user-agent'] : undefined,
                });

                if (tokenData) {
                    if (process.env.PASSWORD_RESET_DEBUG_LOG === 'true') {
                        logger.info({ requestId, email, resetUrl: tokenData.resetUrl }, 'Password reset URL (dev)');
                    }
                    setImmediate(() => {
                        void emailSender.sendPasswordResetEmail({
                            to: user.email,
                            resetUrl: tokenData.resetUrl,
                        }).catch((error) => {
                            logger.error({ error, requestId, email }, 'Failed to send password reset email');
                        });
                    });
                }
            }

            logBusinessEvent('password_reset_requested', {
                requestId,
                email,
                userExists: !!user,
                ip: request.ip,
            });

            const elapsed = Date.now() - startedAt;
            if (elapsed < 250) {
                await new Promise((resolve) => setTimeout(resolve, 250 - elapsed));
            }

            return reply.send({ success: true, message: genericResetMessage });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }

            logger.error({ error, requestId }, 'Failed forgot password request');

            return reply.send({ success: true, message: genericResetMessage });
        }
    });

    fastify.get('/reset-password/validate', async (request, reply) => {
        try {
            const querySchema = z.object({ token: z.string().min(40) });
            const query = querySchema.parse(request.query);
            const tokenRow = await validatePasswordResetToken(query.token);

            return {
                valid: !!tokenRow,
            };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }
            logger.error({ error }, 'Failed validating password reset token');
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    fastify.post('/reset-password', {
        config: resetPasswordConfig,
    }, async (request, reply) => {
        const requestId = request.id;

        try {
            const body = resetPasswordSchema.parse(request.body);
            const hashedPassword = await bcrypt.hash(body.newPassword, 10);

            const consumed = await consumePasswordResetToken(body.token, hashedPassword);

            if (!consumed.success) {
                logBusinessEvent('password_reset_failed', {
                    requestId,
                    reason: 'invalid_or_expired_token',
                    ip: request.ip,
                });
                return reply.status(400).send({ error: 'Invalid or expired reset token' });
            }

            logBusinessEvent('password_reset_succeeded', {
                requestId,
                userId: consumed.userId,
                ip: request.ip,
            });

            return { success: true, message: 'Password updated successfully' };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({ error: error.errors });
            }

            logger.error({ error, requestId }, 'Failed resetting password');
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
                    annualFeesPaid: user.player.annualFeesPaid ? JSON.parse(user.player.annualFeesPaid) : [],
                    currentGroup
                } : null,
            };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });

    // Google Calendar OAuth - Get auth URL
    fastify.get('/google-calendar/auth-url', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const authUrl = GoogleCalendarService.getAuthUrl(decoded.id);
            return { authUrl };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Failed to generate auth URL' });
        }
    });

    // Google Calendar OAuth - Callback (GET - from Google)
    fastify.get('/google-calendar/callback', async (request, reply) => {
        try {
            const { code, state } = request.query as { code: string; state: string };
            
            if (!code || !state) {
                return reply.status(400).send({ error: 'Authorization code or state is missing' });
            }

            // Extract userId from state (it should be encoded in the state parameter)
            const userId = state;

            const tokens = await GoogleCalendarService.exchangeCodeForTokens(code);
            await GoogleCalendarService.saveIntegration(userId, tokens);

            // Redirect back to the calendar page with success message
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4173';
            return reply.redirect(`${frontendUrl}/calendar?google_connected=true`);
        } catch (error) {
            fastify.log.error(error);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4173';
            return reply.redirect(`${frontendUrl}/calendar?google_error=true`);
        }
    });

    // Google Calendar OAuth - Callback (POST - legacy/alternative)
    fastify.post('/google-calendar/callback', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const { code } = request.body as { code: string };
            
            if (!code) {
                return reply.status(400).send({ error: 'Authorization code is required' });
            }

            const tokens = await GoogleCalendarService.exchangeCodeForTokens(code);
            await GoogleCalendarService.saveIntegration(decoded.id, tokens);

            return { success: true, message: 'Google Calendar connected successfully' };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Failed to connect Google Calendar' });
        }
    });

    // Google Calendar - Get status
    fastify.get('/google-calendar/status', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            const integration = await GoogleCalendarService.getIntegration(decoded.id);
            
            return {
                connected: !!integration,
                integration: integration ? {
                    calendarId: integration.calendarId,
                    connectedAt: integration.createdAt,
                } : null,
            };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Failed to get Google Calendar status' });
        }
    });

    // Google Calendar - Disconnect
    fastify.post('/google-calendar/disconnect', {
        onRequest: [fastify.authenticate],
    }, async (request, reply) => {
        try {
            const decoded = request.user as any;
            
            await prisma.googleCalendarToken.delete({
                where: { userId: decoded.id },
            }).catch(() => null);

            return { success: true, message: 'Google Calendar disconnected' };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Failed to disconnect Google Calendar' });
        }
    });
}
