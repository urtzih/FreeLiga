import Fastify from 'fastify';
import cors from '@fastify/cors';
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
        // Register CORS
        await fastify.register(cors, {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            credentials: true,
        });

        // Register JWT
        await fastify.register(jwt, {
            secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
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
                host: 'localhost:3001',
                schemes: ['http'],
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
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

start();
