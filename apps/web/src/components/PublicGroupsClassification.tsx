/**
 * Componente PublicGroupsClassification - Muestra resumen de grupos y clasificación
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';

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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Grupos</h2>
                <p className="text-gray-500 text-center py-8">Error al cargar los grupos</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        📊 Grupos y Clasificación
                        <span className="text-sm bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                            {data.seasonName}
                        </span>
                        {data.cached && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Caché</span>
                        )}
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.groups.map((group) => (
                        <div
                            key={group.id}
                            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border-l-4 border-indigo-500"
                        >
                            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4">
                                <h3 className="text-xl font-bold">{group.name}</h3>
                                <p className="text-indigo-100 text-sm mt-1">
                                    👥 {group.playerCount} jugadores · 🎾 {group.matchCount} partidos
                                </p>
                            </div>

                            <div className="p-4">
                                <div className="space-y-2">
                                    {group.rankings.slice(0, 8).map((player, index) => {
                                        const isTopTwo = index < 2;
                                        const medals = ['🥇', '🥈'];
                                        return (
                                            <div
                                                key={player.id}
                                                className={`flex items-center gap-2 p-2 rounded transition-colors ${
                                                    isTopTwo
                                                        ? 'bg-yellow-50 border-l-2 border-yellow-400 hover:bg-yellow-100'
                                                        : 'hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="w-6 h-6 flex items-center justify-center font-bold text-sm">
                                                    {isTopTwo ? medals[index] : `${index + 1}.`}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {player.name}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">
                                                            {player.won}V
                                                        </span>
                                                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                                                            {player.lost}D
                                                        </span>
                                                        <span className="text-xs text-indigo-600 font-semibold ml-auto">
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
                                    className="mt-4 block w-full text-center py-2 px-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded font-medium text-sm transition-colors"
                                >
                                    Ver clasificación completa
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
