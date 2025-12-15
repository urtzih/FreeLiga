import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import Loader from '../../components/Loader';
import { useAdminQuery } from '../../hooks/useAdminQuery';

export default function ManageSeasons() {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [yearFilter, setYearFilter] = useState<string>('');
    const [deleteError, setDeleteError] = useState<string>('');
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

    const { data: seasons = [], isLoading } = useAdminQuery({
        queryKey: ['seasons'],
        queryFn: async () => {
            const { data } = await api.get('/seasons');
            return data;
        },
    });

    // Filtrar temporadas por año
    const filteredSeasons = yearFilter
        ? seasons.filter((season: any) => {
            const startYear = new Date(season.startDate).getFullYear();
            const endYear = new Date(season.endDate).getFullYear();
            return startYear.toString() === yearFilter || endYear.toString() === yearFilter;
        })
        : seasons;

    // Obtener años únicos para el filtro
    const availableYears = Array.from(new Set<number>(
        seasons.flatMap((season: any) => {
            const startYear = new Date(season.startDate).getFullYear();
            const endYear = new Date(season.endDate).getFullYear();
            return [startYear, endYear];
        })
    )).sort((a, b) => b - a);

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

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/seasons/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['seasons'] });
            alert('✅ Temporada eliminada correctamente');
        },
        onError: (error: any) => {
            console.error('Delete season error:', error.response);
            const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
            setDeleteError(errorMsg);
        }
    });

    const setActiveMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.post(`/seasons/${id}/set-active`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['seasons'] });
        },
        onError: (error: any) => {
            alert(`Error al activar la temporada: ${error.response?.data?.error || error.message}`);
        }
    });

    const handleDelete = (seasonId: string, seasonName: string) => {
        if (window.confirm(`¿Está seguro de que desea eliminar la temporada "${seasonName}"? Esto eliminará todos los grupos, jugadores y partidos asociados.`)) {
            deleteMutation.mutate(seasonId);
        }
    };

    const handleSetActive = (seasonId: string, seasonName: string) => {
        if (window.confirm(`¿Marcar "${seasonName}" como temporada activa? Esto desactivará todas las demás.`)) {
            setActiveMutation.mutate(seasonId);
        }
    };

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

            {/* Filtro de año */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Filtrar por año
                </label>
                <div className="flex gap-2">
                    <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                        <option value="">Todos los años</option>
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                    {yearFilter && (
                        <button
                            onClick={() => setYearFilter('')}
                            className="px-4 py-2 text-sm bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500"
                        >
                            Limpiar filtro
                        </button>
                    )}
                    <span className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400">
                        Mostrando {filteredSeasons.length} de {seasons.length} temporadas
                    </span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center"><Loader /></div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Inicio</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fin</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Grupos</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredSeasons.map((season: any) => (
                                <tr key={season.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                        {season.name}
                                    </td>
                                    <td className="px-6 py-4">
                                        {season.isActive ? (
                                            <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-xs font-bold">
                                                ✓ ACTIVA
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                        {new Date(season.startDate).toLocaleDateString('es-ES')}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                        {new Date(season.endDate).toLocaleDateString('es-ES')}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{season.groups?.length || 0}</td>
                                    <td className="px-6 py-4 flex gap-2 flex-wrap">
                                        {!season.isActive && (
                                            <button
                                                onClick={() => handleSetActive(season.id, season.name)}
                                                disabled={setActiveMutation.isPending}
                                                className="text-xs px-3 py-1 rounded bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-50"
                                                title="Marcar como temporada activa"
                                            >
                                                {setActiveMutation.isPending ? 'Activando...' : 'Activar'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => openEdit(season)}
                                            className="text-xs px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                                        >Editar</button>
                                        {new Date(season.endDate) < new Date() ? (
                                            <Link
                                                to={`/admin/seasons/${season.id}/proposals`}
                                                className="text-xs px-3 py-1 rounded bg-orange-600 text-white hover:bg-orange-700 inline-block"
                                                title="Gestionar ascensos y descensos"
                                            >Movimientos</Link>
                                        ) : (
                                            <button
                                                disabled
                                                className="text-xs px-3 py-1 rounded bg-orange-300 text-orange-900 cursor-not-allowed opacity-60"
                                                title="La temporada debe estar finalizada"
                                            >Movimientos</button>
                                        )}
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
                                        <button
                                            onClick={() => handleDelete(season.id, season.name)}
                                            disabled={deleteMutation.isPending}
                                            className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                                            title="Eliminar temporada"
                                        >{deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}</button>
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
            {/* Modal de error de eliminación */}
            {deleteError && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-red-500">
                        <div className="bg-red-500 p-4 flex items-center">
                            <svg className="w-6 h-6 text-white mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h3 className="text-xl font-bold text-white">No se puede eliminar</h3>
                        </div>
                        
                        <div className="p-6">
                            <div className="mb-6 text-slate-700 dark:text-slate-300 whitespace-pre-line">
                                {deleteError}
                            </div>
                            
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                    <strong>💡 Protección de datos históricos:</strong><br/>
                                    Este sistema protege automáticamente el historial de partidos, clasificaciones y ascensos/descensos. 
                                    No se pueden eliminar temporadas con datos para preservar la integridad del historial de la liga.
                                </p>
                            </div>

                            <button
                                onClick={() => setDeleteError('')}
                                className="w-full px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}        </div>
    );
}
