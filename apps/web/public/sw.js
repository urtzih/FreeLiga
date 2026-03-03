/**
 * Service Worker for FreeSquash League
 * Handles push notifications and offline support
 */

// Handle incoming push notifications
self.addEventListener('push', (event) => {
    console.log('[SW Push Event] Evento push recibido', { hasData: !!event.data });
    
    if (!event.data) {
        console.warn('[SW Push Event] ❌ Push received but no data available');
        return;
    }

    let notificationData = {};
    try {
        notificationData = event.data.json();
        console.log('[SW Push Event] ✅ JSON parseado:', notificationData);
    } catch (e) {
        console.log('[SW Push Event] ⚠️ No JSON, usando text():', e);
        notificationData = {
            title: 'FreeSquash',
            body: event.data.text(),
        };
    }

    const {
        title = 'FreeSquash League',
        body = 'Nueva notificación',
        icon = '/logo.jpg',
        badge = '/logo.jpg',
        tag = 'default',
        data = {},
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
        requireInteraction: false,
    };

    console.log('[SW Push Event] 📢 Mostrando notificación:', { title, body, tag });
    
    event.waitUntil(
        self.registration.showNotification(title, options).then(() => {
            console.log('[SW Push Event] ✅ Notificación mostrada correctamente');
        }).catch((err) => {
            console.error('[SW Push Event] ❌ Error mostrando notificación:', err);
        })
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const data = event.notification.data;
    const url = data?.url || '/';

    if (event.action === 'close') {
        return;
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there's already a window/tab with the target URL open
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window/tab with the target URL
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
    console.log('Notification closed:', event.notification.tag);
});

// Extended Service Worker lifecycle handling (for PWA)
self.addEventListener('install', () => {
    console.log('Service Worker installing...');
    // Force the waiting service worker to become the active one
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    // Claim all clients
    event.waitUntil(clients.claim());
});
