import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

export default function ManageGroups() {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        seasonId: '',
    });

    const { data: groups = [] } = useQuery({
        queryKey: ['groups'],
        queryFn: async () => {
            const { data } = await api.get('/groups');
            return data;
        },
    });

    const { data: seasons = [] } = useQuery({
        queryKey: ['seasons'],
        queryFn: async () => {
            const { data } = await api.get('/seasons');
            return data;
        },
    });

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gestionar Grupos</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {showForm ? 'Cancelar' : '+ Nuevo Grupo'}
                </button>
            </div>

            {showForm && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Crear Grupo</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Nombre del Grupo
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                placeholder="ej. Grupo A"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Temporada
                            </label>
                            <select
                                required
                                value={formData.seasonId}
                                onChange={(e) => setFormData({ ...formData, seasonId: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            >
                                <option value="">Selecciona una temporada...</option>
                                {seasons.map((season: any) => (
                                    <option key={season.id} value={season.id}>{season.name}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Crear Grupo
                        </button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group: any) => (
                    <div key={group.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{group.name}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{group.season?.name}</p>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">
                                {group._count?.groupPlayers || 0} jugadores
                            </span>
                            <Link
                                to={`/groups/${group.id}`}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium"
                            >
                                Ver →
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
