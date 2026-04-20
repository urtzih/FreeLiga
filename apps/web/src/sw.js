/* eslint-disable no-restricted-globals */
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

self.skipWaiting();
clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')));

const DEFAULT_NOTIFICATION_ICON = '/icon-192.png';
const DEFAULT_NOTIFICATION_BADGE = '/icon-maskable-192.png';

self.addEventListener('push', (event) => {
    let notificationData = {
        title: 'FreeLiga',
        body: 'Tienes una nueva notificacion',
    };

    if (event.data) {
        try {
            notificationData = event.data.json();
        } catch {
            notificationData = {
                title: 'FreeLiga',
                body: event.data.text() || 'Tienes una nueva notificacion',
            };
        }
    }

    const {
        title = 'FreeLiga',
        body = 'Nueva notificacion',
        icon = DEFAULT_NOTIFICATION_ICON,
        badge = DEFAULT_NOTIFICATION_BADGE,
        tag = 'default',
        data = {},
        requireInteraction = true,
    } = notificationData;

    const options = {
        body,
        icon,
        badge,
        tag,
        data: {
            url: data.url || '/',
            ...data,
        },
        actions: [
            {
                action: 'open',
                title: 'Abrir',
            },
            {
                action: 'close',
                title: 'Cerrar',
            },
        ],
        silent: false,
        requireInteraction,
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'close') return;

    const data = event.notification.data || {};
    const targetUrl = data.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
            return undefined;
        })
    );
});
