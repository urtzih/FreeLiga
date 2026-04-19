import React from 'react';
import { usePushNotification } from '../hooks/usePushNotification';
import { useToast } from '../contexts/ToastContext';

interface PushNotificationButtonProps {
    showLabel?: boolean;
    className?: string;
}

export default function PushNotificationButton({
    showLabel = true,
    className = '',
}: PushNotificationButtonProps) {
    const { isSupported, isSubscribed, isLoading, error, subscribe, unsubscribe } =
        usePushNotification();
    const { showToast } = useToast();

    React.useEffect(() => {
        if (error) {
            showToast(error, 'error');
        }
    }, [error, showToast]);

    if (!isSupported) {
        return null;
    }

    const handleClick = async () => {
        try {
            if (isSubscribed) {
                await unsubscribe();
                showToast('Desuscrito de notificaciones', 'success');
            } else {
                await subscribe();
                showToast('Suscrito a notificaciones', 'success');
            }
        } catch (err) {
            showToast('Error al actualizar notificaciones', 'error');
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={isLoading}
            className={`
                ${className}
                px-4 py-2 rounded-lg font-medium transition-all
                ${
                    isSubscribed
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title={
                isSubscribed
                    ? 'Desuscribirse de notificaciones'
                    : 'Suscribirse a notificaciones'
            }
        >
            {isLoading ? (
                <>
                    <span className="inline-block mr-2">⏳</span>
                    {showLabel ? 'Procesando...' : ''}
                </>
            ) : isSubscribed ? (
                <>
                    <span className="inline-block mr-2">🔔</span>
                    {showLabel ? 'Notificaciones Activas' : ''}
                </>
            ) : (
                <>
                    <span className="inline-block mr-2">🔕</span>
                    {showLabel ? 'Activar Notificaciones' : ''}
                </>
            )}
        </button>
    );
}

