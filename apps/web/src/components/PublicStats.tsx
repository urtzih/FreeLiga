/**
 * Componente PublicStats - Muestra estadísticas generales públicas
 */

import { useState, useEffect } from 'react';
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
    const [stats, setStats] = useState<PublicStatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/public/stats');
            setStats(data as PublicStatsData);
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !stats) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                📈 Estadísticas de la Temporada {stats.seasonName}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Jugadores */}
                <div className="bg-white rounded-lg p-6 text-center border-b-4 border-blue-500 hover:shadow-lg transition-shadow">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                        {stats.totalPlayers}
                    </div>
                    <p className="text-gray-600 font-medium">👥 Jugadores</p>
                    <p className="text-xs text-gray-500 mt-2">Inscritos en la liga</p>
                </div>

                {/* Partidos */}
                <div className="bg-white rounded-lg p-6 text-center border-b-4 border-indigo-500 hover:shadow-lg transition-shadow">
                    <div className="text-4xl font-bold text-indigo-600 mb-2">
                        {stats.totalMatches}
                    </div>
                    <p className="text-gray-600 font-medium">🎾 Partidos Jugados</p>
                    <p className="text-xs text-gray-500 mt-2">Temporada activa</p>
                </div>

                {/* Grupos */}
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
                    ✨ Datos actualizados cada 24 horas. Última actualización: {new Date(stats.updatedAt).toLocaleString('es-ES')}
                </p>
            )}
        </div>
    );
}
