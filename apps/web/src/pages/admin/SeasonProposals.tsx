import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function SeasonProposals() {
    const { seasonId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [localEntries, setLocalEntries] = useState<any[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    // Fetch season details and closure
    const { data: season, isLoading } = useQuery({
        queryKey: ['season-proposal', seasonId],
        queryFn: async () => {
            const { data: seasonData } = await api.get(`/seasons/${seasonId}`);
            const { data: groups } = await api.get('/groups');
            const seasonGroups = groups.filter((g: any) => g.seasonId === seasonId);

            // Sort groups
            seasonGroups.sort((a: any, b: any) => {
                const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
                return numA - numB;
            });

            // Try to get existing closure
            try {
                const { data: closure } = await api.get(`/seasons/${seasonId}/closure`);
                return { ...seasonData, groups: seasonGroups, closure };
            } catch (e) {
                // If not found, generate preview
                const { data: closure } = await api.post(`/seasons/${seasonId}/closure/preview`);
                return { ...seasonData, groups: seasonGroups, closure };
            }
        },
        enabled: !!seasonId
    });

    // Initialize local state when data loads
    useEffect(() => {
        if (season?.closure?.entries) {
            setLocalEntries(season.closure.entries);
        }
    }, [season]);

    const saveMutation = useMutation({
        mutationFn: async (entries: any[]) => {
            await api.put(`/seasons/${seasonId}/closure/entries`, {
                entries: entries.map(e => ({
                    playerId: e.playerId,
                    movementType: e.movementType
                }))
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['season-proposal', seasonId] });
            setHasChanges(false);
            alert('Cambios guardados correctamente');
        },
        onError: () => {
            alert('Error al guardar los cambios');
        }
    });

    const approveMutation = useMutation({
        mutationFn: async () => {
            await api.post(`/seasons/${seasonId}/closure/approve`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['season-proposal', seasonId] });
            alert('Propuesta aprobada correctamente. Los movimientos se han aplicado.');
        },
        onError: () => {
            alert('Error al aprobar la propuesta');
        }
    });

    const toggleActiveMutation = useMutation({
        mutationFn: async (userId: string) => {
            await api.post(`/users/${userId}/toggle-active`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['season-proposal', seasonId] });
        },
        onError: () => {
            alert('Error al cambiar el estado del jugador');
        }
    });

    const rolloverMutation = useMutation({
        mutationFn: async () => {
            await api.post(`/seasons/${seasonId}/rollover`, { importPlayers: true });
        },
        onSuccess: () => {
            alert('Nueva temporada generada con éxito.');
            navigate('/admin/seasons');
        },
        onError: () => {
            alert('Error al generar la nueva temporada');
        }
    });

    const handleMovementChange = (playerId: string, newType: string) => {
        setLocalEntries(prev => prev.map(entry =>
            entry.playerId === playerId ? { ...entry, movementType: newType } : entry
        ));
        setHasChanges(true);
    };

    const handleSave = () => {
        saveMutation.mutate(localEntries);
    };

    if (isLoading) {
        return <div className="p-8 text-center">Cargando propuesta...</div>;
    }

    if (!season) {
        return <div className="p-8 text-center">Temporada no encontrada</div>;
    }

    const isApproved = season.closure?.status === 'APPROVED';

    // Calculate statistics
    const promotions = localEntries.filter(e => e.movementType === 'PROMOTION').length;
    const relegations = localEntries.filter(e => e.movementType === 'RELEGATION').length;
    const stays = localEntries.filter(e => e.movementType === 'STAY').length;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Propuesta de Movimientos</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Temporada: {season.name} {isApproved && <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-bold">APROBADA</span>}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link
                        to="/admin/seasons"
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        ← Volver
                    </Link>

                    {!isApproved && hasChanges && (
                        <button
                            onClick={handleSave}
                            disabled={saveMutation.isPending}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg animate-pulse"
                        >
                            {saveMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    )}

                    {!isApproved && !hasChanges && (
                        <button
                            onClick={() => {
                                if (window.confirm('¿Estás seguro de aprobar esta propuesta? Esto aplicará los movimientos a los jugadores.')) {
                                    approveMutation.mutate();
                                }
                            }}
                            disabled={approveMutation.isPending}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            {approveMutation.isPending ? 'Aprobando...' : 'Aprobar Propuesta'}
                        </button>
                    )}

                    {isApproved && (
                        <button
                            onClick={() => {
                                if (window.confirm('¿Generar la siguiente temporada importando estos jugadores?')) {
                                    rolloverMutation.mutate();
                                }
                            }}
                            disabled={rolloverMutation.isPending}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            {rolloverMutation.isPending ? 'Generando...' : 'Generar Siguiente Temporada'}
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Jugadores</div>
                    <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{localEntries.length}</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                    <div className="text-sm font-medium text-green-600 dark:text-green-400">Ascensos 📈</div>
                    <div className="text-3xl font-bold text-green-900 dark:text-green-100">{promotions}</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700">
                    <div className="text-sm font-medium text-red-600 dark:text-red-400">Descensos 📉</div>
                    <div className="text-3xl font-bold text-red-900 dark:text-red-100">{relegations}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/20 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Mantienen ➡️</div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stays}</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
                    <div className="text-sm font-medium text-orange-600 dark:text-orange-400">Desactivados 🚫</div>
                    <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                        {localEntries.filter((e: any) => e.player?.user?.isActive === false).length}
                    </div>
                </div>
            </div>

            {isApproved && (
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-700 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                        <div className="text-4xl">✅</div>
                        <div>
                            <h3 className="font-bold text-green-900 dark:text-green-100 text-lg">Propuesta Aprobada</h3>
                            <p className="text-green-800 dark:text-green-200 mt-2">
                                Los movimientos han sido registrados en el historial de los jugadores. Los cambios serán aplicados cuando generes la siguiente temporada.
                            </p>
                            <div className="mt-4 space-y-1 text-sm text-green-700 dark:text-green-300">
                                <p>✓ {promotions} jugador(es) ascendido(s)</p>
                                <p>✓ {relegations} jugador(es) descendido(s)</p>
                                <p>✓ {stays} jugador(es) mantiene(n) grupo</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {season.groups.map((group: any) => {
                    // Get entries for this group to have correct ranking
                    const groupEntries = localEntries.filter((e: any) => e.fromGroupId === group.id).sort((a: any, b: any) => a.finalRank - b.finalRank);

                    return (
                        <div key={group.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{group.name}</h3>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {groupEntries.map((entry: any) => {
                                    const movement = entry.movementType || 'STAY';

                                    let statusColor = 'text-slate-500';
                                    if (movement === 'PROMOTION') statusColor = 'text-green-600 dark:text-green-400';
                                    if (movement === 'RELEGATION') statusColor = 'text-red-600 dark:text-red-400';

                                    const isActive = entry.player?.user?.isActive !== false;
                                    const userId = entry.player?.user?.id;

                                    return (
                                        <div key={entry.playerId} className={`px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${!isActive ? 'opacity-50 bg-red-50 dark:bg-red-900/10' : ''}`}>
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <span className="font-mono text-sm text-slate-400 w-6">#{entry.finalRank}</span>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-medium ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                {entry.player.name}
                                                            </span>
                                                            {!isActive && (
                                                                <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full font-medium">
                                                                    Desactivado
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">🏆 {entry.matchesWon || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {userId && (
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm(`¿${isActive ? 'Desactivar' : 'Activar'} a ${entry.player.name}? ${!isActive ? 'Podrá participar en la siguiente temporada.' : 'NO participará en la siguiente temporada.'}`)) {
                                                                    toggleActiveMutation.mutate(userId);
                                                                }
                                                            }}
                                                            disabled={toggleActiveMutation.isPending}
                                                            className={`text-xs px-2 py-1 rounded transition-colors ${isActive ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'}`}
                                                            title={isActive ? 'Desactivar jugador' : 'Activar jugador'}
                                                        >
                                                            {isActive ? '🚫' : '✅'}
                                                        </button>
                                                    )}
                                                    {isApproved ? (
                                                        <div className={`text-xs font-bold ${statusColor} whitespace-nowrap`}>
                                                            {movement === 'STAY' && 'Mantiene ➡️'}
                                                            {movement === 'PROMOTION' && 'Asciende 📈'}
                                                            {movement === 'RELEGATION' && 'Desciende 📉'}
                                                        </div>
                                                    ) : (
                                                        <select
                                                            value={movement}
                                                            onChange={(e) => handleMovementChange(entry.playerId, e.target.value)}
                                                            className={`text-xs font-bold bg-transparent border-none focus:ring-0 cursor-pointer ${statusColor} whitespace-nowrap`}
                                                        >
                                                            <option value="STAY">Mantiene ➡️</option>
                                                            <option value="PROMOTION">Asciende 📈</option>
                                                            <option value="RELEGATION">Desciende 📉</option>
                                                        </select>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
