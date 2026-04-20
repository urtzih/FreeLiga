/**
 * Componente PublicGroupsClassification - Muestra resumen de grupos y clasificacion
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

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

export default function PublicGroupsClassification() {
    const { t } = useLanguage();
    const publicCacheMs = 1000 * 60 * 60 * 24 * 7;
    const { data, isLoading, error } = useQuery<GroupsSummaryData>({
        queryKey: ['public', 'groups-summary'],
        queryFn: async () => {
            const { data } = await api.get('/public/groups-summary');
            return data as GroupsSummaryData;
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

    if (error || !data) {
        return (
            <div className="club-surface p-6">
                <h2 className="text-2xl font-bold text-club-black-900 mb-4">📊 {t('public.groups.title')}</h2>
                <p className="text-club-black-600 text-center py-8">{t('public.groups.error')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <div className="mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-club-black-900 flex items-center gap-2">
                        📊 {t('public.groups.title')}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs sm:text-sm bg-club-black-900 text-club-yellow-300 px-2 py-0.5 sm:py-1 rounded">
                            {data.seasonName}
                        </span>
                        {data.cached && (
                            <span className="text-[11px] sm:text-xs bg-club-yellow-200 text-club-black-900 px-2 py-0.5 sm:py-1 rounded">{t('common.cache')}</span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
                    {data.groups.map((group) => (
                        <div
                            key={group.id}
                            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border-l-4 border-club-yellow-500"
                        >
                            <div className="bg-gradient-to-r from-club-black-900 to-club-black-800 text-club-yellow-300 p-2 sm:p-4">
                                <h3 className="text-sm sm:text-xl font-bold leading-tight">{group.name}</h3>
                                <p className="text-club-yellow-100 text-[10px] sm:text-sm mt-0.5 sm:mt-1">
                                    👥 {t('public.groups.playersMatches', { players: group.playerCount, matches: group.matchCount })}
                                </p>
                            </div>

                            <div className="p-2 sm:p-4">
                                <div className="space-y-1 sm:space-y-2">
                                    {group.rankings.slice(0, 8).map((player, index) => {
                                        const isTopTwo = index < 2;
                                        const medals = ['🥇', '🥈'];
                                        return (
                                            <div
                                                key={player.id}
                                                className={`items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded transition-colors ${index >= 3 ? 'hidden sm:flex' : 'flex'} ${
                                                    isTopTwo
                                                        ? 'bg-amber-50 border-l-2 border-club-yellow-400 hover:bg-amber-100'
                                                        : 'hover:bg-amber-50/50'
                                                }`}
                                            >
                                                <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold text-xs sm:text-sm">
                                                    {isTopTwo ? medals[index] : `${index + 1}.`}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] sm:text-sm font-medium text-club-black-900 truncate">
                                                        {player.name}
                                                    </p>
                                                    <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                                                        <span className="text-[10px] sm:text-xs font-bold text-green-800 bg-green-100 px-1 sm:px-2 py-0.5 rounded">
                                                            {player.won}V
                                                        </span>
                                                        <span className="text-[10px] sm:text-xs font-bold text-red-700 bg-red-100 px-1 sm:px-2 py-0.5 rounded">
                                                            {player.lost}D
                                                        </span>
                                                        <span className="text-[10px] sm:text-xs text-club-black-700 font-semibold ml-auto">
                                                            {player.winPercentage.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <Link
                                    to={`/public/group/${group.id}`}
                                    className="mt-2 sm:mt-4 block w-full text-center py-1.5 sm:py-2 px-2 sm:px-3 bg-club-black-900 text-club-yellow-300 hover:bg-club-black-800 rounded font-medium text-[11px] sm:text-sm transition-colors"
                                >
                                    {t('public.groups.viewClassification')}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

