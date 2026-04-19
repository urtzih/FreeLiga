/**
 * Push Notification Service
 * Handles sending web push notifications to subscribed users
 */

import * as webpush from 'web-push';
import { prisma } from '@freesquash/database';
import { logger } from '../utils/logger';

export interface PushNotificationInput {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    url?: string;
    data?: Record<string, string>;
}

export type PushTarget =
    | { type: 'ALL' }
    | { type: 'USER'; userId: string }
    | { type: 'GROUP'; groupId: string };

type PushSubscriptionSource = 'USER' | 'PUBLIC';

interface DispatchSubscription {
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    source: PushSubscriptionSource;
}

interface PushSubscriptionData {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

interface SendToSubscriptionsResult {
    sent: number;
    failed: number;
    invalidUserSubscriptionIds: string[];
    invalidPublicSubscriptionIds: string[];
}

function isPushTraceEnabled(): boolean {
    return (process.env.PUSH_TRACE || '').toLowerCase() === 'true';
}

function safeEndpointRef(endpoint: string): string {
    if (!endpoint) return 'empty-endpoint';
    const prefix = endpoint.slice(0, 42);
    return `${prefix}... (len=${endpoint.length})`;
}

function logPushTrace(message: string, data: Record<string, unknown>) {
    if (!isPushTraceEnabled()) return;
    logger.info({ pushTrace: true, ...data }, message);
}

type PwaInstallEventType = 'APP_INSTALLED' | 'STANDALONE_SEEN';

interface PushAdoptionMetrics {
    push: {
        totalDevices: number;
        authenticatedDevices: number;
        publicDevices: number;
        usersWithPush: number;
    };
    pwa: {
        totalInstalledDevices: number;
        installsLast7Days: number;
        installsLast30Days: number;
        lastInstallAt: string | null;
    };
}

// Configure web-push with VAPID keys
export function initializePushNotifications() {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT;

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
        logger.warn(
            {
                hasPublicKey: !!vapidPublicKey,
                hasPrivateKey: !!vapidPrivateKey,
                hasSubject: !!vapidSubject,
            },
            'Web Push VAPID keys not fully configured. Push notifications are disabled.'
        );
        return;
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

/**
 * Save or update a push subscription for a user
 */
export async function savePushSubscription(
    userId: string,
    subscription: PushSubscriptionData
): Promise<void> {
    logPushTrace('push subscribe (authenticated) start', {
        userId,
        endpoint: safeEndpointRef(subscription.endpoint),
    });

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

    logPushTrace('push subscribe (authenticated) done', {
        userId,
        endpoint: safeEndpointRef(subscription.endpoint),
    });
}

/**
 * Remove a push subscription
 */
export async function removePushSubscription(
    userId: string,
    endpoint: string
): Promise<void> {
    logPushTrace('push unsubscribe (authenticated) start', {
        userId,
        endpoint: safeEndpointRef(endpoint),
    });

    await prisma.pushSubscription.deleteMany({
        where: {
            userId,
            endpoint,
        },
    });

    logPushTrace('push unsubscribe (authenticated) done', {
        userId,
        endpoint: safeEndpointRef(endpoint),
    });
}

/**
 * Save or update a push subscription for anonymous/public visitors
 */
export async function savePublicPushSubscription(
    subscription: PushSubscriptionData,
    userAgent?: string | null
): Promise<void> {
    logPushTrace('push subscribe (public) start', {
        endpoint: safeEndpointRef(subscription.endpoint),
        hasUserAgent: !!userAgent,
    });

    try {
        await prisma.$executeRawUnsafe(
            `
            INSERT INTO public_push_subscriptions (id, endpoint, p256dh, auth, userAgent, createdAt, updatedAt)
            VALUES (UUID(), ?, ?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                p256dh = VALUES(p256dh),
                auth = VALUES(auth),
                userAgent = VALUES(userAgent),
                updatedAt = NOW()
            `,
            subscription.endpoint,
            subscription.keys.p256dh,
            subscription.keys.auth,
            userAgent ?? null
        );
    } catch (error) {
        if (isMissingPublicSubscriptionsTableError(error)) {
            logger.warn('public_push_subscriptions table missing: skipping public subscribe persistence');
            return;
        }
        throw error;
    }

    logPushTrace('push subscribe (public) done', {
        endpoint: safeEndpointRef(subscription.endpoint),
    });
}

/**
 * Remove a public push subscription
 */
export async function removePublicPushSubscription(endpoint: string): Promise<void> {
    logPushTrace('push unsubscribe (public) start', {
        endpoint: safeEndpointRef(endpoint),
    });

    try {
        await prisma.$executeRawUnsafe(
            `DELETE FROM public_push_subscriptions WHERE endpoint = ?`,
            endpoint
        );
    } catch (error) {
        if (isMissingPublicSubscriptionsTableError(error)) {
            logger.warn('public_push_subscriptions table missing: skipping public unsubscribe persistence');
            return;
        }
        throw error;
    }

    logPushTrace('push unsubscribe (public) done', {
        endpoint: safeEndpointRef(endpoint),
    });
}

/**
 * Send a push notification to a specific user
 */
export async function sendPushToUser(
    userId: string,
    notification: PushNotificationInput
): Promise<{ sent: number; failed: number }> {
    const result = await sendPushByTarget({ type: 'USER', userId }, notification);
    return { sent: result.sent, failed: result.failed };
}

/**
 * Send a push notification to all active users
 */
export async function sendPushToAll(
    notification: PushNotificationInput
): Promise<{ success: number; failed: number }> {
    const result = await sendPushByTarget({ type: 'ALL' }, notification);
    return {
        success: result.sent,
        failed: result.failed,
    };
}

export async function sendPushByTarget(
    target: PushTarget,
    notification: PushNotificationInput
): Promise<{ sent: number; failed: number; audience: number }> {
    logPushTrace('push send start', {
        targetType: target.type,
        title: notification.title,
        tag: notification.tag || null,
        url: notification.url || null,
    });

    const subscriptions = await findSubscriptionsByTarget(target);

    if (subscriptions.length === 0) {
        logPushTrace('push send no audience', {
            targetType: target.type,
        });
        return { sent: 0, failed: 0, audience: 0 };
    }

    const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/logo.jpg',
        badge: notification.badge || '/logo.jpg',
        tag: notification.tag || 'default',
        data: {
            url: notification.url || '/',
            ...(notification.data || {}),
        },
    });

