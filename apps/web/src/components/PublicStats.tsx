/**
 * Componente PublicStats - Muestra estadísticas generales públicas
 */

import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

interface PublicStatsData {
    seasonName: string;
    totalPlayers: number;
    totalMatches: number;
    totalGroups: number;
    cached: boolean;
    updatedAt: string;
}

export default function PublicStats() {
    const publicCacheMs = 1000 * 60 * 60 * 24 * 7;
    const { data: stats, isLoading } = useQuery<PublicStatsData>({
        queryKey: ['public', 'stats'],
        queryFn: async () => {
            const { data } = await api.get('/public/stats');
            return data as PublicStatsData;
        },
        staleTime: publicCacheMs,
        gcTime: publicCacheMs,
    });

    if (isLoading || !stats) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                📈 Estadísticas de la Temporada {stats.seasonName}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 text-center border-b-4 border-blue-500 hover:shadow-lg transition-shadow">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                        {stats.totalPlayers}
                    </div>
                    <p className="text-gray-600 font-medium">👥 Jugadores</p>
                    <p className="text-xs text-gray-500 mt-2">Inscritos en la liga</p>
                </div>

                <div className="bg-white rounded-lg p-6 text-center border-b-4 border-indigo-500 hover:shadow-lg transition-shadow">
                    <div className="text-4xl font-bold text-indigo-600 mb-2">
                        {stats.totalMatches}
                    </div>
                    <p className="text-gray-600 font-medium">🎾 Partidos jugados</p>
                    <p className="text-xs text-gray-500 mt-2">Temporada activa</p>
                </div>

                <div className="bg-white rounded-lg p-6 text-center border-b-4 border-purple-500 hover:shadow-lg transition-shadow">
                    <div className="text-4xl font-bold text-purple-600 mb-2">
                        {stats.totalGroups}
                    </div>
                    <p className="text-gray-600 font-medium">🏆 Grupos</p>
                    <p className="text-xs text-gray-500 mt-2">Por nivel de juego</p>
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
