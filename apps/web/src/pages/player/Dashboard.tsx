import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../lib/api';
import Loader from '../../components/Loader';

export default function Dashboard() {
    const { user, loading } = useAuth();
    const { t, formatDate, formatDateTime } = useLanguage();
    const [showBanner, setShowBanner] = useState(true);
    const calendarEnabled = user?.player?.calendarEnabled ?? false;
    const currentGroupFromAuth = user?.player?.currentGroup;
    const currentGroupId = currentGroupFromAuth?.id;

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowBanner(false);
        }, 10000);
        return () => clearTimeout(timer);
    }, []);

    const { data: playerStats, isLoading: statsLoading } = useQuery({
        queryKey: ['playerStats', user?.player?.id],
        queryFn: async () => {
            const { data } = await api.get(`/players/${user?.player?.id}/stats`);
            return data;
        },
        enabled: !!user?.player?.id,
    });

    const globalStats = playerStats?.globalStats ?? {
        wins: playerStats?.wins ?? 0,
        losses: playerStats?.losses ?? 0,
        setsWon: playerStats?.setsWon ?? 0,
        setsLost: playerStats?.setsLost ?? 0,
        average: playerStats?.average ?? 0,
        totalMatches: playerStats?.totalMatches ?? 0,
    };
    const lastPlayedMatch = playerStats?.recentMatches?.[0];
    const daysSinceLastMatch = (() => {
        if (!lastPlayedMatch?.date) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastMatchDate = new Date(lastPlayedMatch.date);
        lastMatchDate.setHours(0, 0, 0, 0);

        return Math.max(
            0,
            Math.floor((today.getTime() - lastMatchDate.getTime()) / (1000 * 60 * 60 * 24)),
        );
    })();
    const daysSinceLastMatchLabel = daysSinceLastMatch === null
        ? t('dashboard.statNoMatchesYet')
        : daysSinceLastMatch === 0
            ? t('dashboard.statToday')
            : daysSinceLastMatch === 1
                ? t('dashboard.statDaysSinceLastMatchSingle', { count: daysSinceLastMatch })
                : t('dashboard.statDaysSinceLastMatchPlural', { count: daysSinceLastMatch });

    const { data: upcomingMatches } = useQuery({
        queryKey: ['upcomingMatches', user?.player?.id],
        queryFn: async () => {
            const { data } = await api.get('/matches', {
                params: {
                    playerId: user?.player?.id,
                    scheduled: 'true',
                },
            });
            return data.filter((m: any) => {
                if (!m.scheduledDate) return false;
                return new Date(m.scheduledDate) >= new Date();
            }).sort((a: any, b: any) =>
                new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
            );
        },
        enabled: !!user?.player?.id && calendarEnabled,
    });

    const { data: currentGroupLive } = useQuery({
        queryKey: ['group', currentGroupId],
        queryFn: async () => {
            const { data } = await api.get(`/groups/${currentGroupId}`);
            return data;
        },
        enabled: !!currentGroupId,
    });

    const { data: currentClassification } = useQuery({
        queryKey: ['classification', currentGroupId],
        queryFn: async () => {
            const { data } = await api.get(`/classification?groupId=${currentGroupId}`);
            return data as Array<{ playerId: string }>;
        },
        enabled: !!currentGroupId,
    });

    const currentGroup = currentGroupLive ?? currentGroupFromAuth;
    const myRemainingMatches = (() => {
        if (!currentGroup?.groupPlayers || !user?.player?.id) return 0;
        const myPlayerId = String(user.player.id);
        const totalOpponents = Math.max(0, currentGroup.groupPlayers.length - 1);
        const completedOpponents = new Set<string>();

        (currentGroup.matches ?? []).forEach((match: any) => {
            const isPlayer1 = String(match.player1Id) === myPlayerId;
            const isPlayer2 = String(match.player2Id) === myPlayerId;
            if (!isPlayer1 && !isPlayer2) return;

            const isClosed =
                (match.matchStatus === 'PLAYED' && match.gamesP1 !== null && match.gamesP2 !== null) ||
                match.matchStatus === 'INJURY';
            if (!isClosed) return;

            const opponentId = String(isPlayer1 ? match.player2Id : match.player1Id);
            completedOpponents.add(opponentId);
        });

        return Math.max(0, totalOpponents - completedOpponents.size);
    })();
    const recentGroupMatchesExcludingMe = currentGroup?.matches
        ? [...currentGroup.matches]
            .filter((match: any) => {
                const myPlayerId = String(user?.player?.id ?? '');
                const isMyMatch = String(match.player1Id) === myPlayerId || String(match.player2Id) === myPlayerId;
                if (isMyMatch) return false;

                return (
                    (match.matchStatus === 'PLAYED' && match.gamesP1 !== null && match.gamesP2 !== null) ||
                    match.matchStatus === 'INJURY' ||
                    match.matchStatus === 'CANCELLED'
                );
            })
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 4)
        : [];
    const getGroupMatchOutcome = (match: any) => {
        if (match.matchStatus === 'CANCELLED') {
            return { winnerId: null as string | null, loserId: null as string | null };
        }

        if (match.winnerId) {
            const winnerId = String(match.winnerId);
            const p1 = String(match.player1Id);
            const p2 = String(match.player2Id);
            const loserId = winnerId === p1 ? p2 : winnerId === p2 ? p1 : null;
            return { winnerId, loserId };
        }

        if (typeof match.gamesP1 === 'number' && typeof match.gamesP2 === 'number') {
            if (match.gamesP1 > match.gamesP2) {
                return { winnerId: String(match.player1Id), loserId: String(match.player2Id) };
            }
            if (match.gamesP2 > match.gamesP1) {
                return { winnerId: String(match.player2Id), loserId: String(match.player1Id) };
            }
        }

        return { winnerId: null as string | null, loserId: null as string | null };
    };

    const myRanking = currentGroup?.groupPlayers?.find(
        (gp: any) => gp.playerId === user?.player?.id
    );
    const classificationPosition = currentClassification?.findIndex(
        (row) => String(row.playerId) === String(user?.player?.id),
    );
    const rankingPosition = classificationPosition !== undefined && classificationPosition >= 0
        ? classificationPosition + 1
        : myRanking?.rankingPosition;
    const groupPositionByPlayerId = new Map<string, number>(
        (currentClassification ?? []).map((row, index) => [String(row.playerId), index + 1]),
    );
    const rankingHighlightClasses = rankingPosition && rankingPosition <= 2
        ? {
            number: 'text-green-600 dark:text-green-400',
            label: 'text-green-700 dark:text-green-400',
            box: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
        }
        : rankingPosition && rankingPosition > 6
            ? {
                number: 'text-red-600 dark:text-red-400',
                label: 'text-red-700 dark:text-red-400',
                box: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
            }
            : {
                number: 'text-amber-600 dark:text-amber-400',
                label: 'text-slate-600 dark:text-slate-400',
                box: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
            };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader />
            </div>
        );
    }

    return (
        <div className="space-y-3 md:space-y-6">
            {showBanner && (
                <div className="club-page-hero rounded-xl md:rounded-2xl p-4 md:p-8 text-white shadow-lg transition-all duration-300">
                    <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">{t('dashboard.welcomeBack', { name: user?.player?.name ?? '' })}</h1>
                    <p className="text-sm md:text-base club-page-hero-subtitle">{t('dashboard.subtitle')}</p>
                </div>
            )}

            {playerStats && playerStats.currentStreak !== 0 && (
                <div className={`rounded-xl md:rounded-2xl p-4 md:p-8 text-white shadow-lg transition-all duration-300 ${playerStats.currentStreak > 0
                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                    : 'bg-gradient-to-r from-red-500 to-red-600'
                    }`}>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg md:text-2xl font-bold mb-1">{t('dashboard.currentStreak')}</h3>
                            <p className="text-white/90 text-sm md:text-lg">
                                {playerStats.currentStreak > 0
                                    ? t('dashboard.streakWins', { count: Math.abs(playerStats.currentStreak) })
                                    : t('dashboard.streakLosses', { count: Math.abs(playerStats.currentStreak) })}
                            </p>
                        </div>
                        <div className="text-4xl md:text-6xl">
                            {playerStats.currentStreak > 0 ? '🔥' : '💧'}
                        </div>
                    </div>
                </div>
            )}

            {playerStats?.isInjuredActiveSeason && (
                <div className="rounded-xl md:rounded-2xl p-4 md:p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg md:text-2xl font-bold mb-1">🤕 {t('dashboard.activeInjuryTitle')}</h3>
                            <p className="text-white/90 text-sm md:text-base">
                                {t('dashboard.activeInjuryDesc')}
                            </p>
                        </div>
                        <div className="text-3xl md:text-5xl">🩹</div>
                    </div>
                </div>
            )}

            <div className="space-y-2 md:space-y-4">
                <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                    {t('dashboard.currentSeasonStats')}
                </h2>
                <SeasonStatsStrip
                    loading={statsLoading}
                    items={[
                        {
                            title: t('dashboard.statWins'),
                            value: playerStats?.wins || 0,
                            icon: '🏆',
                            accent: 'text-green-600 dark:text-green-400',
                            surface: 'bg-green-50/80 dark:bg-green-900/20 border-green-100 dark:border-green-800/60',
                        },
                        {
                            title: t('dashboard.statLosses'),
                            value: playerStats?.losses || 0,
                            icon: '📉',
                            accent: 'text-red-600 dark:text-red-400',
                            surface: 'bg-red-50/80 dark:bg-red-900/20 border-red-100 dark:border-red-800/60',
                        },
                        {
                            title: t('dashboard.statAverage'),
                            value: playerStats?.average || 0,
                            icon: '⚖️',
                            accent: 'text-sky-600 dark:text-sky-400',
                            surface: 'bg-sky-50/80 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800/60',
                        },
                        {
                            title: t('dashboard.statDaysSinceLastMatch'),
                            value: daysSinceLastMatchLabel,
                            icon: '🗓️',
                            accent: 'text-amber-600 dark:text-amber-400',
                            surface: 'bg-amber-50/80 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/60',
                        },
                    ]}
                />
            </div>

            {currentGroup && (
                <div className="bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-3 md:px-6 py-3 md:py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-3">
                        <h3 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white">Grupo 3</h3>
                        <Link
                            to={`/groups/${currentGroup.id}`}
                            className="inline-flex items-center px-3 md:px-4 py-2 text-sm md:text-base club-btn-yellow whitespace-nowrap"
                        >
                            {t('dashboard.viewDetails')} →
                        </Link>
                    </div>
                    <div className="p-3 md:p-6 min-h-[140px] md:min-h-auto">
                        <div className="flex flex-col justify-center">
                            <div className="flex flex-wrap items-baseline gap-x-2 md:gap-x-4 mb-3 md:mb-4">
                                {currentGroup.season && (() => {
                                    const start = new Date(currentGroup.season.startDate);
                                    const end = new Date(currentGroup.season.endDate);
                                    const hoy = new Date();
                                    const diasRestantes = Math.ceil((end.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
                                    return (
                                        <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                                            {formatDate(start)} – {formatDate(end)} · {diasRestantes > 0
                                                ? t('dashboard.daysLeft', { count: diasRestantes })
                                                : t('dashboard.seasonFinished')}
                                        </span>
                                    );
                                })()}
                            </div>
                            <div className="mb-3 md:mb-4">
                                <div className={`w-full text-left rounded-xl md:rounded-2xl border px-3 md:px-5 py-2 md:py-3 shadow-sm ${rankingHighlightClasses.box}`}>
                                    <div className="flex items-end justify-between gap-2">
                                        <div className={`text-3xl md:text-5xl font-extrabold leading-none ${rankingHighlightClasses.number}`}>
                                            #{rankingPosition || '-'}
                                        </div>
                                        <p className={`text-xs md:text-sm font-semibold leading-none ${rankingHighlightClasses.label}`}>
                                            {rankingPosition && rankingPosition <= 2
                                                ? `⬆️ ${t('dashboard.promotion')}`
                                                : rankingPosition && rankingPosition > 6
                                                    ? `⚠️ ${t('dashboard.relegation')}`
                                                    : t('dashboard.position')
                                            }
                                        </p>
                                    </div>
                                    <p className="text-xs md:text-sm mt-1 text-slate-600 dark:text-slate-300">
                                        {t('dashboard.statWins')}: {playerStats?.wins || 0} · {t('dashboard.statLosses')}: {playerStats?.losses || 0} · {t('dashboard.remainingMatchesLabel')}: {myRemainingMatches}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-3 md:mt-4">
                                <h4 className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    {t('dashboard.currentGroupRecentOthers')}
                                </h4>
                                {recentGroupMatchesExcludingMe.length > 0 ? (
                                    <div className="space-y-1.5">
                                        {recentGroupMatchesExcludingMe.map((match: any) => (
                                            <article
                                                key={match.id}
                                                className="text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-700 px-2.5 md:px-3 py-2 bg-slate-50 dark:bg-slate-900/60"
                                            >
                                                {(() => {
                                                    const p1Id = String(match.player1Id);
                                                    const p2Id = String(match.player2Id);
                                                    const { winnerId, loserId } = getGroupMatchOutcome(match);
                                                    const p1Position = groupPositionByPlayerId.get(p1Id);
                                                    const p2Position = groupPositionByPlayerId.get(p2Id);
                                                    const p1Class = winnerId === p1Id
                                                        ? 'text-green-700 dark:text-green-400 font-semibold'
                                                        : loserId === p1Id
                                                            ? 'text-red-700 dark:text-red-400'
                                                            : 'text-slate-700 dark:text-slate-300';
                                                    const p2Class = winnerId === p2Id
                                                        ? 'text-green-700 dark:text-green-400 font-semibold'
                                                        : loserId === p2Id
                                                            ? 'text-red-700 dark:text-red-400'
                                                            : 'text-slate-700 dark:text-slate-300';

                                                    return (
                                                        <>
                                                            <div className="flex items-center justify-between gap-2">
                                                                <p className={`truncate ${p1Class}`}>
                                                                    <span className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 mr-1">
                                                                        {p1Position ? `#${p1Position}` : '#-'}
                                                                    </span>
                                                                    {match.player1?.name}
                                                                    {match.matchStatus !== 'CANCELLED' && (
                                                                        <span className="ml-2 text-sm md:text-base font-bold text-slate-700 dark:text-slate-200">
                                                                            {match.gamesP1 ?? '-'}
                                                                        </span>
                                                                    )}
                                                                </p>
                                                                <span className="text-slate-400">vs</span>
                                                                <p className={`truncate text-right ${p2Class}`}>
                                                                    {match.matchStatus !== 'CANCELLED' && (
                                                                        <span className="mr-2 text-sm md:text-base font-bold text-slate-700 dark:text-slate-200">
                                                                            {match.gamesP2 ?? '-'}
                                                                        </span>
                                                                    )}
                                                                    {match.player2?.name}
                                                                    <span className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 ml-1">
                                                                        {p2Position ? `#${p2Position}` : '#-'}
                                                                    </span>
                                                                </p>
                                                            </div>
                                                            <div className="mt-1">
                                                                <p className="text-slate-500 dark:text-slate-400">
                                                                    {formatDate(match.date)}
                                                                </p>
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                                        {t('dashboard.currentGroupRecentOthersEmpty')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!currentGroup && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6">
                    <p className="text-yellow-800 dark:text-yellow-200">
                        {t('dashboard.noGroup')}
                    </p>
                </div>
            )}

            {calendarEnabled && upcomingMatches && upcomingMatches.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('dashboard.upcomingMatches')}</h2>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {upcomingMatches.map((match: any) => {
                            const opponent = match.player1Id === user?.player?.id ? match.player2 : match.player1;
                            return (
                                <Link
                                    key={match.id}
                                    to="/calendar"
                                    className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <span className="text-2xl">⏳</span>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">
                                                    {t('dashboard.vs')} {opponent.name}
                                                </p>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    📍 {match.location}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {formatDateTime(match.scheduledDate, {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        {match.googleEventId && (
                                            <div className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-1 rounded">
                                                📅 {t('dashboard.google')}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900">
                        <Link
                            to="/calendar"
                            className="text-amber-600 dark:text-amber-400 hover:text-amber-700 font-medium"
                        >
                            {t('dashboard.viewCalendar')} →
                        </Link>
                    </div>
                </div>
            )}

            {playerStats?.recentMatches && playerStats.recentMatches.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-3 md:px-6 py-3 md:py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                        <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{t('dashboard.recentMatches')}</h2>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {playerStats.recentMatches.map((match: any) => (
                            <div key={match.id} className="p-2 md:p-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                <div className="flex items-center justify-between gap-2 md:gap-4">
                                    <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                                        <span className="text-xl md:text-2xl flex-shrink-0">
                                            {match.winnerId === user?.player?.id ? '✅' : '❌'}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-900 dark:text-white text-sm md:text-base truncate">
                                                {t('dashboard.vs')} {match.player1Id === user?.player?.id ? match.player2.name : match.player1.name}
                                            </p>
                                            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                                                {formatDate(match.date)}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        className={`text-base md:text-lg font-bold flex-shrink-0 ${
                                            match.winnerId === user?.player?.id
                                                ? 'text-green-700 dark:text-green-300'
                                                : 'text-red-600 dark:text-red-400'
                                        }`}
                                    >
                                        {match.player1Id === user?.player?.id
                                            ? `${match.gamesP1}-${match.gamesP2}`
                                            : `${match.gamesP2}-${match.gamesP1}`}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="px-3 md:px-6 py-2 md:py-4 bg-slate-50 dark:bg-slate-900">
                        <Link
                            to={currentGroup ? `/groups/${currentGroup.id}` : '/matches/history'}
                            className="text-sm md:text-base text-amber-600 dark:text-amber-400 hover:text-amber-700 font-medium"
                        >
                            {t('dashboard.viewAllMatches')} →
                        </Link>
                    </div>
                </div>
            )}

            <GlobalStatsVisual
                loading={statsLoading}
                wins={globalStats.wins}
                losses={globalStats.losses}
                setsWon={globalStats.setsWon}
                setsLost={globalStats.setsLost}
                average={globalStats.average}
                totalMatches={globalStats.totalMatches}
                injuredMatches={playerStats?.injuryMatchesActiveSeason || 0}
                showInjured={Boolean(playerStats?.isInjuredActiveSeason)}
                globalTitle={t('dashboard.globalStats')}
                historyLabel={t('dashboard.viewMatchHistory')}
                winLossLabel={t('dashboard.globalVisualWinLoss')}
                winsLabel={t('dashboard.statWins')}
                lossesLabel={t('dashboard.statLosses')}
                setsWonLabel={t('dashboard.globalVisualSetsWon')}
                setsLostLabel={t('dashboard.globalVisualSetsLost')}
                averageLabel={t('dashboard.globalVisualAverage')}
                totalMatchesLabel={t('dashboard.globalVisualTotalMatches')}
                injuredMatchesLabel={t('dashboard.globalVisualInjuries')}
                noDataLabel={t('dashboard.globalVisualNoData')}
            />
        </div>
    );
}

function SeasonStatsStrip({
    loading,
    items,
}: {
    loading?: boolean;
    items: Array<{
        title: string;
        value: string | number;
        icon: string;
        accent: string;
        surface: string;
    }>;
}) {
    return (
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
            <div className="pointer-events-none absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_10%_0%,rgba(56,189,248,0.12),transparent_35%),radial-gradient(circle_at_90%_0%,rgba(34,197,94,0.10),transparent_35%)]" />
            <div className="relative grid grid-cols-4 divide-x divide-slate-200 dark:divide-slate-700">
                {items.map((item) => (
                    <div key={item.title} className="p-1.5 md:p-2">
                        <div className={`px-2 py-3 md:px-4 md:py-5 text-center rounded-lg md:rounded-xl border ${item.surface}`}>
                        <div className="flex items-center justify-center gap-1.5 mb-1 md:mb-2">
                            <span className="text-xs md:text-base leading-none">{item.icon}</span>
                            <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 truncate">
                                {item.title}
                            </p>
                        </div>
                        {loading ? (
                            <div className="mx-auto h-5 md:h-8 w-10 md:w-14 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                        ) : (
                            <p className={`text-lg md:text-3xl font-black leading-none tracking-tight ${item.accent}`}>
                                {item.value}
                            </p>
                        )}
                    </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function GlobalStatsVisual({
    loading,
    wins,
    losses,
    setsWon,
    setsLost,
    average,
    totalMatches,
    injuredMatches,
    showInjured,
    globalTitle,
    historyLabel,
    winLossLabel,
    winsLabel,
    lossesLabel,
    setsWonLabel,
    setsLostLabel,
    averageLabel,
    totalMatchesLabel,
    injuredMatchesLabel,
    noDataLabel,
}: {
    loading?: boolean;
    wins: number;
    losses: number;
    setsWon: number;
    setsLost: number;
    average: number;
    totalMatches: number;
    injuredMatches: number;
    showInjured: boolean;
    globalTitle: string;
    historyLabel: string;
    winLossLabel: string;
    winsLabel: string;
    lossesLabel: string;
    setsWonLabel: string;
    setsLostLabel: string;
    averageLabel: string;
    totalMatchesLabel: string;
    injuredMatchesLabel: string;
    noDataLabel: string;
}) {
    if (loading) {
        return (
            <div className="relative overflow-hidden rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg p-4 md:p-6">
                <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                    <div className="h-28 md:h-36 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                    <div className="space-y-3">
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    const totalMatchesSafe = totalMatches || (wins + losses);
    const hasMatchData = totalMatchesSafe > 0;
    const winRate = hasMatchData ? (wins / totalMatchesSafe) * 100 : 0;
    const lossRate = hasMatchData ? 100 - winRate : 0;

    const totalSets = setsWon + setsLost;
    const hasSetData = totalSets > 0;
    const setsWonRate = hasSetData ? (setsWon / totalSets) * 100 : 0;
    const setsLostRate = hasSetData ? 100 - setsWonRate : 0;

    const ringStyle = {
        background: hasMatchData
            ? `conic-gradient(#16a34a 0% ${winRate}%, #ef4444 ${winRate}% 100%)`
            : 'conic-gradient(#94a3b8 0% 100%)',
    };

    return (
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
            <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.16),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.18),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.12),transparent_40%)]" />
            <div className="relative px-3 md:px-6 py-3 md:py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-3">
                <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{globalTitle}</h2>
                <Link
                    to="/matches/history"
                    className="inline-flex items-center px-3 md:px-4 py-2 text-sm md:text-base club-btn-yellow whitespace-nowrap"
                >
                    {historyLabel} →
                </Link>
            </div>
            <div className="relative p-4 md:p-6 grid md:grid-cols-2 gap-4 md:gap-6 items-stretch">
                <div className="h-full flex flex-col items-center justify-center gap-2 py-2 md:py-3">
                    <div className="relative w-full max-w-[180px] md:max-w-[260px] aspect-square rounded-full p-2 md:p-3 shadow-inner ring-1 ring-slate-300 dark:ring-slate-600" style={ringStyle}>
                        <div className="h-full w-full rounded-full bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center">
                            <p className="text-xl md:text-4xl font-black text-slate-900 dark:text-white leading-none">
                                {hasMatchData ? `${winRate.toFixed(0)}%` : '0%'}
                            </p>
                            <p className="text-[11px] md:text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {winLossLabel}
                            </p>
                        </div>
                    </div>
                    {!hasMatchData && (
                        <p className="text-xs md:text-sm text-amber-700 dark:text-amber-300 text-center">
                            {noDataLabel}
                        </p>
                    )}
                </div>

                <div className="space-y-3">
                    <div className={`grid gap-2 ${showInjured ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2">
                            <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400">{totalMatchesLabel}</p>
                            <p className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white">{totalMatchesSafe}</p>
                        </div>
                        {showInjured && (
                            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2">
                                <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400">{injuredMatchesLabel}</p>
                                <p className="text-lg md:text-xl font-extrabold text-orange-600 dark:text-orange-400">{injuredMatches}</p>
                            </div>
                        )}
                    </div>
                    <MetricBar label={`${winsLabel} (${wins})`} value={winRate} color="from-green-500 to-green-600" />
                    <MetricBar label={`${lossesLabel} (${losses})`} value={lossRate} color="from-red-500 to-red-600" />
                    <MetricBar label={`${setsWonLabel} (${setsWon})`} value={setsWonRate} color="from-sky-500 to-indigo-500" />
                    <MetricBar label={`${setsLostLabel} (${setsLost})`} value={setsLostRate} color="from-fuchsia-500 to-violet-500" />

                    <div className="pt-1 flex items-center justify-between">
                        <p className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400">{averageLabel}</p>
                        <span className="px-2.5 py-1 rounded-full text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600">
                            {average > 0 ? '+' : ''}{average}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricBar({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: string;
}) {
    const safeValue = Math.max(0, Math.min(100, value));

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <p className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
                <p className="text-xs md:text-sm font-semibold text-slate-500 dark:text-slate-400">{safeValue.toFixed(1)}%</p>
            </div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                    className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
                    style={{ width: `${safeValue}%` }}
                />
            </div>
        </div>
    );
}
