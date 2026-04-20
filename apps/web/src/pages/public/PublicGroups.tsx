/**
 * Pagina publica - Grupos y Clasificacion
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

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

interface GroupsSummaryData {
    seasonName: string;
    groups: GroupSummary[];
    cached: boolean;
    updatedAt: string;
}

export default function PublicGroups() {
    const { t } = useLanguage();
    const publicCacheMs = 1000 * 60 * 60 * 24 * 7;
    const { data, isLoading, error } = useQuery<GroupsSummaryData>({
        queryKey: ['public', 'groups-summary', 'page'],
        queryFn: async () => {
            const { data } = await api.get('/public/groups-summary');
            return data as GroupsSummaryData;
        },
        staleTime: publicCacheMs,
        gcTime: publicCacheMs,
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50">
            <div className="bg-gradient-to-r from-club-black-900 to-club-black-800 text-white py-8 sm:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-bold mb-2 text-club-yellow-300 break-words">📊 {t('publicGroups.title')}</h1>
                            <p className="text-club-yellow-100 text-sm sm:text-base break-words">
                                {t('publicGroups.subtitleSeason', { seasonName: data?.seasonName ?? '-' })}
                            </p>
                            {data?.cached && (
                                <span className="inline-block mt-2 text-[11px] sm:text-xs bg-club-yellow-200 text-club-black-900 px-2 py-0.5 rounded">
                                    {t('common.cache')}
                                </span>
                            )}
                        </div>
                        <Link
                            to="/"
                            className="w-full sm:w-auto self-start px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-club-yellow-300 text-club-black-900 font-semibold rounded-lg hover:bg-club-yellow-200 transition-colors text-center"
                        >
                            ← {t('public.page.back')}
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
                {isLoading && (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-club-yellow-600"></div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600">
                        {t('publicGroups.loadError')}
                    </div>
                )}

                {!isLoading && data && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {data.groups?.map((group: GroupSummary) => (
                            <div
                                key={group.id}
                                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border-l-4 border-club-yellow-500"
                            >
                                <div className="bg-gradient-to-r from-club-black-900 to-club-black-800 text-club-yellow-300 p-3 sm:p-4">
                                    <h3 className="text-lg sm:text-xl font-bold break-words">{group.name}</h3>
                                    <p className="text-club-yellow-100 text-xs sm:text-sm mt-1 break-words">
                                        👥 {group.playerCount} {t('public.stats.players').toLowerCase()} · 🎾 {group.matchCount} {t('public.stats.matches').toLowerCase()}
                                    </p>
                                </div>

                                <div className="p-3 sm:p-4">
                                    <h4 className="text-sm font-semibold text-club-black-700 mb-3">🏆 {t('publicGroups.topPlayers')}</h4>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        {group.rankings.slice(0, 5).map((player, idx) => (
                                            <div
                                                key={player.id}
                                                className="flex items-center gap-2 sm:gap-3 p-2 rounded hover:bg-club-yellow-50/60 transition-colors"
                                            >
                                                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-club-yellow-100 text-club-black-900 font-bold text-xs flex-shrink-0">
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

                                    <Link
                                        to={`/public/group/${group.id}`}
                                        className="mt-3 sm:mt-4 block w-full text-center py-2 px-3 bg-club-black-900 text-club-yellow-300 hover:bg-club-black-800 rounded font-medium text-sm transition-colors"
                                    >
                                        {t('publicGroups.fullClassification')}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-10 sm:mt-12 bg-club-yellow-50 border border-club-yellow-200 rounded-xl p-4 sm:p-6 text-center">
                    <p className="text-gray-700 text-sm sm:text-base">
                        {t('publicGroups.participate')} <Link to="/login" className="text-club-black-900 font-semibold hover:text-club-yellow-700 hover:underline">{t('public.page.signIn')}</Link> {t('publicGroups.signInToJoin')}
                    </p>
                </div>
            </div>
        </div>
    );
}

