/**
 * Componente PublicStats - Muestra estadisticas generales publicas
 */

import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

interface PublicStatsData {
    seasonName: string;
    totalPlayers: number;
    totalMatches: number;
    totalGroups: number;
    cached: boolean;
    updatedAt: string;
}

export default function PublicStats() {
    const { t, formatDateTime } = useLanguage();
    const publicCacheMs = 1000 * 60 * 60 * 24 * 7;
    const { data: stats, isLoading } = useQuery<PublicStatsData>({
        queryKey: ['public', 'stats'],
        queryFn: async () => {
            const { data } = await api.get('/public/stats');
            return data as PublicStatsData;
        },
        staleTime: publicCacheMs,
        gcTime: publicCacheMs,
    });

    if (isLoading || !stats) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-amber-50 to-amber-100/60 rounded-xl shadow-lg border border-amber-200/80 p-3 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-2xl font-bold text-club-black-900 mb-3 sm:mb-6 text-center">
                📈 {t('public.stats.title', { seasonName: stats.seasonName })}
            </h2>

            <div className="grid grid-cols-3 gap-2 sm:gap-6">
                <div className="bg-white rounded-lg p-2 sm:p-6 text-center border-b-4 border-club-yellow-500 hover:shadow-lg transition-shadow">
                    <div className="text-2xl sm:text-4xl font-bold text-club-black-900 mb-1 sm:mb-2">
                        {stats.totalPlayers}
                    </div>
                    <p className="text-[11px] sm:text-base text-club-black-700 font-medium">👥 {t('public.stats.players')}</p>
                    <p className="hidden sm:block text-xs text-club-black-500 mt-2">{t('public.stats.playersNote')}</p>
                </div>

                <div className="bg-white rounded-lg p-2 sm:p-6 text-center border-b-4 border-club-yellow-500 hover:shadow-lg transition-shadow">
                    <div className="text-2xl sm:text-4xl font-bold text-club-black-900 mb-1 sm:mb-2">
                        {stats.totalMatches}
                    </div>
                    <p className="text-[11px] sm:text-base text-club-black-700 font-medium">🎾 {t('public.stats.matches')}</p>
                    <p className="hidden sm:block text-xs text-club-black-500 mt-2">{t('public.stats.matchesNote')}</p>
                </div>

                <div className="bg-white rounded-lg p-2 sm:p-6 text-center border-b-4 border-club-yellow-500 hover:shadow-lg transition-shadow">
                    <div className="text-2xl sm:text-4xl font-bold text-club-black-900 mb-1 sm:mb-2">
                        {stats.totalGroups}
                    </div>
                    <p className="text-[11px] sm:text-base text-club-black-700 font-medium">🏆 {t('public.stats.groups')}</p>
                    <p className="hidden sm:block text-xs text-club-black-500 mt-2">{t('public.stats.groupsNote')}</p>
                </div>
            </div>

            {stats.cached && (
                <p className="text-xs text-club-black-600 text-center mt-4">
                    {t('common.weeklyDataUpdated', { date: formatDateTime(stats.updatedAt) })}
                </p>
            )}
        </div>
    );
}

