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

    const currentGroup = currentGroupLive ?? currentGroupFromAuth;

    const myRanking = currentGroup?.groupPlayers?.find(
        (gp: any) => gp.playerId === user?.player?.id
    );
    const rankingPosition = myRanking?.rankingPosition;
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
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
                    <StatCard
                        title={t('dashboard.statWins')}
                        value={playerStats?.wins || 0}
                        icon="🏆"
                        color="from-green-500 to-green-600"
                        loading={statsLoading}
                    />
                    <StatCard
                        title={t('dashboard.statLosses')}
                        value={playerStats?.losses || 0}
                        icon="📉"
                        color="from-red-500 to-red-600"
                        loading={statsLoading}
                    />
                    <StatCard
                        title={t('dashboard.statWinRate')}
                        value={`${playerStats?.winPercentage || 0}%`}
                        icon="📊"
                        color="from-amber-500 to-amber-600"
                        loading={statsLoading}
                    />
                    <StatCard
                        title={t('dashboard.statAverage')}
                        value={playerStats?.average || 0}
                        icon="⚖️"
                        color="from-amber-500 to-amber-600"
                        loading={statsLoading}
                    />
                </div>
            </div>

            <div className="md:hidden">
                <Link
                    to="/matches/record"
                    className="flex items-center justify-center w-full px-4 py-3 club-btn-primary"
                >
                    {t('dashboard.recordMatch')}
                </Link>
            </div>

            {currentGroup && (
                <div className="bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-3 md:px-6 py-3 md:py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                        <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{t('dashboard.currentGroup')}</h2>
                    </div>
                    <div className="p-3 md:p-6 flex justify-between items-center gap-3 md:gap-6 min-h-[140px] md:min-h-auto">
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="flex flex-wrap items-baseline gap-x-2 md:gap-x-4 mb-3 md:mb-4">
                                <h3 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white">{currentGroup.name}</h3>
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
                            <Link
                                to={`/groups/${currentGroup.id}`}
                                className="inline-flex items-center px-3 md:px-4 py-2 text-sm md:text-base club-btn-yellow"
                            >
                                {t('dashboard.viewDetails')} →
                            </Link>
                        </div>
                        <div className="shrink-0">
                            <div className={`text-left rounded-xl md:rounded-2xl border px-3 md:px-5 py-2 md:py-3 shadow-sm ${rankingHighlightClasses.box}`}>
                                <div className={`text-3xl md:text-5xl font-extrabold leading-none ${rankingHighlightClasses.number}`}>
                                    #{rankingPosition || '-'}
                                </div>
                                <p className={`text-xs md:text-sm font-semibold mt-1 ${rankingHighlightClasses.label}`}>
                                    {rankingPosition && rankingPosition <= 2
                                        ? `⬆️ ${t('dashboard.promotion')}`
                                        : rankingPosition && rankingPosition > 6
                                            ? `⚠️ ${t('dashboard.relegation')}`
                                            : t('dashboard.position')
                                    }
                                </p>
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

function StatCard({
    title,
    value,
    icon,
    color,
    loading
}: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
    loading?: boolean;
}) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg md:rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className={`h-1 md:h-2 bg-gradient-to-r ${color}`}></div>
            <div className="p-3 md:p-6">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                    <p className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
                    <span className="text-lg md:text-2xl">{icon}</span>
                </div>
                {loading ? (
                    <div className="h-6 md:h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                ) : (
                    <p className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
                )}
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
            <div className="relative p-4 md:p-6 grid md:grid-cols-2 gap-4 md:gap-6 items-stretch">
                <div className="md:col-span-2 flex items-center justify-between gap-2 md:gap-3 overflow-x-auto">
                    <h2 className="text-sm md:text-lg font-bold text-slate-900 dark:text-white whitespace-nowrap shrink-0">{globalTitle}</h2>
                    <Link
                        to="/matches/history"
                        className="inline-flex items-center px-3 md:px-4 py-2 text-xs md:text-base club-btn-yellow hover:!translate-y-0 hover:!shadow-lg whitespace-nowrap shrink-0"
                    >
                        {historyLabel} →
                    </Link>
                </div>
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
