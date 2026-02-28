import { Link, Outlet } from 'react-router-dom';

export default function FooterOnlyLayout() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
            {/* Contenido principal - Sin padding para que las páginas tengan control total */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer con enlaces legales */}
            <footer className="bg-gray-100 dark:bg-gray-800 py-8 border-t border-slate-200 dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Left: Logo and info */}
                        <div className="flex flex-col items-start gap-3">
                            <div className="flex items-center gap-3">
                                <img src="/logo.jpg" alt="FreeSquash Liga" className="h-12 w-12 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                                <span className="text-lg font-semibold text-slate-800 dark:text-white">Free Squash Gasteiz</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Plataforma de gestión de liga de squash</p>
                        </div>

                        {/* Right: Action buttons */}
                        <div className="flex flex-col items-end gap-3">
                            <Link to="/report-bug" className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors whitespace-nowrap text-sm">
                                🐞 Reportar Bug
                            </Link>
                            <a href="mailto:ligafreesquash@gmail.com" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">Contacto</a>
                        </div>
                    </div>

                    {/* Legal links */}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                            <Link to="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                Política de Privacidad
                            </Link>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <Link to="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                Términos de Servicio
                            </Link>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <Link to="/legal" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                Aviso Legal
                            </Link>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                            © {new Date().getFullYear()} Free Squash Gasteiz. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
