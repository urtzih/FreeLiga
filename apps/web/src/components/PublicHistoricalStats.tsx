/**
 * Componente PublicHistoricalStats - Muestra estadísticas históricas públicas
 */

import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

interface PublicHistoricalStatsData {
    totalSeasons: number;
    totalPlayers: number;
    activePlayers: number;
    inactivePlayers: number;
    totalGroups: number;
    totalPlayedMatches: number;
    cached: boolean;
    updatedAt: string;
}

export default function PublicHistoricalStats() {
    const publicCacheMs = 1000 * 60 * 60 * 24 * 7;
    const { data: stats, isLoading } = useQuery<PublicHistoricalStatsData>({
        queryKey: ['public', 'stats', 'historical'],
        queryFn: async () => {
            const { data } = await api.get('/public/stats/historical');
            return data as PublicHistoricalStatsData;
        },
        staleTime: publicCacheMs,
        gcTime: publicCacheMs,
    });

    if (isLoading || !stats) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-slate-50 to-indigo-50 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                📚 Histórico global de la liga
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg p-6 text-center border-b-4 border-indigo-500 hover:shadow-lg transition-shadow">
                    <div className="text-4xl font-bold text-indigo-600 mb-2">
                        {stats.totalPlayedMatches}
                    </div>
                    <p className="text-gray-600 font-medium">🎾 Partidos totales</p>
                    <p className="text-xs text-gray-500 mt-2">Con resultado registrado</p>
                </div>

                <div className="bg-white rounded-lg p-6 text-center border-b-4 border-blue-500 hover:shadow-lg transition-shadow">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                        {stats.totalSeasons}
                    </div>
                    <p className="text-gray-600 font-medium">🗓️ Temporadas</p>
                    <p className="text-xs text-gray-500 mt-2">Histórico completo</p>
                </div>

                <div className="bg-white rounded-lg p-6 text-center border-b-4 border-purple-500 hover:shadow-lg transition-shadow">
                    <div className="text-4xl font-bold text-purple-600 mb-2">
                        {stats.totalGroups}
                    </div>
                    <p className="text-gray-600 font-medium">🏆 Grupos totales</p>
                    <p className="text-xs text-gray-500 mt-2">Creados en la liga</p>
                </div>

                <div className="bg-white rounded-lg p-6 text-center border-b-4 border-emerald-500 hover:shadow-lg transition-shadow">
                    <div className="text-4xl font-bold text-emerald-600 mb-2">
                        {stats.activePlayers + stats.inactivePlayers}
                    </div>
                    <p className="text-gray-600 font-medium">👥 Jugadores totales</p>
                    <p className="text-xs text-gray-500 mt-2">En la plataforma actual</p>
                </div>
            </div>
            {stats.cached && (
                <p className="text-xs text-gray-500 text-center mt-4">
                    Datos actualizados semanalmente. Última actualización: {new Date(stats.updatedAt).toLocaleString('es-ES')}
                </p>
            )}
        </div>
    );
}
