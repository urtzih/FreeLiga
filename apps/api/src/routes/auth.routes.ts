import { FastifyInstance } from 'fastify';
import { prisma } from '@freesquash/database';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { getPlayerCurrentGroup } from '../utils/playerHelpers';
import { GoogleCalendarService } from '../services/googleCalendar.service';

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
        const requestId = Math.random().toString(36).substring(7);
        const log = (msg: string, data?: any) => console.log(`\n${'='.repeat(60)}\n🔐 LOGIN [${requestId}] ${msg}\n${data ? JSON.stringify(data, null, 2) : ''}${'='.repeat(60)}`);
        const logError = (msg: string, data?: any) => console.error(`\n${'!'.repeat(60)}\n❌ LOGIN [${requestId}] ${msg}\n${data ? JSON.stringify(data, null, 2) : ''}${'!'.repeat(60)}`);
        
        try {
            log('⏳ ENDPOINT HIT - Request received', request.body);
            
            const body = loginSchema.parse(request.body);
            log('✅ Credentials parsed successfully', { email: body.email, passwordLength: body.password.length });

            // Find user
            log('🔎 Querying database for user...');
            const user = await prisma.user.findUnique({
                where: { email: body.email },
                include: {
                    player: true,
                },
            });

            if (!user) {
                logError('👤 User not found in database', { email: body.email });
                return reply.status(401).send({ error: 'Invalid credentials' });
            }

            log('✅ User found in database', { userId: user.id, email: user.email, hasPlayer: !!user.player });

            // Check password
            log('🔑 Comparing password with hash...');
            const validPassword = await bcrypt.compare(body.password, user.password);

            if (!validPassword) {
                logError('❌ Password comparison FAILED', { email: body.email });
                return reply.status(401).send({ error: 'Invalid credentials' });
            }

            log('✅ Password validation PASSED');

            // Check if user is active
            log('📋 Checking if user is active...');
            if (!user.isActive) {
                logError('🚫 User account is inactive', { email: body.email });
                return reply.status(403).send({ error: 'Account is deactivated. Please contact an administrator.' });
            }
            log('✅ User is ACTIVE');

            // Obtener grupo actual basado en temporada activa
            log('👥 Fetching current group for player...');
            let currentGroup = null;
            if (user.player) {
                try {
                    currentGroup = await getPlayerCurrentGroup(user.player.id);
                    log('✅ Current group fetched', { groupId: currentGroup?.id, groupName: currentGroup?.name });
                } catch (err) {
                    logError('⚠️ Error fetching current group (non-fatal)', err);
                    // No fallar el login si hay error al obtener grupo
                    currentGroup = null;
                }
            } else {
                log('ℹ️ No player record associated with user');
            }

            log('🔐 Generating JWT token...');
            const token = fastify.jwt.sign({
                id: user.id,
                email: user.email,
                role: user.role,
                playerId: user.player?.id || null,
            });
            log('✅ JWT Token generated successfully');

            log('🎉 LOGIN SUCCESSFUL - Returning user data', { 
                userId: user.id, 
                email: user.email, 
                role: user.role,
                hasGroup: !!currentGroup
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
            logError('💥 EXCEPTION CAUGHT IN CATCH BLOCK');
            logError('Error type', error instanceof Error ? error.constructor.name : typeof error);
            logError('Error message', error instanceof Error ? error.message : String(error));
            
            if (error instanceof Error && error.stack) {
                logError('Stack trace', error.stack);
            }

            if (error instanceof z.ZodError) {
                logError('🔴 Zod validation error (400)', error.errors);
                return reply.status(400).send({ error: error.errors });
            }

            const errorMessage = error instanceof Error ? error.message : String(error);
            fastify.log.error(error);
            
            logError('Sending 500 response with details', { details: errorMessage });
            
            return reply.status(500).send({ 
                error: 'Internal server error', 
                details: errorMessage,
                type: error instanceof Error ? error.constructor.name : typeof error,
                requestId
            });
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
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4175';
            return reply.redirect(`${frontendUrl}/calendar?google_connected=true`);
        } catch (error) {
            fastify.log.error(error);
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4175';
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
