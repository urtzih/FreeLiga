/**
 * Página Pública - Grupos y Clasificaciones
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

interface PlayerRanking {
    id: string;
    name: string;
    played: number;
    won: number;
    lost: number;
    winPercentage: number;
    points: number;
}

interface GroupSummary {
    id: string;
    name: string;
    playerCount: number;
    matchCount: number;
    rankings: PlayerRanking[];
}

export default function PublicGroups() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: result } = await api.get('/public/groups-summary');
            setData(result);
        } catch (err) {
            console.error('Error:', err);
            setError('Error al cargar los grupos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">📊 Grupos y Clasificación</h1>
                            <p className="text-indigo-100">Clasificaciones por grupo de la temporada {data?.seasonName}</p>
                        </div>
                        <Link
                            to="/"
                            className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                            ← Volver
                        </Link>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600">
                        {error}
                    </div>
                )}

                {!loading && data && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.groups?.map((group: GroupSummary) => (
                            <div
                                key={group.id}
                                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border-l-4 border-indigo-500"
                            >
                                {/* Header */}
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4">
                                    <h3 className="text-xl font-bold">{group.name}</h3>
                                    <p className="text-indigo-100 text-sm mt-1">
                                        👥 {group.playerCount} jugadores • 🎾 {group.matchCount} partidos
                                    </p>
                                </div>

                                {/* Tabla de clasificación */}
                                <div className="p-4">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">🏆 Top Jugadores</h4>
                                    <div className="space-y-2">
                                        {group.rankings.slice(0, 5).map((player, idx) => (
                                            <div
                                                key={player.id}
                                                className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs flex-shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {player.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {player.won}V-{player.lost}D ({player.winPercentage.toFixed(0)}%)
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Bot6ón */}
                                    <Link
                                        to={`/public/group/${group.id}`}
                                        className="mt-4 block w-full text-center py-2 px-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded font-medium text-sm transition-colors"
                                    >
                                        Ver clasificación completa
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Info Footer */}
                <div className="mt-12 bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center">
                    <p className="text-gray-700">
                        ¿Quieres participar? <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Inicia sesión</Link> para unirte a la liga
                    </p>
                </div>
            </div>
        </div>
    );
}
