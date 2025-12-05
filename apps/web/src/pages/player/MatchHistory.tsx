import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import EditMatchModal from '../../components/EditMatchModal';

export default function MatchHistory() {
    const { user, isAdmin } = useAuth();
    const queryClient = useQueryClient();
    const [editingMatch, setEditingMatch] = useState<any>(null);

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
        }
    });

    // Fetch all groups
    const { data: allGroups = [] } = useQuery({
        queryKey: ['groups'],
        queryFn: async () => {
            const { data } = await api.get('/groups');
            return data;
        }
    });

    // Filter groups by selected season
    const availableGroups = useMemo(() => {
        if (!selectedSeason) return allGroups;
        return allGroups.filter((g: any) => g.seasonId === selectedSeason);
    }, [allGroups, selectedSeason]);


    const { data: matches = [], isLoading } = useQuery({
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
            const isPlayer1 = match.player1Id === user?.player?.id;
            const opponent = isPlayer1 ? match.player2 : match.player1;

            // Search filter
            if (searchTerm && !opponent.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }

            // Date range filter
            const matchDate = new Date(match.date);
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
    }, [matches, searchTerm, dateFrom, dateTo, selectedSeason, selectedGroup, user?.player?.id]);

    const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);
    const paginatedMatches = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredMatches.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredMatches, currentPage]);

    // Reset to page 1 when filters change
    const resetToPageOne = () => setCurrentPage(1);

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
                <h1 className="text-3xl font-bold mb-2">Historial de Partidos</h1>
                <p className="text-indigo-100">Tu registro completo de partidos</p>
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
                    <div className="p-12 text-center text-slate-600 dark:text-slate-400">Cargando...</div>
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

            {/* Modal de Edición */}
            <EditMatchModal
                match={editingMatch}
                isOpen={!!editingMatch}
                onClose={() => setEditingMatch(null)}
            />
        </div>
    );
}