    const result = await sendToSubscriptions(subscriptions, payload);

    if (result.invalidUserSubscriptionIds.length > 0) {
        logPushTrace('push cleanup invalid authenticated subscriptions', {
            invalidCount: result.invalidUserSubscriptionIds.length,
        });
        await prisma.pushSubscription.deleteMany({
            where: {
                id: {
                    in: result.invalidUserSubscriptionIds,
                },
            },
        });
    }

    if (result.invalidPublicSubscriptionIds.length > 0) {
        logPushTrace('push cleanup invalid public subscriptions', {
            invalidCount: result.invalidPublicSubscriptionIds.length,
        });
        try {
            await prisma.$executeRawUnsafe(
                `
                DELETE FROM public_push_subscriptions
                WHERE id IN (${result.invalidPublicSubscriptionIds.map(() => '?').join(',')})
                `,
                ...result.invalidPublicSubscriptionIds
            );
        } catch (error) {
            if (!isMissingPublicSubscriptionsTableError(error)) {
                throw error;
            }
        }
    }

    return {
        sent: result.sent,
        failed: result.failed,
        audience: subscriptions.length,
    };
}

function isInvalidSubscriptionError(error: any): boolean {
    return error?.statusCode === 404 || error?.statusCode === 410;
}

async function sendToSubscriptions(
    subscriptions: DispatchSubscription[],
    payload: string
): Promise<SendToSubscriptionsResult> {
    const invalidUserSubscriptionIds: string[] = [];
    const invalidPublicSubscriptionIds: string[] = [];
    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
        logPushTrace('push delivery attempt', {
            subscriptionId: sub.id,
            source: sub.source,
            endpoint: safeEndpointRef(sub.endpoint),
        });

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
            sent++;
            logPushTrace('push delivery success', {
                subscriptionId: sub.id,
                source: sub.source,
            });
        } catch (error: any) {
            failed++;
            if (isInvalidSubscriptionError(error)) {
                logPushTrace('push delivery invalid subscription', {
                    subscriptionId: sub.id,
                    source: sub.source,
                    statusCode: error?.statusCode,
                });
                if (sub.source === 'PUBLIC') {
                    invalidPublicSubscriptionIds.push(sub.id);
                } else {
                    invalidUserSubscriptionIds.push(sub.id);
                }
                continue;
            }

            logPushTrace('push delivery failed', {
                subscriptionId: sub.id,
                source: sub.source,
                statusCode: error?.statusCode,
                message: error?.message,
            });

            logger.warn(
                {
                    subscriptionId: sub.id,
                    statusCode: error?.statusCode,
                    message: error?.message,
                },
                'Failed to send push notification to subscription'
            );
        }
    }

    return { sent, failed, invalidUserSubscriptionIds, invalidPublicSubscriptionIds };
}

