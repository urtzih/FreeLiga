import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import EditMatchModal from '../../components/EditMatchModal';

export default function MatchHistory() {
    const { user, isAdmin } = useAuth();
    const [editingMatch, setEditingMatch] = useState<any>(null);

    const { data: matches = [], isLoading } = useQuery({
        queryKey: ['matches', user?.player?.id],
        queryFn: async () => {
            const { data } = await api.get(`/matches?playerId=${user?.player?.id}`);
            return data;
        },
        enabled: !!user?.player?.id,
    });

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
                <h1 className="text-3xl font-bold mb-2">Historial de Partidos</h1>
                <p className="text-indigo-100">Tu registro completo de partidos</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-slate-600 dark:text-slate-400">Cargando...</div>
                ) : matches.length === 0 ? (
                    <div className="p-12 text-center text-slate-600 dark:text-slate-400">
                        No hay partidos registrados todavía
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {matches.map((match: any) => {
                            const isPlayer1 = match.player1Id === user?.player?.id;
                            const opponent = isPlayer1 ? match.player2 : match.player1;
                            const myGames = isPlayer1 ? match.gamesP1 : match.gamesP2;
                            const opponentGames = isPlayer1 ? match.gamesP2 : match.gamesP1;
                            const won = match.winnerId === user?.player?.id;

                            // Permitir editar si es admin o si es uno de los jugadores (siempre true aquí porque filtramos por playerId)
                            const canEdit = isAdmin || match.player1Id === user?.player?.id || match.player2Id === user?.player?.id;

                            return (
                                <div key={match.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="text-4xl">
                                                {match.matchStatus === 'INJURY' ? '🤕' : match.matchStatus === 'CANCELLED' ? '🚫' : won ? '✅' : '❌'}
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium text-slate-900 dark:text-white">vs {opponent.name}</span>
                                                    {opponent.nickname && (
                                                        <span className="text-sm text-slate-500 dark:text-slate-400">"{opponent.nickname}"</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                    {match.group.name} • {new Date(match.date).toLocaleDateString('es-ES')}
                                                </p>
                                                {match.matchStatus !== 'PLAYED' && (
                                                    <p className="text-sm text-orange-600 dark:text-orange-400 mt-1 uppercase font-medium">
                                                        {match.matchStatus === 'INJURY' ? 'LESIÓN' : 'CANCELADO'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-4">
                                            {match.matchStatus === 'PLAYED' && (
                                                <div className="text-right">
                                                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                                                        {myGames} - {opponentGames}
                                                    </div>
                                                    <p className={`text-sm font-medium ${won ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {won ? 'Victoria' : 'Derrota'}
                                                    </p>
                                                </div>
                                            )}

                                            {canEdit && (
                                                <button
                                                    onClick={() => setEditingMatch(match)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                    title="Editar resultado"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal de Edición */}
            <EditMatchModal
                match={editingMatch}
                isOpen={!!editingMatch}
                onClose={() => setEditingMatch(null)}
            />
        </div>
    );
}
