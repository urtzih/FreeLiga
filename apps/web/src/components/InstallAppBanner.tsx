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
        canShowIosInstructions,
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
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 text-white px-3 py-3">
            <div className="max-w-5xl mx-auto">
                <div className="rounded-2xl border border-white/25 bg-white/10 backdrop-blur-md px-4 py-3 shadow-lg">
                    <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
                        <div className="flex items-center gap-3">
                            <img
                                src="/logo.jpg"
                                alt="FreeLiga"
                                className="h-11 w-11 rounded-xl object-cover ring-2 ring-white/60 shadow-md"
                            />
                            <div>
                                <p className="text-[11px] uppercase tracking-wide text-emerald-100 font-semibold">
                                    FreeLiga App
                                </p>
                                <p className="text-sm sm:text-base">
                                    {!notificationsGranted && supportsNotifications
                                        ? 'Activa notificaciones para recibir avisos de torneos, temporada y recordatorios.'
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
                                    className="px-4 py-2 rounded-xl bg-white text-emerald-700 font-semibold shadow-lg shadow-emerald-900/30 ring-2 ring-white/70 hover:bg-emerald-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
                                    className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                                >
                                    Instalar app
                                </button>
                            )}
                            {canShowIosInstructions && (
                                <button
                                    onClick={() => showToast('En iPhone usa Compartir > Anadir a pantalla de inicio', 'info')}
                                    className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                                >
                                    Ver pasos
                                </button>
                            )}
                            <button
                                onClick={dismiss}
                                className="px-3 py-2 rounded-xl bg-black/20 hover:bg-black/30 transition-colors"
                            >
                                Ahora no
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
