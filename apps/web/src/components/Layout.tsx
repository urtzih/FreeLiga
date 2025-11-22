import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setMobileMenuOpen(false);
    };

    const closeMobileMenu = () => setMobileMenuOpen(false);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            {/* Navegación */}
            <nav className="bg-white dark:bg-slate-800 shadow-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Logo y marca */}
                        <div className="flex items-center">
                            <Link to="/dashboard" className="flex items-center space-x-3" onClick={closeMobileMenu}>
                                <img
                                    src="/logo.jpg"
                                    alt="FreeSquash Logo"
                                    className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                />
                                <span className="text-xl font-bold text-slate-800 dark:text-white">
                                    FreeSquash
                                </span>
                            </Link>
                        </div>

                        {/* Menú Desktop */}
                        <div className="hidden md:flex items-center space-x-1">
                            <Link
                                to="/dashboard"
                                className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                Inicio
                            </Link>
                            <Link
                                to="/classification"
                                className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                Clasificación
                            </Link>
                            <Link
                                to="/matches/record"
                                className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                Registrar
                            </Link>
                            <Link
                                to="/matches/history"
                                className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                Historial
                            </Link>
                            {isAdmin && (
                                <Link
                                    to="/admin"
                                    className="px-3 py-2 rounded-md text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                >
                                    Admin
                                </Link>
                            )}

                            {/* Usuario y logout desktop */}
                            <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-slate-200 dark:border-slate-700">
                                <span className="text-sm text-slate-600 dark:text-slate-400 max-w-[150px] truncate">
                                    {user?.player?.name || user?.email}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all shadow-sm hover:shadow-md"
                                >
                                    Salir
                                </button>
                            </div>
                        </div>

                        {/* Botón hamburguesa móvil */}
                        <div className="flex items-center md:hidden">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                                aria-label="Menú"
                            >
                                {mobileMenuOpen ? (
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Menú Mobile (desplegable) */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-slate-200 dark:border-slate-700">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            <Link
                                to="/dashboard"
                                onClick={closeMobileMenu}
                                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                🏠 Inicio
                            </Link>
                            <Link
                                to="/classification"
                                onClick={closeMobileMenu}
                                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                🏆 Clasificación
                            </Link>
                            <Link
                                to="/matches/record"
                                onClick={closeMobileMenu}
                                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                ⚽ Registrar Partido
                            </Link>
                            <Link
                                to="/matches/history"
                                onClick={closeMobileMenu}
                                className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                📜 Historial
                            </Link>
                            {isAdmin && (
                                <Link
                                    to="/admin"
                                    onClick={closeMobileMenu}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                >
                                    🔧 Administración
                                </Link>
                            )}

                            {/* Usuario y logout mobile */}
                            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                                <div className="px-3 py-2">
                                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                                        {user?.player?.name || user?.email}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        {user?.email}
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="mt-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    🚪 Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Contenido principal */}
            <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
                <Outlet />
            </main>
        </div>
    );
}
