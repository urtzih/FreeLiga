import { useToast } from '../contexts/ToastContext';

export default function ToastContainer() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) return null;

    const getToastStyles = (type: string) => {
        switch (type) {
            case 'success':
                return 'bg-green-500 text-white';
            case 'error':
                return 'bg-red-500 text-white';
            case 'warning':
                return 'bg-yellow-500 text-white';
            case 'info':
            default:
                return 'bg-blue-500 text-white';
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            case 'info':
            default:
                return 'ℹ';
        }
    };

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`${getToastStyles(toast.type)} px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in`}
                    style={{
                        animation: 'slideIn 0.3s ease-out',
                    }}
                >
                    <span className="text-xl font-bold">{getIcon(toast.type)}</span>
                    <p className="flex-1 font-medium">{toast.message}</p>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="text-white hover:text-gray-200 font-bold text-lg"
                        aria-label="Cerrar"
                    >
                        ×
                    </button>
                </div>
            ))}
            <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
        </div>
    );
}
