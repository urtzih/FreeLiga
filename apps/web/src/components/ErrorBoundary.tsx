import { Component, ErrorInfo, ReactNode } from 'react';
import { LANGUAGE_STORAGE_KEY, type AppLanguage } from '../i18n/messages';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

function normalizeLanguage(rawValue?: string | null): AppLanguage | null {
    if (!rawValue) return null;
    const value = rawValue.trim().toLowerCase();
    if (value.startsWith('eu')) return 'eu';
    if (value.startsWith('es')) return 'es';
    return null;
}

function getCurrentLanguage(): AppLanguage {
    if (typeof window !== 'undefined') {
        try {
            const stored = normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
            if (stored) return stored;
        } catch {
            // noop
        }
    }

    if (typeof navigator !== 'undefined') {
        const candidates = Array.isArray(navigator.languages) && navigator.languages.length > 0
            ? navigator.languages
            : [navigator.language];

        for (const candidate of candidates) {
            const normalized = normalizeLanguage(candidate);
            if (normalized) return normalized;
        }
    }

    return 'es';
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });

        const errorMessage = error.message?.toLowerCase() || '';
        const isAuthError =
            errorMessage.includes('unauthorized') ||
            errorMessage.includes('401') ||
            errorMessage.includes('token') ||
            errorMessage.includes('authentication') ||
            (errorMessage.includes('user') && errorMessage.includes('not found'));

        if (isAuthError) {
            console.warn('Authentication error detected. Clearing session...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        }

        if (process.env.NODE_ENV === 'production') {
            // TODO: Integrate with error tracking service (Sentry, etc.)
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleClearSessionAndReload = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const language = getCurrentLanguage();
            const tr = (es: string, eu: string) => (language === 'eu' ? eu : es);

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
                    <div className="max-w-md w-full">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-red-200 dark:border-red-800">
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                    <svg
                                        className="w-10 h-10 text-red-600 dark:text-red-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                        />
                                    </svg>
                                </div>
                            </div>

                            <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-3">
                                {tr('\u00A1Ups! Algo sali\u00F3 mal', 'Ene! Zerbait gaizki joan da')}
                            </h1>

                            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                                {tr(
                                    'Se ha producido un error inesperado. Estamos trabajando para solucionarlo.',
                                    'Ustekabeko errore bat gertatu da. Konpontzen ari gara.',
                                )}
                            </p>

                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="mb-6">
                                    <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-2">
                                        {tr('Ver detalles t\u00E9cnicos', 'Xehetasun teknikoak ikusi')}
                                    </summary>
                                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-sm">
                                        <p className="font-mono text-red-800 dark:text-red-300 mb-2">
                                            {this.state.error.toString()}
                                        </p>
                                        {this.state.errorInfo && (
                                            <pre className="text-xs text-red-700 dark:text-red-400 overflow-auto max-h-40">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        )}
                                    </div>
                                </details>
                            )}

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={this.handleClearSessionAndReload}
                                    className="w-full px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors duration-200"
                                >
                                    {tr('Limpiar sesi\u00F3n y volver al login', 'Saioa garbitu eta loginera itzuli')}
                                </button>
                                <button
                                    onClick={this.handleReset}
                                    className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors duration-200"
                                >
                                    {tr('Intentar de nuevo', 'Berriro saiatu')}
                                </button>
                                <button
                                    onClick={() => { window.location.href = '/'; }}
                                    className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors duration-200"
                                >
                                    {tr('Volver al inicio', 'Hasierara itzuli')}
                                </button>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                                    {tr('Si el problema persiste, contacta con', 'Arazoak jarraitzen badu, jarri harremanetan')}{' '}
                                    <a
                                        href="mailto:ligafreesquash@gmail.com"
                                        className="text-amber-600 dark:text-amber-400 hover:underline"
                                    >
                                        ligafreesquash@gmail.com
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
