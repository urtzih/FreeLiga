/**
 * Componente PublicHistoricalStats - Muestra estadisticas historicas publicas
 */

import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

interface PublicHistoricalStatsData {
    totalSeasons: number;
    totalPlayers: number;
    activePlayers: number;
    inactivePlayers: number;
    totalGroups: number;
    totalPlayedMatches: number;
    cached: boolean;
    updatedAt: string;
}

export default function PublicHistoricalStats() {
    const { t, formatDateTime } = useLanguage();
    const publicCacheMs = 1000 * 60 * 60 * 24 * 7;
    const { data: stats, isLoading } = useQuery<PublicHistoricalStatsData>({
        queryKey: ['public', 'stats', 'historical'],
        queryFn: async () => {
            const { data } = await api.get('/public/stats/historical');
            return data as PublicHistoricalStatsData;
        },
        staleTime: publicCacheMs,
        gcTime: publicCacheMs,
    });

    if (isLoading || !stats) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-slate-50 to-amber-50 rounded-xl shadow-lg p-3 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-6 text-center">
                📚 {t('public.historical.title')}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-6">
                <div className="bg-white rounded-lg p-2 sm:p-6 text-center border-b-4 border-amber-500 hover:shadow-lg transition-shadow">
                    <div className="text-2xl sm:text-4xl font-bold text-amber-600 mb-1 sm:mb-2">
                        {stats.totalPlayedMatches}
                    </div>
                    <p className="text-xs sm:text-base text-gray-600 font-medium">🎾 {t('public.historical.totalMatches')}</p>
                    <p className="hidden sm:block text-xs text-gray-500 mt-2">{t('public.historical.totalMatchesNote')}</p>
                </div>

                <div className="bg-white rounded-lg p-2 sm:p-6 text-center border-b-4 border-amber-500 hover:shadow-lg transition-shadow">
                    <div className="text-2xl sm:text-4xl font-bold text-amber-600 mb-1 sm:mb-2">
                        {stats.totalSeasons}
                    </div>
                    <p className="text-xs sm:text-base text-gray-600 font-medium">🗓️ {t('public.historical.seasons')}</p>
                    <p className="hidden sm:block text-xs text-gray-500 mt-2">{t('public.historical.seasonsNote')}</p>
                </div>

                <div className="bg-white rounded-lg p-2 sm:p-6 text-center border-b-4 border-amber-500 hover:shadow-lg transition-shadow">
                    <div className="text-2xl sm:text-4xl font-bold text-amber-600 mb-1 sm:mb-2">
                        {stats.totalGroups}
                    </div>
                    <p className="text-xs sm:text-base text-gray-600 font-medium">🏆 {t('public.historical.groups')}</p>
                    <p className="hidden sm:block text-xs text-gray-500 mt-2">{t('public.historical.groupsNote')}</p>
                </div>

                <div className="bg-white rounded-lg p-2 sm:p-6 text-center border-b-4 border-emerald-500 hover:shadow-lg transition-shadow">
                    <div className="text-2xl sm:text-4xl font-bold text-emerald-600 mb-1 sm:mb-2">
                        {stats.activePlayers + stats.inactivePlayers}
                    </div>
                    <p className="text-xs sm:text-base text-gray-600 font-medium">👥 {t('public.historical.players')}</p>
                    <p className="hidden sm:block text-xs text-gray-500 mt-2">{t('public.historical.playersNote')}</p>
                </div>
            </div>
            {stats.cached && (
                <p className="text-xs text-gray-500 text-center mt-4">
                    {t('common.weeklyDataUpdated', { date: formatDateTime(stats.updatedAt) })}
                </p>
            )}
        </div>
    );
}

