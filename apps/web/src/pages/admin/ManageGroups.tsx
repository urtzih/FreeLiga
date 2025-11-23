import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

export default function ManageGroups() {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editingGroup, setEditingGroup] = useState<any>(null);
    const [whatsappUrl, setWhatsappUrl] = useState('');
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
            updateWhatsappMutation.mutate({
                groupId: editingGroup.id,
                whatsappUrl: whatsappUrl,
            });
        }
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
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{group.season?.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mb-4">
                            {group.whatsappUrl ? '✅ WhatsApp configurado' : '⚠️ Sin link de WhatsApp'}
                        </p>
                        <div className="space-y-2">
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
                            <button
                                onClick={() => handleEditWhatsapp(group)}
                                className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                            >
                                {group.whatsappUrl ? 'Editar WhatsApp' : 'Añadir WhatsApp'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal para editar WhatsApp */}
            {editingGroup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            Link de WhatsApp - {editingGroup.name}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    URL del grupo de WhatsApp
                                </label>
                                <input
                                    type="url"
                                    value={whatsappUrl}
                                    onChange={(e) => setWhatsappUrl(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    placeholder="https://chat.whatsapp.com/..."
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Deja vacío para eliminar el link
                                </p>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={handleSaveWhatsapp}
                                    disabled={updateWhatsappMutation.isPending}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    {updateWhatsappMutation.isPending ? 'Guardando...' : 'Guardar'}
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingGroup(null);
                                        setWhatsappUrl('');
                                    }}
                                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