async function findSubscriptionsByTarget(target: PushTarget) {
    switch (target.type) {
        case 'USER':
            return (await prisma.pushSubscription.findMany({
                where: {
                    userId: target.userId,
                    user: {
                        isActive: true,
                    },
                },
                select: {
                    id: true,
                    endpoint: true,
                    p256dh: true,
                    auth: true,
                },
            })).map((sub) => ({ ...sub, source: 'USER' as const }));

        case 'GROUP':
            return (await prisma.pushSubscription.findMany({
                where: {
                    user: {
                        isActive: true,
                        player: {
                            groupPlayers: {
                                some: {
                                    groupId: target.groupId,
                                },
                            },
                        },
                    },
                },
                select: {
                    id: true,
                    endpoint: true,
                    p256dh: true,
                    auth: true,
                },
            })).map((sub) => ({ ...sub, source: 'USER' as const }));

        case 'ALL': {
            const [userSubscriptions, publicSubscriptions] = await Promise.all([
                prisma.pushSubscription.findMany({
                    where: {
                        user: {
                            isActive: true,
                        },
                    },
                    select: {
                        id: true,
                        endpoint: true,
                        p256dh: true,
                        auth: true,
                    },
                }),
                findPublicPushSubscriptions(),
            ]);

            // De-duplicate by endpoint (prefer USER record when duplicated)
            const seen = new Set<string>();
            const merged: DispatchSubscription[] = [];

            for (const sub of userSubscriptions) {
                if (seen.has(sub.endpoint)) continue;
                seen.add(sub.endpoint);
                merged.push({ ...sub, source: 'USER' });
            }

            for (const sub of publicSubscriptions) {
                if (seen.has(sub.endpoint)) continue;
                seen.add(sub.endpoint);
                merged.push(sub);
            }

            logPushTrace('push audience resolved', {
                targetType: target.type,
                userSubscriptions: userSubscriptions.length,
                publicSubscriptions: publicSubscriptions.length,
                deduplicatedAudience: merged.length,
            });

            return merged;
        }
    }
}

async function findPublicPushSubscriptions(): Promise<DispatchSubscription[]> {
    let rows: Array<{
        id: string;
        endpoint: string;
        p256dh: string;
        auth: string;
    }>;

    try {
        rows = await prisma.$queryRawUnsafe<Array<{
            id: string;
            endpoint: string;
            p256dh: string;
            auth: string;
        }>>(
            `
            SELECT id, endpoint, p256dh, auth
            FROM public_push_subscriptions
            `
        );
    } catch (error) {
        if (isMissingPublicSubscriptionsTableError(error)) {
            logger.warn('public_push_subscriptions table missing: returning empty public subscriptions');
            return [];
        }
        throw error;
    }

    return rows.map((row) => ({
        ...row,
        source: 'PUBLIC' as const,
    }));
}

