import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

interface AdminStats {
    totals: {
        players: number;
        groups: number;
        seasons: number;
        matches: number;
        activeGroups: number;
    };
    activeSeason: {
        id: string;
        name: string;
        startDate: string;
        endDate: string;
        groups: Array<{
            id: string;
            name: string;
            _count: {
                groupPlayers: number;
                matches: number;
            };
        }>;
    } | null;
    recentMatches: Array<{
        id: string;
        date: string;
        gamesP1: number;
        gamesP2: number;
        player1: { id: string; name: string };
        player2: { id: string; name: string };
        winner: { id: string; name: string } | null;
        group: {
            id: string;
            name: string;
            season: { name: string };
        };
    }>;
}

export default function AdminDashboard() {
    const { user } = useAuth();

    const { data: stats, isLoading } = useQuery<AdminStats>({
        queryKey: ['adminStats'],
        queryFn: async () => {
            const { data } = await api.get('/admin/stats');
            return data;
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-lg text-slate-600 dark:text-slate-400">Cargando estadísticas...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Encabezado */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-8 text-white shadow-lg">
                <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
                <p className="text-red-100">Bienvenido, {user?.email}</p>
            </div>

            {/* Estadísticas Generales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard
                    title="Jugadores"
                    value={stats?.totals.players || 0}
                    icon="🏃"
                    color="from-blue-500 to-blue-600"
                />
                <StatCard
                    title="Grupos"
                    value={stats?.totals.groups || 0}
                    icon="👥"
                    color="from-green-500 to-green-600"
                />
                <StatCard
                    title="Grupos Activos"
                    value={stats?.totals.activeGroups || 0}
                    icon="✅"
                    color="from-emerald-500 to-emerald-600"
                />
                <StatCard
                    title="Temporadas"
                    value={stats?.totals.seasons || 0}
                    icon="📅"
                    color="from-purple-500 to-purple-600"
                />
                <StatCard
                    title="Partidos"
                    value={stats?.totals.matches || 0}
                    icon="🎾"
                    color="from-orange-500 to-orange-600"
                />
            </div>

            {/* Temporada Activa */}
            {stats?.activeSeason && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Temporada Activa</h2>
                    </div>
                    <div className="p-6">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                {stats.activeSeason.name}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                {new Date(stats.activeSeason.startDate).toLocaleDateString('es-ES')} -{' '}
                                {new Date(stats.activeSeason.endDate).toLocaleDateString('es-ES')}
                            </p>
                        </div>

                        {/* Grupos de la temporada activa */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stats.activeSeason.groups.map((group) => (
                                <Link
                                    key={group.id}
                                    to={`/groups/${group.id}`}
                                    className="block p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                                >
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">{group.name}</h4>
                                    <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                                        <span>👥 {group._count.groupPlayers} jugadores</span>
                                        <span>🎾 {group._count.matches} partidos</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Partidos Recientes */}
            {stats?.recentMatches && stats.recentMatches.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Partidos Recientes</h2>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {stats.recentMatches.map((match) => (
                            <div key={match.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="font-medium text-slate-900 dark:text-white">
                                                {match.player1.name}
                                            </span>
                                            <span className="text-slate-600 dark:text-slate-400">vs</span>
                                            <span className="font-medium text-slate-900 dark:text-white">
                                                {match.player2.name}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400">
                                            {match.group.season.name} - {match.group.name} •{' '}
                                            {new Date(match.date).toLocaleDateString('es-ES')}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                                            {match.gamesP1}-{match.gamesP2}
                                        </div>
                                        {match.winner && (
                                            <div className="text-xs text-green-600 dark:text-green-400">
                                                ✓ {match.winner.name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900">
                        <Link
                            to="/matches/history"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium"
                        >
                            Ver Todos los Partidos →
                        </Link>
                    </div>
                </div>
            )}

            {/* Acciones Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link
                    to="/admin/seasons"
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-shadow"
                >
                    <div className="text-4xl mb-4">📅</div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Temporadas</h3>
                    <p className="text-slate-600 dark:text-slate-400">Crear y gestionar temporadas</p>
                </Link>

                <Link
                    to="/admin/groups"
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-shadow"
                >
                    <div className="text-4xl mb-4">👥</div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Grupos</h3>
                    <p className="text-slate-600 dark:text-slate-400">Gestionar grupos y asignaciones</p>
                </Link>


                <Link
                    to="/admin/users"
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-shadow"
                >
                    <div className="text-4xl mb-4">👤</div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Usuarios</h3>
                    <p className="text-slate-600 dark:text-slate-400">Gestionar usuarios del sistema</p>
                </Link>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
    color,
}: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
}) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${color}`}></div>
            <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
                    <span className="text-2xl">{icon}</span>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
            </div>
        </div>
    );
}
