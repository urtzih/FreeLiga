/**
 * FreeSQuash League - API Server
 * 
 * @author Urtzi Diaz Arberas
 * @copyright © 2024-2026 Urtzi Diaz Arberas. All rights reserved.
 * @license Proprietary - All intellectual property rights belong to Urtzi Diaz Arberas
 */

/// <reference types="node" />
import Fastify from 'fastify';
import cors from '@fastify/cors';
import compress from '@fastify/compress';
import etag from '@fastify/etag';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from './routes/auth.routes';
import { playerRoutes } from './routes/player.routes';
import { groupRoutes } from './routes/group.routes';
import { matchRoutes } from './routes/match.routes';
import { seasonRoutes } from './routes/season.routes';
import { classificationRoutes } from './routes/classification.routes';
import { userRoutes } from './routes/user.routes';
import { adminRoutes } from './routes/admin.routes';
import { bugRoutes } from './routes/bug.routes';
import { logger, logBusinessEvent } from './utils/logger';
import { registerHttpLogging, httpErrorHook } from './utils/httpLogger';

const fastify = Fastify({
    logger: true,
    disableRequestLogging: true, // Usamos nuestro middleware personalizado
    requestIdLogLabel: 'requestId',
    genReqId: () => {
        return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },
});

async function start() {
    try {
        // Validate critical environment variables
        logger.info('Starting application initialization');
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            logger.fatal('JWT_SECRET is not configured');
            throw new Error('CRITICAL: JWT_SECRET is not configured! Set in environment variables.');
        }
        if (jwtSecret === 'your-super-secret-jwt-key-change-in-production') {
            logger.fatal('JWT_SECRET is using insecure default value');
            throw new Error('CRITICAL: JWT_SECRET is using the insecure default value! Change immediately in production.');
        }
        logger.info('JWT configuration validated');

        // Compute allowed origins (comma-separated list)
        const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:4173')
            .split(',')
            .map((o: string) => o.trim())
            .filter(Boolean);

        logger.info({ allowedOrigins }, 'Configuring CORS');

        // Register CORS
        await fastify.register(cors, {
            origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
            credentials: true,
        });

        // Rate limiting
        await fastify.register(rateLimit, {
            max: 100, // Max requests per window
            timeWindow: '1 minute', // Time window
            cache: 10000, // Cache size
            allowList: ['127.0.0.1'], // Whitelist localhost
            redis: undefined, // Use in-memory for now
        });

        // Compression (gzip/br)
        await fastify.register(compress, { global: true });

        // ETag for conditional GET
        await fastify.register(etag, { weak: true });

        // Register JWT
        await fastify.register(jwt, {
            secret: jwtSecret,
        });

        // JWT Authentication Decorator
        fastify.decorate('authenticate', async function (request: any, reply: any) {
            try {
                await request.jwtVerify();
            } catch (err) {
                reply.status(401).send({ error: 'Unauthorized' });
            }
        });

        // Registrar logging HTTP
        await registerHttpLogging(fastify);
        
        // Hook de errores
        fastify.setErrorHandler(httpErrorHook);

        // Health check endpoint
        fastify.get('/health', async (request, reply) => {
            return {
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || 'development',
            };
        });

        // Register Swagger
        await fastify.register(require('@fastify/swagger'), {
            swagger: {
                info: {
                    title: 'FreeSquash API',
                    description: 'API documentation for FreeSquash League',
                    version: '1.0.0',
                },
                host: process.env.SWAGGER_HOST || 'localhost:3001',
                schemes: process.env.SWAGGER_SCHEMES ? process.env.SWAGGER_SCHEMES.split(',') : ['http'],
                consumes: ['application/json'],
                produces: ['application/json'],
                securityDefinitions: {
                    apiKey: {
                        type: 'apiKey',
                        name: 'Authorization',
                        in: 'header',
                    },
                },
            },
        });

        await fastify.register(require('@fastify/swagger-ui'), {
            routePrefix: '/documentation',
            uiConfig: {
                docExpansion: 'list',
                deepLinking: false,
            },
            uiHooks: {
                onRequest: function (request: any, reply: any, next: any) { next() },
                preHandler: function (request: any, reply: any, next: any) { next() }
            },
            staticCSP: true,
            transformStaticCSP: (header: any) => header,
        });

        // No cache by default - results change constantly
        fastify.addHook('onSend', (request: any, reply: any, payload: any, done: any) => {
            if (request.method === 'GET') {
                reply.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
                reply.header('Pragma', 'no-cache');
                reply.header('Expires', '0');
            }
            done();
        });

        // Register routes
        await fastify.register(authRoutes, { prefix: '/api/auth' });
        await fastify.register(playerRoutes, { prefix: '/api/players' });
        await fastify.register(groupRoutes, { prefix: '/api/groups' });
        await fastify.register(matchRoutes, { prefix: '/api/matches' });
        await fastify.register(seasonRoutes, { prefix: '/api/seasons' });
        await fastify.register(classificationRoutes, { prefix: '/api/classification' });
        await fastify.register(userRoutes, { prefix: '/api/users' });
        await fastify.register(adminRoutes, { prefix: '/api/admin' });
        await fastify.register(bugRoutes, { prefix: '/api/bugs' });

        // Start server
        const port = parseInt(process.env.PORT || '3001');
        const host = process.env.HOST || '0.0.0.0';
        const address = await fastify.listen({ port, host });

        logger.info({ address, port, host, env: process.env.NODE_ENV }, '🚀 Server running');
        logBusinessEvent('server_started', { address, port, host });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    logger.error({ reason, promise: String(promise) }, 'Unhandled Rejection');
    logBusinessEvent('unhandled_rejection', { reason: String(reason) });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: unknown) => {
    logger.fatal({ error }, 'Uncaught Exception - shutting down');
    logBusinessEvent('uncaught_exception', { error: String(error) });
    process.exit(1);
});

start();
