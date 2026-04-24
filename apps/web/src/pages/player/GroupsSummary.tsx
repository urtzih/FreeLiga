import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Loader from '../../components/Loader';
import ProgressBar from '../../components/ProgressBar';
import { useAuth } from '../../contexts/AuthContext';
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
        winnerId?: string | null;
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
    const { user } = useAuth();
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
            <header className="club-page-hero p-4 md:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs md:text-sm uppercase tracking-wide text-amber-200/90">{tr('Temporada activa', 'Denboraldi aktiboa')}</p>
                        <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">{activeSeason.name}</h1>
                        <p className="text-sm md:text-base club-page-hero-subtitle">
                            {tr('Resumen y progreso actual de todos los grupos', 'Talde guztien laburpena eta uneko aurrerapena')}
                        </p>
                    </div>
                    <div className="flex gap-2 text-sm">
                        <span className="px-3 py-1 rounded-full border border-amber-300/60 bg-amber-200/10 text-amber-100">
                            {groups.length} {tr('grupos', 'talde')}
                        </span>
                    </div>
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

                    const isClosedMatchForClassification = (match: GroupDetail['matches'][number]) =>
                        (match.matchStatus === 'PLAYED' && match.gamesP1 !== null && match.gamesP2 !== null) ||
                        match.matchStatus === 'INJURY';
                    const activeGroupPlayerIds = new Set(
                        group.groupPlayers.map((gp) => gp.playerId),
                    );

                    const legacyInjuryExposureByPlayer = new Map<string, number>();
                    groupMatches.forEach((match) => {
                        if (match.matchStatus !== 'INJURY' || match.winnerId) return;
                        legacyInjuryExposureByPlayer.set(match.player1Id, (legacyInjuryExposureByPlayer.get(match.player1Id) ?? 0) + 1);
                        legacyInjuryExposureByPlayer.set(match.player2Id, (legacyInjuryExposureByPlayer.get(match.player2Id) ?? 0) + 1);
                    });

                    const inferLegacyInjuredPlayerId = (match: GroupDetail['matches'][number]) => {
                        const p1Count = legacyInjuryExposureByPlayer.get(match.player1Id) ?? 0;
                        const p2Count = legacyInjuryExposureByPlayer.get(match.player2Id) ?? 0;
                        if (p1Count === p2Count) return match.player1Id;
                        return p1Count > p2Count ? match.player1Id : match.player2Id;
                    };

                    const isPlayerInjuredInMatch = (match: GroupDetail['matches'][number], playerId: string) => {
                        if (match.matchStatus !== 'INJURY') return false;
                        if (match.winnerId) {
                            return (match.player1Id === playerId || match.player2Id === playerId) && match.winnerId !== playerId;
                        }
                        return inferLegacyInjuredPlayerId(match) === playerId;
                    };

                    const getPlayerProgress = (playerId: string) => {
                        const completedOpponents = new Set<string>();
                        const injuryOpponents = new Set<string>();

                        for (const match of groupMatches) {
                            if (!isClosedMatchForClassification(match)) continue;

                            const isPlayer1 = match.player1Id === playerId;
                            const isPlayer2 = match.player2Id === playerId;
                            if (!isPlayer1 && !isPlayer2) continue;

                            const opponentId = isPlayer1 ? match.player2Id : match.player1Id;
                            // Ignorar cruces legacy contra jugadores fuera del grupo actual
                            if (!activeGroupPlayerIds.has(opponentId)) continue;
                            completedOpponents.add(opponentId);

                            if (isPlayerInjuredInMatch(match, playerId)) {
                                injuryOpponents.add(opponentId);
                            }
                        }

                        return {
                            remainingMatches: Math.max(0, (players - 1) - completedOpponents.size),
                            injuryCount: injuryOpponents.size,
                            isInjuredPlayer: injuryOpponents.size > 0,
                        };
                    };

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
                                                    <th className="">AVG</th>
                                                    <th className="px-2 py-2 text-cpx-2 py-2 text-centerenter">R</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                {(() => {
                                                    const progressByPlayer = new Map<string, { remainingMatches: number; injuryCount: number }>();
                                                    classification.forEach((playerRow) => {
                                                        const progress = getPlayerProgress(playerRow.playerId);
                                                        progressByPlayer.set(playerRow.playerId, progress);
                                                    });

                                                    return classification.slice(0, 8).map((row, idx) => {
                                                        const setsDiff = row.setsWon - row.setsLost;
                                                        const progress = progressByPlayer.get(row.playerId) ?? getPlayerProgress(row.playerId);
                                                        const remainingMatches = progress.remainingMatches;
                                                        const seasonInjuryThreshold = Math.min(2, Math.max(players - 1, 0));
                                                        const isInjuredPlayer =
                                                            progress.injuryCount >= seasonInjuryThreshold &&
                                                            remainingMatches === 0;
                                                        const isCurrentUser = String(row.playerId) === String(user?.player?.id);

                                                        const isTopLeagueChampion = isFirstGroup && idx === 0;
                                                        const isPromotion = !isFirstGroup && idx < 2;
                                                        const isRelegation = !isLastGroup && idx >= 6;

                                                        const baseRowClass = isTopLeagueChampion
                                                            ? 'bg-amber-50 dark:bg-amber-900/25 hover:bg-amber-100 dark:hover:bg-amber-900/35'
                                                            : isPromotion
                                                            ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                                                            : isRelegation
                                                                ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                                                                : 'hover:bg-slate-50 dark:hover:bg-slate-900/60';
                                                        const rowClass = `${baseRowClass} ${isCurrentUser ? 'outline outline-1 -outline-offset-1 outline-amber-400/70 dark:outline-amber-500/45' : ''}`;

                                                        return (
                                                            <tr key={row.playerId} className={rowClass}>
                                                                <td className={`px-2 py-2 ${isCurrentUser ? 'font-semibold text-slate-700 dark:text-slate-200' : isTopLeagueChampion ? 'font-semibold text-amber-700 dark:text-amber-300' : 'text-slate-500'}`}>{idx + 1}</td>
                                                                <td className={`px-2 py-2 font-medium ${isCurrentUser ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                                                                    <span className="inline-flex items-center gap-1">
                                                                        {isTopLeagueChampion && (
                                                                            <span className="text-amber-600 dark:text-amber-300" title={tr('Campeon de la mejor liga', 'Liga oneneko txapelduna')}>
                                                                                {String.fromCodePoint(0x1F3C6)}
                                                                            </span>
                                                                        )}
                                                                        <span>{row.playerName}</span>
                                                                        {isCurrentUser && (
                                                                            <span className="text-[10px] px-1 py-0.5 rounded bg-amber-200 text-amber-900 dark:bg-amber-700/40 dark:text-amber-100 font-semibold">
                                                                                {tr('Tu', 'Zu')}
                                                                            </span>
                                                                        )}
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
                                                                        setsDiff >= 0 ? 'text-club-yellow-700 dark:text-club-yellow-300' : 'text-red-500 dark:text-red-400'
                                                                    }`}
                                                                >
                                                                    {setsDiff}
                                                                </td>
                                                                <td className="px-2 py-2 text-center text-slate-700 dark:text-slate-200">{remainingMatches}</td>
                                                            </tr>
                                                        );
                                                    });
                                                })()}
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