function isMissingPublicSubscriptionsTableError(error: unknown): boolean {
    if (!error) return false;
    const message = (error as { message?: string }).message ?? '';
    return message.includes('1146') && message.includes('public_push_subscriptions');
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

export async function trackPwaInstallationEvent(input: {
    installationId: string;
    eventType: PwaInstallEventType;
    userAgent?: string | null;
}) {
    const isInstallSignal =
        input.eventType === 'APP_INSTALLED' || input.eventType === 'STANDALONE_SEEN';
    await prisma.$executeRawUnsafe(
        `
        INSERT INTO pwa_installations (id, installationId, installedAt, firstSeenAt, lastSeenAt, userAgent, createdAt, updatedAt)
        VALUES (UUID(), ?, ?, NOW(), NOW(), ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
            lastSeenAt = NOW(),
            userAgent = VALUES(userAgent),
            installedAt = COALESCE(pwa_installations.installedAt, VALUES(installedAt)),
            updatedAt = NOW()
        `,
        input.installationId,
        isInstallSignal ? new Date() : null,
        input.userAgent || null
    );
}

export async function getPushAdoptionMetrics(): Promise<PushAdoptionMetrics> {
    const [authenticatedSubscriptions, publicSubscriptions, usersWithPushRows, pwaStatsRows] = await Promise.all([
        prisma.pushSubscription.findMany({
            select: {
                endpoint: true,
            },
        }),
        prisma.publicPushSubscription
            .findMany({
                select: {
                    endpoint: true,
                },
            })
            .catch((error) => {
                if (isMissingTableError(error, 'public_push_subscriptions')) {
                    logger.warn('public_push_subscriptions table missing: metrics will report 0 public devices');
                    return [];
                }
                throw error;
            }),
        prisma.pushSubscription.groupBy({
            by: ['userId'],
        }),
        prisma
            .$queryRawUnsafe<Array<{ installs7: bigint | number; installs30: bigint | number; total: bigint | number }>>(
                `
                SELECT
                    SUM(CASE WHEN installedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS installs7,
                    SUM(CASE WHEN installedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS installs30,
                    COUNT(*) AS total
                FROM pwa_installations
                WHERE installedAt IS NOT NULL
                `
            )
            .catch((error) => {
                if (isMissingTableError(error, 'pwa_installations')) {
                    logger.warn('pwa_installations table missing: metrics will report 0 installs');
                    return [];
                }
                throw error;
            }),
    ]);

    const endpoints = new Set<string>();
    for (const sub of authenticatedSubscriptions) endpoints.add(sub.endpoint);
    for (const sub of publicSubscriptions) endpoints.add(sub.endpoint);

    const latestInstallRows = await prisma
        .$queryRawUnsafe<Array<{ installedAt: Date | null }>>(
            `
            SELECT installedAt
            FROM pwa_installations
            WHERE installedAt IS NOT NULL
            ORDER BY installedAt DESC
            LIMIT 1
            `
        )
        .catch((error) => {
            if (isMissingTableError(error, 'pwa_installations')) {
                return [];
            }
            throw error;
        });

    const pwaStats = pwaStatsRows[0] || { installs7: 0, installs30: 0, total: 0 };
    const toNumber = (value: bigint | number | null | undefined) => Number(value || 0);

    return {
        push: {
            totalDevices: endpoints.size,
            authenticatedDevices: authenticatedSubscriptions.length,
            publicDevices: publicSubscriptions.length,
            usersWithPush: usersWithPushRows.length,
        },
        pwa: {
            totalInstalledDevices: toNumber(pwaStats.total),
            installsLast7Days: toNumber(pwaStats.installs7),
            installsLast30Days: toNumber(pwaStats.installs30),
            lastInstallAt: latestInstallRows[0]?.installedAt?.toISOString() || null,
        },
    };
}

function isMissingTableError(error: unknown, tableName: string): boolean {
    if (!error) return false;
    const message = (error as { message?: string }).message ?? '';
    return message.includes('1146') && message.includes(tableName);
}
