/**
 * Pagina publica - Ultimos partidos
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

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

export default function PublicMatches() {
    const { t, formatDate, formatTime } = useLanguage();
    const publicCacheMs = 1000 * 60 * 60 * 24 * 7;
    const { data, isLoading, error } = useQuery<RecentMatchesData>({
        queryKey: ['public', 'recent-matches', 'page'],
        queryFn: async () => {
            const { data } = await api.get('/public/recent-matches');
            return data as RecentMatchesData;
        },
        staleTime: publicCacheMs,
        gcTime: publicCacheMs,
    });

    const matches = data?.data ?? [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50">
            <div className="bg-gradient-to-r from-amber-600 to-amber-600 text-white py-8 sm:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-bold mb-2 break-words">🎾 {t('publicMatches.title')}</h1>
                            <p className="club-page-hero-subtitle text-sm sm:text-base break-words">{t('publicMatches.subtitle')}</p>
                        </div>
                        <Link
                            to="/"
                            className="w-full sm:w-auto self-start px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-white text-amber-600 font-semibold rounded-lg hover:bg-amber-50 transition-colors text-center"
                        >
                            ← {t('public.page.back')}
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
                {isLoading && (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600">
                        {t('publicMatches.loadError')}
                    </div>
                )}

                {!isLoading && matches.length === 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-6 sm:p-12 text-center">
                        <p className="text-gray-500 text-base sm:text-lg">{t('publicMatches.empty')}</p>
                    </div>
                )}

                {!isLoading && matches.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {matches.map((match) => (
                            <div
                                key={match.id}
                                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border-l-4 border-amber-500"
                            >
                                <div className="bg-gradient-to-r from-amber-50 to-amber-50 p-3 sm:p-4 border-b border-gray-200">
                                    <p className="text-sm text-gray-600 break-words">
                                        📍 {match.group.name}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 break-words">
                                        📅 {formatDate(match.date)} {t('publicMatches.at')} {formatTime(match.date, { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                <div className="p-4 sm:p-6">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-bold text-base sm:text-lg break-words ${match.winner?.id === match.player1.id ? 'text-green-600' : 'text-gray-900'}`}>
                                                {match.player1.name}
                                            </p>
                                            {match.winner?.id === match.player1.id && (
                                                <p className="text-sm text-green-600 font-semibold">🏆 {t('publicMatches.winner')}</p>
                                            )}
                                        </div>

                                        <div className="text-center sm:mx-4">
                                            <div className="inline-flex bg-gradient-to-r from-amber-500 to-amber-500 text-white rounded-lg px-4 py-2.5 sm:py-3 font-bold text-lg sm:text-xl">
                                                {match.gamesP1}-{match.gamesP2}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0 text-left sm:text-right">
                                            <p className={`font-bold text-base sm:text-lg break-words ${match.winner?.id === match.player2.id ? 'text-green-600' : 'text-gray-900'}`}>
                                                {match.player2.name}
                                            </p>
                                            {match.winner?.id === match.player2.id && (
                                                <p className="text-sm text-green-600 font-semibold">🏆 {t('publicMatches.winner')}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-4 sm:px-6 py-3 border-t border-gray-200">
                                    <Link
                                        to={`/public/group/${match.group.id}`}
                                        className="text-amber-600 hover:text-amber-700 text-sm font-medium break-words"
                                    >
                                        {t('publicMatches.viewGroupClassification', { groupName: match.group.name })} →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-10 sm:mt-12 bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-6 text-center">
                    <p className="text-gray-700 text-sm sm:text-base">
                        {t('publicMatches.moreDetails')} <Link to="/login" className="text-amber-600 font-semibold hover:underline">{t('public.page.signIn')}</Link> {t('publicMatches.signInFullPanel')}
                    </p>
                </div>
            </div>
        </div>
    );
}

