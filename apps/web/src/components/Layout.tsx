import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Cargar datos del grupo actual para mostrar en el menú
    const currentGroupId = user?.player?.currentGroupId;
    const { data: currentGroup } = useQuery({
        queryKey: ['navGroup', currentGroupId],
        queryFn: async () => {
            const { data } = await api.get(`/groups/${currentGroupId}`);
            return data;
        },
        enabled: !!currentGroupId,
        staleTime: 60_000,
    });

    const grupoLabel = currentGroup?.name
        ? (currentGroup.name.toLowerCase().startsWith('grupo') ? currentGroup.name : `Grupo ${currentGroup.name}`)
        : 'Grupo';

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
                                <span className="hidden sm:inline text-xl font-bold text-slate-800 dark:text-white">
                                    FreeSquash
                                </span>
                            </Link>
                        </div>

                        {/* Menú Desktop */}
                        <div className="hidden md:flex items-center space-x-1">
                            {isAdmin ? (
                                // Admin Menu
                                <>
                                    <Link
                                        to="/admin"
                                        className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        to="/admin/users"
                                        className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Usuarios
                                    </Link>
                                    <Link
                                        to="/admin/seasons"
                                        className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Temporadas
                                    </Link>
                                    <Link
                                        to="/admin/groups"
                                        className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Grupos
                                    </Link>
                                    <Link
                                        to="/admin/bugs"
                                        className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Bugs
                                    </Link>
                                </>
                            ) : (
                                // Player Menu
                                <>
                                    <Link
                                        to="/dashboard"
                                        className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Inicio
                                    </Link>
                                    <Link
                                        to={user?.player?.currentGroupId ? `/groups/${user.player.currentGroupId}` : '/dashboard'}
                                        className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        {grupoLabel}
                                    </Link>
                                    <Link
                                        to="/matches/record"
                                        className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Registrar
                                    </Link>
                                    {/* Submenú Más */}
                                    <div className="relative group">
                                        <button
                                            type="button"
                                            className="px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <span>Más</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        <div className="absolute left-0 w-44 rounded-lg shadow-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-2 hidden group-hover:block z-50">
                                            <Link to="/progress" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700" >Progreso</Link>
                                            <Link to="/matches/history" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700" >Mis partidos</Link>
                                            <Link to="/historia" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700" >General</Link>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Usuario y logout desktop - Hidden on mobile */}
                        <div className="hidden md:flex items-center space-x-3 ml-4 pl-4 border-l border-slate-200 dark:border-slate-700">
                            <Link
                                to="/profile"
                                className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 max-w-[150px] truncate transition-colors cursor-pointer"
                                title="Ver mi perfil"
                            >
                                {user?.player?.name || user?.email}
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all shadow-sm hover:shadow-md"
                            >
                                Salir
                            </button>
                        </div>

                        {/* Botón hamburguesa móvil */}
                        <div className="flex items-center gap-3 md:hidden ml-auto">
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
                            {isAdmin ? (
                                // Admin Mobile Menu
                                <>
                                    <Link to="/admin" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                        📊 Dashboard
                                    </Link>
                                    <Link to="/admin/users" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                        👤 Usuarios
                                    </Link>
                                    <Link to="/admin/seasons" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                        📅 Temporadas
                                    </Link>
                                    <Link to="/admin/groups" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                        👥 Grupos
                                    </Link>
                                    <Link to="/admin/bugs" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                        🐞 Bugs
                                    </Link>
                                </>
                            ) : (
                                // Player Mobile Menu
                                <>
                                    <Link to="/dashboard" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                        🏠 Inicio
                                    </Link>
                                    <Link to={user?.player?.currentGroupId ? `/groups/${user.player.currentGroupId}` : '/dashboard'} onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                        🏆 {grupoLabel}
                                    </Link>
                                    <Link to="/matches/record" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                        ⚽ Registrar Partido
                                    </Link>
                                    <details className="px-1" open>
                                        <summary className="list-none cursor-pointer block px-3 py-2 rounded-md text-base font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/40">
                                            ➕ Más
                                        </summary>
                                        <div className="mt-2 space-y-1">
                                            <Link to="/progress" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">📈 Progreso</Link>
                                            <Link to="/matches/history" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">📜 Mis partidos</Link>
                                            <Link to="/historia" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">📅 General</Link>
                                        </div>
                                    </details>
                                </>
                            )}
                            {/* Usuario y logout mobile */}
                            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                                <Link to="/profile" onClick={closeMobileMenu} className="block px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-md transition-colors">
                                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                                        👤 {user?.player?.name || user?.email}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Ver perfil
                                    </div>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="mt-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    🚪 Salir
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

            {/* Footer con logo Euskadi */}
            <footer className="bg-gray-100 dark:bg-gray-800 py-6 mt-8 border-t border-slate-200 dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div className="flex items-center">
                        <img src="/euskadiLogo.png" alt="Federación de Squash de Euskadi" className="h-12" />
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center space-x-4">
                        <Link to="/report-bug" className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                            🐞 Reportar Bug
                        </Link>
                        <a href="mailto:contacto@freesquash.test" className="hover:underline">Contacto</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
