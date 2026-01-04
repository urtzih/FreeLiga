import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import Spinner from '../../components/Spinner';
import { useToast } from '../../contexts/ToastContext';

export default function RecordMatch() {
    const getTodayLocalISO = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getErrorMessage = (err: any) => {
        // Sin conexión a internet
        if (!navigator.onLine || err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
            return 'Sin conexión a internet. Verifica tu conexión y vuelve a intentarlo.';
        }

        // Error de servidor (5xx)
        if (err.response?.status >= 500) {
            return 'Error del servidor. Por favor, inténtalo de nuevo más tarde.';
        }

        // Error de base de datos (común en respuestas del backend)
        if (err.response?.data?.error?.includes('database') ||
            err.response?.data?.error?.includes('Database') ||
            err.response?.data?.error?.includes('BD') ||
            err.response?.data?.error?.includes('conexión')) {
            return 'Error de conexión con la base de datos. Inténtalo de nuevo en unos momentos.';
        }

        // Error específico del backend
        if (err.response?.data?.error) {
            return `${err.response.data.error}`;
        }

        // Error genérico
        return 'Error al registrar el partido. Por favor, inténtalo de nuevo.';
    };

    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        groupId: user?.player?.currentGroup?.id || '',
        player1Id: user?.player?.id || '',
        player2Id: '',
        gamesP1: 0,
        gamesP2: 0,
        date: getTodayLocalISO(),
        matchStatus: 'PLAYED' as 'PLAYED' | 'INJURY',
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

    // Filtrar oponentes disponibles - optimizado
    const availableOpponents = useMemo(() => {
        if (!group?.groupPlayers || !user?.player?.id) return [];

        // Crear Set de oponentes jugados (más eficiente que filter múltiple)
        const playedOpponentIds = new Set(
            group.matches
                ?.filter((match: any) => 
                    match.player1Id === user.player?.id || match.player2Id === user.player?.id
                )
                .map((match: any) => 
                    match.player1Id === user.player?.id ? match.player2Id : match.player1Id
                ) || []
        );

        // Filtrar una sola vez
        return group.groupPlayers.filter((gp: any) =>
            gp.playerId !== user.player?.id && !playedOpponentIds.has(gp.playerId)
        );
    }, [group?.groupPlayers, group?.matches, user?.player?.id]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const payload = {
                ...data,
                date: new Date(data.date).toISOString(),
                // Ensure games are 0 if injury, though backend validation allows 0-3.
                // Just in case we want to be clean.
                gamesP1: data.matchStatus === 'INJURY' ? 0 : data.gamesP1,
                gamesP2: data.matchStatus === 'INJURY' ? 0 : data.gamesP2,
            };
            const response = await api.post('/matches', payload);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['playerStats'] });
            queryClient.invalidateQueries({ queryKey: ['group'] });
            queryClient.invalidateQueries({ queryKey: ['classification'] });
            showToast('¡Partido registrado! La clasificación ha sido actualizada.', 'success');
            navigate(`/groups/${formData.groupId}`);
        },
        onError: (err: any) => {
            console.error('Error al registrar partido:', err);
            setError(getErrorMessage(err));
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.player1Id === formData.player2Id) {
            setError('Por favor, selecciona jugadores diferentes');
            return;
        }

        // Validate date is not in future (timezone-safe using local ISO)
        const todayIso = getTodayLocalISO();
        if (formData.date > todayIso) {
            setError('No se pueden registrar partidos con fecha futura');
            return;
        }

        if (formData.matchStatus === 'PLAYED') {
            // Validaciones: rangos y formato ganador obligatorio (3-0,3-1,3-2 o inverso)
            if (formData.gamesP1 < 0 || formData.gamesP1 > 3 || formData.gamesP2 < 0 || formData.gamesP2 > 3) {
                setError('Los juegos deben estar entre 0 y 3');
                return;
            }
            const validScore = (formData.gamesP1 === 3 && formData.gamesP2 >= 0 && formData.gamesP2 <= 2) || (formData.gamesP2 === 3 && formData.gamesP1 >= 0 && formData.gamesP1 <= 2);
            if (!validScore) {
                setError('Resultado inválido. Formatos permitidos: 3-0, 3-1, 3-2 (o inverso). Un jugador debe llegar a 3.');
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
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 relative">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                {/* Loading Overlay */}
                {mutation.isPending && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                        <Spinner size="lg" />
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Fecha
                        </label>
                        <input
                            type="date"
                            max={getTodayLocalISO()}
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
                        </select>
                    </div>

                    {formData.matchStatus === 'PLAYED' && (
                        <>
                            <div className="grid grid-cols-2 gap-3 sm:gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Tus Juegos
                                    </label>
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData((prev) => ({ ...prev, gamesP1: Math.max(0, prev.gamesP1 - 1) }))}
                                            className="px-2 sm:px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 focus:ring-2 focus:ring-green-500 focus:border-transparent text-xl font-bold flex-shrink-0"
                                            aria-label="Restar juego"
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            min="0"
                                            max="3"
                                            value={formData.gamesP1}
                                            onChange={(e) => setFormData({ ...formData, gamesP1: Math.min(3, Math.max(0, parseInt(e.target.value) || 0)) })}
                                            className="w-full px-2 sm:px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl font-bold min-w-0"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData((prev) => ({ ...prev, gamesP1: Math.min(3, prev.gamesP1 + 1) }))}
                                            className="px-2 sm:px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 focus:ring-2 focus:ring-green-500 focus:border-transparent text-xl font-bold flex-shrink-0"
                                            aria-label="Sumar juego"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Juegos del Oponente
                                    </label>
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData((prev) => ({ ...prev, gamesP2: Math.max(0, prev.gamesP2 - 1) }))}
                                            className="px-2 sm:px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 focus:ring-2 focus:ring-green-500 focus:border-transparent text-xl font-bold flex-shrink-0"
                                            aria-label="Restar juego"
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            min="0"
                                            max="3"
                                            value={formData.gamesP2}
                                            onChange={(e) => setFormData({ ...formData, gamesP2: Math.min(3, Math.max(0, parseInt(e.target.value) || 0)) })}
                                            className="w-full px-2 sm:px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl font-bold min-w-0"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData((prev) => ({ ...prev, gamesP2: Math.min(3, prev.gamesP2 + 1) }))}
                                            className="px-2 sm:px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 focus:ring-2 focus:ring-green-500 focus:border-transparent text-xl font-bold flex-shrink-0"
                                            aria-label="Sumar juego"
                                        >
                                            +
                                        </button>
                                    </div>
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
                                    {formData.matchStatus === 'PLAYED' && formData.gamesP1 !== formData.gamesP2 && (formData.gamesP1 === 3 || formData.gamesP2 === 3) && (
                                        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">
                                            Formato al mejor de 5 (primero a 3)
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
