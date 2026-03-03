/**
 * Componente RecentMatches - Muestra últimos partidos jugados
 */

import { useState, useEffect } from 'react';
import api from '../lib/api';

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

interface RecentMatchesData {
    data: Match[];
    cached: boolean;
    updatedAt: string;
}

export default function RecentMatches() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [cached, setCached] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchRecentMatches();
    }, []);

    const fetchRecentMatches = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/public/recent-matches');
            const payload = data as RecentMatchesData;
            setMatches(payload.data);
            setCached(payload.cached || false);
        } catch (err) {
            console.error('Error fetching recent matches:', err);
            setError('No se pudieron cargar los partidos recientes');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                🎾 Últimos Partidos
                {cached && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Caché</span>}
            </h2>

            {error && (
                <div className="text-center py-4 text-gray-500">
                    {error}
                </div>
            )}

            {matches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <p>No hay partidos registrados aún</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {matches.map((match) => {
                        const isPlayer1Winner = match.winner?.id === match.player1.id;
                        const isPlayer2Winner = match.winner?.id === match.player2.id;
                        
                        return (
                            <div
                                key={match.id}
                                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-500 mb-2">
                                            📍 {match.group.name} • {new Date(match.date).toLocaleDateString('es-ES')}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className={`font-semibold ${isPlayer1Winner ? 'text-green-700' : 'text-gray-900'}`}>
                                                        {match.player1.name}
                                                    </p>
                                                    {isPlayer1Winner && (
                                                        <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                                                            🏆 Ganador
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-center px-4">
                                                <div className="text-2xl font-bold text-blue-600">
                                                    {match.gamesP1}-{match.gamesP2}
                                                </div>
                                            </div>
                                            <div className="flex-1 text-right">
                                                <div className="flex items-center gap-2 justify-end">
                                                    {isPlayer2Winner && (
                                                        <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                                                            🏆 Ganador
                                                        </span>
                                                    )}
                                                    <p className={`font-semibold ${isPlayer2Winner ? 'text-green-700' : 'text-gray-900'}`}>
                                                        {match.player2.name}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
