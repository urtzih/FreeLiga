import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

interface UsePushNotificationReturn {
    isSupported: boolean;
    isSubscribed: boolean;
    isLoading: boolean;
    error: string | null;
    subscribe: (mode?: PushSubscriptionMode) => Promise<void>;
    unsubscribe: (mode?: PushSubscriptionMode) => Promise<void>;
}

export type PushSubscriptionMode = 'auto' | 'public' | 'authenticated';

export function usePushNotification(): UsePushNotificationReturn {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Check if push notifications are supported
    const isSupported =
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;

    // Get VAPID public key
    const { data: vapidData } = useQuery({
        queryKey: ['vapid-public-key'],
        queryFn: async () => {
            const response = await api.get('/push/vapid-public-key');
            return response.data;
        },
        enabled: isSupported,
    });

    // Check subscription status on mount and when VAPID key is loaded
    useEffect(() => {
        if (!isSupported || !vapidData) return;

        const checkSubscription = async () => {
            try {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                setIsSubscribed(!!subscription);
            } catch (err) {
                console.error('Error checking subscription:', err);
            }
        };

        checkSubscription();
    }, [isSupported, vapidData]);

    const getServiceWorkerRegistration = useCallback(async (timeoutMs = 20000) => {
        const waitForReady = async () => {
            return await Promise.race([
                navigator.serviceWorker.ready,
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Service Worker no disponible a tiempo')), timeoutMs)
                ),
            ]);
        };

        const waitForActiveRegistration = async (registration: ServiceWorkerRegistration) => {
            if (registration.active) return registration;

            const worker = registration.installing || registration.waiting;
            if (worker) {
                await Promise.race([
                    new Promise<void>((resolve) => {
                        const onStateChange = () => {
                            if (worker.state === 'activated') {
                                worker.removeEventListener('statechange', onStateChange);
                                resolve();
                            }
                        };
                        worker.addEventListener('statechange', onStateChange);
                        onStateChange();
                    }),
                    new Promise<void>((_, reject) =>
                        setTimeout(() => reject(new Error('Service Worker no activo a tiempo')), timeoutMs)
                    ),
                ]);
            } else {
                await waitForReady();
            }

            return registration.active ? registration : await waitForReady();
        };

        const existingRegistration = await navigator.serviceWorker.getRegistration();
        if (existingRegistration) {
            return await waitForActiveRegistration(existingRegistration);
        }

        // First try the default ready flow (works when SW registration is still initializing).
        try {
            const readyRegistration = await waitForReady();
            return await waitForActiveRegistration(readyRegistration);
        } catch {
            // Continue with explicit registration fallbacks below.
        }

        // Fallback for dev/tunnel contexts: dev SW in Vite and prod SW script.
        const candidateScripts = import.meta.env.DEV
            ? ['/dev-sw.js?dev-sw', '/sw.js']
            : ['/sw.js', '/dev-sw.js?dev-sw'];

        for (const scriptUrl of candidateScripts) {
            try {
                await navigator.serviceWorker.register(scriptUrl, { scope: '/', type: 'module' });
                const readyRegistration = await waitForReady();
                return await waitForActiveRegistration(readyRegistration);
            } catch (err) {
                console.warn('[PushDebug] fallback SW register failed', { scriptUrl, err });
                try {
                    await navigator.serviceWorker.register(scriptUrl, { scope: '/' });
                    const readyRegistration = await waitForReady();
                    return await waitForActiveRegistration(readyRegistration);
                } catch (classicErr) {
                    console.warn('[PushDebug] fallback SW register classic failed', { scriptUrl, err: classicErr });
                }
            }
        }

        throw new Error('Service Worker no disponible a tiempo');
    }, []);

    // Pre-warm SW registration to reduce click-time race conditions on mobile/tunnel.
    useEffect(() => {
        if (!isSupported) return;
        getServiceWorkerRegistration().catch((err) => {
            console.warn('[PushDebug] SW prewarm failed', err);
        });
    }, [isSupported, getServiceWorkerRegistration]);

    const subscribe = useCallback(async (mode: PushSubscriptionMode = 'auto') => {
        const resolvedMode = mode === 'auto' ? 'public' : mode;
        console.log('[PushDebug] subscribe:start', {
            isSupported,
            hasVapidKey: !!vapidData?.publicKey,
            notificationPermission: typeof Notification !== 'undefined' ? Notification.permission : 'unknown',
            mode: resolvedMode,
        });

        if (!isSupported || !vapidData?.publicKey) {
            setError('Push notifications are not supported or VAPID key not loaded');
            console.log('[PushDebug] subscribe:abort:not-supported-or-no-vapid');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            console.log('[PushDebug] subscribe:loading=true');

            // Request notification permission
            if (Notification.permission === 'denied') {
                setError('Notification permission denied');
                console.log('[PushDebug] subscribe:permission-denied');
                throw new Error('Notification permission denied');
            }

            if (Notification.permission !== 'granted') {
                console.log('[PushDebug] subscribe:requesting-permission');
                const permission = await Notification.requestPermission();
                console.log('[PushDebug] subscribe:permission-result', { permission });
                if (permission !== 'granted') {
                    setError('Notification permission denied by user');
                    console.log('[PushDebug] subscribe:permission-not-granted');
                    throw new Error('Notification permission denied by user');
                }
            }

            // Get service worker registration
            console.log('[PushDebug] subscribe:waiting-service-worker-ready');
            const registration = await getServiceWorkerRegistration();
            console.log('[PushDebug] subscribe:service-worker-ready');

            // Subscribe to push
            console.log('[PushDebug] subscribe:pushManager.subscribe:start');
            let subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                console.log('[PushDebug] subscribe:reusing-existing-subscription');
            } else {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(
                        vapidData.publicKey
                    ) as BufferSource,
                });
                console.log('[PushDebug] subscribe:pushManager.subscribe:done');
            }

            // Send subscription to backend
            console.log('[PushDebug] subscribe:backend-save:start');
            if (resolvedMode === 'authenticated') {
                await api.post('/push/subscribe', subscription.toJSON());
            } else {
                await api.post('/push/public-subscribe', subscription.toJSON());
            }
            console.log('[PushDebug] subscribe:backend-save:done');

            setIsSubscribed(true);
            console.log('[PushDebug] subscribe:success');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe';
            setError(errorMessage);
            console.error('Subscription error:', err);
            console.error('[PushDebug] subscribe:error', err);
            throw err;
        } finally {
            setIsLoading(false);
            console.log('[PushDebug] subscribe:loading=false');
        }
    }, [isSupported, vapidData, getServiceWorkerRegistration]);

    const unsubscribe = useCallback(async (mode: PushSubscriptionMode = 'auto') => {
        const resolvedMode = mode === 'auto' ? 'public' : mode;
        console.log('[PushDebug] unsubscribe:start', { isSupported });
        if (!isSupported) return;

        try {
            setIsLoading(true);
            setError(null);
            console.log('[PushDebug] unsubscribe:loading=true');

            console.log('[PushDebug] unsubscribe:waiting-service-worker-ready');
            const registration = await getServiceWorkerRegistration();
            console.log('[PushDebug] unsubscribe:service-worker-ready');
            const subscription = await registration.pushManager.getSubscription();
            console.log('[PushDebug] unsubscribe:getSubscription', { hasSubscription: !!subscription });

            if (subscription) {
                // Notify backend
                console.log('[PushDebug] unsubscribe:backend-remove:start');
                if (resolvedMode === 'authenticated') {
                    await api.post('/push/unsubscribe', {
                        endpoint: subscription.endpoint,
                    });
                } else {
                    await api.post('/push/public-unsubscribe', {
                        endpoint: subscription.endpoint,
                    });
                }
                console.log('[PushDebug] unsubscribe:backend-remove:done');

                // Unsubscribe from push
                console.log('[PushDebug] unsubscribe:browser-unsubscribe:start');
                await subscription.unsubscribe();
                console.log('[PushDebug] unsubscribe:browser-unsubscribe:done');
                setIsSubscribed(false);
                console.log('[PushDebug] unsubscribe:success');
            } else {
                console.log('[PushDebug] unsubscribe:no-subscription-found');
                setIsSubscribed(false);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe';
            setError(errorMessage);
            console.error('Unsubscription error:', err);
            console.error('[PushDebug] unsubscribe:error', err);
            throw err;
        } finally {
            setIsLoading(false);
            console.log('[PushDebug] unsubscribe:loading=false');
        }
    }, [isSupported, getServiceWorkerRegistration]);

    return {
        isSupported,
        isSubscribed,
        isLoading,
        error,
        subscribe,
        unsubscribe,
    };
}

/**
 * Convert VAPID public key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}
