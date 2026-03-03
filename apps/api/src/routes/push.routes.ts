import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
    savePushSubscription,
    removePushSubscription,
    sendPushToUser,
    sendPushToAll,
    getVapidPublicKey,
} from '../services/push-notification.service';
import { logger, logBusinessEvent } from '../utils/logger';

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
    data: z.record(z.string()).optional(),
});

export async function registerPushRoutes(fastify: FastifyInstance) {
    /**
     * GET /api/push/vapid-public-key
     * Get the VAPID public key for subscribing to push notifications
     * Public endpoint
     */
    fastify.get('/push/vapid-public-key', async (request, reply) => {
        try {
            const publicKey = getVapidPublicKey();
            return { publicKey };
        } catch (error) {
            logger.error({ error }, '❌ Error getting VAPID public key');
            return reply.status(500).send({
                error: 'Failed to get VAPID public key',
            });
        }
    });

    /**
     * POST /api/push/subscribe
     * Subscribe to push notifications
     * Requires authentication
     */
    fastify.post<{ Body: typeof subscriptionSchema._type }>(
        '/push/subscribe',
        { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try {
                const userId = (request.user as any).id;
                console.log(`[Push Subscribe] User ${userId} attempting to subscribe`);
                console.log(`[Push Subscribe] Request body:`, request.body);
                
                const validation = subscriptionSchema.safeParse(request.body);
                if (!validation.success) {
                    console.error(`[Push Subscribe] Validation failed:`, validation.error);
                    return reply.status(400).send({ error: 'Invalid subscription data' });
                }

                console.log(`[Push Subscribe] Validation passed, saving subscription...`);
                await savePushSubscription(userId, validation.data);
                console.log(`[Push Subscribe] ✅ Subscription saved successfully for user ${userId}`);

                logBusinessEvent('push_subscription_created', {
                    userId,
                    endpoint: validation.data.endpoint.substring(0, 50) + '...',
                });

                return {
                    success: true,
                    message: 'Subscribed successfully',
                };
            } catch (error) {
                console.error(`[Push Subscribe] ❌ Error:`, error);
                logger.error({ error }, '❌ Error subscribing to push notifications');
                return reply.status(500).send({
                    error: 'Failed to subscribe',
                });
            }
        }
    );

    /**
     * POST /api/push/unsubscribe
     * Unsubscribe from push notifications
     * Requires authentication
     */
    fastify.post<{ Body: { endpoint: string } }>(
        '/push/unsubscribe',
        { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            try {
                const { endpoint } = request.body as { endpoint: string };

                if (!endpoint) {
                    return reply.status(400).send({ error: 'Endpoint is required' });
                }

                const userId = (request.user as any).id;
                await removePushSubscription(userId, endpoint);

                logBusinessEvent('push_subscription_removed', {
                    userId,
                    endpoint: endpoint.substring(0, 50) + '...',
                });

                return {
                    success: true,
                    message: 'Unsubscribed successfully',
                };
            } catch (error) {
                logger.error({ error }, '❌ Error unsubscribing from push notifications');
                return reply.status(500).send({
                    error: 'Failed to unsubscribe',
                });
            }
        }
    );

    /**
     * POST /api/push/send-to-user/:userId
     * Send a push notification to a specific user
     * Requires admin authentication
     */
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
                        message: 'The user must activate notifications by clicking the 🔔 button',
                    });
                }

                return {
                    success: true,
                    message: 'Notification sent',
                    result,
                };
            } catch (error) {
                logger.error({ error }, '❌ Error sending push notification to user');
                return reply.status(500).send({
                    error: 'Failed to send notification',
                });
            }
        }
    );

    /**
     * POST /api/push/send-to-all
     * Send a push notification to all subscribed users
     * Requires admin authentication
     */
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
                logger.error({ error }, '❌ Error sending broadcast push notification');
                return reply.status(500).send({
                    error: 'Failed to send broadcast',
                });
            }
        }
    );
}
