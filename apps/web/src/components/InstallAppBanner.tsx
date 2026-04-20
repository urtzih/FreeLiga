import { useEffect, useRef, useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { usePushNotification } from '../hooks/usePushNotification';

function isMobileClient() {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return /android|iphone|ipad|ipod|mobile/.test(ua);
}

function isIOSClient() {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua);
}

function canUseWebPushSecureContext() {
    if (typeof window === 'undefined') return false;
    const host = window.location.hostname;
    const isLocalhost = host === 'localhost' || host === '127.0.0.1';
    return window.isSecureContext || isLocalhost;
}

export default function InstallAppBanner() {
    const { showToast } = useToast();
    const pushNotification = usePushNotification();
    const { isSupported: pushSupported, isSubscribed, subscribe } = pushNotification;
    const [isEnabling, setIsEnabling] = useState(false);
    const autoSyncRef = useRef<string | null>(null);
    const {
        visible,
        canInstall,
        isInstalled,
        install,
        dismiss,
        supportsNotifications,
        notificationsGranted,
        notificationPermission,
        requestNotifications,
    } = useInstallPrompt();
    const isMobile = isMobileClient();
    const isIOS = isIOSClient();

    useEffect(() => {
        if (!supportsNotifications || notificationPermission !== 'granted') return;
        if (!pushSupported) return;

        const needsSync = !isSubscribed;
        if (!needsSync) return;

        const syncKey = `public:${isSubscribed}`;
        if (autoSyncRef.current === syncKey) return;
        autoSyncRef.current = syncKey;

        const run = async () => {
            try {
                if (!isSubscribed) {
                    await subscribe('public');
                }
            } catch (error) {
                console.warn('Auto sync push preferences failed', error);
            }
        };

        void run();
    }, [
        supportsNotifications,
        notificationPermission,
        pushSupported,
        isSubscribed,
        subscribe,
    ]);

    if (!visible) return null;

    const handleEnableAll = async () => {
        if (isEnabling) return;
        setIsEnabling(true);
        try {
            if (!canUseWebPushSecureContext()) {
                showToast('Para notificaciones en movil necesitas HTTPS (o localhost). Con IP local por http no funciona.', 'warning');
                return;
            }

            if (isMobile && !isInstalled && canInstall) {
                await install();
            }

            if (notificationPermission === 'denied') {
                if (isIOS) {
                    showToast('Notificaciones bloqueadas. En iPhone: Ajustes > Safari > Notificaciones y permite FreeLiga.', 'warning');
                } else {
                    showToast('Notificaciones bloqueadas en el navegador. Habilitalas en ajustes del sitio.', 'warning');
                }
                return;
            }

            const permission = notificationsGranted ? 'granted' : await requestNotifications();
            if (permission !== 'granted') {
                if (permission === 'default') {
                    showToast('Acepta el permiso del navegador para continuar', 'warning');
                } else {
                    showToast('Notificaciones bloqueadas. Revisa ajustes del navegador.', 'warning');
                }
                return;
            }

            if (!pushSupported) {
                showToast('Este navegador no soporta notificaciones push', 'warning');
                return;
            }

            if (!isSubscribed) {
                await subscribe('public');
            }

            showToast('Notificaciones activadas correctamente', 'success');
        } catch (error: any) {
            const message = error?.response?.data?.error || error?.message || 'No se pudo activar notificaciones';
            showToast(message, 'error');
        } finally {
            setIsEnabling(false);
        }
    };

    return (
        <div className="bg-gradient-to-r from-zinc-100 via-white to-zinc-100 text-club-black-900 px-3 py-3 border-y border-club-yellow-500/50">
            <div className="max-w-5xl mx-auto">
                <div className="relative rounded-2xl border border-yellow-200/35 bg-black/65 text-white backdrop-blur-md px-4 py-3 shadow-[0_14px_28px_rgba(0,0,0,0.35)]">
                    <button
                        onClick={dismiss}
                        aria-label="Cerrar"
                        className="absolute top-2 right-2 z-10 h-8 w-8 rounded-lg bg-black/40 border border-white/15 text-zinc-100 hover:bg-black/55 transition-colors inline-flex items-center justify-center text-lg leading-none"
                    >
                        ×
                    </button>
                    <div className="pr-10 sm:pr-12 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
                        <div className="flex items-center gap-3">
                            <img
                                src="/logo.jpg"
                                alt="FreeLiga"
                                className="h-11 w-11 rounded-xl object-cover ring-2 ring-white/60 shadow-md"
                            />
                            <div>
                                <p className="text-[11px] uppercase tracking-wide text-yellow-200 font-semibold">
                                    FreeLiga App
                                </p>
                                <p className="text-sm sm:text-base">
                                    {!notificationsGranted && supportsNotifications
                                        ? 'Activa notificaciones para recibir avisos de torneos, partidos y recordatorios.'
                                        : isMobile && canInstall
                                          ? 'Instala FreeLiga en tu movil para acceder rapido y recibir avisos.'
                                          : 'En iPhone: pulsa Compartir y luego Anadir a pantalla de inicio.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                            {!notificationsGranted && supportsNotifications && (
                                <button
                                    onClick={handleEnableAll}
                                    disabled={isEnabling}
                                    className="px-4 py-2 rounded-xl bg-yellow-400 text-black font-semibold shadow-lg shadow-black/30 ring-2 ring-yellow-200/80 hover:bg-yellow-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isEnabling
                                        ? 'Activando...'
                                        : notificationPermission === 'denied'
                                          ? 'Desbloquear notificaciones'
                                          : isMobile && canInstall
                                            ? 'Activar app + notificaciones'
                                            : 'Activar notificaciones'}
                                </button>
                            )}
                            {isMobile && canInstall && !supportsNotifications && (
                                <button
                                    onClick={install}
                                    className="px-3 py-2 rounded-xl bg-zinc-800/75 border border-yellow-200/30 text-yellow-50 hover:bg-zinc-700/75 transition-colors"
                                >
                                    Instalar app
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

