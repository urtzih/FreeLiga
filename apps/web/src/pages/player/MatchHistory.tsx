import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../lib/api';
import EditMatchModal from '../../components/EditMatchModal';
import Loader from '../../components/Loader';

interface MatchHistoryEntry {
    id: string;
    player1Id: string;
    player2Id: string;
    winnerId: string | null;
    groupId: string;
    gamesP1: number | null;
    gamesP2: number | null;
    matchStatus: 'PLAYED' | 'INJURY' | 'CANCELLED';
    date: string;
    scheduledDate?: string | null;
    player1: { id: string; name: string; nickname?: string | null };
    player2: { id: string; name: string; nickname?: string | null };
    group: {
        name: string;
        seasonId?: string;
        season?: { name?: string; isActive?: boolean };
    };
}

export default function MatchHistory() {
    const { user, isAdmin } = useAuth();
    const { language, formatDate } = useLanguage();
    const tr = (es: string, eu: string) => (language === 'eu' ? eu : es);
    const queryClient = useQueryClient();
    const [editingMatch, setEditingMatch] = useState<MatchHistoryEntry | null>(null);
    const [showCreatePendingModal, setShowCreatePendingModal] = useState(false);
    const [createPendingError, setCreatePendingError] = useState('');
    const [createPendingForm, setCreatePendingForm] = useState({
        groupId: '',
        player1Id: '',
        player2Id: '',
        gamesP1: 0,
        gamesP2: 0,
        date: new Date().toISOString().split('T')[0],
    });

    // Filters
    const [onlyMyMatches, setOnlyMyMatches] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [playerName1, setPlayerName1] = useState('');
    const [playerName2, setPlayerName2] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedSeason, setSelectedSeason] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const effectiveOnlyMyMatches = !isAdmin && onlyMyMatches;

    // Fetch all seasons
    const { data: seasons = [] } = useQuery({
        queryKey: ['seasons'],
        queryFn: async () => {
            const { data } = await api.get('/seasons');
            return data;
        },
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true
    });

    // Fetch all groups
    const { data: allGroups = [] } = useQuery({
        queryKey: ['groups'],
        queryFn: async () => {
            const { data } = await api.get('/groups');
            return data;
        },
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true
    });

    // Filter groups by selected season
    const availableGroups = useMemo(() => {
        if (!selectedSeason) return allGroups;
        return allGroups.filter((g: any) => g.seasonId === selectedSeason);
    }, [allGroups, selectedSeason]);


    const { data: matches = [], isLoading, refetch: refetchMatches } = useQuery<MatchHistoryEntry[]>({
        queryKey: ['matches', isAdmin ? 'all' : (effectiveOnlyMyMatches ? 'my' : 'all'), user?.player?.id],
        queryFn: async () => {
            const endpoint = isAdmin || !effectiveOnlyMyMatches
                ? '/matches'
                : `/matches?playerId=${user?.player?.id}`;
            const { data } = await api.get(endpoint);
            return data;
        },
        enabled: isAdmin || !effectiveOnlyMyMatches || !!user?.player?.id,
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true
    });

    const { data: groupPlayers = [] } = useQuery({
        queryKey: ['groupPlayersForPendingMatch', createPendingForm.groupId],
        queryFn: async () => {
            if (!createPendingForm.groupId) return [];
            const { data } = await api.get(`/groups/${createPendingForm.groupId}/players`);
            return data;
        },
        enabled: isAdmin && showCreatePendingModal && !!createPendingForm.groupId,
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });

    const createPendingMatchMutation = useMutation({
        mutationFn: async (payload: { groupId: string; player1Id: string; player2Id: string; gamesP1: number; gamesP2: number; date: string; matchStatus: 'PLAYED' }) => {
            const { data } = await api.post('/matches', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['matches'] });
            setShowCreatePendingModal(false);
            setCreatePendingError('');
            setCreatePendingForm({
                groupId: '',
                player1Id: '',
                player2Id: '',
                gamesP1: 0,
                gamesP2: 0,
                date: new Date().toISOString().split('T')[0],
            });
            alert(tr('Partido registrado correctamente', 'Partida ondo erregistratu da'));
        },
        onError: (error: any) => {
            const message = error?.response?.data?.error || error?.message || tr('No se pudo crear el partido pendiente', 'Ezin izan da pendiente partida sortu');
            setCreatePendingError(String(message));
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (matchId: string) => {
            await api.delete(`/matches/${matchId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['matches'] });
            queryClient.invalidateQueries({ queryKey: ['group'] });
            queryClient.invalidateQueries({ queryKey: ['classification'] });
            alert(tr('Partido eliminado correctamente', 'Partida ondo ezabatu da'));
        },
        onError: (error: any) => {
            console.error('Error eliminando partido:', error);
            alert(`${tr('Error al eliminar el partido', 'Errorea partida ezabatzean')}: ${error.response?.data?.error || error.message}`);
        },
    });

    const handleDelete = async (matchId: string) => {
        if (window.confirm(tr('Estas seguro de que quieres eliminar este partido?', 'Ziur zaude partida hau ezabatu nahi duzula?'))) {
            await deleteMutation.mutateAsync(matchId);
        }
    };

    // Filtered and paginated matches
    const filteredMatches = useMemo(() => {
        return matches.filter((match) => {
            // Non-admins: show only closed matches (PLAYED with result, INJURY, CANCELLED)
            if (!isAdmin) {
                const isPlayedWithResult =
                    match.matchStatus === 'PLAYED' &&
                    match.gamesP1 !== null &&
                    match.gamesP2 !== null;
                const isClosedNonPlayed =
                    match.matchStatus === 'INJURY' ||
                    match.matchStatus === 'CANCELLED';
                if (!isPlayedWithResult && !isClosedNonPlayed) {
                    return false;
                }
            }

            const currentPlayerId = user?.player?.id;
            const isCurrentPlayerInMatch = match.player1Id === currentPlayerId || match.player2Id === currentPlayerId;
            const player1Name = match.player1?.name?.toLowerCase() || '';
            const player2Name = match.player2?.name?.toLowerCase() || '';

            if (effectiveOnlyMyMatches) {
                if (!isCurrentPlayerInMatch) {
                    return false;
                }

                const search = searchTerm.trim().toLowerCase();
                if (search) {
                    const opponent = match.player1Id === currentPlayerId ? match.player2 : match.player1;
                    const opponentName = opponent?.name?.toLowerCase() || '';
                    if (!opponentName.includes(search)) {
                        return false;
                    }
                }
            } else {
                const name1 = playerName1.trim().toLowerCase();
                const name2 = playerName2.trim().toLowerCase();

                if (name1 && name2) {
                    const firstFound = player1Name.includes(name1) || player2Name.includes(name1);
                    const secondFound = player1Name.includes(name2) || player2Name.includes(name2);
                    if (!firstFound || !secondFound) {
                        return false;
                    }
                } else if (name1 || name2) {
                    const oneName = name1 || name2;
                    const found = player1Name.includes(oneName) || player2Name.includes(oneName);
                    if (!found) {
                        return false;
                    }
                }
            }

            // Date range filter (use match.date or match.scheduledDate for pending matches)
            const matchDate = new Date(match.date || match.scheduledDate || new Date());
            if (dateFrom && matchDate < new Date(dateFrom)) return false;
            if (dateTo && matchDate > new Date(dateTo)) return false;

            // Season filter
            if (selectedSeason && match.group?.seasonId !== selectedSeason) {
                return false;
            }

            // Group filter
            if (selectedGroup && match.groupId !== selectedGroup) {
                return false;
            }

            return true;
        });
    }, [matches, effectiveOnlyMyMatches, searchTerm, playerName1, playerName2, dateFrom, dateTo, selectedSeason, selectedGroup, user?.player?.id, isAdmin]);

    const legacyInjuryExposureByGroup = useMemo(() => {
        const byGroup = new Map<string, Map<string, number>>();

        matches.forEach((match) => {
            if (match.matchStatus !== 'INJURY' || match.winnerId) return;

            const groupMap = byGroup.get(match.groupId) ?? new Map<string, number>();
            groupMap.set(match.player1Id, (groupMap.get(match.player1Id) ?? 0) + 1);
            groupMap.set(match.player2Id, (groupMap.get(match.player2Id) ?? 0) + 1);
            byGroup.set(match.groupId, groupMap);
        });

        return byGroup;
    }, [matches]);

    const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);
    const paginatedMatches = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredMatches.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredMatches, currentPage]);

    // Reset to page 1 when filters change
    const resetToPageOne = () => setCurrentPage(1);

    const selectedGroupMatches = useMemo(() => {
        if (!createPendingForm.groupId) return [] as any[];
        return matches.filter((match) => match.groupId === createPendingForm.groupId);
    }, [matches, createPendingForm.groupId]);

    const groupsWithRemainingMatches = useMemo(() => {
        return allGroups.filter((group: any) => {
            const groupPlayersData = group.groupPlayers || [];
            const playerIds = groupPlayersData
                .map((gp: any) => gp.playerId || gp.player?.id)
                .filter(Boolean);

            if (playerIds.length < 2) return false;

            const groupPlayedMatches = matches.filter((match) => {
                if (match.groupId !== group.id) return false;
                return match.gamesP1 !== null && match.gamesP2 !== null;
            });

            const hasPlayedPair = (aId: string, bId: string) => {
                return groupPlayedMatches.some((match) => (
                    (match.player1Id === aId && match.player2Id === bId) ||
                    (match.player1Id === bId && match.player2Id === aId)
                ));
            };

            for (let indexA = 0; indexA < playerIds.length; indexA++) {
                for (let indexB = indexA + 1; indexB < playerIds.length; indexB++) {
                    if (!hasPlayedPair(playerIds[indexA], playerIds[indexB])) {
                        return true;
                    }
                }
            }

            return false;
        });
    }, [allGroups, matches]);

    const hasPlayedResultBetween = useCallback((playerAId: string, playerBId: string) => {
        return selectedGroupMatches.some((match) => {
            const samePair =
                (match.player1Id === playerAId && match.player2Id === playerBId) ||
                (match.player1Id === playerBId && match.player2Id === playerAId);

            if (!samePair) return false;

            return match.gamesP1 !== null && match.gamesP2 !== null;
        });
    }, [selectedGroupMatches]);

    const playersWithRemainingMatches = useMemo(() => {
        if (!createPendingForm.groupId || !groupPlayers.length) return [] as any[];

        return groupPlayers.filter((playerA: any) => {
            return groupPlayers.some((playerB: any) => {
                if (playerA.id === playerB.id) return false;
                return !hasPlayedResultBetween(playerA.id, playerB.id);
            });
        });
    }, [groupPlayers, createPendingForm.groupId, hasPlayedResultBetween]);

    const remainingOpponentsForPlayer1 = useMemo(() => {
        if (!createPendingForm.player1Id) return [] as any[];

        return groupPlayers.filter((player: any) => {
            if (player.id === createPendingForm.player1Id) return false;
            return !hasPlayedResultBetween(createPendingForm.player1Id, player.id);
        });
    }, [groupPlayers, createPendingForm.player1Id, hasPlayedResultBetween]);

    const handleCreatePendingMatch = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatePendingError('');

        if (!createPendingForm.groupId || !createPendingForm.player1Id || !createPendingForm.player2Id) {
            setCreatePendingError(tr('Debes seleccionar grupo y los dos contrincantes', 'Taldea eta bi aurkariak hautatu behar dituzu'));
            return;
        }

        if (createPendingForm.player1Id === createPendingForm.player2Id) {
            setCreatePendingError(tr('Los contrincantes deben ser diferentes', 'Aurkariak desberdinak izan behar dira'));
            return;
        }

        const validScore =
            (createPendingForm.gamesP1 === 3 && createPendingForm.gamesP2 >= 0 && createPendingForm.gamesP2 <= 2) ||
            (createPendingForm.gamesP2 === 3 && createPendingForm.gamesP1 >= 0 && createPendingForm.gamesP1 <= 2);

        if (!validScore) {
            setCreatePendingError(tr('Resultado invalido: formato permitido 3-0, 3-1, 3-2 (o inverso).', 'Emaitza baliogabea: onartutako formatua 3-0, 3-1, 3-2 (edo alderantziz).'));

            return;
        }

        if (hasPlayedResultBetween(createPendingForm.player1Id, createPendingForm.player2Id)) {
            setCreatePendingError(tr('Esta pareja ya no tiene partidos restantes en este grupo', 'Bikote honek ez du partida pendienterik talde honetan'));
            return;
        }

        await createPendingMatchMutation.mutateAsync({
            groupId: createPendingForm.groupId,
            player1Id: createPendingForm.player1Id,
            player2Id: createPendingForm.player2Id,
            gamesP1: createPendingForm.gamesP1,
            gamesP2: createPendingForm.gamesP2,
            date: new Date(createPendingForm.date).toISOString(),
            matchStatus: 'PLAYED',
        });
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="club-page-hero p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{tr('Historial de partidos', 'Partiden historia')}</h1>
                        <p className="club-page-hero-subtitle">{tr('Consulta partidos y aplica filtros por jugadores, fechas, temporada y grupo.', 'Partidak kontsultatu eta iragazi jokalarien, daten, denboraldien eta taldeen arabera.')}</p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => {
                                setCreatePendingError('');
                                setShowCreatePendingModal(true);
                            }}
                            className="club-btn-primary px-4 py-2 text-sm"
                        >
                            {tr('+ Registrar partido (admin)', '+ Partida erregistratu (admin)')}
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 md:p-6">
                {!isAdmin && (
                    <div className="mb-4">
                        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                            <input
                                type="checkbox"
                                checked={onlyMyMatches}
                                onChange={(e) => {
                                    setOnlyMyMatches(e.target.checked);
                                    setSearchTerm('');
                                    setPlayerName1('');
                                    setPlayerName2('');
                                    resetToPageOne();
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                            />
                            {tr('Mis partidos', 'Nire partidak')}
                        </label>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4">
                    {effectiveOnlyMyMatches ? (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                {tr('Buscar oponente', 'Aurkaria bilatu')}
                            </label>
                            <input
                                type="text"
                                placeholder={tr('Nombre del oponente...', 'Aurkariaren izena...')}
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); resetToPageOne(); }}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    {tr('Jugador 1', 'Jokalaria 1')}
                                </label>
                                <input
                                    type="text"
                                    placeholder={tr('Nombre del jugador...', 'Jokalariaren izena...')}
                                    value={playerName1}
                                    onChange={(e) => { setPlayerName1(e.target.value); resetToPageOne(); }}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    {tr('Jugador 2', 'Jokalaria 2')}
                                </label>
                                <input
                                    type="text"
                                    placeholder={tr('Nombre del jugador...', 'Jokalariaren izena...')}
                                    value={playerName2}
                                    onChange={(e) => { setPlayerName2(e.target.value); resetToPageOne(); }}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
                        </>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            {tr('Temporada', 'Denboraldia')}
                        </label>
                        <select
                            value={selectedSeason}
                            onChange={(e) => {
                                setSelectedSeason(e.target.value);
                                setSelectedGroup(''); // Reset group when season changes
                                resetToPageOne();
                            }}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="">{tr('Todas las temporadas', 'Denboraldi guztiak')}</option>
                            {seasons.map((season: any) => (
                                <option key={season.id} value={season.id}>{season.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            {tr('Grupo', 'Taldea')}
                        </label>
                        <select
                            value={selectedGroup}
                            onChange={(e) => { setSelectedGroup(e.target.value); resetToPageOne(); }}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            disabled={!selectedSeason && allGroups.length > 0}
                        >
                            <option value="">{tr('Todos los grupos', 'Talde guztiak')}</option>
                            {availableGroups.map((group: any) => (
                                <option key={group.id} value={group.id}>{group.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            {tr('Desde', 'Noiztik')}
                        </label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); resetToPageOne(); }}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            {tr('Hasta', 'Noiz arte')}
                        </label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => { setDateTo(e.target.value); resetToPageOne(); }}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                </div>
                {(searchTerm || playerName1 || playerName2 || dateFrom || dateTo || selectedSeason || selectedGroup || (!isAdmin && !onlyMyMatches)) && (
                    <button
                        onClick={() => {
                            setOnlyMyMatches(true);
                            setSearchTerm('');
                            setPlayerName1('');
                            setPlayerName2('');
                            setDateFrom('');
                            setDateTo('');
                            setSelectedSeason('');
                            setSelectedGroup('');
                            resetToPageOne();
                        }}
                        className="mt-4 px-4 py-2 text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                    >
                        {tr('Limpiar filtros', 'Iragazkiak garbitu')}
                    </button>
                )}
            </div>

            {/* Match List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 md:p-12 text-center"><Loader /></div>
                ) : filteredMatches.length === 0 ? (
                    <div className="p-8 md:p-12 text-center text-slate-600 dark:text-slate-400">
                        {matches.length === 0 ? tr('No hay partidos registrados todavia', 'Oraindik ez dago partida erregistraturik') : tr('No se encontraron partidos con los filtros aplicados', 'Ez da partidarik aurkitu aplikatutako iragazkiekin')}
                    </div>
                ) : (
                    <>
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {paginatedMatches.map((match) => {
                                const isPlayer1 = match.player1Id === user?.player?.id;
                                const isCurrentPlayerInMatch = match.player1Id === user?.player?.id || match.player2Id === user?.player?.id;
                                const opponent = isPlayer1 ? match.player2 : match.player1;
                                const myGames = isPlayer1 ? match.gamesP1 : match.gamesP2;
                                const opponentGames = isPlayer1 ? match.gamesP2 : match.gamesP1;
                                const won = match.winnerId === user?.player?.id;
                                const showPersonalView = !isAdmin && isCurrentPlayerInMatch;
                                const isCurrentSeasonMatch = match.group?.season?.isActive === true;
                                const canEdit = isAdmin || (isCurrentPlayerInMatch && isCurrentSeasonMatch);
                                const canDelete = isAdmin;
                                const iAmInjuredInThisMatch =
                                    match.matchStatus === 'INJURY' &&
                                    (match.winnerId
                                        ? match.winnerId !== user?.player?.id
                                        : (() => {
                                            const groupMap = legacyInjuryExposureByGroup.get(match.groupId);
                                            const p1Count = groupMap?.get(match.player1Id) ?? 0;
                                            const p2Count = groupMap?.get(match.player2Id) ?? 0;
                                            const inferredInjuredPlayerId =
                                                p1Count === p2Count
                                                    ? match.player1Id
                                                    : p1Count > p2Count
                                                        ? match.player1Id
                                                        : match.player2Id;
                                            return inferredInjuredPlayerId === user?.player?.id;
                                        })());

                                return (
                                    <div key={match.id} className="p-3 md:p-6 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3 md:space-x-4 min-w-0">
                                                <div className="text-3xl md:text-4xl shrink-0">
                                                    {
                                                    match.matchStatus === 'INJURY'
                                                        ? String.fromCodePoint(0x1F915)
                                                        : match.matchStatus === 'CANCELLED'
                                                            ? String.fromCodePoint(0x1F6AB)
                                                            : showPersonalView
                                                                ? (won ? String.fromCodePoint(0x2705) : String.fromCodePoint(0x274C))
                                                                : String.fromCodePoint(0x1F3BE)
                                                }
                                                </div>
                                                <div className="min-w-0">
                                                    {!isAdmin && (
                                                        <div className="flex items-center space-x-2 min-w-0">
                                                            {isCurrentPlayerInMatch ? (
                                                                <span className="font-medium text-slate-900 dark:text-white truncate">vs {opponent.name}</span>
                                                            ) : (
                                                                <span className="font-medium text-slate-900 dark:text-white truncate">
                                                                    <span className={match.winnerId === match.player1Id ? 'text-green-600 dark:text-green-400 font-semibold' : ''}>
                                                                        {match.player1?.name}
                                                                    </span>
                                                                    <span> vs </span>
                                                                    <span className={match.winnerId === match.player2Id ? 'text-green-600 dark:text-green-400 font-semibold' : ''}>
                                                                        {match.player2?.name}
                                                                    </span>
                                                                </span>
                                                            )}
                                                            {isCurrentPlayerInMatch && opponent.nickname && (
                                                                <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400 truncate">"{opponent.nickname}"</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-0.5 md:mt-1">
                                                        {match.group.name} - {formatDate(new Date(match.date))}
                                                    </p>
                                                    {match.group.season && (
                                                        <p className="text-[11px] md:text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                                            {match.group.season.name}
                                                        </p>
                                                    )}
                                                    {match.matchStatus !== 'PLAYED' && (
                                                        <p className="text-sm text-orange-600 dark:text-orange-400 mt-1 uppercase font-medium">
                                                            {match.matchStatus === 'INJURY'
                                                                ? (isCurrentPlayerInMatch
                                                                    ? (iAmInjuredInThisMatch ? tr('LESION', 'LESIOA') : tr('RIVAL LESIONADO', 'AURKARIA LESIONATUTA'))
                                                                    : tr('LESION', 'LESIOA'))
                                                                : tr('CANCELADO', 'EZEZTATUA')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2 md:gap-3 shrink-0">
                                                {/* Pending Match Indicator */}
                                                {isAdmin && (match.gamesP1 === null || match.gamesP2 === null) && (
                                                    <div className="text-right">
                                                        <div className="px-3 py-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                                            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{String.fromCodePoint(0x23F3)} {tr('PENDIENTE', 'PENDIENTEA')}</p>
                                                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{tr('Sin resultado registrado', 'Emaitza erregistratu gabe')}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {match.matchStatus === 'PLAYED' && (
                                                    <div className="text-right">
                                                        <div className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-none">
                                                            {showPersonalView ? `${myGames} - ${opponentGames}` : `${match.gamesP1} - ${match.gamesP2}`}
                                                        </div>
                                                        {isAdmin ? (
                                                            // Admin view: show colored participant names
                                                            <div className="flex items-center gap-2 mt-2 text-xs">
                                                                <span className={`px-2 py-1 rounded font-medium ${match.winnerId === match.player1Id ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                                                    {match.player1.name}
                                                                </span>
                                                                <span className="text-slate-600 dark:text-slate-400">vs</span>
                                                                <span className={`px-2 py-1 rounded font-medium ${match.winnerId === match.player2Id ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                                                    {match.player2.name}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {showPersonalView ? (
                                                                    <p className={`text-xs md:text-sm font-semibold ${won ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                        {won ? tr('Victoria', 'Garaipena') : tr('Derrota', 'Porrota')}
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400">
                                                                        {tr('Resultado', 'Emaitza')}
                                                                    </p>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => setEditingMatch(match)}
                                                            className="p-2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors rounded-full hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                                            title={tr('Editar resultado', 'Emaitza editatu')}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDelete(match.id)}
                                                            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            title={tr('Eliminar partido', 'Partida ezabatu')}
                                                            disabled={deleteMutation.isPending}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-3 md:p-6 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div className="text-xs md:text-sm text-slate-600 dark:text-slate-400 text-center md:text-left">
                                    {tr('Mostrando', 'Erakusten')} {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredMatches.length)} {tr('de', ' / ')} {filteredMatches.length} {tr('partidos', 'partida')}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 md:px-4 py-2 text-xs md:text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {tr('Anterior', 'Aurrekoa')}
                                    </button>
                                    <span className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                                        {tr('Pagina', 'Orria')} {currentPage} {tr('de', '/')} {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 md:px-4 py-2 text-xs md:text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {tr('Siguiente', 'Hurrengoa')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal Crear Partido Pendiente (Admin) */}
            {isAdmin && showCreatePendingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{tr('Crear partido pendiente', 'Pendiente partida sortu')}</h3>
                            <button
                                onClick={() => {
                                    if (!createPendingMatchMutation.isPending) {
                                        setShowCreatePendingModal(false);
                                        setCreatePendingError('');
                                        setCreatePendingForm({
                                            groupId: '',
                                            player1Id: '',
                                            player2Id: '',
                                            gamesP1: 0,
                                            gamesP2: 0,
                                            date: new Date().toISOString().split('T')[0],
                                        });
                                    }
                                }}
                                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            >{tr('X', 'X')}</button>
                        </div>

                        <form onSubmit={handleCreatePendingMatch} className="p-6 space-y-4">
                            {createPendingError && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                                    {createPendingError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{tr('Grupo', 'Taldea')}</label>
                                <select
                                    value={createPendingForm.groupId}
                                    onChange={(e) => {
                                        setCreatePendingForm({
                                            groupId: e.target.value,
                                            player1Id: '',
                                            player2Id: '',
                                            gamesP1: 0,
                                            gamesP2: 0,
                                            date: createPendingForm.date,
                                        });
                                        setCreatePendingError('');
                                    }}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                >
                                    <option value="">{tr('Selecciona un grupo', 'Aukeratu talde bat')}</option>
                                    {groupsWithRemainingMatches.map((group: any) => (
                                        <option key={group.id} value={group.id}>{group.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{tr('Contrincante 1', 'Aurkaria 1')}</label>
                                    <select
                                        value={createPendingForm.player1Id}
                                        onChange={(e) => {
                                            setCreatePendingForm(prev => ({ ...prev, player1Id: e.target.value, player2Id: '' }));
                                            setCreatePendingError('');
                                        }}
                                        disabled={!createPendingForm.groupId}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
                                    >
                                        <option value="">{tr('Selecciona jugador', 'Aukeratu jokalaria')}</option>
                                        {playersWithRemainingMatches.map((player: any) => (
                                            <option key={player.id} value={player.id}>{player.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{tr('Contrincante 2', 'Aurkaria 2')}</label>
                                    <select
                                        value={createPendingForm.player2Id}
                                        onChange={(e) => {
                                            setCreatePendingForm(prev => ({ ...prev, player2Id: e.target.value }));
                                            setCreatePendingError('');
                                        }}
                                        disabled={!createPendingForm.groupId}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
                                    >
                                        <option value="">{tr('Selecciona jugador', 'Aukeratu jokalaria')}</option>
                                        {remainingOpponentsForPlayer1.map((player: any) => (
                                            <option key={player.id} value={player.id}>{player.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{tr('Juegos P1', 'Jokoak P1')}</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="3"
                                        value={createPendingForm.gamesP1}
                                        onChange={(e) => {
                                            setCreatePendingForm(prev => ({ ...prev, gamesP1: parseInt(e.target.value) || 0 }));
                                            setCreatePendingError('');
                                        }}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{tr('Juegos P2', 'Jokoak P2')}</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="3"
                                        value={createPendingForm.gamesP2}
                                        onChange={(e) => {
                                            setCreatePendingForm(prev => ({ ...prev, gamesP2: parseInt(e.target.value) || 0 }));
                                            setCreatePendingError('');
                                        }}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{tr('Fecha', 'Data')}</label>
                                    <input
                                        type="date"
                                        value={createPendingForm.date}
                                        onChange={(e) => {
                                            setCreatePendingForm(prev => ({ ...prev, date: e.target.value }));
                                            setCreatePendingError('');
                                        }}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!createPendingMatchMutation.isPending) {
                                            setShowCreatePendingModal(false);
                                            setCreatePendingError('');
                                            setCreatePendingForm({
                                                groupId: '',
                                                player1Id: '',
                                                player2Id: '',
                                                gamesP1: 0,
                                                gamesP2: 0,
                                                date: new Date().toISOString().split('T')[0],
                                            });
                                        }
                                    }}
                                    className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors"
                                >
                                    {tr('Cancelar', 'Utzi')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={createPendingMatchMutation.isPending}
                                    className="px-4 py-2 club-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {createPendingMatchMutation.isPending ? tr('Registrando...', 'Erregistratzen...') : tr('Registrar resultado', 'Emaitza erregistratu')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Edicion */}
            <EditMatchModal
                match={editingMatch}
                isOpen={!!editingMatch}
                onClose={() => {
                    setEditingMatch(null);
                    refetchMatches();
                }}
            />
        </div>
    );
}
