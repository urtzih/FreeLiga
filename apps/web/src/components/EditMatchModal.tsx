import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useToast } from '../contexts/ToastContext';

interface Match {
    id: string;
    gamesP1: number;
    gamesP2: number;
    matchStatus: 'PLAYED' | 'INJURY' | 'CANCELLED';
    date: string;
    player1: { name: string };
    player2: { name: string };
}

interface UpdateMatchData {
    matchStatus: string;
    date?: string;
    gamesP1?: number;
    gamesP2?: number;
}

interface EditMatchModalProps {
    match: Match;
    isOpen: boolean;
    onClose: () => void;
}

export default function EditMatchModal({ match, isOpen, onClose }: EditMatchModalProps) {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        gamesP1: 0,
        gamesP2: 0,
        matchStatus: 'PLAYED',
        date: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (match) {
            setFormData({
                gamesP1: match.gamesP1,
                gamesP2: match.gamesP2,
                matchStatus: match.matchStatus,
                date: match.date ? new Date(match.date).toISOString().split('T')[0] : ''
            });
        }
    }, [match]);

    const mutation = useMutation({
        mutationFn: async (data: UpdateMatchData) => {
            try {
                const response = await api.put(`/matches/${match.id}`, data);
                return response.data;
            } catch (error) {
                console.error('❌ PUT request failed:', error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['matches'] });
            queryClient.invalidateQueries({ queryKey: ['playerStats'] });
            queryClient.invalidateQueries({ queryKey: ['classification'] });
            queryClient.invalidateQueries({ queryKey: ['group'] });
            showToast('✓ Partido actualizado correctamente', 'success');
            onClose();
        },
        onError: (err: unknown) => {
            const error = err as { response?: { data?: { error?: unknown } } };
            const errorData = error.response?.data?.error;
            if (Array.isArray(errorData)) {
                setError(errorData.map((e: { message?: string }) => e.message || JSON.stringify(e)).join(', '));
            } else if (typeof errorData === 'object' && errorData !== null) {
                setError(JSON.stringify(errorData));
            } else {
                setError(String(errorData) || 'Error al actualizar el partido');
            }
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const payload: UpdateMatchData = {
            matchStatus: formData.matchStatus,
            date: formData.date ? new Date(formData.date).toISOString() : undefined
        };

        // Only include games if match status is PLAYED
        if (formData.matchStatus === 'PLAYED') {
            payload.gamesP1 = formData.gamesP1;
            payload.gamesP2 = formData.gamesP2;
        } else {
            // For INJURY/CANCELLED, set games to 0
            payload.gamesP1 = 0;
            payload.gamesP2 = 0;
        }

        mutation.mutate(payload);
    };

    if (!isOpen || !match) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Editar Partido</h3>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="text-center mb-4">
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">Enfrentamiento</p>
                        <div className="flex items-center justify-center space-x-4 font-bold text-lg text-slate-900 dark:text-white">
                            <span>{match.player1?.name || 'Jugador 1'}</span>
                            <span className="text-slate-400">vs</span>
                            <span>{match.player2?.name || 'Jugador 2'}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Estado
                        </label>
                        <select
                            value={formData.matchStatus}
                            onChange={(e) => setFormData({ ...formData, matchStatus: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="PLAYED">Jugado</option>
                            <option value="INJURY">Lesión</option>
                            <option value="CANCELLED">Cancelado</option>
                        </select>
                    </div>

                    {formData.matchStatus === 'PLAYED' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Juegos {match.player1?.name?.split(' ')[0] || 'J1'}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="3"
                                    value={formData.gamesP1}
                                    onChange={(e) => setFormData({ ...formData, gamesP1: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-center font-bold text-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Juegos {match.player2?.name?.split(' ')[0] || 'J2'}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="3"
                                    value={formData.gamesP2}
                                    onChange={(e) => setFormData({ ...formData, gamesP2: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-center font-bold text-xl"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Fecha
                        </label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
