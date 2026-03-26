import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import EditMatchModal from '../../components/EditMatchModal';
import Loader from '../../components/Loader';

export default function MatchHistory() {
    const { user, isAdmin } = useAuth();
    const queryClient = useQueryClient();
    const [editingMatch, setEditingMatch] = useState<any>(null);
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
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedSeason, setSelectedSeason] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

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


    const { data: matches = [], isLoading, refetch: refetchMatches } = useQuery({
        queryKey: ['matches', isAdmin ? 'all' : user?.player?.id],
        queryFn: async () => {
            // Admins see all matches, players see only their own
            const endpoint = isAdmin
                ? '/matches'
                : `/matches?playerId=${user?.player?.id}`;
            const { data } = await api.get(endpoint);
            return data;
        },
        enabled: isAdmin || !!user?.player?.id,
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
            alert('Partido registrado correctamente');
        },
        onError: (error: any) => {
            const message = error?.response?.data?.error || error?.message || 'No se pudo crear el partido pendiente';
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
            alert('Partido eliminado correctamente');
        },
        onError: (error: any) => {
            console.error('Error eliminando partido:', error);
            alert(`Error al eliminar el partido: ${error.response?.data?.error || error.message}`);
        },
    });

    const handleDelete = async (matchId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este partido?')) {
            await deleteMutation.mutateAsync(matchId);
        }
    };

    // Filtered and paginated matches
    const filteredMatches = useMemo(() => {
        return matches.filter((match: any) => {
            // Exclude scheduled matches without results (unless admin viewing all)
            if (!isAdmin && (match.gamesP1 === null || match.gamesP2 === null)) {
                return false;
            }

            // For non-admins, only show their own matches
            if (!isAdmin) {
                const isPlayer1 = match.player1Id === user?.player?.id;
                const opponent = isPlayer1 ? match.player2 : match.player1;

                // Search filter
                if (searchTerm && !opponent.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                    return false;
                }
            } else {
                // For admins, search in player names
                if (searchTerm) {
                    const p1Match = match.player1?.name?.toLowerCase().includes(searchTerm.toLowerCase());
                    const p2Match = match.player2?.name?.toLowerCase().includes(searchTerm.toLowerCase());
                    if (!p1Match && !p2Match) return false;
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
    }, [matches, searchTerm, dateFrom, dateTo, selectedSeason, selectedGroup, user?.player?.id, isAdmin]);

    const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);
    const paginatedMatches = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredMatches.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredMatches, currentPage]);

    // Reset to page 1 when filters change
    const resetToPageOne = () => setCurrentPage(1);

    const selectedGroupMatches = useMemo(() => {
        if (!createPendingForm.groupId) return [] as any[];
        return matches.filter((match: any) => match.groupId === createPendingForm.groupId);
    }, [matches, createPendingForm.groupId]);

    const groupsWithRemainingMatches = useMemo(() => {
        return allGroups.filter((group: any) => {
            const groupPlayersData = group.groupPlayers || [];
            const playerIds = groupPlayersData
                .map((gp: any) => gp.playerId || gp.player?.id)
                .filter(Boolean);

            if (playerIds.length < 2) return false;

            const groupPlayedMatches = matches.filter((match: any) => {
                if (match.groupId !== group.id) return false;
                return match.gamesP1 !== null && match.gamesP2 !== null;
            });

            const hasPlayedPair = (aId: string, bId: string) => {
                return groupPlayedMatches.some((match: any) => (
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
        return selectedGroupMatches.some((match: any) => {
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
            setCreatePendingError('Debes seleccionar grupo y los dos contrincantes');
            return;
        }

        if (createPendingForm.player1Id === createPendingForm.player2Id) {
            setCreatePendingError('Los contrincantes deben ser diferentes');
            return;
        }

        const validScore =
            (createPendingForm.gamesP1 === 3 && createPendingForm.gamesP2 >= 0 && createPendingForm.gamesP2 <= 2) ||
            (createPendingForm.gamesP2 === 3 && createPendingForm.gamesP1 >= 0 && createPendingForm.gamesP1 <= 2);

        if (!validScore) {
            setCreatePendingError('Resultado inválido: formato permitido 3-0, 3-1, 3-2 (o inverso).');
            return;
        }

        if (hasPlayedResultBetween(createPendingForm.player1Id, createPendingForm.player2Id)) {
            setCreatePendingError('Esta pareja ya no tiene partidos restantes en este grupo');
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
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Historial de Partidos</h1>
                        <p className="text-indigo-100">Tu registro completo de partidos</p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => {
                                setCreatePendingError('');
                                setShowCreatePendingModal(true);
                            }}
                            className="px-4 py-2 rounded-lg bg-white text-indigo-700 font-semibold hover:bg-indigo-50 transition-colors"
                        >
                            + Registrar partido (admin)
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Buscar oponente
                        </label>
                        <input
                            type="text"
                            placeholder="Nombre del oponente..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); resetToPageOne(); }}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Temporada
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
                            <option value="">Todas las temporadas</option>
                            {seasons.map((season: any) => (
                                <option key={season.id} value={season.id}>{season.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Grupo
                        </label>
                        <select
                            value={selectedGroup}
                            onChange={(e) => { setSelectedGroup(e.target.value); resetToPageOne(); }}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            disabled={!selectedSeason && allGroups.length > 0}
                        >
                            <option value="">Todos los grupos</option>
                            {availableGroups.map((group: any) => (
                                <option key={group.id} value={group.id}>{group.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Desde
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
                            Hasta
                        </label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => { setDateTo(e.target.value); resetToPageOne(); }}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                </div>
                {(searchTerm || dateFrom || dateTo || selectedSeason || selectedGroup) && (
                    <button
                        onClick={() => { setSearchTerm(''); setDateFrom(''); setDateTo(''); setSelectedSeason(''); setSelectedGroup(''); resetToPageOne(); }}
                        className="mt-4 px-4 py-2 text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            {/* Match List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center"><Loader /></div>
                ) : filteredMatches.length === 0 ? (
                    <div className="p-12 text-center text-slate-600 dark:text-slate-400">
                        {matches.length === 0 ? 'No hay partidos registrados todavía' : 'No se encontraron partidos con los filtros aplicados'}
                    </div>
                ) : (
                    <>
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {paginatedMatches.map((match: any) => {
                                const isPlayer1 = match.player1Id === user?.player?.id;
                                const opponent = isPlayer1 ? match.player2 : match.player1;
                                const myGames = isPlayer1 ? match.gamesP1 : match.gamesP2;
                                const opponentGames = isPlayer1 ? match.gamesP2 : match.gamesP1;
                                const won = match.winnerId === user?.player?.id;
                                const canEdit = isAdmin || match.player1Id === user?.player?.id || match.player2Id === user?.player?.id;
                                const canDelete = isAdmin || match.groupId === user?.player?.currentGroup?.id;

                                return (
                                    <div key={match.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="text-4xl">
                                                    {match.matchStatus === 'INJURY' ? '🤕' : match.matchStatus === 'CANCELLED' ? '🚫' : isAdmin ? '🎾' : won ? '✅' : '❌'}
                                                </div>
                                                <div>
                                                    {!isAdmin && (
                                                        <div className="flex items-center space-x-2">
                                                            <span className="font-medium text-slate-900 dark:text-white">vs {opponent.name}</span>
                                                            {opponent.nickname && (
                                                                <span className="text-sm text-slate-500 dark:text-slate-400">"{opponent.nickname}"</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                        {match.group.name} • {new Date(match.date).toLocaleDateString('es-ES')}
                                                    </p>
                                                    {match.group.season && (
                                                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                                                            {match.group.season.name}
                                                        </p>
                                                    )}
                                                    {match.matchStatus !== 'PLAYED' && (
                                                        <p className="text-sm text-orange-600 dark:text-orange-400 mt-1 uppercase font-medium">
                                                            {match.matchStatus === 'INJURY' ? 'LESIÓN' : 'CANCELADO'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-3">
                                                {/* Pending Match Indicator */}
                                                {isAdmin && (match.gamesP1 === null || match.gamesP2 === null) && (
                                                    <div className="text-right">
                                                        <div className="px-3 py-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                                            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">⏳ PENDIENTE</p>
                                                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Sin resultado registrado</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {match.matchStatus === 'PLAYED' && (
                                                    <div className="text-right">
                                                        <div className="text-3xl font-bold text-slate-900 dark:text-white">
                                                            {myGames} - {opponentGames}
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
                                                            // Player view: show victory/defeat labels
                                                            <p className={`text-sm font-medium ${won ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                {won ? 'Victoria' : 'Derrota'}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => setEditingMatch(match)}
                                                            className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                            title="Editar resultado"
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
                                                            title="Eliminar partido"
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
                            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredMatches.length)} de {filteredMatches.length} partidos
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Anterior
                                    </button>
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        Página {currentPage} de {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Siguiente
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
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Crear partido pendiente</h3>
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
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreatePendingMatch} className="p-6 space-y-4">
                            {createPendingError && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                                    {createPendingError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Grupo</label>
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
                                    <option value="">Selecciona un grupo</option>
                                    {groupsWithRemainingMatches.map((group: any) => (
                                        <option key={group.id} value={group.id}>{group.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Contrincante 1</label>
                                    <select
                                        value={createPendingForm.player1Id}
                                        onChange={(e) => {
                                            setCreatePendingForm(prev => ({ ...prev, player1Id: e.target.value, player2Id: '' }));
                                            setCreatePendingError('');
                                        }}
                                        disabled={!createPendingForm.groupId}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
                                    >
                                        <option value="">Selecciona jugador</option>
                                        {playersWithRemainingMatches.map((player: any) => (
                                            <option key={player.id} value={player.id}>{player.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Contrincante 2</label>
                                    <select
                                        value={createPendingForm.player2Id}
                                        onChange={(e) => {
                                            setCreatePendingForm(prev => ({ ...prev, player2Id: e.target.value }));
                                            setCreatePendingError('');
                                        }}
                                        disabled={!createPendingForm.groupId}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
                                    >
                                        <option value="">Selecciona jugador</option>
                                        {remainingOpponentsForPlayer1.map((player: any) => (
                                            <option key={player.id} value={player.id}>{player.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Juegos P1</label>
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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Juegos P2</label>
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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fecha</label>
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
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={createPendingMatchMutation.isPending}
                                    className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    {createPendingMatchMutation.isPending ? 'Registrando...' : 'Registrar resultado'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Edición */}
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
