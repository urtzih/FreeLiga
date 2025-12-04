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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {season.groups.map((group: any) => {
                    // Sort players by ranking position
                    const players = [...(group.groupPlayers || [])].sort((a: any, b: any) => a.rankingPosition - b.rankingPosition);

                    return (
                        <div key={group.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{group.name}</h3>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {players.map((gp: any) => {
                                    const entry = localEntries.find((e: any) => e.playerId === gp.playerId);
                                    const movement = entry?.movementType || 'STAY';

                                    let statusColor = 'text-slate-500';
                                    if (movement === 'PROMOTION') statusColor = 'text-green-600 dark:text-green-400';
                                    if (movement === 'RELEGATION') statusColor = 'text-red-600 dark:text-red-400';

                                    return (
                                        <div key={gp.playerId} className="px-4 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-sm text-slate-400 w-6">#{gp.rankingPosition}</span>
                                                <span className="font-medium text-slate-900 dark:text-white">{gp.player.name}</span>
                                            </div>
                                            {isApproved ? (
                                                <div className={`text-xs font-bold ${statusColor}`}>
                                                    {movement === 'STAY' && 'Mantiene ➡️'}
                                                    {movement === 'PROMOTION' && 'Asciende 📈'}
                                                    {movement === 'RELEGATION' && 'Desciende 📉'}
                                                </div>
                                            ) : (
                                                <select
                                                    value={movement}
                                                    onChange={(e) => handleMovementChange(gp.playerId, e.target.value)}
                                                    className={`text-xs font-bold bg-transparent border-none focus:ring-0 cursor-pointer ${statusColor}`}
                                                >
                                                    <option value="STAY">Mantiene ➡️</option>
                                                    <option value="PROMOTION">Asciende 📈</option>
                                                    <option value="RELEGATION">Desciende 📉</option>
                                                </select>
                                            )}
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
