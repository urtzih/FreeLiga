import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
    getPushAdoptionMetrics,
    getVapidPublicKey,
    removePublicPushSubscription,
    removePushSubscription,
    savePublicPushSubscription,
    savePushSubscription,
    sendPushToAll,
    sendPushToUser,
    trackPwaInstallationEvent,
} from '../services/push-notification.service';
import { logBusinessEvent, logger } from '../utils/logger';

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: any, reply: any) => Promise<void>;
    }
}

const subscriptionSchema = z.object({
    endpoint: z.string().url(),
    keys: z.object({
        p256dh: z.string(),
        auth: z.string(),
    }),
});

const pushNotificationSchema = z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    icon: z.string().optional(),
    badge: z.string().optional(),
    tag: z.string().optional(),
    url: z.string().optional(),
    data: z.record(z.string()).optional(),
});

const unsubscribeSchema = z.object({
    endpoint: z.string().url(),
});

const pwaInstallEventSchema = z.object({
    installationId: z.string().min(16).max(191),
    eventType: z.enum(['APP_INSTALLED', 'STANDALONE_SEEN']),
});

export async function registerPushRoutes(fastify: FastifyInstance) {
    fastify.get('/push/vapid-public-key', async (_request, reply) => {
        try {
            const publicKey = getVapidPublicKey();
            return { publicKey };
        } catch (error) {
            logger.error({ error }, 'Error getting VAPID public key');
            return reply.status(500).send({
                error: 'Failed to get VAPID public key',
            });
        }
    });

    fastify.post<{ Body: typeof subscriptionSchema._type }>(
        '/push/subscribe',
        { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try {
                const userId = (request.user as any).id;
                const validation = subscriptionSchema.safeParse(request.body);
                if (!validation.success) {
                    return reply.status(400).send({ error: 'Invalid subscription data' });
                }

                await savePushSubscription(userId, validation.data);

                logBusinessEvent('push_subscription_created', {
                    userId,
                    endpoint: `${validation.data.endpoint.substring(0, 50)}...`,
                });

                return {
                    success: true,
                    message: 'Subscribed successfully',
                };
            } catch (error) {
                logger.error({ error }, 'Error subscribing to push notifications');
                return reply.status(500).send({
                    error: 'Failed to subscribe',
                });
            }
        }
    );

    fastify.post<{ Body: typeof subscriptionSchema._type }>(
        '/push/public-subscribe',
        async (request, reply) => {
            try {
                const validation = subscriptionSchema.safeParse(request.body);
                if (!validation.success) {
                    return reply.status(400).send({ error: 'Invalid subscription data' });
                }

                const userAgent = request.headers['user-agent'] || null;
                await savePublicPushSubscription(validation.data, userAgent);

                logBusinessEvent('push_public_subscription_created', {
                    endpoint: `${validation.data.endpoint.substring(0, 50)}...`,
                });

                return {
                    success: true,
                    message: 'Public subscription saved',
                };
            } catch (error) {
                logger.error({ error }, 'Error creating public push subscription');
                return reply.status(500).send({
                    error: 'Failed to subscribe',
                });
            }
        }
    );

    fastify.post<{ Body: { endpoint: string } }>(
        '/push/unsubscribe',
        { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try {
                const { endpoint } = unsubscribeSchema.parse(request.body);

                const userId = (request.user as any).id;
                await removePushSubscription(userId, endpoint);

                logBusinessEvent('push_subscription_removed', {
                    userId,
                    endpoint: `${endpoint.substring(0, 50)}...`,
                });

                return {
                    success: true,
                    message: 'Unsubscribed successfully',
                };
            } catch (error) {
                if (error instanceof z.ZodError) {
                    return reply.status(400).send({ error: 'Endpoint is required' });
                }
                logger.error({ error }, 'Error unsubscribing from push notifications');
                return reply.status(500).send({
                    error: 'Failed to unsubscribe',
                });
            }
        }
    );

    fastify.post<{ Body: typeof unsubscribeSchema._type }>(
        '/push/public-unsubscribe',
        async (request, reply) => {
            try {
                const { endpoint } = unsubscribeSchema.parse(request.body);
                await removePublicPushSubscription(endpoint);

                logBusinessEvent('push_public_subscription_removed', {
                    endpoint: `${endpoint.substring(0, 50)}...`,
                });

                return {
                    success: true,
                    message: 'Public unsubscription completed',
                };
            } catch (error) {
                if (error instanceof z.ZodError) {
                    return reply.status(400).send({ error: 'Endpoint is required' });
                }
                logger.error({ error }, 'Error removing public push subscription');
                return reply.status(500).send({
                    error: 'Failed to unsubscribe',
                });
            }
        }
    );

    fastify.post<{ Body: typeof pwaInstallEventSchema._type }>(
        '/pwa/installation-events',
        async (request, reply) => {
            try {
                const validation = pwaInstallEventSchema.safeParse(request.body);
                if (!validation.success) {
                    return reply.status(400).send({ error: 'Invalid install event data' });
                }

                const userAgent = request.headers['user-agent'] || null;
                await trackPwaInstallationEvent({
                    installationId: validation.data.installationId,
                    eventType: validation.data.eventType,
                    userAgent,
                });

                return {
                    success: true,
                };
            } catch (error) {
                logger.error({ error }, 'Error tracking PWA install event');
                return reply.status(500).send({
                    error: 'Failed to track install event',
                });
            }
        }
    );

    fastify.post<{ Params: { userId: string }; Body: typeof pushNotificationSchema._type }>(
        '/push/send-to-user/:userId',
        { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try {
                const user = request.user as any;
                if (user.role !== 'ADMIN') {
                    return reply.status(403).send({
                        error: 'Only admins can send notifications',
                    });
                }

                const validation = pushNotificationSchema.safeParse(request.body);
                if (!validation.success) {
                    return reply.status(400).send({ error: 'Invalid notification data' });
                }

                const { userId: targetUserId } = request.params as { userId: string };
                const result = await sendPushToUser(targetUserId, validation.data);

                logBusinessEvent('push_notification_sent', {
                    senderId: user.id,
                    targetUserId,
                    title: validation.data.title,
                    sent: result.sent,
                    failed: result.failed,
                });

                if (result.sent === 0 && result.failed === 0) {
                    return reply.status(404).send({
                        error: 'User has no active push subscriptions',
                    });
                }

                return {
                    success: true,
                    message: 'Notification sent',
                    result,
                };
            } catch (error) {
                logger.error({ error }, 'Error sending push notification to user');
                return reply.status(500).send({
                    error: 'Failed to send notification',
                });
            }
        }
    );

    fastify.post<{ Body: typeof pushNotificationSchema._type }>(
        '/push/send-to-all',
        { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try {
                const user = request.user as any;
                if (user.role !== 'ADMIN') {
                    return reply.status(403).send({
                        error: 'Only admins can send notifications',
                    });
                }

                const validation = pushNotificationSchema.safeParse(request.body);
                if (!validation.success) {
                    return reply.status(400).send({ error: 'Invalid notification data' });
                }

                const result = await sendPushToAll(validation.data);

                logBusinessEvent('push_notification_broadcast', {
                    senderId: user.id,
                    title: validation.data.title,
                    successCount: result.success,
                    failedCount: result.failed,
                });

                return {
                    success: true,
                    message: 'Broadcast completed',
                    result,
                };
            } catch (error) {
                logger.error({ error }, 'Error sending broadcast push notification');
                return reply.status(500).send({
                    error: 'Failed to send broadcast',
                });
            }
        }
    );

    fastify.get(
        '/push/adoption-metrics',
        { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try {
                const user = request.user as any;
                if (user.role !== 'ADMIN') {
                    return reply.status(403).send({
                        error: 'Only admins can view adoption metrics',
                    });
                }

                const metrics = await getPushAdoptionMetrics();
                return { metrics };
            } catch (error) {
                logger.error({ error }, 'Error getting push adoption metrics');
                return reply.status(500).send({
                    error: 'Failed to get adoption metrics',
                });
            }
        }
    );
}
