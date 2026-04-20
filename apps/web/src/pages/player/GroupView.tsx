import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Loader from '../../components/Loader';

interface ClassificationRow {
    playerId: string;
    playerName: string;
    wins: number;
    losses: number;
    setsWon: number;
    setsLost: number;
}

export default function GroupView() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { language, localeCode, t, formatDate } = useLanguage();
    const tr = (es: string, eu: string) => (language === 'eu' ? eu : es);
    const calendarEnabled = user?.player?.calendarEnabled ?? false;
    const [visibleRecentMatches, setVisibleRecentMatches] = useState(10);
    const [visibleRemainingMatches, setVisibleRemainingMatches] = useState(6);
    const [selectedRecentOpponent, setSelectedRecentOpponent] = useState<string>('all');

    const { data: group, isLoading, error: groupError } = useQuery({
        queryKey: ['group', id],
        queryFn: async () => {
            const { data } = await api.get(`/groups/${id}`);
            return data;
        },
    });

    const { data: classification, isLoading: loadingClassification, error: classificationError } = useQuery<ClassificationRow[]>({
        queryKey: ['classification', id],
        queryFn: async () => {
            const { data } = await api.get(`/classification?groupId=${id}`);
            return data;
        },
        enabled: !!id
    });

    // Filter matches for current player
    const myMatches = group?.matches.filter((match: any) => {
        const isMyMatch = match.player1Id === user?.player?.id || match.player2Id === user?.player?.id;
        if (!isMyMatch) return false;

        const hasResult = match.gamesP1 !== null && match.gamesP2 !== null;
        const isInjury = match.matchStatus === 'INJURY';
        const isScheduledPending = (match.isScheduled || !!match.scheduledDate) && !hasResult;

        // Mostrar siempre partidos jugados o por lesion
        if (hasResult || isInjury) return true;

        // Mostrar pendientes solo si fueron programados y calendario esta habilitado
        if (isScheduledPending) return calendarEnabled;

        // Ocultar pendientes internos no programados
        return false;
    }) || [];

    if (isLoading || loadingClassification) {
        return <div className="py-12"><Loader /></div>;
    }

    if (groupError) {
        return (
            <div className="text-center py-12">
                <div className="text-red-600 dark:text-red-400 text-lg mb-4">{tr('Error cargando el grupo', 'Errorea taldea kargatzean')}</div>
                <p className="text-slate-600 dark:text-slate-400 mb-4">{tr('Es posible que:', 'Baliteke hau gertatzea:')}</p>
                <ul className="text-left max-w-md mx-auto text-slate-600 dark:text-slate-400 space-y-2">
                    <li>- {tr('El grupo no exista o haya sido eliminado', 'Taldea ez egotea edo ezabatuta egotea')}</li>
                    <li>- {tr('No tengas permiso para ver este grupo', 'Talde hau ikusteko baimenik ez izatea')}</li>
                    <li>- {tr('Tu sesion haya expirado', 'Zure saioa iraungi izana')}</li>
                </ul>
                <a href="/dashboard" className="text-amber-600 dark:text-amber-400 hover:underline mt-6 inline-block">{tr('Volver al inicio', 'Hasierara itzuli')}</a>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="text-center py-12">
                <div className="text-slate-600 dark:text-slate-400 text-lg mb-4">{tr('Grupo no encontrado', 'Taldea ez da aurkitu')}</div>
                <a href="/dashboard" className="text-amber-600 dark:text-amber-400 hover:underline">{tr('Volver al inicio', 'Hasierara itzuli')}</a>
            </div>
        );
    }

    if (classificationError) {
        return <div className="text-center py-12 text-red-600">{tr('Error cargando clasificacion', 'Errorea sailkapena kargatzean')}</div>;
    }

    const totalPlayers = group.groupPlayers.length;
    const completedMatches = group.matches.filter((m: any) =>
        (m.matchStatus === 'PLAYED' && m.gamesP1 !== null && m.gamesP2 !== null) || m.matchStatus === 'INJURY'
    );
    const playedMatches = group.matches.filter((m: any) => m.matchStatus === 'PLAYED' && m.gamesP1 !== null && m.gamesP2 !== null);

    const recentPlayedMatches = [...playedMatches]
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const recentOpponentOptions = [...group.groupPlayers]
        .map((gp: any) => ({ id: String(gp.playerId), name: gp.player.name }))
        .sort((a, b) => a.name.localeCompare(b.name, localeCode));

    const isClosedMatchForClassification = (match: any) =>
        (match.matchStatus === 'PLAYED' && match.gamesP1 !== null && match.gamesP2 !== null) ||
        match.matchStatus === 'INJURY';

    const getClassificationProgress = (playerId: string) => {
        const completedOpponents = new Set<string>();
        const injuryOpponents = new Set<string>();

        group.matches.forEach((match: any) => {
            if (!isClosedMatchForClassification(match)) return;

            const isPlayer1 = String(match.player1Id) === playerId;
            const isPlayer2 = String(match.player2Id) === playerId;
            if (!isPlayer1 && !isPlayer2) return;

            const opponentId = isPlayer1 ? match.player2Id : match.player1Id;
            completedOpponents.add(String(opponentId));

            if (match.matchStatus === 'INJURY') {
                injuryOpponents.add(String(opponentId));
            }
        });

        const remaining = Math.max(0, (totalPlayers - 1) - completedOpponents.size);

        return {
            remaining,
            injuries: injuryOpponents.size,
        };
    };

    const classificationProgressByPlayer = new Map<string, { remaining: number; injuries: number }>();
    let maxInjuriesInGroup = 0;
    (classification ?? []).forEach((row) => {
        const progress = getClassificationProgress(row.playerId);
        classificationProgressByPlayer.set(String(row.playerId), progress);
        if (progress.injuries > maxInjuriesInGroup) {
            maxInjuriesInGroup = progress.injuries;
        }
    });

    const isActuallyInjuredPlayer = (playerId: string) => {
        const progress = classificationProgressByPlayer.get(String(playerId));
        if (!progress) return false;
        return progress.injuries > 0 && progress.remaining === 0 && progress.injuries === maxInjuriesInGroup;
    };

    const filteredRecentMatches = selectedRecentOpponent === 'all'
        ? recentPlayedMatches
        : recentPlayedMatches.filter((match: any) =>
            String(match.player1Id) === selectedRecentOpponent || String(match.player2Id) === selectedRecentOpponent
        );

    const displayedRecentMatches = selectedRecentOpponent === 'all'
        ? filteredRecentMatches.slice(0, visibleRecentMatches)
        : filteredRecentMatches;
    const closedMyMatchesCount = myMatches.filter((m: any) =>
        (m.matchStatus === 'PLAYED' && m.gamesP1 !== null && m.gamesP2 !== null) || m.matchStatus === 'INJURY'
    ).length;
    const getDirectMatchDisplay = (opponentPlayerId: string) => {
        const defaultDisplay = {
            resultText: tr('No jugado', 'Jokatu gabe'),
            resultColor: 'text-slate-400',
            resultStatusText: tr('Pendiente', 'Pendiente'),
            resultStatusTone: 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300',
            resultBadgeTone: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
            showScoreBadge: false,
        };
        const myPlayerId = user?.player?.id;
        if (!myPlayerId) return defaultDisplay;

        const directMatch = group.matches.find((m: any) => {
            const isDirectMatch =
                (m.player1Id === myPlayerId && m.player2Id === opponentPlayerId) ||
                (m.player2Id === myPlayerId && m.player1Id === opponentPlayerId);
            const isClosedByStatus =
                (m.matchStatus === 'PLAYED' && m.gamesP1 !== null && m.gamesP2 !== null) ||
                m.matchStatus === 'INJURY' ||
                m.matchStatus === 'CANCELLED';
            return isDirectMatch && isClosedByStatus;
        });

        if (!directMatch) return defaultDisplay;

        if (directMatch.matchStatus === 'INJURY') {
            return {
                resultText: tr('Lesion', 'Lesioa'),
                resultColor: 'text-orange-600 dark:text-orange-400 font-semibold',
                resultStatusText: tr('Lesion', 'Lesioa'),
                resultStatusTone: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
                resultBadgeTone: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700/50',
                showScoreBadge: false,
            };
        }

        if (directMatch.matchStatus === 'CANCELLED') {
            return {
                resultText: tr('Cancelado', 'Ezeztatua'),
                resultColor: 'text-slate-500 dark:text-slate-400 font-semibold',
                resultStatusText: tr('Cancelado', 'Ezeztatua'),
                resultStatusTone: 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300',
                resultBadgeTone: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                showScoreBadge: false,
            };
        }

        const myGames = directMatch.player1Id === myPlayerId ? directMatch.gamesP1 : directMatch.gamesP2;
        const opponentGames = directMatch.player1Id === myPlayerId ? directMatch.gamesP2 : directMatch.gamesP1;
        const won = directMatch.winnerId === myPlayerId;
        const lost = directMatch.winnerId === opponentPlayerId;
        let resultColor = 'text-slate-500 dark:text-slate-400 font-semibold';
        let resultStatusText = tr('Resultado', 'Emaitza');
        let resultStatusTone = 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300';
        let resultBadgeTone = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';

        if (won) {
            resultColor = 'text-emerald-700 dark:text-emerald-400 font-semibold';
            resultStatusText = tr('Victoria', 'Garaipena');
            resultStatusTone = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
            resultBadgeTone = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/50';
        }
        if (lost) {
            resultColor = 'text-red-600 dark:text-red-400 font-semibold';
            resultStatusText = tr('Derrota', 'Porrota');
            resultStatusTone = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
            resultBadgeTone = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700/50';
        }

        return {
            resultText: `${myGames}-${opponentGames}`,
            resultColor,
            resultStatusText,
            resultStatusTone,
            resultBadgeTone,
            showScoreBadge: true,
        };
    };

    const hasPlayedBetween = (playerAId: string, playerBId: string) => {
        return completedMatches.some((match: any) => (
            (match.player1Id === playerAId && match.player2Id === playerBId) ||
            (match.player1Id === playerBId && match.player2Id === playerAId)
        ));
    };

    const remainingMatchesList: Array<{ id: string; player1Name: string; player2Name: string }> = [];
    const players = [...group.groupPlayers].sort((a: any, b: any) => a.rankingPosition - b.rankingPosition);
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            const playerA = players[i];
            const playerB = players[j];
            if (!hasPlayedBetween(playerA.playerId, playerB.playerId)) {
                remainingMatchesList.push({
                    id: `${playerA.playerId}_${playerB.playerId}`,
                    player1Name: playerA.player.name,
                    player2Name: playerB.player.name,
                });
            }
        }
    }

    // Calcular dias restantes
    const endDate = new Date(group.season.endDate);
    const today = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Funcion para exportar CSV del grupo
    const handleExportGroupCSV = () => {
        if (!group.groupPlayers) return;

        const rows: string[] = [];
        rows.push(tr(
            'Posicion,Jugador,Partidos Ganados,Partidos Perdidos,Sets Ganados,Sets Perdidos,Movimiento',
            'Postua,Jokalaria,Irabazitako Partidak,Galdutako Partidak,Irabazitako Setak,Galdutako Setak,Mugimendua',
        ));

        const sortedPlayers = [...group.groupPlayers].sort((a: any, b: any) => a.rankingPosition - b.rankingPosition);
        sortedPlayers.forEach((gp: any) => {
            const movement = gp.rankingPosition <= 2
                ? tr('ASCENSO', 'IGOERA')
                : gp.rankingPosition > totalPlayers - 2
                    ? tr('DESCENSO', 'JAITSIERA')
                    : tr('MANTIENE', 'MANTENTZEN DA');
            const wins = group.matches.filter((m: any) => m.matchStatus === 'PLAYED' && m.winnerId === gp.playerId).length || 0;
            const losses = group.matches.filter((m: any) => m.matchStatus === 'PLAYED' && ((m.player1Id === gp.playerId && m.winnerId === m.player2Id) || (m.player2Id === gp.playerId && m.winnerId === m.player1Id))).length || 0;

            let setsWon = 0, setsLost = 0;
            group.matches.forEach((m: any) => {
                if (m.matchStatus === 'PLAYED') {
                    if (m.player1Id === gp.playerId) {
                        setsWon += m.gamesP1;
                        setsLost += m.gamesP2;
                    } else if (m.player2Id === gp.playerId) {
                        setsWon += m.gamesP2;
                        setsLost += m.gamesP1;
                    }
                }
            });

            rows.push(`${gp.rankingPosition},"${gp.player.name}",${wins},${losses},${setsWon},${setsLost},"${movement}"`);
        });

        const csv = rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${tr('clasificacion', 'sailkapena')}_${group.name.replace(/\s+/g, '_')}.csv`);
        link.click();
    };

    return (
        <div className="space-y-6">
            {/* Encabezado */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{group.name}</h1>
                    <p className="text-slate-600 dark:text-slate-400">{group.season.name}</p>
                </div>
                <div className="flex gap-2">
                    {user?.role === 'ADMIN' && (
                        <button
                            onClick={handleExportGroupCSV}
                            className="px-4 py-2 club-btn-dark font-medium flex items-center gap-2 shadow-sm"
                            title={tr('Descargar clasificacion como CSV', 'Sailkapena CSV gisa deskargatu')}
                        >
                            {String.fromCodePoint(0x1F4C4)} CSV
                        </button>
                    )}
                    {group.whatsappUrl && (
                        <a
                            href={group.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black/85 rounded-lg transition-colors font-semibold flex items-center gap-2 shadow-sm whitespace-nowrap h-fit self-center"
                            title={tr('Grupo WhatsApp', 'WhatsApp taldea')}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            <span className="hidden sm:inline">{tr('Grupo WhatsApp', 'WhatsApp taldea')}</span>
                            <span className="sm:hidden">WhatsApp</span>
                        </a>
                    )}
                </div>
            </div>

                        {/* Indicadores */}
            <div className="grid grid-cols-2 gap-1.5 md:gap-6">
                <div className="bg-gradient-to-br from-yellow-300 to-yellow-400 rounded-lg md:rounded-xl p-2 md:p-6 text-club-black-900 border border-black/15 shadow-lg">
                    <div className="flex items-center justify-between mb-1 md:mb-2">
                        <span className="text-[11px] md:text-sm font-semibold opacity-90">{t('groupView.kpi.daysRemaining')}</span>
                        <span className="text-base md:text-2xl">{String.fromCodePoint(0x23F0)}</span>
                    </div>
                    <p className="text-xl md:text-4xl font-bold leading-none">{daysRemaining > 0 ? daysRemaining : 0}</p>
                    <p className="text-xs text-black/75 mt-0.5 md:mt-1 hidden md:block">
                        {t('groupView.kpi.untilDate', { date: formatDate(endDate) })}
                    </p>
                </div>

                <div className="bg-gradient-to-br from-[#171717] to-[#2b2b2b] rounded-lg md:rounded-xl p-2 md:p-6 text-yellow-100 border border-yellow-400/30 shadow-lg">
                    <div className="flex items-center justify-between mb-1 md:mb-2">
                        <span className="text-[11px] md:text-sm font-semibold opacity-90">{t('groupView.kpi.totalPlayers')}</span>
                        <span className="text-base md:text-2xl">{String.fromCodePoint(0x1F465)}</span>
                    </div>
                    <p className="text-xl md:text-4xl font-bold leading-none">{totalPlayers}</p>
                    <p className="text-xs text-yellow-100/80 mt-0.5 md:mt-1 hidden md:block">{t('groupView.kpi.activeInGroup')}</p>
                </div>
            </div>

            {/* Estadisticas del Grupo */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{tr('Estadisticas del Grupo', 'Taldearen Estatistikak')}</h2>
                    {classification && classification.length > 0 && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            {classification.length} {tr('jugadores', 'jokalari')}
                        </span>
                    )}
                </div>
                <div className="p-3 md:p-6 space-y-0 md:space-y-6">
                    {!classification || classification.length === 0 ? (
                        <p className="text-sm text-slate-600 dark:text-slate-400">{tr('Sin partidos registrados todavia.', 'Oraindik ez dago partidarik erregistratuta.')}</p>
                    ) : (
                        <>

                            {/* Tabla para escritorio - version completa */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-900">
                                        <tr>
                                            <th className="px-3 py-2 text-center font-medium text-slate-600 dark:text-slate-400">{tr('Pos', 'Pos')}</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400">{tr('Jugador', 'Jokalaria')}</th>
                                            <th className="px-3 py-2 text-center font-medium text-slate-600 dark:text-slate-400">{tr('Victorias', 'Garaipenak')}</th>
                                            <th className="px-3 py-2 text-center font-medium text-slate-600 dark:text-slate-400">{tr('Derrotas', 'Porrotak')}</th>
                                            <th className="px-3 py-2 text-center font-medium text-slate-600 dark:text-slate-400">{tr('Restantes', 'Geratzen direnak')}</th>
                                            <th className="px-3 py-2 text-center font-medium text-slate-600 dark:text-slate-400">{tr('Lesion', 'Lesioa')}</th>
                                            <th className="px-3 py-2 text-center font-medium text-slate-600 dark:text-slate-400">Sets +</th>
                                            <th className="px-3 py-2 text-center font-medium text-slate-600 dark:text-slate-400">Sets -</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {classification.map((row, idx) => {
                                            const progress = classificationProgressByPlayer.get(String(row.playerId)) ?? getClassificationProgress(row.playerId);
                                            const remaining = progress.remaining;
                                            const injuries = progress.injuries;
                                            const isInjuredPlayer = isActuallyInjuredPlayer(row.playerId);
                                            const displayInjuries = isInjuredPlayer ? injuries : 0;
                                            const isCurrentUser = String(row.playerId) === String(user?.player?.id);
                                            
                                            // Determinar ascenso/descenso
                                            const isPromotion = idx < 2; // Top 2: ascenso
                                            const isRelegation = idx >= totalPlayers - 2; // altimos 2: descenso
                                            
                                            const baseRowClass = isPromotion
                                                ? "bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                                                : isRelegation
                                                ? "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
                                                : "hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors";
                                            const rowClass = `${baseRowClass} ${isCurrentUser ? 'ring-1 ring-inset ring-amber-400/70 dark:ring-amber-500/45' : ''}`;

                                            return (
                                                <tr key={row.playerId} className={rowClass}>
                                                    <td className={`px-3 py-2 text-center font-semibold ${isCurrentUser ? 'font-bold text-slate-700 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>{idx + 1}</td>
                                                    <td className="px-3 py-2">
                                                        <span className="inline-flex items-center gap-1">
                                                            <span className={isCurrentUser ? 'font-bold' : ''}>{row.playerName}</span>
                                                            {isCurrentUser && (
                                                                <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 dark:bg-amber-700/40 dark:text-amber-100 font-semibold">
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
                                                    <td className="px-3 py-2 text-center font-semibold text-green-700 dark:text-green-300">{row.wins}</td>
                                                    <td className="px-3 py-2 text-center font-semibold text-red-600 dark:text-red-400">{row.losses}</td>
                                                    <td className="px-3 py-2 text-center font-semibold text-slate-600 dark:text-slate-400">{remaining}</td>
                                                    <td className="px-3 py-2 text-center font-semibold text-orange-600 dark:text-orange-400">{displayInjuries}</td>
                                                    <td className="px-3 py-2 text-center">{row.setsWon}</td>
                                                    <td className="px-3 py-2 text-center">{row.setsLost}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Tabla para movil - version compacta */}
                            <div className="md:hidden overflow-x-auto -mx-2">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700">
                                            <th className="px-2 py-2">{tr('Pos', 'Pos')}</th>
                                            <th className="px-2 py-2">{tr('Jugador', 'Jokalaria')}</th>
                                            <th className="px-2 py-2 text-center">G</th>
                                            <th className="px-2 py-2 text-center">P</th>
                                            <th className="px-2 py-2 text-center">AVG</th>
                                            <th className="px-2 py-2 text-center">R</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {classification.map((row, idx) => {
                                            const progress = classificationProgressByPlayer.get(String(row.playerId)) ?? getClassificationProgress(row.playerId);
                                            const remaining = progress.remaining;
                                            const isInjuredPlayer = isActuallyInjuredPlayer(row.playerId);
                                            const isCurrentUser = String(row.playerId) === String(user?.player?.id);
                                            
                                            // Calculate set difference
                                            const setDifference = row.setsWon - row.setsLost;
                                            
                                            // Determinar ascenso/descenso
                                            const isPromotion = idx < 2; // Top 2: ascenso
                                            const isRelegation = idx >= totalPlayers - 2; // altimos 2: descenso
                                            
                                            const baseRowClass = isPromotion
                                                ? "bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                                                : isRelegation
                                                ? "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
                                                : "hover:bg-slate-50 dark:hover:bg-slate-900/60";
                                            const rowClass = `${baseRowClass} ${isCurrentUser ? 'ring-1 ring-inset ring-amber-400/70 dark:ring-amber-500/45' : ''}`;

                                            return (
                                                <tr key={row.playerId} className={rowClass}>
                                                    <td className={`px-2 py-2 ${isCurrentUser ? 'font-semibold text-slate-700 dark:text-slate-200' : 'text-slate-500'}`}>{idx + 1}</td>
                                                    <td className={`px-2 py-2 font-medium ${isCurrentUser ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                                                        <span className="inline-flex items-center gap-1">
                                                            <span>{row.playerName}</span>
                                                            {isCurrentUser && (
                                                                <span className="text-[10px] px-1 py-0.5 rounded bg-amber-200 text-amber-900 dark:bg-amber-700/40 dark:text-amber-100 font-semibold">
                                                                    {tr('Tu', 'Zu')}
                                                                </span>
                                                            )}
                                                            {isInjuredPlayer && (
                                                                <span className="text-[10px] px-1 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                                                    {String.fromCodePoint(0x1F915)}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-2 text-center font-semibold text-green-700 dark:text-green-300">{row.wins}</td>
                                                    <td className="px-2 py-2 text-center font-semibold text-red-600 dark:text-red-400">{row.losses}</td>
                                                    <td className={`px-2 py-2 text-center font-semibold ${setDifference >= 0 ? 'text-club-yellow-700 dark:text-club-yellow-300' : 'text-red-500 dark:text-red-400'}`}>
                                                        {setDifference > 0 ? '+' : ''}{setDifference}
                                                    </td>
                                                    <td className="px-2 py-2 text-center text-slate-700 dark:text-slate-200">{remaining}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Clasificacion Actual (Ranking interno) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{tr('Contrincantes', 'Aurkariak')}</h2>
                </div>
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    {tr('Jugador', 'Jokalaria')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    {tr('Resultado directo', 'Emaitza zuzena')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    {tr('Contacto', 'Kontaktua')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {group.groupPlayers
                                .filter((gp: any) => gp.player.user?.role !== 'ADMIN')
                                .map((gp: any, index: number) => {
                                    const isCurrentUser = gp.playerId === user?.player?.id;
                                    const { resultText, resultColor } = getDirectMatchDisplay(gp.playerId);
                                    
                                    return (
                                        <tr 
                                            key={gp.id} 
                                            className={`hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${isCurrentUser ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    {index < 2 && (
                                                        <span className="text-xs font-semibold text-club-yellow-700 dark:text-club-yellow-300">
                                                            {String.fromCodePoint(0x1F3C6)} TOP
                                                        </span>
                                                    )}
                                                    {index >= totalPlayers - 2 && (
                                                        <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                                                            {String.fromCodePoint(0x2B07)} OUT
                                                        </span>
                                                    )}
                                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                                        #{gp.rankingPosition}
                                                    </span>
                                                    <div>
                                                        <p className={`font-medium ${isCurrentUser ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                                                    {gp.player.name} {isCurrentUser && tr('(Tu)', '(Zu)')}
                                                        </p>
                                                        {gp.player.nickname && (
                                                            <p className="text-sm text-slate-500 dark:text-slate-400">"{gp.player.nickname}"</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {isCurrentUser ? (
                                                    <span className="text-sm text-slate-400 dark:text-slate-500 italic">{tr('Eres tu', 'Zu zara')}</span>
                                                ) : (
                                                    <span className={`text-sm ${resultColor}`}>
                                                        {resultText}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {isCurrentUser ? (
                                                    <span className="text-sm text-slate-400 dark:text-slate-500 italic">{tr('Eres tu', 'Zu zara')}</span>
                                                ) : (
                                                    <ContactButtons phone={gp.player.phone} email={gp.player.user?.email} language={language} />
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>

            {/* Vista movil - Cards */}
                <div className="md:hidden space-y-2 p-3">
                    {group.groupPlayers
                        .filter((gp: any) => gp.player.user?.role !== 'ADMIN')
                        .map((gp: any, index: number) => {
                            const isCurrentUser = gp.playerId === user?.player?.id;
                            const { resultText, resultStatusText, resultStatusTone, resultBadgeTone, showScoreBadge } = getDirectMatchDisplay(gp.playerId);

                            return (
                                <div 
                                    key={gp.id} 
                                    className={`p-4 rounded-lg border ${isCurrentUser ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div>
                                                {index < 2 && (
                                                    <span className="text-xs font-semibold text-club-yellow-700 dark:text-club-yellow-300">
                                                        {String.fromCodePoint(0x1F3C6)} TOP
                                                    </span>
                                                )}
                                                {index >= totalPlayers - 2 && (
                                                    <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                                                        {String.fromCodePoint(0x2B07)} OUT
                                                    </span>
                                                )}
                                                {index >= 2 && index < totalPlayers - 2 && <span className="text-sm font-bold text-slate-500">#{gp.rankingPosition}</span>}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`font-semibold text-sm ${isCurrentUser ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                                                        #{gp.rankingPosition} {gp.player.name} {isCurrentUser && tr('(Tu)', '(Zu)')}
                                                    </p>
                                                    {!isCurrentUser && (
                                                        <div className="flex flex-wrap justify-end items-center gap-1.5 shrink-0">
                                                            {showScoreBadge ? (
                                                                <>
                                                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${resultStatusTone}`}>
                                                                        {resultStatusText}
                                                                    </span>
                                                                    <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-sm font-extrabold leading-none ${resultBadgeTone}`}>
                                                                        {resultText}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs font-bold uppercase tracking-wide ${resultBadgeTone}`}>
                                                                    {resultText}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                {gp.player.nickname && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">"{gp.player.nickname}"</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {!isCurrentUser && (
                                        <div className="mt-3 flex gap-2">
                                            <ContactButtons phone={gp.player.phone} email={gp.player.user?.email} language={language} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* Partidos Recientes */}
            {recentPlayedMatches.length > 0 && (

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{tr('Partidos Recientes', 'Azken Partidak')}</h2>
                        <div className="flex items-center gap-2">
                            <label htmlFor="recent-opponent-filter" className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {tr('Jugador', 'Jokalaria')}
                            </label>
                            <select
                                id="recent-opponent-filter"
                                value={selectedRecentOpponent}
                                onChange={(e) => setSelectedRecentOpponent(e.target.value)}
                                className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="all">{tr('Todos', 'Guztiak')}</option>
                                {recentOpponentOptions.map((opponent) => (
                                    <option key={opponent.id} value={opponent.id}>
                                        {opponent.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {displayedRecentMatches
                            .map((match: any) => (
                            <div key={match.id} className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <span className={`font-medium ${match.winnerId === match.player1Id ? 'text-green-700 dark:text-green-300' : 'text-slate-900 dark:text-white'}`}>
                                                {match.player1.name}
                                            </span>
                                            <span className="text-slate-600 dark:text-slate-400">vs</span>
                                            <span className={`font-medium ${match.winnerId === match.player2Id ? 'text-green-700 dark:text-green-300' : 'text-slate-900 dark:text-white'}`}>
                                                {match.player2.name}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                            {new Date(match.date).toLocaleDateString(localeCode)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {match.gamesP1} - {match.gamesP2}
                                        </p>
                                        {match.matchStatus !== 'PLAYED' && (
                                            <p className="text-xs text-orange-600 dark:text-orange-400 uppercase">
                                                {match.matchStatus === 'INJURY' ? tr('LESION', 'LESIOA') : tr('CANCELADO', 'EZEZTATUA')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {selectedRecentOpponent === 'all' && visibleRecentMatches < filteredRecentMatches.length && (
                        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 text-center">
                            <button
                                onClick={() => setVisibleRecentMatches((prev) => Math.min(prev + 10, filteredRecentMatches.length))}
                                className="px-4 py-2 club-btn-tertiary"
                            >
                                {filteredRecentMatches.length - visibleRecentMatches <= 10 ? tr('Ver todos', 'Guztiak ikusi') : tr('Ver mas', 'Gehiago ikusi')}
                            </button>
                        </div>
                    )}
                </div>
            )
            }

            {/* Partidos Restantes */}
            {remainingMatchesList.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{tr('Partidos Restantes', 'Geratzen diren Partidak')}</h2>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            {language === 'eu'
                                ? `${remainingMatchesList.length} zain`
                                : `${remainingMatchesList.length} pendientes`}
                        </span>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {remainingMatchesList.slice(0, visibleRemainingMatches).map((match) => (
                            <div key={match.id} className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-medium text-slate-900 dark:text-white">{match.player1Name}</span>
                                        <span className="text-slate-600 dark:text-slate-400">vs</span>
                                        <span className="font-medium text-slate-900 dark:text-white">{match.player2Name}</span>
                                    </div>
                                    <span className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-400">{tr('Pendiente', 'Zain')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {visibleRemainingMatches < remainingMatchesList.length && (
                        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 text-center">
                            <button
                                onClick={() => setVisibleRemainingMatches((prev) => prev + 6)}
                                className="px-4 py-2 club-btn-tertiary"
                            >
                                {tr('Ver mas', 'Gehiago ikusi')}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Mis Partidos - Matches for the current player */}
            {user?.player?.id && myMatches.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{tr('Mis Partidos', 'Nire Partidak')}</h2>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            {language === 'eu'
                                ? `${closedMyMatchesCount} itxita / ${myMatches.length} guztira`
                                : `${closedMyMatchesCount} cerrados de ${myMatches.length} totales`}
                        </span>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {myMatches
                            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((match: any) => {
                                const isPlayer1 = match.player1Id === user?.player?.id;
                                const opponent = isPlayer1 ? match.player2 : match.player1;
                                const myScore = isPlayer1 ? match.gamesP1 : match.gamesP2;
                                const opponentScore = isPlayer1 ? match.gamesP2 : match.gamesP1;
                                const won = match.winnerId === user?.player?.id;
                                const played = (match.matchStatus === 'PLAYED' && match.gamesP1 !== null && match.gamesP2 !== null) || match.matchStatus === 'INJURY';

                                return (
                                    <div key={match.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3">
                                                    {played && (
                                                        <span className="text-2xl">
                                                            {match.matchStatus === 'INJURY' ? String.fromCodePoint(0x1F915) : won ? String.fromCodePoint(0x2705) : String.fromCodePoint(0x274C)}
                                                        </span>
                                                    )}
                                                    {!played && (
                                                        <span className="text-2xl">{String.fromCodePoint(0x23F3)}</span>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-white">
                                                            {tr('vs', 'vs')} {opponent.name}
                                                        </p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                                            {new Date(played ? match.date : (match.scheduledDate || match.date)).toLocaleDateString(localeCode, { 
                                                                day: '2-digit', 
                                                                month: '2-digit', 
                                                                year: 'numeric',
                                                                ...(match.scheduledDate && !played ? { hour: '2-digit', minute: '2-digit' } : {})
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {played ? (
                                                    match.matchStatus === 'INJURY' ? (
                                                        <p className="text-sm font-bold text-orange-600 dark:text-orange-400 uppercase">
                                                            {tr('LESION', 'LESIOA')}
                                                        </p>
                                                    ) : (
                                                        <p className={`text-2xl font-bold ${won ? 'text-green-700 dark:text-green-300' : 'text-red-600 dark:text-red-400'}`}>
                                                            {myScore} - {opponentScore}
                                                        </p>
                                                    )
                                                ) : (
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        {tr('Pendiente', 'Zain')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}
        </div >
    );
}

function ContactButtons({ phone, email, language }: { phone?: string; email?: string; language: 'es' | 'eu' }) {
    const tr = (es: string, eu: string) => (language === 'eu' ? eu : es);
    const hasValidEmail = email && !email.endsWith('@ejemplo.com');
    
    if (!phone && !hasValidEmail) {
        return <span className="text-sm text-slate-400">{tr('Sin informacion de contacto', 'Kontaktu informaziorik gabe')}</span>;
    }

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {phone && (
                <>
                    <a
                        href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-10 min-w-10 px-3 py-2 md:px-3 md:py-1 bg-amber-100 dark:bg-club-black-900 text-club-yellow-700 dark:text-club-yellow-300 rounded-xl hover:bg-amber-200 dark:hover:bg-club-black-800 transition-colors text-sm md:text-sm font-semibold inline-flex items-center justify-center gap-2"
                        title="WhatsApp"
                        aria-label="WhatsApp"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        <span className="hidden sm:inline">WhatsApp</span>
                    </a>
                    <a
                        href={`tel:${phone}`}
                        className="min-h-10 min-w-10 px-3 py-2 md:px-3 md:py-1 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-xl hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors text-sm md:text-sm font-semibold inline-flex items-center justify-center"
                        title={tr('Llamar', 'Deitu')}
                        aria-label={tr('Llamar', 'Deitu')}
                    >
                        {String.fromCodePoint(0x1F4DE)}
                    </a>
                </>
            )}
            {hasValidEmail && (
                <a
                    href={`mailto:${email}`}
                    className="min-h-10 min-w-10 px-3 py-2 md:px-3 md:py-1 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-xl hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors text-sm md:text-sm font-semibold inline-flex items-center justify-center"
                    title={tr('Enviar email', 'Emaila bidali')}
                    aria-label={tr('Enviar email', 'Emaila bidali')}
                >
                    {String.fromCodePoint(0x2709, 0xFE0F)}
                </a>
            )}
        </div>
    );
}
