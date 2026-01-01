import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import Loader from '../../components/Loader';
import { Link } from 'react-router-dom';

interface Group {
    id: string;
    name: string;
    seasonId: string;
    groupPlayers: Array<{ playerId: string }>;
    _count: { matches: number; groupPlayers: number };
}

interface ClassificationRow {
    playerId: string;
    playerName: string;
    wins: number;
    losses: number;
    draws: number;
    setsWon: number;
    setsLost: number;
    average: number;
}

export default function GroupsSummary() {
    const { data: seasons, isLoading: loadingSeasons } = useQuery({
        queryKey: ['seasons'],
        queryFn: async () => {
            const { data } = await api.get('/seasons');
            return data as Array<{ id: string; name: string; isActive: boolean }>;
        },
        staleTime: 1000 * 60 * 2,
    });

    const activeSeason = useMemo(() => seasons?.find((s) => s.isActive), [seasons]);

    const { data: groups, isLoading: loadingGroups } = useQuery({
        queryKey: ['season-groups', activeSeason?.id],
        enabled: Boolean(activeSeason?.id),
        queryFn: async () => {
            const { data } = await api.get(`/groups?seasonId=${activeSeason?.id}`);
            return data as Group[];
        },
    });

    const classificationQueries = useQueries({
        queries: (groups ?? []).map((group) => ({
            queryKey: ['classification', group.id],
            enabled: Boolean(group?.id),
            queryFn: async () => {
                const { data } = await api.get(`/classification?groupId=${group.id}`);
                return data as ClassificationRow[];
            },
            staleTime: 1000 * 60,
        })),
    });

    const isLoading = loadingSeasons || loadingGroups || classificationQueries.some((q) => q.isLoading);

    if (isLoading) {
        return (
            <div className="py-12">
                <Loader label="Cargando resumen de grupos..." />
            </div>
        );
    }

    if (!activeSeason) {
        return <div className="py-12 text-center text-slate-600">No hay una temporada activa.</div>;
    }

    if (!groups || groups.length === 0) {
        return <div className="py-12 text-center text-slate-600">Sin grupos para la temporada activa.</div>;
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <p className="text-sm text-slate-500">Temporada activa</p>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{activeSeason.name}</h1>
                </div>
                <div className="flex gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {groups.length} grupos
                    </span>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {groups.map((group, index) => {
                    const classification = classificationQueries[index]?.data ?? [];
                    const players = group.groupPlayers.length;
                    const possibleMatches = (players * (players - 1)) / 2;
                    const played = group._count.matches;
                    const progress = possibleMatches > 0 ? Math.round((played / possibleMatches) * 100) : 0;

                    return (
                        <div
                            key={group.id}
                            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm flex flex-col"
                        >
                            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Grupo</p>
                                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{group.name}</h2>
                                    <p className="text-xs text-slate-500 mt-1">{players} jugadores · {played} partidos jugados</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-slate-500">Progreso</div>
                                    <div className="text-lg font-semibold text-slate-900 dark:text-white">{progress}%</div>
                                    <div className="text-[11px] text-slate-500">{played}/{possibleMatches || 0} partidos</div>
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col gap-4">
                                {classification.length === 0 ? (
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Aún no hay partidos en este grupo.</p>
                                ) : (
                                    <div className="overflow-x-auto -mx-2">
                                        <table className="min-w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700">
                                                    <th className="px-2 py-2">Pos</th>
                                                    <th className="px-2 py-2">Jugador</th>
                                                    <th className="px-2 py-2 text-center">G</th>
                                                    <th className="px-2 py-2 text-center">P</th>
                                                    <th className="px-2 py-2 text-center">Dif</th>
                                                    <th className="px-2 py-2 text-center">R</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                {classification.slice(0, 8).map((row, idx) => {
                                                    const setsDiff = row.setsWon - row.setsLost;
                                                    const totalMatchesPerPlayer = players - 1;
                                                    const playedMatches = row.wins + row.losses + row.draws;
                                                    const remainingMatches = totalMatchesPerPlayer - playedMatches;
                                                    const isPromotion = idx < 2; // Top 2: ascenso
                                                    const isRelegation = idx >= 6; // 7º en adelante: descenso
                                                    const rowClass = isPromotion 
                                                        ? "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30" 
                                                        : isRelegation 
                                                        ? "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
                                                        : "hover:bg-slate-50 dark:hover:bg-slate-900/60";
                                                    return (
                                                        <tr key={row.playerId} className={rowClass}>
                                                            <td className="px-2 py-2 text-slate-500">{idx + 1}</td>
                                                            <td className="px-2 py-2 font-medium text-slate-900 dark:text-white">{row.playerName}</td>
                                                            <td className="px-2 py-2 text-center font-semibold text-green-600 dark:text-green-400">{row.wins}</td>
                                                            <td className="px-2 py-2 text-center font-semibold text-red-600 dark:text-red-400">{row.losses}</td>
                                                            <td
                                                                className={`px-2 py-2 text-center font-semibold ${
                                                                    setsDiff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                                                                }`}
                                                            >
                                                                {setsDiff}
                                                            </td>
                                                            <td className="px-2 py-2 text-center text-slate-700 dark:text-slate-200">
                                                                {remainingMatches}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-300 pt-1">
                                    <Link to={`/groups/${group.id}`} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                                        Ver grupo
                                    </Link>
                                    <span className="text-[12px] text-slate-500">Se actualiza con los datos del grupo</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
