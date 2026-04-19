/**
 * Componente RecentMatches - Muestra ultimos partidos jugados
 */

import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

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
    const { t, formatDate } = useLanguage();
    const publicCacheMs = 1000 * 60 * 60 * 24 * 7;
    const { data, isLoading, error } = useQuery<RecentMatchesData>({
        queryKey: ['public', 'recent-matches'],
        queryFn: async () => {
            const { data } = await api.get('/public/recent-matches');
            return data as RecentMatchesData;
        },
        staleTime: publicCacheMs,
        gcTime: publicCacheMs,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
        );
    }

    const matches = data?.data ?? [];
    const cached = data?.cached ?? false;

    return (
        <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 mb-4 sm:mb-6">
                🎾 {t('public.recentMatches.title')}
                {cached && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{t('public.recentMatches.cache')}</span>}
            </h2>

            {error && (
                <div className="text-center py-4 text-gray-500">
                    {t('public.recentMatches.loadError')}
                </div>
            )}

            {matches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <p>{t('public.recentMatches.empty')}</p>
                </div>
            ) : (
                <div className="space-y-1.5 sm:space-y-3">
                    {matches.map((match, index) => {
                        const isPlayer1Winner = match.winner?.id === match.player1.id;
                        const isPlayer2Winner = match.winner?.id === match.player2.id;

                        return (
                            <div
                                key={match.id}
                                className={`border border-gray-200 rounded-lg p-2 sm:p-4 hover:bg-gray-50 transition-colors ${
                                    index >= 8 ? 'hidden sm:block' : 'block'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-[10px] sm:text-sm text-gray-500 mb-1 sm:mb-2 truncate">
                                            📍 {match.group.name} · {formatDate(match.date)}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className={`text-xs sm:text-base font-semibold truncate ${isPlayer1Winner ? 'text-green-700' : 'text-gray-900'}`}>
                                                        {match.player1.name}
                                                    </p>
                                                    {isPlayer1Winner && (
                                                        <span className="hidden sm:inline-block bg-green-500 text-white px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold">
                                                            {t('public.recentMatches.winner')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-center px-1 sm:px-4">
                                                <div className="text-base sm:text-2xl font-bold text-amber-600">
                                                    {match.gamesP1}-{match.gamesP2}
                                                </div>
                                            </div>
                                            <div className="flex-1 text-right">
                                                <div className="flex items-center gap-2 justify-end">
                                                    {isPlayer2Winner && (
                                                        <span className="hidden sm:inline-block bg-green-500 text-white px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold">
                                                            {t('public.recentMatches.winner')}
                                                        </span>
                                                    )}
                                                    <p className={`text-xs sm:text-base font-semibold truncate ${isPlayer2Winner ? 'text-green-700' : 'text-gray-900'}`}>
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

