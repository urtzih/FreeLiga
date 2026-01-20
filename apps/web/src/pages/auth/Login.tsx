import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(() => {
        return sessionStorage.getItem('loginError') || '';
    });
    const [loading, setLoading] = useState(false);
    const { login, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const storedError = sessionStorage.getItem('loginError');
        if (storedError) {
            setError(storedError);
        }
        
        return () => {
            if (user) {
                sessionStorage.removeItem('loginError');
            }
        };
    }, [user]);

    useEffect(() => {
        if (user && !loading && !error) {
            sessionStorage.removeItem('loginError');
            const redirectPath = user.role === 'ADMIN' ? '/admin' : '/dashboard';
            navigate(redirectPath, { replace: true });
        }
    }, [user, loading, error, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        sessionStorage.removeItem('loginError');
        setLoading(true);

        try {
            await login(email, password);
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || 'Error al iniciar sesión. Verifica tus credenciales.';
            
            sessionStorage.setItem('loginError', errorMessage);
            setError(errorMessage);
            setLoading(false);
        }
    };

    const clearError = () => {
        setError('');
        sessionStorage.removeItem('loginError');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block">
                        <img
                            src="/logo.jpg"
                            alt="FreeSquash Logo"
                            className="mx-auto w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-lg mb-4 hover:scale-105 transition-transform cursor-pointer"
                        />
                    </Link>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Bienvenido de nuevo</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">Inicia sesión en FreeSquash League</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-600 dark:border-red-500 rounded-lg shadow-md">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start flex-1">
                                    <svg className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5 mr-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <div className="flex-1">
                                        <p className="text-base font-bold text-red-800 dark:text-red-300 mb-1">⚠️ Error de inicio de sesión</p>
                                        <p className="text-sm text-red-700 dark:text-red-200 leading-relaxed">{error}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={clearError}
                                    className="ml-4 flex-shrink-0 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                                    aria-label="Cerrar mensaje de error"
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Correo Electrónico
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="tu@email.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" clipRule="evenodd" />
                                            <path fillRule="evenodd" d="M.664 10.596a.75.75 0 010-.192C1.868 6.94 5.522 4.5 10 4.5s8.132 2.44 9.336 5.904a.75.75 0 010 .192C18.132 13.06 14.478 15.5 10 15.5S1.868 13.06.664 10.596zM15 10a5 5 0 11-10 0 5 5 0 0110 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.561 1.561 0 000-1.254C16.313 7.03 13.513 5 10 5a9.74 9.74 0 00-2.531.442l-1.398-1.398A9.964 9.964 0 0110 3c4.97 0 8.268 2.943 9.542 7-.138.464-.288.908-.45 1.33L16.25 9.75l-1.06-1.06-1.06 1.06-1.25-1.25a3.5 3.5 0 00-4.95-4.95l-1.25 1.25-1.06-1.06L3.28 2.22zM7.5 11.5c0 .055.003.11.008.164l1.3-1.3A2.5 2.5 0 0111.5 7.5c.055 0 .11.003.164.008l1.3-1.3A3.5 3.5 0 007.5 11.5zM10 15a9.74 9.74 0 01-2.531-.442l1.398-1.398A5.002 5.002 0 0010 12.5a5 5 0 00-2.5-4.41l-1.543-1.543C4.313 7.97 1.513 10 5.03 15a1.56 1.56 0 000 1.254C6.187 12.97 8.987 15 12.469 15a9.964 9.964 0 002.46-3.449l-1.745-1.745A10.029 10.029 0 0110 15z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-4 py-3 text-white font-medium rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                        ¿No tienes cuenta? Contacta con el administrador de la liga
                    </p>
                </div>
            </div>
        </div>
    );
}
