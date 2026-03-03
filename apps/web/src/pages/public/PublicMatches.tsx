/**
 * Página Pública - Últimos Partidos
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

interface Match {
    id: string;
    player1: { id: string; name: string };
    player2: { id: string; name: string };
    gamesP1: number;
    gamesP2: number;
    winner?: { id: string; name: string } | null;
    date: string;
    group: { id: string; name: string };
}

export default function PublicMatches() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchMatches();
    }, []);

    const fetchMatches = async () => {
        try {
            const { data } = await api.get('/public/recent-matches');
            setMatches(data?.data || []);
        } catch (err) {
            console.error('Error:', err);
            setError('Error al cargar los partidos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">🎾 Últimos Partidos</h1>
                            <p className="text-blue-100">Resultados recientes de la liga</p>
                        </div>
                        <Link
                            to="/"
                            className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
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
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600">
                        {error}
                    </div>
                )}

                {!loading && matches.length === 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                        <p className="text-gray-500 text-lg">No hay partidos registrados aún</p>
                    </div>
                )}

                {!loading && matches.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {matches.map((match) => (
                            <div
                                key={match.id}
                                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border-l-4 border-blue-500"
                            >
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
                                    <p className="text-sm text-gray-600">
                                        📍 {match.group.name}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        📅 {new Date(match.date).toLocaleDateString('es-ES')} a las {new Date(match.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        {/* Jugador 1 */}
                                        <div className="flex-1">
                                            <p className={`font-bold text-lg ${match.winner?.id === match.player1.id ? 'text-green-600' : 'text-gray-900'}`}>
                                                {match.player1.name}
                                            </p>
                                            {match.winner?.id === match.player1.id && (
                                                <p className="text-sm text-green-600 font-semibold">🏆 Ganador</p>
                                            )}
                                        </div>

                                        {/* Resultado */}
                                        <div className="mx-4 text-center">
                                            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg px-4 py-3 font-bold text-xl">
                                                {match.gamesP1}-{match.gamesP2}
                                            </div>
                                        </div>

                                        {/* Jugador 2 */}
                                        <div className="flex-1 text-right">
                                            <p className={`font-bold text-lg ${match.winner?.id === match.player2.id ? 'text-green-600' : 'text-gray-900'}`}>
                                                {match.player2.name}
                                            </p>
                                            {match.winner?.id === match.player2.id && (
                                                <p className="text-sm text-green-600 font-semibold">🏆 Ganador</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                                    <Link
                                        to={`/public/group/${match.group.id}`}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                    >
                                        Ver clasificación del {match.group.name} →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Info Footer */}
                <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                    <p className="text-gray-700">
                        ¿Quieres ver más detalles? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Inicia sesión</Link> para acceder al panel completo
                    </p>
                </div>
            </div>
        </div>
    );
}
