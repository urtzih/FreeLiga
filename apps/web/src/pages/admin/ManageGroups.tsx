import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAdminQuery } from '../../hooks/useAdminQuery';

export default function ManageGroups() {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();

    // UI state
    const [showForm, setShowForm] = useState(false);
    const [editingGroup, setEditingGroup] = useState<any>(null);
    const [whatsappUrl, setWhatsappUrl] = useState('');
    const [formData, setFormData] = useState({ name: '', seasonId: '' });
    const [filterSeason, setFilterSeason] = useState(searchParams.get('season') || '');
    const [page, setPage] = useState(1);
    const perPage = 12;
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [selectedPlayerId, setSelectedPlayerId] = useState('');
    const [showSwapModal, setShowSwapModal] = useState(false);
    const [swapPlayer1, setSwapPlayer1] = useState({ playerId: '', groupId: '' });
    const [swapPlayer2, setSwapPlayer2] = useState({ playerId: '', groupId: '' });

    // Sincronizar filtro con URL
    useEffect(() => {
        const seasonParam = searchParams.get('season');
        if (seasonParam && seasonParam !== filterSeason) {
            setFilterSeason(seasonParam);
            setPage(1);
        }
    }, [searchParams]);

    // Actualizar URL cuando cambia el filtro
    const handleFilterChange = (seasonId: string) => {
        setFilterSeason(seasonId);
        setPage(1);
        if (seasonId) {
            setSearchParams({ season: seasonId });
        } else {
            setSearchParams({});
        }
    };

    // Data fetching
    const { data: adminStats } = useAdminQuery({
        queryKey: ['adminStatsForUsers'],
        queryFn: async () => {
            const { data } = await api.get('/admin/stats');
            return data;
        },
    });

    const { data: groups = [] } = useAdminQuery({
        queryKey: ['groups'],
        queryFn: async () => {
            const { data } = await api.get('/groups');
            return data;
        },
    });

    // Players to add (fetch users)
    const { data: usersData = { users: [] } } = useAdminQuery({
        queryKey: ['users-for-groups'],
        queryFn: async () => {
            const { data } = await api.get('/users?page=1&limit=500');
            return data;
        }
    });

    const { data: seasons = [] } = useAdminQuery({
        queryKey: ['seasons'],
        queryFn: async () => {
            const { data } = await api.get('/seasons');
            return data;
        },
    });

    // Filtering & pagination
    const filteredBySeason = filterSeason
        ? groups.filter((g: any) => g.season?.id === filterSeason)
        : groups;
    const paginatedGroups = filteredBySeason.slice((page - 1) * perPage, page * perPage);
    const totalPages = Math.ceil(filteredBySeason.length / perPage);

    const candidatePlayers = (usersData.users || []).filter((u: any) => {
        if (!u.player) return false;
        // sin grupo o inactivo o no asignado al grupo expandido
        return !u.player.currentGroup || u.isActive === false;
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            await api.post('/groups', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            setShowForm(false);
            setFormData({ name: '', seasonId: '' });
        },
    });

    const updateWhatsappMutation = useMutation({
        mutationFn: async ({ groupId, whatsappUrl }: { groupId: string; whatsappUrl: string }) => {
            await api.put(`/groups/${groupId}`, { whatsappUrl });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            setEditingGroup(null);
            setWhatsappUrl('');
            alert('Link de WhatsApp actualizado correctamente');
        },
        onError: (error: any) => {
            alert(`Error: ${error.response?.data?.error || error.message}`);
        },
    });

    const addPlayerMutation = useMutation({
        mutationFn: async ({ groupId, playerId }: { groupId: string; playerId: string }) => {
            await api.post(`/groups/${groupId}/players`, { playerId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            setShowAddModal(false);
            setSelectedGroupId('');
            setSelectedPlayerId('');
        },
        onError: (error: any) => {
            alert(`Error al añadir jugador: ${error.response?.data?.error || error.message}`);
        },
    });

    const removePlayerMutation = useMutation({
        mutationFn: async ({ groupId, playerId }: { groupId: string; playerId: string }) => {
            await api.delete(`/groups/${groupId}/players/${playerId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
        onError: (error: any) => {
            alert(`Error al quitar jugador: ${error.response?.data?.error || error.message}`);
        },
    });

    const swapPlayersMutation = useMutation({
        mutationFn: async (data: { player1Id: string; group1Id: string; player2Id: string; group2Id: string }) => {
            await api.post('/groups/swap-players', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
            setShowSwapModal(false);
            setSwapPlayer1({ playerId: '', groupId: '' });
            setSwapPlayer2({ playerId: '', groupId: '' });
            alert('Jugadores intercambiados correctamente');
        },
        onError: (error: any) => {
            alert(`Error al intercambiar jugadores: ${error.response?.data?.error || error.message}`);
        },
    });

    // Handlers
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const handleEditWhatsapp = (group: any) => {
        setEditingGroup(group);
        setWhatsappUrl(group.whatsappUrl || '');
    };

    const handleSaveWhatsapp = () => {
        if (editingGroup) {
            updateWhatsappMutation.mutate({ groupId: editingGroup.id, whatsappUrl });
        }
    };

    const handleRemovePlayer = (groupId: string, playerId: string, playerName: string) => {
        if (window.confirm(`¿Estás seguro de que quieres quitar a ${playerName} del grupo?`)) {
            removePlayerMutation.mutate({ groupId, playerId });
        }
    };

    const handleSwapPlayers = () => {
        if (!swapPlayer1.playerId || !swapPlayer1.groupId || !swapPlayer2.playerId || !swapPlayer2.groupId) {
            alert('Por favor selecciona ambos jugadores para intercambiar');
            return;
        }
        if (swapPlayer1.groupId === swapPlayer2.groupId) {
            alert('No puedes intercambiar jugadores del mismo grupo');
            return;
        }
        swapPlayersMutation.mutate({
            player1Id: swapPlayer1.playerId,
            group1Id: swapPlayer1.groupId,
            player2Id: swapPlayer2.playerId,
            group2Id: swapPlayer2.groupId,
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gestionar Grupos</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowSwapModal(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        title="Intercambiar jugadores entre grupos"
                    >
                        ⇄ Intercambiar
                    </button>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        {showForm ? 'Cancelar' : '+ Nuevo Grupo'}
                    </button>
                </div>
            </div>

            {/* Add player modal */}
            {showAddModal && selectedGroupId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-4 w-full max-w-md">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Añadir jugador al grupo</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-slate-700">✕</button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Selecciona jugador</label>
                                <select
                                    className="w-full border rounded px-2 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    value={selectedPlayerId ?? ''}
                                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                                >
                                    <option value="">-- Elegir --</option>
                                    {candidatePlayers.map((player: any) => (
                                        <option 
                                            key={player.player.id} 
                                            value={player.player.id}
                                            style={{
                                                color: player.isActive === false ? '#ef4444' : '#10b981',
                                                fontWeight: player.isActive === false ? 'normal' : '500'
                                            }}
                                        >
                                            {player.isActive === false ? '✗ ' : '✓ '}{player.player.name} {!player.player.currentGroup ? '(Sin grupo)' : ''}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">✓ Activo | ✗ Inactivo</p>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="px-3 py-1 rounded border border-slate-300 dark:border-slate-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={!selectedPlayerId || addPlayerMutation.isPending}
                                    onClick={() => {
                                        if (!selectedGroupId || !selectedPlayerId) return;
                                        addPlayerMutation.mutate({ groupId: selectedGroupId, playerId: selectedPlayerId });
                                    }}
                                    className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                    {addPlayerMutation.isPending ? 'Añadiendo...' : 'Añadir'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Season filter */}
            <div className="mt-4 flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Filtrar por Temporada:</label>
                <select
                    value={filterSeason}
                    onChange={e => handleFilterChange(e.target.value)}
                    className="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                    <option value="">Todas</option>
                    {seasons.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>

            {/* Create group form */}
            {showForm && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Crear Grupo</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre del Grupo</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                placeholder="ej. Grupo A"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Temporada</label>
                            <select
                                required
                                value={formData.seasonId}
                                onChange={e => setFormData({ ...formData, seasonId: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            >
                                <option value="">Selecciona una temporada...</option>
                                {seasons.map((season: any) => (
                                    <option key={season.id} value={season.id}>{season.name}</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            Crear Grupo
                        </button>
                    </form>
                </div>
            )}

            {/* Groups grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedGroups.map((group: any) => (
                    <div key={group.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 relative">
                        {adminStats?.activeSeason?.id === group.season?.id && (
                            <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded">Activo</span>
                        )}
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{group.name}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{group.season?.name}</p>
                        <div 
                            onClick={() => group.whatsappUrl && handleEditWhatsapp(group)}
                            className={`text-xs mb-4 flex items-center gap-1 ${
                                group.whatsappUrl 
                                    ? 'text-green-600 dark:text-green-400 cursor-pointer font-medium group/whatsapp' 
                                    : 'text-slate-500 dark:text-slate-500'
                            }`}
                        >
                            <span>{group.whatsappUrl ? '✅ WhatsApp configurado' : '⚠️ Sin link de WhatsApp'}</span>
                            {group.whatsappUrl && (
                                <span className="opacity-0 group-hover/whatsapp:opacity-100 transition-opacity">✎</span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400">{group._count?.groupPlayers || 0} jugadores</span>
                                <Link to={`/groups/${group.id}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium">
                                    Ver →
                                </Link>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setExpandedGroup(expandedGroup === group.id ? null : group.id);
                                    }}
                                    className={`w-full px-3 py-2 text-xs rounded-lg font-semibold transition-all ${
                                        expandedGroup === group.id
                                            ? 'bg-blue-600 dark:bg-blue-700 text-white'
                                            : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                                    }`}
                                >
                                    {expandedGroup === group.id ? '▼ Ocultar clasificación' : '▶ Ver clasificación'}
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedGroupId(group.id);
                                        setShowAddModal(true);
                                        setSelectedPlayerId(candidatePlayers[0]?.player?.id || '');
                                    }}
                                    className="px-3 py-2 text-xs rounded-lg font-semibold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                                    disabled={!candidatePlayers.length}
                                    title={candidatePlayers.length ? 'Añadir jugador inactivo o sin grupo' : 'No hay jugadores disponibles'}
                                >
                                    + Player
                                </button>
                            </div>
                            {!group.whatsappUrl && (
                                <button
                                    onClick={() => handleEditWhatsapp(group)}
                                    className="w-full px-3 py-2 text-sm rounded-lg transition-colors bg-green-600 text-white hover:bg-green-700"
                                >
                                    Añadir WhatsApp
                                </button>
                            )}
                        </div>
                        
                        {/* Clasificación expandible */}
                        {expandedGroup === group.id && group.groupPlayers && (
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Clasificación</h4>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {[...group.groupPlayers]
                                        .sort((a: any, b: any) => a.rankingPosition - b.rankingPosition)
                                        .map((gp: any) => (
                                            <div key={gp.playerId} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                                                <div className="flex-1">
                                                    <span className="font-medium text-slate-900 dark:text-white">#{gp.rankingPosition}</span>
                                                    <span className="text-slate-600 dark:text-slate-400 ml-2">{gp.player.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-xs px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                                        {gp.rankingPosition <= 2 ? '📈 Ascenso' : gp.rankingPosition > group.groupPlayers.length - 2 ? '📉 Descenso' : 'Mantiene'}
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemovePlayer(group.id, gp.playerId, gp.player.name)}
                                                        className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                                                        title="Quitar del grupo"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 space-x-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
                    >Anterior</button>
                    <span className="text-sm">Página {page} de {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
                    >Siguiente</button>
                </div>
            )}

            {/* Swap Players Modal */}
            {showSwapModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 w-full max-w-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">⇄ Intercambiar Jugadores entre Grupos</h2>
                            <button onClick={() => setShowSwapModal(false)} className="text-slate-500 hover:text-slate-700">✕</button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border border-slate-300 dark:border-slate-700 rounded-lg p-4">
                                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Jugador 1</h3>
                                    <div className="space-y-2">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Grupo</label>
                                            <select
                                                className="w-full border rounded px-2 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                value={swapPlayer1.groupId}
                                                onChange={(e) => setSwapPlayer1({ ...swapPlayer1, groupId: e.target.value, playerId: '' })}
                                            >
                                                <option value="">-- Seleccionar Grupo --</option>
                                                {filteredBySeason.map((g: any) => (
                                                    <option key={g.id} value={g.id}>{g.name} ({g._count?.groupPlayers || 0} jugadores)</option>
                                                ))}
                                            </select>
                                        </div>
                                        {swapPlayer1.groupId && (
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jugador</label>
                                                <select
                                                    className="w-full border rounded px-2 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                    value={swapPlayer1.playerId}
                                                    onChange={(e) => setSwapPlayer1({ ...swapPlayer1, playerId: e.target.value })}
                                                >
                                                    <option value="">-- Seleccionar Jugador --</option>
                                                    {groups.find((g: any) => g.id === swapPlayer1.groupId)?.groupPlayers?.map((gp: any) => (
                                                        <option key={gp.playerId} value={gp.playerId}>
                                                            #{gp.rankingPosition} - {gp.player.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="border border-slate-300 dark:border-slate-700 rounded-lg p-4">
                                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Jugador 2</h3>
                                    <div className="space-y-2">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Grupo</label>
                                            <select
                                                className="w-full border rounded px-2 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                value={swapPlayer2.groupId}
                                                onChange={(e) => setSwapPlayer2({ ...swapPlayer2, groupId: e.target.value, playerId: '' })}
                                            >
                                                <option value="">-- Seleccionar Grupo --</option>
                                                {filteredBySeason.map((g: any) => (
                                                    <option key={g.id} value={g.id}>{g.name} ({g._count?.groupPlayers || 0} jugadores)</option>
                                                ))}
                                            </select>
                                        </div>
                                        {swapPlayer2.groupId && (
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jugador</label>
                                                <select
                                                    className="w-full border rounded px-2 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                                    value={swapPlayer2.playerId}
                                                    onChange={(e) => setSwapPlayer2({ ...swapPlayer2, playerId: e.target.value })}
                                                >
                                                    <option value="">-- Seleccionar Jugador --</option>
                                                    {groups.find((g: any) => g.id === swapPlayer2.groupId)?.groupPlayers?.map((gp: any) => (
                                                        <option key={gp.playerId} value={gp.playerId}>
                                                            #{gp.rankingPosition} - {gp.player.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <p className="text-sm text-blue-900 dark:text-blue-200">
                                    ℹ️ Los jugadores intercambiarán sus posiciones en el ranking de sus respectivos grupos.
                                </p>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowSwapModal(false)}
                                    className="px-4 py-2 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={!swapPlayer1.playerId || !swapPlayer2.playerId || swapPlayersMutation.isPending}
                                    onClick={handleSwapPlayers}
                                    className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {swapPlayersMutation.isPending ? 'Intercambiando...' : '⇄ Intercambiar Jugadores'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* WhatsApp modal */}
            {editingGroup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Link de WhatsApp - {editingGroup.name}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">URL del grupo de WhatsApp</label>
                                <input
                                    type="url"
                                    value={whatsappUrl}
                                    onChange={e => setWhatsappUrl(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    placeholder="https://chat.whatsapp.com/..."
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Deja vacío para eliminar el link</p>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={handleSaveWhatsapp}
                                    disabled={updateWhatsappMutation.isPending}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >{updateWhatsappMutation.isPending ? 'Guardando...' : 'Guardar'}</button>
                                <button
                                    onClick={() => { setEditingGroup(null); setWhatsappUrl(''); }}
                                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
                                >Cancelar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
