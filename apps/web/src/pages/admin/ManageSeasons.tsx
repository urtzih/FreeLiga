import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

export default function ManageSeasons() {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        endDate: '',
    });
    const [editSeason, setEditSeason] = useState<any>(null);
    const [editData, setEditData] = useState({
        name: '',
        startDate: '',
        endDate: '',
    });

    const { data: seasons = [], isLoading } = useQuery({
        queryKey: ['seasons'],
        queryFn: async () => {
            const { data } = await api.get('/seasons');
            return data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            await api.post('/seasons', {
                ...data,
                startDate: new Date(data.startDate).toISOString(),
                endDate: new Date(data.endDate).toISOString(),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['seasons'] });
            setShowForm(false);
            setFormData({ name: '', startDate: '', endDate: '' });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            await api.put(`/seasons/${id}`, {
                ...data,
                startDate: new Date(data.startDate).toISOString(),
                endDate: new Date(data.endDate).toISOString(),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['seasons'] });
            setEditSeason(null);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const openEdit = (season: any) => {
        setEditSeason(season);
        setEditData({
            name: season.name,
            startDate: new Date(season.startDate).toISOString().substring(0, 10),
            endDate: new Date(season.endDate).toISOString().substring(0, 10),
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editSeason) return;
        updateMutation.mutate({ id: editSeason.id, data: editData });
    };

    // Función para exportar CSV de una temporada
    const handleExportCSV = (season: any) => {
        if (!season.groups) return;
        
        const rows: string[] = [];
        rows.push('Temporada,Grupo,Posición,Jugador,Movimiento,Partidos Ganados');
        
        season.groups.forEach((group: any) => {
            const sortedPlayers = [...(group.groupPlayers || [])].sort((a: any, b: any) => a.rankingPosition - b.rankingPosition);
            sortedPlayers.forEach((gp: any) => {
                const totalPlayers = group.groupPlayers.length;
                const movement = gp.rankingPosition <= 2 ? 'ASCENSO' : gp.rankingPosition > totalPlayers - 2 ? 'DESCENSO' : 'MANTIENE';
                const matchesWon = gp.player.matches?.filter((m: any) => m.winnerId === gp.playerId).length || 0;
                
                rows.push(`"${season.name}","${group.name}",${gp.rankingPosition},"${gp.player.name}","${movement}",${matchesWon}`);
            });
        });
        
        const csv = rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `clasificacion_${season.name.replace(/\s+/g, '_')}.csv`);
        link.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gestionar Temporadas</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {showForm ? 'Cancelar' : '+ Nueva Temporada'}
                </button>
            </div>

            {showForm && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Crear Temporada</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Nombre de la Temporada
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                placeholder="ej. Otoño 2024"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Fecha de Inicio
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Fecha de Fin
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Crear Temporada
                        </button>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center">Cargando...</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Inicio</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fin</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Grupos</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {seasons.map((season: any) => (
                                <tr key={season.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{season.name}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                        {new Date(season.startDate).toLocaleDateString('es-ES')}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                        {new Date(season.endDate).toLocaleDateString('es-ES')}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{season.groups?.length || 0}</td>
                                    <td className="px-6 py-4 flex gap-2">
                                        <button
                                            onClick={() => openEdit(season)}
                                            className="text-xs px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                                        >Editar</button>
                                        <a
                                            href={`/admin/groups?season=${season.id}`}
                                            className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                                            title="Ver clasificación y resultados de todos los grupos"
                                        >Ver más</a>
                                        <button
                                            onClick={() => handleExportCSV(season)}
                                            className="text-xs px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700"
                                            title="Exportar clasificación como CSV"
                                        >CSV</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            {editSeason && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-lg p-6">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Editar Temporada</h2>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    value={editData.name}
                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Inicio</label>
                                    <input
                                        type="date"
                                        required
                                        value={editData.startDate}
                                        onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fin</label>
                                    <input
                                        type="date"
                                        required
                                        value={editData.endDate}
                                        onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={updateMutation.isPending}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >{updateMutation.isPending ? 'Guardando...' : 'Guardar'}</button>
                                <button
                                    type="button"
                                    onClick={() => setEditSeason(null)}
                                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
                                >Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
