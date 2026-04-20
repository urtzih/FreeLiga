import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}
type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

const DISMISS_KEY = 'pwa_install_banner_dismiss_until';
const INSTALLED_KEY = 'pwa_install_installed';
const INSTALLATION_ID_KEY = 'pwa_installation_id';
const TRACKED_INSTALL_KEY = 'pwa_install_tracked_install';
const TRACKED_STANDALONE_KEY = 'pwa_install_tracked_standalone';
const DISMISS_MS = 24 * 60 * 60 * 1000;

function getOrCreateInstallationId() {
    const existing = localStorage.getItem(INSTALLATION_ID_KEY);
    if (existing) return existing;

    const generated =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(INSTALLATION_ID_KEY, generated);
    return generated;
}

function isStandalone() {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
    );
}

function isIOSBrowser() {
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua) && /safari/.test(ua) && !/crios|fxios/.test(ua);
}

export function useInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() => {
        if (typeof window === 'undefined' || typeof Notification === 'undefined') return 'unsupported';
        return Notification.permission;
    });
    const [installed, setInstalled] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem(INSTALLED_KEY) === 'true' || isStandalone();
    });
    const [dismissUntil, setDismissUntil] = useState<number>(() => {
        if (typeof window === 'undefined') return 0;
        const raw = Number(localStorage.getItem(DISMISS_KEY) || '0');
        const maxAllowed = Date.now() + DISMISS_MS;
        return raw > maxAllowed ? maxAllowed : raw;
    });

    const trackInstallEvent = useCallback(async (eventType: 'APP_INSTALLED' | 'STANDALONE_SEEN') => {
        if (typeof window === 'undefined') return;
        const eventKey = eventType === 'APP_INSTALLED' ? TRACKED_INSTALL_KEY : TRACKED_STANDALONE_KEY;
        if (localStorage.getItem(eventKey) === 'true') return;

        try {
            await api.post('/pwa/installation-events', {
                installationId: getOrCreateInstallationId(),
                eventType,
            });
            localStorage.setItem(eventKey, 'true');
        } catch {
            // Fire-and-forget telemetry.
        }
    }, []);

    useEffect(() => {
        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setDeferredPrompt(event as BeforeInstallPromptEvent);
        };

        const handleAppInstalled = () => {
            setInstalled(true);
            localStorage.setItem(INSTALLED_KEY, 'true');
            trackInstallEvent('APP_INSTALLED');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, [trackInstallEvent]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!isStandalone()) return;
        trackInstallEvent('STANDALONE_SEEN');
    }, [trackInstallEvent]);

    const dismiss = useCallback(() => {
        const value = Date.now() + DISMISS_MS;
        setDismissUntil(value);
        localStorage.setItem(DISMISS_KEY, String(value));
    }, []);

    const requestNotifications = useCallback(async () => {
        if (typeof Notification === 'undefined') return 'unsupported';
        const result = await Notification.requestPermission();
        setNotificationPermission(result);
        if (result === 'granted') {
            localStorage.removeItem(DISMISS_KEY);
            setDismissUntil(0);
        }
        return result;
    }, []);

    const install = useCallback(async (): Promise<InstallOutcome> => {
        if (!deferredPrompt) return 'unavailable';
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
            setInstalled(true);
            localStorage.setItem(INSTALLED_KEY, 'true');
        }
        setDeferredPrompt(null);
        return choice.outcome;
    }, [deferredPrompt]);

    const canShowIosInstructions = useMemo(
        () => !installed && !isStandalone() && isIOSBrowser(),
        [installed]
    );

    const notificationsGranted = notificationPermission === 'granted';
    const supportsNotifications = notificationPermission !== 'unsupported';

    const visible = useMemo(() => {
        if (Date.now() < dismissUntil) return false;
        if (installed) return false;

        if (!!deferredPrompt || canShowIosInstructions) return true;
        if (supportsNotifications && !notificationsGranted) return true;

        return false;
    }, [
        dismissUntil,
        installed,
        deferredPrompt,
        canShowIosInstructions,
        supportsNotifications,
        notificationsGranted,
    ]);

    return {
        visible,
        install,
        dismiss,
        requestNotifications,
        notificationsGranted,
        notificationPermission,
        supportsNotifications,
        canInstall: !!deferredPrompt,
        canShowIosInstructions,
        isInstalled: installed,
    };
}

