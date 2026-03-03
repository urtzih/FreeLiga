/**
 * Push Notification Service
 * Handles sending web push notifications to subscribed users
 */

import * as webpush from 'web-push';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configure web-push with VAPID keys
export function initializePushNotifications() {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@freesquash.com';

    if (!vapidPublicKey || !vapidPrivateKey) {
        console.warn('⚠️  Web Push VAPID keys not configured. Push notifications will not work.');
        return;
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

interface PushSubscriptionData {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

/**
 * Save or update a push subscription for a user
 */
export async function savePushSubscription(
    userId: string,
    subscription: PushSubscriptionData
): Promise<void> {
    try {
        await prisma.pushSubscription.upsert({
            where: {
                userId_endpoint: {
                    userId,
                    endpoint: subscription.endpoint,
                },
            },
            update: {
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                updatedAt: new Date(),
            },
            create: {
                userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
            },
        });
    } catch (error) {
        console.error('Error saving push subscription:', error);
        throw error;
    }
}

/**
 * Remove a push subscription
 */
export async function removePushSubscription(
    userId: string,
    endpoint: string
): Promise<void> {
    try {
        await prisma.pushSubscription.deleteMany({
            where: {
                userId,
                endpoint,
            },
        });
    } catch (error) {
        console.error('Error removing push subscription:', error);
        throw error;
    }
}

/**
 * Send a push notification to a specific user
 */
export async function sendPushToUser(
    userId: string,
    notification: {
        title: string;
        body: string;
        icon?: string;
        badge?: string;
        tag?: string;
        data?: Record<string, string>;
    }
): Promise<{ sent: number; failed: number }> {
    try {
        // First, check if user has push notifications enabled
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { pushNotificationsEnabled: true },
        });

        if (!user || user.pushNotificationsEnabled === false) {
            console.log(`User ${userId} has push notifications disabled`);
            return { sent: 0, failed: 0 };
        }

        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId },
        });

        if (subscriptions.length === 0) {
            return { sent: 0, failed: 0 };
        }

        const payload = JSON.stringify({
            title: notification.title,
            body: notification.body,
            icon: notification.icon || '/logo.jpg',
            badge: notification.badge || '/logo.jpg',
            tag: notification.tag || 'default',
            data: notification.data || {},
        });

        const failedSubscriptions: string[] = [];
        let sentCount = 0;

        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth,
                        },
                    },
                    payload
                );
                sentCount++;
            } catch (error: any) {
                if (error.statusCode === 410 || error.statusCode === 404) {
                    // Subscription has expired or is no longer valid
                    failedSubscriptions.push(sub.id);
                } else {
                    console.error(`Error sending push to subscription ${sub.id}:`, error);
                }
            }
        }

        // Remove invalid subscriptions
        if (failedSubscriptions.length > 0) {
            await prisma.pushSubscription.deleteMany({
                where: {
                    id: {
                        in: failedSubscriptions,
                    },
                },
            });
        }

        return { sent: sentCount, failed: failedSubscriptions.length };
    } catch (error) {
        console.error('Error sending push notification to user:', error);
        throw error;
    }
}

/**
 * Send a push notification to all active users
 */
export async function sendPushToAll(notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: Record<string, string>;
}): Promise<{ success: number; failed: number }> {
    try {
        // Only get subscriptions for users with push notifications enabled
        const subscriptions = await prisma.pushSubscription.findMany({
            where: {
                user: {
                    pushNotificationsEnabled: true,
                },
            },
            select: {
                id: true,
                userId: true,
                endpoint: true,
                p256dh: true,
                auth: true,
            },
        });

        const payload = JSON.stringify({
            title: notification.title,
            body: notification.body,
            icon: notification.icon || '/logo.jpg',
            badge: notification.badge || '/logo.jpg',
            tag: notification.tag || 'default',
            data: notification.data || {},
        });

        const failedSubscriptions: string[] = [];
        let successCount = 0;

        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth,
                        },
                    },
                    payload
                );
                successCount++;
            } catch (error: any) {
                if (error.statusCode === 410 || error.statusCode === 404) {
                    failedSubscriptions.push(sub.id);
                } else {
                    console.error(`Error sending push to subscription ${sub.id}:`, error);
                    failedSubscriptions.push(sub.id);
                }
            }
        }

        // Remove invalid subscriptions
        if (failedSubscriptions.length > 0) {
            await prisma.pushSubscription.deleteMany({
                where: {
                    id: {
                        in: failedSubscriptions,
                    },
                },
            });
        }

        return {
            success: successCount,
            failed: failedSubscriptions.length,
        };
    } catch (error) {
        console.error('Error sending push notification to all:', error);
        throw error;
    }
}

/**
 * Get VAPID public key (needed for frontend)
 */
export function getVapidPublicKey(): string {
    const key = process.env.VAPID_PUBLIC_KEY;
    if (!key) {
        throw new Error('VAPID_PUBLIC_KEY not configured');
    }
    return key;
}
