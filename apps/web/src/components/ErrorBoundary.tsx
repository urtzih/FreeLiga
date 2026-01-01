import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
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

        // Aquí puedes enviar el error a un servicio de logging (Sentry, etc.)
        if (process.env.NODE_ENV === 'production') {
            // TODO: Integrar con servicio de error tracking
            // Ejemplo: Sentry.captureException(error);
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            // Si se proporciona un fallback personalizado, usarlo
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Fallback por defecto
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
                    <div className="max-w-md w-full">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-red-200 dark:border-red-800">
                            {/* Icono de Error */}
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

                            {/* Título */}
                            <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-3">
                                ¡Ups! Algo salió mal
                            </h1>

                            {/* Mensaje */}
                            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                                Se ha producido un error inesperado. Nuestro equipo ha sido notificado y
                                estamos trabajando para solucionarlo.
                            </p>

                            {/* Detalles del error (solo en desarrollo) */}
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="mb-6">
                                    <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-2">
                                        Ver detalles técnicos
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

                            {/* Acciones */}
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={this.handleReset}
                                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                                >
                                    Intentar de nuevo
                                </button>
                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors duration-200"
                                >
                                    Volver al inicio
                                </button>
                            </div>

                            {/* Información de contacto */}
                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                                    Si el problema persiste, contacta con{' '}
                                    <a
                                        href="mailto:ligafreesquash@gmail.com"
                                        className="text-blue-600 dark:text-blue-400 hover:underline"
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
