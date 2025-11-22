import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

export default function RecordMatch() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        groupId: user?.player?.currentGroupId || '',
        player1Id: user?.player?.id || '',
        player2Id: '',
        gamesP1: 0,
        gamesP2: 0,
        date: new Date().toISOString().split('T')[0],
        matchStatus: 'PLAYED' as 'PLAYED' | 'INJURY' | 'CANCELLED',
    });
    const [error, setError] = useState('');

    const { data: group } = useQuery({
        queryKey: ['group', formData.groupId],
        queryFn: async () => {
            const { data } = await api.get(`/groups/${formData.groupId}`);
            return data;
        },
        enabled: !!formData.groupId,
    });

    // Filtrar oponentes disponibles
    const availableOpponents = useMemo(() => {
        if (!group || !user?.player?.id) return [];

        const playedOpponentIds = new Set();

        // Buscar partidos jugados por el usuario actual
        group.matches?.forEach((match: any) => {
            if (match.matchStatus === 'PLAYED') {
                if (match.player1Id === user.player.id) {
                    playedOpponentIds.add(match.player2Id);
                } else if (match.player2Id === user.player.id) {
                    playedOpponentIds.add(match.player1Id);
                }
            }
        });

        return group.groupPlayers.filter((gp: any) =>
            gp.playerId !== user.player.id && !playedOpponentIds.has(gp.playerId)
        );
    }, [group, user]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            console.log('Enviando datos de partido:', data);
            const response = await api.post('/matches', data);
            return response.data;
        },
        onSuccess: () => {
            console.log('Partido registrado con éxito');
            queryClient.invalidateQueries({ queryKey: ['playerStats'] });
            queryClient.invalidateQueries({ queryKey: ['group'] });
            queryClient.invalidateQueries({ queryKey: ['classification'] });
            navigate('/dashboard');
        },
        onError: (err: any) => {
            console.error('Error al registrar partido:', err);
            setError(err.response?.data?.error || 'Error al registrar el partido. Inténtalo de nuevo.');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.player1Id === formData.player2Id) {
            setError('Por favor, selecciona jugadores diferentes');
            return;
        }

        if (formData.matchStatus === 'PLAYED') {
            if (formData.gamesP1 < 0 || formData.gamesP1 > 3 || formData.gamesP2 < 0 || formData.gamesP2 > 3) {
                setError('Los juegos deben estar entre 0 y 3');
                return;
            }
        }

        mutation.mutate(formData);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Encabezado */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 text-white shadow-lg">
                <h1 className="text-3xl font-bold mb-2">Registrar Partido</h1>
                <p className="text-green-100">Introduce los resultados para actualizar las clasificaciones</p>
            </div>

            {/* Formulario */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Fecha
                        </label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Tu Oponente
                        </label>
                        <select
                            value={formData.player2Id}
                            onChange={(e) => setFormData({ ...formData, player2Id: e.target.value })}
                            required
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="">Selecciona un oponente...</option>
                            {availableOpponents.map((gp: any) => (
                                <option key={gp.playerId} value={gp.playerId}>
                                    {gp.player.name} {gp.player.nickname && `"${gp.player.nickname}"`}
                                </option>
                            ))}
                        </select>
                        {availableOpponents.length === 0 && group && (
                            <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                                ¡Has jugado contra todos los oponentes disponibles!
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Estado del Partido
                        </label>
                        <select
                            value={formData.matchStatus}
                            onChange={(e) => setFormData({ ...formData, matchStatus: e.target.value as any })}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="PLAYED">Jugado</option>
                            <option value="INJURY">Lesión (anulado)</option>
                            <option value="CANCELLED">Cancelado</option>
                        </select>
                    </div>

                    {formData.matchStatus === 'PLAYED' && (
                        <>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Tus Juegos
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="3"
                                        value={formData.gamesP1}
                                        onChange={(e) => setFormData({ ...formData, gamesP1: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Juegos del Oponente
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="3"
                                        value={formData.gamesP2}
                                        onChange={(e) => setFormData({ ...formData, gamesP2: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl font-bold"
                                    />
                                </div>
                            </div>

                            {/* Vista Previa del Resultado */}
                            {formData.player2Id && (
                                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Vista Previa del Resultado:</p>
                                    <div className="flex items-center justify-center space-x-4 text-lg">
                                        <span className={`font-bold ${formData.gamesP1 > formData.gamesP2 ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
                                            {user?.player?.name}
                                        </span>
                                        <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {formData.gamesP1} - {formData.gamesP2}
                                        </span>
                                        <span className={`font-bold ${formData.gamesP2 > formData.gamesP1 ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
                                            {group?.groupPlayers.find((gp: any) => gp.playerId === formData.player2Id)?.player.name}
                                        </span>
                                    </div>
                                    {formData.gamesP1 === formData.gamesP2 && (
                                        <p className="text-center text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                                            ⚠️ Esto se registrará como empate
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {formData.matchStatus === 'INJURY' && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                            <p className="text-orange-600 dark:text-orange-400 text-sm">
                                ℹ️ Los partidos por lesión se registran pero no afectan a las clasificaciones
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={mutation.isPending || !formData.player2Id}
                        className="w-full px-6 py-3 text-white font-medium rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                    >
                        {mutation.isPending ? 'Registrando...' : 'Registrar Partido'}
                    </button>
                </form>
            </div>
        </div>
    );
}
