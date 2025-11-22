import { Link } from 'react-router-dom';

export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-8 text-white shadow-lg">
                <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
                <p className="text-red-100">Gestiona la FreeSquash League</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link to="/admin/seasons" className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-shadow">
                    <div className="text-4xl mb-4">📅</div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Temporadas</h3>
                    <p className="text-slate-600 dark:text-slate-400">Crear y gestionar temporadas de la liga</p>
                </Link>

                <Link to="/admin/groups" className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-shadow">
                    <div className="text-4xl mb-4">👥</div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Grupos</h3>
                    <p className="text-slate-600 dark:text-slate-400">Gestionar grupos y asignaciones de jugadores</p>
                </Link>

                <Link to="/admin/players" className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-shadow">
                    <div className="text-4xl mb-4">🏃</div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Jugadores</h3>
                    <p className="text-slate-600 dark:text-slate-400">Ver y editar información de jugadores</p>
                </Link>
            </div>
        </div>
    );
}
