/**
 * Página PúbIlica - Clasificación Completa de un Grupo
 */

import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

interface PlayerRanking {
    id: string;
    name: string;
    played: number;
    won: number;
    lost: number;
    winPercentage: number;
    points: number;
}

interface GroupData {
    id: string;
    name: string;
    seasonName: string;
    totalMatches: number;
    rankings: PlayerRanking[];
}

export default function PublicGroupDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<GroupData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const response = await fetch(`/api/public/group/${id}/classification`);
            if (response.ok) {
                const result = await response.json();
                setData(result);
            } else if (response.status === 404) {
                setError('Grupo no encontrado');
            } else {
                setError('No se pudieron cargar los datos');
            }
        } catch (err) {
            console.error('Error:', err);
            setError('Error al cargar la clasificación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div>
                            {data && (
                                <>
                                    <h1 className="text-4xl font-bold mb-2">{data.name}</h1>
                                    <p className="text-purple-100">Clasificación Completa • Temporada {data.seasonName}</p>
                                </>
                            )}
                            {!data && !loading && (
                                <h1 className="text-4xl font-bold mb-2">Grupo no encontrado</h1>
                            )}
                            {loading && (
                                <h1 className="text-4xl font-bold mb-2">Cargando...</h1>
                            )}
                        </div>
                        <button
                            onClick={() => navigate('/public/groups')}
                            className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors"
                        >
                            ← Volver a Grupos
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600">
                        {error}
                    </div>
                )}

                {!loading && data && (
                    <>
                        {/* Estadísticas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div className="bg-white rounded-lg shadow p-4 text-center border-b-4 border-purple-500">
                                <div className="text-3xl font-bold text-purple-600">{data.rankings.length}</div>
                                <p className="text-gray-600 text-sm mt-1">Jugadores</p>
                            </div>
                            <div className="bg-white rounded-lg shadow p-4 text-center border-b-4 border-indigo-500">
                                <div className="text-3xl font-bold text-indigo-600">{data.totalMatches}</div>
                                <p className="text-gray-600 text-sm mt-1">Partidos Jugados</p>
                            </div>
                        </div>

                        {/* Tabla de clasificación */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                                        <tr>
                                            <th className="px-6 py-4 text-left font-semibold">Posición</th>
                                            <th className="px-6 py-4 text-left font-semibold">Jugador</th>
                                            <th className="px-6 py-4 text-center font-semibold">Partidos</th>
                                            <th className="px-6 py-4 text-center font-semibold">Victorias</th>
                                            <th className="px-6 py-4 text-center font-semibold">Derrotas</th>
                                            <th className="px-6 py-4 text-center font-semibold">% Victorias</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {data.rankings.map((player, idx) => {
                                            const isTopTwo = idx < 2;
                                            const isLastTwo = idx >= data.rankings.length - 2;
                                            return (
                                                <tr
                                                    key={player.id}
                                                    className={`${
                                                        isTopTwo
                                                            ? 'bg-gradient-to-r from-green-50 to-emerald-50'
                                                            : isLastTwo
                                                            ? 'bg-gradient-to-r from-red-50 to-orange-50'
                                                            : 'hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            {isTopTwo && (
                                                                <span className="text-xl">
                                                                    {idx === 0 && '🥇'}
                                                                    {idx === 1 && '🥈'}
                                                                </span>
                                                            )}
                                                            <span className="font-bold text-lg">{idx + 1}</span>
                                                        </div>
                                                    </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-gray-900">{player.name}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center text-gray-700">{player.played}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="font-semibold text-green-600">{player.won}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="font-semibold text-red-600">{player.lost}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                                                            style={{ width: `${player.winPercentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">{player.winPercentage.toFixed(1)}%</p>
                                                </td>
                                            </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-green-50 to-transparent rounded-lg p-4 border border-green-200">
                                <p className="text-sm text-gray-600">
                                    <span className="font-semibold">🥇 Ascensos:</span> Los 2 primeros clasificados ascienden de grupo
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-red-50 to-transparent rounded-lg p-4 border border-red-200">
                                <p className="text-sm text-gray-600">
                                    <span className="font-semibold">⬇️ Descensos:</span> Los 2 últimos clasificados descienden de grupo
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-transparent rounded-lg p-4 border border-blue-200">
                                <p className="text-sm text-gray-600">
                                    <span className="font-semibold">🔄 Actualización:</span> Cada 24 horas (caché optimizado)
                                </p>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="mt-12 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl p-8 text-center border-2 border-purple-200">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">¿Quieres ver todos los detalles?</h3>
                            <p className="text-gray-700 mb-6">Inicia sesión para acceder a tu panel personal con estadísticas completas, historial de partidos y mucho más.</p>
                            <Link
                                to="/login"
                                className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                            >
                                Iniciar Sesión
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
