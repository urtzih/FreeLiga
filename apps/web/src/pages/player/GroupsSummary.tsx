import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Loader from '../../components/Loader';
import ProgressBar from '../../components/ProgressBar';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../lib/api';

interface Group {
    id: string;
    name: string;
    seasonId: string;
    groupPlayers: Array<{ playerId: string }>;
    _count: { matches: number; groupPlayers: number };
}

interface GroupDetail extends Group {
    matches: Array<{
        player1Id: string;
        player2Id: string;
        gamesP1: number | null;
        gamesP2: number | null;
        matchStatus: string;
    }>;
}

interface ClassificationRow {
    playerId: string;
    playerName: string;
    totalMatches: number;
    wins: number;
    losses: number;
    draws: number;
    setsWon: number;
    setsLost: number;
    average: number;
}

export default function GroupsSummary() {
    const { language } = useLanguage();
    const tr = (es: string, eu: string) => (language === 'eu' ? eu : es);

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

    const groupDetailQueries = useQueries({
        queries: (groups ?? []).map((group) => ({
            queryKey: ['group', group.id],
            enabled: Boolean(group?.id),
            queryFn: async () => {
                const { data } = await api.get(`/groups/${group.id}`);
                return data as GroupDetail;
            },
            staleTime: 1000 * 60,
        })),
    });

    const isLoading =
        loadingSeasons ||
        loadingGroups ||
        classificationQueries.some((q) => q.isLoading) ||
        groupDetailQueries.some((q) => q.isLoading);

    if (isLoading) {
        return (
            <div className="py-12">
                <Loader label={tr('Cargando resumen de grupos...', 'Taldeen laburpena kargatzen...')} />
            </div>
        );
    }

    if (!activeSeason) {
        return <div className="py-12 text-center text-slate-600">{tr('No hay una temporada activa.', 'Ez dago denboraldi aktiborik.')}</div>;
    }

    if (!groups || groups.length === 0) {
        return <div className="py-12 text-center text-slate-600">{tr('Sin grupos para la temporada activa.', 'Ez dago talderik denboraldi aktiborako.')}</div>;
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <p className="text-sm text-slate-500">{tr('Temporada activa', 'Denboraldi aktiboa')}</p>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{activeSeason.name}</h1>
                </div>
                <div className="flex gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {groups.length} {tr('grupos', 'talde')}
                    </span>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {groups.map((group, groupIndex) => {
                    const classification = classificationQueries[groupIndex]?.data ?? [];
                    const groupDetail = groupDetailQueries[groupIndex]?.data;
                    const groupMatches = groupDetail?.matches ?? [];
                    const players = group.groupPlayers.length;
                    const possibleMatches = (players * (players - 1)) / 2;
                    const playedWithResult = groupMatches.filter(
                        (m) => m.matchStatus === 'PLAYED' && m.gamesP1 !== null && m.gamesP2 !== null,
                    ).length;
                    const injuryMatches = groupMatches.filter((m) => m.matchStatus === 'INJURY').length;
                    const played = playedWithResult + injuryMatches;
                    const progress = possibleMatches > 0 ? Math.round((played / possibleMatches) * 100) : 0;

                    const injuriesByPlayer = new Map<string, number>();
                    for (const match of groupMatches) {
                        if (match.matchStatus !== 'INJURY') continue;
                        injuriesByPlayer.set(match.player1Id, (injuriesByPlayer.get(match.player1Id) || 0) + 1);
                        injuriesByPlayer.set(match.player2Id, (injuriesByPlayer.get(match.player2Id) || 0) + 1);
                    }

                    const isFirstGroup = groupIndex === 0;
                    const isLastGroup = groupIndex === groups.length - 1;

                    return (
                        <div
                            key={group.id}
                            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm flex flex-col"
                        >
                            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-slate-500">{tr('Grupo', 'Taldea')}</p>
                                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{group.name}</h2>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {players} {tr('jugadores', 'jokalari')} - {played} {tr('partidos jugados', 'jokatutako partida')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-slate-500">{tr('Progreso', 'Aurrerapena')}</div>
                                    <div className="text-lg font-semibold text-slate-900 dark:text-white">{progress}%</div>
                                    <div className="text-[11px] text-slate-500">{played}/{possibleMatches || 0} {tr('partidos', 'partida')}</div>
                                </div>
                            </div>

                            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                <ProgressBar percentage={progress} height="md" showPercentage={false} />
                            </div>

                            <div className="p-5 flex-1 flex flex-col gap-4">
                                {classification.length === 0 ? (
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{tr('Aun no hay partidos en este grupo.', 'Oraindik ez dago partidarik talde honetan.')}</p>
                                ) : (
                                    <div className="overflow-x-auto -mx-2">
                                        <table className="min-w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700">
                                                    <th className="px-2 py-2">{tr('Pos', 'Pos')}</th>
                                                    <th className="px-2 py-2">{tr('Jugador', 'Jokalaria')}</th>
                                                    <th className="px-2 py-2 text-center">G</th>
                                                    <th className="px-2 py-2 text-center">P</th>
                                                    <th className="px-2 py-2 text-center">Average</th>
                                                    <th className="px-2 py-2 text-center">R</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                {classification.slice(0, 8).map((row, idx) => {
                                                    const setsDiff = row.setsWon - row.setsLost;
                                                    const totalMatchesPerPlayer = players - 1;
                                                    const playedMatches = row.wins + row.losses + row.draws;
                                                    const injuryCount = injuriesByPlayer.get(row.playerId) || 0;
                                                    const remainingMatches = totalMatchesPerPlayer - playedMatches - injuryCount;
                                                    const isInjuredPlayer = remainingMatches === 0 && injuryCount > 0;

                                                    const isPromotion = !isFirstGroup && idx < 2;
                                                    const isRelegation = !isLastGroup && idx >= 6;

                                                    const rowClass = isPromotion
                                                        ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                                                        : isRelegation
                                                            ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                                                            : 'hover:bg-slate-50 dark:hover:bg-slate-900/60';

                                                    return (
                                                        <tr key={row.playerId} className={rowClass}>
                                                            <td className="px-2 py-2 text-slate-500">{idx + 1}</td>
                                                            <td className="px-2 py-2 font-medium text-slate-900 dark:text-white">
                                                                <span className="inline-flex items-center gap-1">
                                                                    <span>{row.playerName}</span>
                                                                    {isInjuredPlayer && (
                                                                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                                                            {String.fromCodePoint(0x1F915)} {tr('Lesionado', 'Lesionatua')}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </td>
                                                            <td className="px-2 py-2 text-center font-semibold text-green-600 dark:text-green-400">{row.wins}</td>
                                                            <td className="px-2 py-2 text-center font-semibold text-red-600 dark:text-red-400">{row.losses}</td>
                                                            <td
                                                                className={`px-2 py-2 text-center font-semibold ${
                                                                    setsDiff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                                                                }`}
                                                            >
                                                                {setsDiff}
                                                            </td>
                                                            <td className="px-2 py-2 text-center text-slate-700 dark:text-slate-200">{remainingMatches}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-300 pt-1">
                                    <Link to={`/groups/${group.id}`} className="text-amber-600 dark:text-amber-400 font-medium hover:underline">
                                        {tr('Ver grupo', 'Taldea ikusi')}
                                    </Link>
                                    <span className="text-[12px] text-slate-500">{tr('Se actualiza con los datos del grupo', 'Taldeko datuekin eguneratzen da')}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
