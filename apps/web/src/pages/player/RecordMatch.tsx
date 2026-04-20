import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import Spinner from '../../components/Spinner';
import api from '../../lib/api';

type MatchStatus = 'PLAYED' | 'INJURY';

function getTodayLocalISO() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default function RecordMatch() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        groupId: user?.player?.currentGroup?.id || '',
        player1Id: user?.player?.id || '',
        player2Id: '',
        gamesP1: 0,
        gamesP2: 0,
        date: getTodayLocalISO(),
        matchStatus: 'PLAYED' as MatchStatus,
    });
    const [error, setError] = useState('');
    const [showInjuryConfirm, setShowInjuryConfirm] = useState(false);

    const getErrorMessage = (err: any) => {
        if (!navigator.onLine || err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
            return t('recordMatch.error.noInternet');
        }

        if (err?.response?.status >= 500) {
            return t('recordMatch.error.server');
        }

        const backendError = String(err?.response?.data?.error || '');
        if (
            backendError.includes('database') ||
            backendError.includes('Database') ||
            backendError.includes('BD') ||
            backendError.includes('conexion') ||
            backendError.includes('conexión')
        ) {
            return t('recordMatch.error.database');
        }

        if (backendError) {
            return backendError;
        }

        return t('recordMatch.error.generic');
    };

    const { data: group, isLoading: isLoadingGroup } = useQuery({
        queryKey: ['group', formData.groupId],
        queryFn: async () => {
            const { data } = await api.get(`/groups/${formData.groupId}`);
            return data;
        },
        enabled: !!formData.groupId,
    });

    const availableOpponents = useMemo(() => {
        if (!group?.groupPlayers || !user?.player?.id) {
            return [];
        }

        const playedOpponentIds = new Set(
            (group.matches || [])
                .filter((match: any) => {
                    const hasResult = match.gamesP1 !== null && match.gamesP2 !== null;
                    const isMyMatch = match.player1Id === user.player?.id || match.player2Id === user.player?.id;
                    return (hasResult || match.matchStatus === 'INJURY') && isMyMatch;
                })
                .map((match: any) => (match.player1Id === user.player?.id ? match.player2Id : match.player1Id)),
        );

        return group.groupPlayers.filter((gp: any) => gp.playerId !== user.player?.id && !playedOpponentIds.has(gp.playerId));
    }, [group?.groupPlayers, group?.matches, user?.player?.id]);

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const payload = {
                ...data,
                date: new Date(data.date).toISOString(),
                gamesP1: data.matchStatus === 'INJURY' ? 0 : data.gamesP1,
                gamesP2: data.matchStatus === 'INJURY' ? 0 : data.gamesP2,
            };
            const response = await api.post('/matches', payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['playerStats'] });
            queryClient.invalidateQueries({ queryKey: ['group'] });
            queryClient.invalidateQueries({ queryKey: ['classification'] });
            showToast(t('recordMatch.toast.registered'), 'success');
            navigate(`/groups/${formData.groupId}`);
        },
        onError: (err: any) => {
            setError(getErrorMessage(err));
        },
    });

    const injuryMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post('/matches/mark-injury');
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['playerStats'] });
            queryClient.invalidateQueries({ queryKey: ['group'] });
            queryClient.invalidateQueries({ queryKey: ['classification'] });
            queryClient.invalidateQueries({ queryKey: ['matches'] });
            queryClient.invalidateQueries({ queryKey: ['upcomingMatches'] });
            showToast(t('recordMatch.toast.injuryMarked'), 'success');
            setShowInjuryConfirm(false);
            navigate('/dashboard');
        },
        onError: (err: any) => {
            showToast(err?.response?.data?.error || t('recordMatch.toast.injuryError'), 'error');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.player1Id === formData.player2Id) {
            setError(t('recordMatch.validation.differentPlayers'));
            return;
        }

        const todayIso = getTodayLocalISO();
        if (formData.date > todayIso) {
            setError(t('recordMatch.validation.futureDate'));
            return;
        }

        if (formData.matchStatus === 'PLAYED') {
            if (formData.gamesP1 < 0 || formData.gamesP1 > 3 || formData.gamesP2 < 0 || formData.gamesP2 > 3) {
                setError(t('recordMatch.validation.gamesRange'));
                return;
            }

            const validScore =
                (formData.gamesP1 === 3 && formData.gamesP2 >= 0 && formData.gamesP2 <= 2) ||
                (formData.gamesP2 === 3 && formData.gamesP1 >= 0 && formData.gamesP1 <= 2);

            if (!validScore) {
                setError(t('recordMatch.validation.invalidScore'));
                return;
            }
        }

        mutation.mutate(formData);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="club-page-hero p-8">
                <h1 className="text-3xl font-bold mb-2">{t('recordMatch.headerTitle')}</h1>
                <p className="club-page-hero-subtitle">{t('recordMatch.headerSubtitle')}</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 relative">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                {mutation.isPending && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                        <Spinner size="lg" />
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            {t('recordMatch.field.date')}
                        </label>
                        <input
                            type="date"
                            max={getTodayLocalISO()}
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            {t('recordMatch.field.opponent')}
                        </label>
                        {isLoadingGroup ? (
                            <div className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-slate-600"></div>
                                <span>{t('recordMatch.loadingOpponents')}</span>
                            </div>
                        ) : (
                            <>
                                <select
                                    value={formData.player2Id}
                                    onChange={(e) => setFormData({ ...formData, player2Id: e.target.value })}
                                    required
                                    disabled={isLoadingGroup || availableOpponents.length === 0}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">{t('recordMatch.selectOpponent')}</option>
                                    {availableOpponents.map((gp: any) => (
                                        <option key={gp.playerId} value={gp.playerId}>
                                            {gp.player.name} {gp.player.nickname && `"${gp.player.nickname}"`}
                                        </option>
                                    ))}
                                </select>
                                {availableOpponents.length === 0 && group && !isLoadingGroup && (
                                    <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                                        {t('recordMatch.noOpponentsAvailable')}
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            {t('recordMatch.field.status')}
                        </label>
                        <select
                            value={formData.matchStatus}
                            onChange={(e) => setFormData({ ...formData, matchStatus: e.target.value as MatchStatus })}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="PLAYED">{t('recordMatch.status.played')}</option>
                            <option value="INJURY">{t('recordMatch.status.injury')}</option>
                        </select>
                    </div>

                    {formData.matchStatus === 'PLAYED' && (
                        <>
                            <div className="grid grid-cols-2 gap-3 sm:gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        {t('recordMatch.field.yourGames')}
                                    </label>
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData((prev) => ({ ...prev, gamesP1: Math.max(0, prev.gamesP1 - 1) }))}
                                            className="px-2 sm:px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 focus:ring-2 focus:ring-green-500 focus:border-transparent text-xl font-bold flex-shrink-0"
                                            aria-label={t('recordMatch.aria.decreaseGame')}
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            min="0"
                                            max="3"
                                            value={formData.gamesP1}
                                            onChange={(e) => setFormData({ ...formData, gamesP1: Math.min(3, Math.max(0, parseInt(e.target.value, 10) || 0)) })}
                                            className="w-full px-2 sm:px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl font-bold min-w-0"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData((prev) => ({ ...prev, gamesP1: Math.min(3, prev.gamesP1 + 1) }))}
                                            className="px-2 sm:px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 focus:ring-2 focus:ring-green-500 focus:border-transparent text-xl font-bold flex-shrink-0"
                                            aria-label={t('recordMatch.aria.increaseGame')}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 whitespace-nowrap">
                                        {t('recordMatch.field.opponentGames')}
                                    </label>
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData((prev) => ({ ...prev, gamesP2: Math.max(0, prev.gamesP2 - 1) }))}
                                            className="px-2 sm:px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 focus:ring-2 focus:ring-green-500 focus:border-transparent text-xl font-bold flex-shrink-0"
                                            aria-label={t('recordMatch.aria.decreaseGame')}
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            min="0"
                                            max="3"
                                            value={formData.gamesP2}
                                            onChange={(e) => setFormData({ ...formData, gamesP2: Math.min(3, Math.max(0, parseInt(e.target.value, 10) || 0)) })}
                                            className="w-full px-2 sm:px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl font-bold min-w-0"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData((prev) => ({ ...prev, gamesP2: Math.min(3, prev.gamesP2 + 1) }))}
                                            className="px-2 sm:px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 focus:ring-2 focus:ring-green-500 focus:border-transparent text-xl font-bold flex-shrink-0"
                                            aria-label={t('recordMatch.aria.increaseGame')}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {formData.player2Id && (
                                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('recordMatch.preview.title')}</p>
                                    <div className="overflow-x-auto">
                                        <div className="flex items-center justify-center gap-3 sm:gap-4 text-base sm:text-lg whitespace-nowrap min-w-max">
                                            <span className={`font-bold shrink-0 whitespace-nowrap ${formData.gamesP1 > formData.gamesP2 ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
                                            {user?.player?.name}
                                            </span>
                                            <span className="text-2xl font-bold text-slate-900 dark:text-white shrink-0 whitespace-nowrap">
                                            {formData.gamesP1} - {formData.gamesP2}
                                            </span>
                                            <span className={`font-bold shrink-0 whitespace-nowrap ${formData.gamesP2 > formData.gamesP1 ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
                                            {group?.groupPlayers.find((gp: any) => gp.playerId === formData.player2Id)?.player.name}
                                            </span>
                                        </div>
                                    </div>
                                    {formData.gamesP1 !== formData.gamesP2 && (formData.gamesP1 === 3 || formData.gamesP2 === 3) && (
                                        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">
                                            {t('recordMatch.preview.bestOfFive')}
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {formData.matchStatus === 'INJURY' && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                            <p className="text-orange-600 dark:text-orange-400 text-sm">
                                {String.fromCodePoint(0x2139)} {t('recordMatch.injuryInfo')}
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={mutation.isPending || !formData.player2Id}
                        className="w-full px-6 py-3 club-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {mutation.isPending ? t('recordMatch.submit.pending') : t('recordMatch.submit.default')}
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowInjuryConfirm(true)}
                        className="w-full px-6 py-3 text-orange-700 dark:text-orange-200 font-semibold rounded-lg border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                    >
                        {String.fromCodePoint(0x1F915)} {t('recordMatch.injury.button')}
                    </button>
                </form>
            </div>

            {showInjuryConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-xl">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t('recordMatch.injury.modal.title')}</h3>
                        <div className="space-y-3 text-slate-700 dark:text-slate-300 text-sm">
                            <p>{t('recordMatch.injury.modal.line1')}</p>
                            <p>{t('recordMatch.injury.modal.line2')}</p>
                            <p>{t('recordMatch.injury.modal.line3')}</p>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowInjuryConfirm(false)}
                                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
                                disabled={injuryMutation.isPending}
                            >
                                {t('recordMatch.injury.modal.cancel')}
                            </button>
                            <button
                                onClick={() => injuryMutation.mutate()}
                                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                                disabled={injuryMutation.isPending}
                            >
                                {injuryMutation.isPending ? t('recordMatch.injury.modal.pending') : t('recordMatch.injury.modal.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
