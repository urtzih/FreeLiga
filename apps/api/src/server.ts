import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { authRoutes } from './routes/auth.routes';
import { playerRoutes } from './routes/player.routes';
import { groupRoutes } from './routes/group.routes';
import { matchRoutes } from './routes/match.routes';
import { seasonRoutes } from './routes/season.routes';
import { classificationRoutes } from './routes/classification.routes';

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

        // Register routes
        await fastify.register(authRoutes, { prefix: '/api/auth' });
        await fastify.register(playerRoutes, { prefix: '/api/players' });
        await fastify.register(groupRoutes, { prefix: '/api/groups' });
        await fastify.register(matchRoutes, { prefix: '/api/matches' });
        await fastify.register(seasonRoutes, { prefix: '/api/seasons' });
        await fastify.register(classificationRoutes, { prefix: '/api/classification' });

        // Health check
        fastify.get('/health', async () => {
            return { status: 'ok', timestamp: new Date().toISOString() };
        });

        // Start server
        const port = parseInt(process.env.PORT || '3001');
        await fastify.listen({ port, host: '0.0.0.0' });

        console.log(`🚀 Server running on http://localhost:${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

start();
