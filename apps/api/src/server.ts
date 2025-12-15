/// <reference types="node" />
import Fastify from 'fastify';
import cors from '@fastify/cors';
import compress from '@fastify/compress';
import etag from '@fastify/etag';
import jwt from '@fastify/jwt';
import { authRoutes } from './routes/auth.routes';
import { playerRoutes } from './routes/player.routes';
import { groupRoutes } from './routes/group.routes';
import { matchRoutes } from './routes/match.routes';
import { seasonRoutes } from './routes/season.routes';
import { classificationRoutes } from './routes/classification.routes';
import { userRoutes } from './routes/user.routes';
import { adminRoutes } from './routes/admin.routes';
import { bugRoutes } from './routes/bug.routes';

const fastify = Fastify({
    logger: {
        level: process.env.NODE_ENV === 'development' ? 'info' : 'error',
    },
});

async function start() {
    try {
        // Validate critical environment variables
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('CRITICAL: JWT_SECRET is not configured! Set in environment variables.');
        }
        if (jwtSecret === 'your-super-secret-jwt-key-change-in-production') {
            throw new Error('CRITICAL: JWT_SECRET is using the insecure default value! Change immediately in production.');
        }

        // Compute allowed origins (comma-separated list)
        const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:4173')
            .split(',')
            .map((o: string) => o.trim())
            .filter(Boolean);

        // Register CORS
        await fastify.register(cors, {
            origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
            credentials: true,
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

        // Cache-Control for safe GET list endpoints
        const CACHEABLE_PREFIXES = ['/api/groups', '/api/seasons', '/api/classification', '/api/players', '/api/matches'];
        fastify.addHook('onSend', (request: any, reply: any, payload: any, done: any) => {
            if (request.method === 'GET') {
                const urlPath = (request.url || '').split('?')[0];
                if (CACHEABLE_PREFIXES.some((p) => urlPath.startsWith(p))) {
                    reply.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
                }
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

        // Health check
        fastify.get('/health', async () => {
            return { status: 'ok', timestamp: new Date().toISOString() };
        });

        // Start server
        const port = parseInt(process.env.PORT || '3001');
        const host = process.env.HOST || '0.0.0.0';
        const address = await fastify.listen({ port, host });

        console.log(`🚀 Server running on ${address}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: unknown) => {
    console.error('Uncaught Exception:', error);
});

start();
