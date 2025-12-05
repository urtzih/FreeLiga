import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

export default function Dashboard() {
    const { user, loading } = useAuth();
    const [showBanner, setShowBanner] = useState(true);

    // Auto-dismiss banner after 10s
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowBanner(false);
        }, 10000);
        return () => clearTimeout(timer);
    }, []);

    const { data: playerStats, isLoading: statsLoading } = useQuery({
        queryKey: ['playerStats', user?.player?.id],
        queryFn: async () => {
            const { data } = await api.get(`/players/${user?.player?.id}/stats`);
            return data;
        },
        enabled: !!user?.player?.id,
    });

    // Obtener currentGroup desde el contexto (ya viene del backend con la temporada activa)
    const currentGroup = user?.player?.currentGroup;

    const myRanking = currentGroup?.groupPlayers.find(
        (gp: any) => gp.playerId === user?.player?.id
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600 dark:text-slate-400">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Encabezado con Racha */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {showBanner && (
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-lg transition-all duration-300">
                        <h1 className="text-3xl font-bold mb-2">¡Bienvenido de nuevo, {user?.player?.name}!</h1>
                        <p className="text-blue-100">Sigue tu rendimiento y escala en la clasificación</p>
                    </div>
                )}

                {playerStats && playerStats.currentStreak !== 0 && (
                    <div className={`rounded-2xl p-8 text-white shadow-lg ${playerStats.currentStreak > 0
                        ? 'bg-gradient-to-r from-green-500 to-green-600'
                        : 'bg-gradient-to-r from-red-500 to-red-600'
                        }`}>
                        <div className="flex items-center justify-between h-full">
                            <div>
                                <h3 className="text-2xl font-bold mb-2">Racha Actual</h3>
                                <p className="text-white/90 text-lg">
                                    {Math.abs(playerStats.currentStreak)} {playerStats.currentStreak > 0 ? 'victorias' : 'derrotas'} consecutivas
                                </p>
                            </div>
                            <div className="text-6xl">
                                {playerStats.currentStreak > 0 ? '🔥' : '💧'}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Tarjetas de Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Victorias"
                    value={playerStats?.wins || 0}
                    icon="🏆"
                    color="from-green-500 to-green-600"
                    loading={statsLoading}
                />
                <StatCard
                    title="Derrotas"
                    value={playerStats?.losses || 0}
                    icon="📉"
                    color="from-red-500 to-red-600"
                    loading={statsLoading}
                />
                <StatCard
                    title="% Victorias"
                    value={`${playerStats?.winPercentage || 0}%`}
                    icon="📊"
                    color="from-blue-500 to-blue-600"
                    loading={statsLoading}
                />
                <StatCard
                    title="Average"
                    value={playerStats?.average || 0}
                    icon="⚖️"
                    color="from-purple-500 to-purple-600"
                    loading={statsLoading}
                />
            </div>

            {/* Grupo Actual y Clasificación */}
            {currentGroup && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Grupo Actual</h2>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="flex flex-wrap items-baseline gap-x-4">
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{currentGroup.name}</h3>
                                    {(() => {
                                        const start = new Date(currentGroup.season.startDate);
                                        const end = new Date(currentGroup.season.endDate);
                                        const hoy = new Date();
                                        const diasRestantes = Math.ceil((end.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
                                        return (
                                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                                {start.toLocaleDateString('es-ES')} – {end.toLocaleDateString('es-ES')} · {diasRestantes > 0 ? `Quedan ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}` : 'Temporada finalizada'}
                                            </span>
                                        );
                                    })()}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-4xl font-bold ${myRanking?.rankingPosition && myRanking.rankingPosition <= 2
                                    ? 'text-green-600 dark:text-green-400'
                                    : myRanking?.rankingPosition && myRanking.rankingPosition > 6
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-blue-600 dark:text-blue-400'
                                    }`}>
                                    #{myRanking?.rankingPosition || '-'}
                                </div>
                                <p className={`text-sm ${myRanking?.rankingPosition && myRanking.rankingPosition <= 2
                                    ? 'text-green-600 dark:text-green-400'
                                    : myRanking?.rankingPosition && myRanking.rankingPosition > 6
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-slate-600 dark:text-slate-400'
                                    }`}>
                                    {myRanking?.rankingPosition && myRanking.rankingPosition <= 2
                                        ? '⬆️ Puestos de Ascenso'
                                        : myRanking?.rankingPosition && myRanking.rankingPosition > 6
                                            ? '⚠️ Peligro de Descenso'
                                            : 'Tu Posición'
                                    }
                                </p>
                            </div>
                        </div>
                        <Link
                            to={`/groups/${currentGroup.id}`}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Ver Detalles del Grupo →
                        </Link>
                    </div>
                </div>
            )}

            {!currentGroup && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6">
                    <p className="text-yellow-800 dark:text-yellow-200">
                        No estás asignado a ningún grupo actualmente. Contacta con un administrador para unirte a una liga.
                    </p>
                </div>
            )}



            {/* Partidos Recientes */}
            {playerStats?.recentMatches && playerStats.recentMatches.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Partidos Recientes</h2>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {playerStats.recentMatches.map((match: any) => (
                            <div key={match.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        {match.winnerId === user?.player?.id ? (
                                            <span className="text-2xl">✅</span>
                                        ) : (
                                            <span className="text-2xl">❌</span>
                                        )}
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                vs {match.player1Id === user?.player?.id ? match.player2.name : match.player1.name}
                                            </p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {new Date(match.date).toLocaleDateString('es-ES')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                                        {match.player1Id === user?.player?.id
                                            ? `${match.gamesP1}-${match.gamesP2}`
                                            : `${match.gamesP2}-${match.gamesP1}`}
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


        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
    color,
    loading
}: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
    loading?: boolean;
}) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${color}`}></div>
            <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
                    <span className="text-2xl">{icon}</span>
                </div>
                {loading ? (
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                ) : (
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
                )}
            </div>
        </div>
    );
}
