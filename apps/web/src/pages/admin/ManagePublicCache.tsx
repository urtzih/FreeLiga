import { useState, useEffect } from 'react';
import api from '../../lib/api';

interface CacheEntry {
    key: string;
    type: 'public' | 'private' | 'data';
    createdAt: string;
    ageSeconds: number;
    expiresInSeconds: number;
    isExpired: boolean;
    ttlHours: number;
}

interface CacheStats {
    size: number;
    entries: CacheEntry[];
    metrics: {
        hits: number;
        misses: number;
        sets: number;
        invalidations: number;
        expirations: number;
        totalReads: number;
        hitRate: number;
    };
}

export default function ManagePublicCache() {
    const [loading, setLoading] = useState(false);
    const [loadingStats, setLoadingStats] = useState(true);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<CacheStats | null>(null);
    const [invalidatingKey, setInvalidatingKey] = useState<string | null>(null);
    const [lastInvalidation, setLastInvalidation] = useState<{ scope: 'public' | 'private' | 'all'; at: string } | null>(null);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoadingStats(true);
            const { data } = await api.get('/public/cache/stats');
            setStats(data);
        } catch (err: any) {
            console.error('Error loading cache stats:', err);
        } finally {
            setLoadingStats(false);
        }
    };

    const invalidateAllCache = async () => {
        try {
            setLoading(true);
            setMessage(null);
            setError(null);

            const { data } = await api.post('/public/cache/invalidate/admin');
            const when = data?.at ? new Date(data.at).toLocaleString('es-ES') : 'ahora';
            setLastInvalidation({ scope: 'public', at: data?.at || new Date().toISOString() });
            setMessage(`Caché invalidada correctamente (${when}).`);
            
            // Recargar stats después de invalidar
            setTimeout(() => loadStats(), 500);
        } catch (err: any) {
            const apiMessage = err?.response?.data?.error;
            setError(apiMessage || 'No se pudo invalidar la caché');
        } finally {
            setLoading(false);
        }
    };

    const invalidatePrivateCache = async () => {
        try {
            setLoading(true);
            setMessage(null);
            setError(null);

            const { data } = await api.post('/public/cache/invalidate/private/admin');
            const when = data?.at ? new Date(data.at).toLocaleString('es-ES') : 'ahora';
            setLastInvalidation({ scope: 'private', at: data?.at || new Date().toISOString() });
            setMessage(`Caché privada invalidada correctamente (${when}).`);

            setTimeout(() => loadStats(), 500);
        } catch (err: any) {
            const apiMessage = err?.response?.data?.error;
            setError(apiMessage || 'No se pudo invalidar la caché privada');
        } finally {
            setLoading(false);
        }
    };

    const invalidateAllScopesCache = async () => {
        try {
            setLoading(true);
            setMessage(null);
            setError(null);

            const { data } = await api.post('/public/cache/invalidate/all/admin');
            const when = data?.at ? new Date(data.at).toLocaleString('es-ES') : 'ahora';
            setLastInvalidation({ scope: 'all', at: data?.at || new Date().toISOString() });
            setMessage(`Caché pública y privada invalidada correctamente (${when}).`);

            setTimeout(() => loadStats(), 500);
        } catch (err: any) {
            const apiMessage = err?.response?.data?.error;
            setError(apiMessage || 'No se pudo invalidar toda la caché');
        } finally {
            setLoading(false);
        }
    };

    const invalidateSingleKey = async (key: string) => {
        try {
            setInvalidatingKey(key);
            setMessage(null);
            setError(null);

            const encodedKey = encodeURIComponent(key);
            await api.post(`/public/cache/invalidate/key/${encodedKey}`);
            
            setMessage(`Caché "${key.substring(0, 40)}..." invalidada.`);
            setTimeout(() => loadStats(), 500);
        } catch (err: any) {
            const apiError = err?.response?.data?.error;
            setError(apiError || 'Error al invalidar la caché');
        } finally {
            setInvalidatingKey(null);
        }
    };

    const formatTime = (seconds: number): string => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        return `${Math.floor(seconds / 3600)}h`;
    };

    const getTypeColor = (type: string) => {
        if (type === 'public') return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        if (type === 'private') return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">⚡ Gestión de Caché</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-2">
                            Monitorea y controla todas las entradas de caché del sistema. Cache de 24h para mejor rendimiento.
                        </p>
                    </div>
                    <button
                        onClick={loadStats}
                        disabled={loadingStats}
                        className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium transition-colors disabled:opacity-60"
                    >
                        🔄 Recargar
                    </button>
                </div>
            </div>

            {/* Estadísticas Generales */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4">
                        <div className="text-3xl font-bold text-blue-600">{stats.size}</div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Entradas en Caché</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4">
                        <div className="text-3xl font-bold text-green-600">{stats.metrics.hitRate.toFixed(1)}%</div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Tasa de Aciertos</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4">
                        <div className="text-3xl font-bold text-amber-600">{stats.metrics.hits}</div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Hits</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4">
                        <div className="text-3xl font-bold text-red-600">{stats.metrics.misses}</div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Misses</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4">
                        <div className="text-3xl font-bold text-indigo-600">{stats.metrics.sets}</div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Sets</p>
                    </div>
                </div>
            )}

            {/* Botón de Acción Global */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">🚀 Invalidar Toda la Caché Pública</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Borra todas las entradas de caché pública para forzar recálculo inmediato
                        </p>
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-2">
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={invalidateAllCache}
                                disabled={loading}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium transition-colors whitespace-nowrap"
                            >
                                {loading ? '⏳ Invalidando...' : '🗑️ Pública'}
                            </button>
                            <button
                                onClick={invalidatePrivateCache}
                                disabled={loading}
                                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium transition-colors whitespace-nowrap"
                            >
                                {loading ? '⏳ Invalidando...' : '🧹 Privada'}
                            </button>
                            <button
                                onClick={invalidateAllScopesCache}
                                disabled={loading}
                                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium transition-colors whitespace-nowrap"
                            >
                                {loading ? '⏳ Invalidando...' : '💥 Todo'}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Última invalidación:{' '}
                            {lastInvalidation
                                ? `${new Date(lastInvalidation.at).toLocaleString('es-ES')} (${lastInvalidation.scope})`
                                : 'sin registros en esta sesión'}
                        </p>
                    </div>
                </div>

                {message && (
                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 text-sm">
                        ✅ {message}
                    </div>
                )}

                {error && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 text-sm">
                        ❌ {error}
                    </div>
                )}
            </div>

            {/* Tabla de Entradas de Caché */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        📊 Entradas en Caché ({stats?.size || 0})
                    </h2>
                </div>

                {loadingStats ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <p className="mt-2 text-slate-600 dark:text-slate-400">Cargando datos de caché...</p>
                    </div>
                ) : stats && stats.entries.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                                <tr>
                                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Clave</th>
                                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Tipo</th>
                                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Antigüedad</th>
                                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Expira en</th>
                                    <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Creado</th>
                                    <th className="px-6 py-3 text-center font-semibold text-slate-900 dark:text-white">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {stats.entries.map((entry) => (
                                    <tr key={entry.key} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                        <td className="px-6 py-4">
                                            <code className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-900 dark:text-slate-200 font-mono truncate max-w-xs">
                                                {entry.key}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(entry.type)}`}>
                                                {entry.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600 dark:text-slate-400 font-medium">
                                                {formatTime(entry.ageSeconds)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-medium ${entry.isExpired ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                {entry.isExpired ? '❌ Expirado' : `✓ ${formatTime(entry.expiresInSeconds)}`}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                            {new Date(entry.createdAt).toLocaleString('es-ES', {
                                                month: 'numeric',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => invalidateSingleKey(entry.key)}
                                                disabled={invalidatingKey === entry.key}
                                                className="px-3 py-1 text-xs rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-900 dark:text-white font-medium transition-colors disabled:opacity-60"
                                            >
                                                {invalidatingKey === entry.key ? '⏳' : '🗑️'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-600 dark:text-slate-400">
                        📭 No hay entradas en caché
                    </div>
                )}
            </div>

            {/* Info de TTL */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
                <p className="font-semibold">ℹ️ Información:</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Las cachés públicas se mantienen <strong>24 horas</strong> para rendimiento óptimo</li>
                    <li>Al cambiar de temporada, el cache se invalida automáticamente</li>
                    <li>Si los datos siguen siendo antiguos en el navegador, haz un hard-refresh (Ctrl+F5)</li>
                </ul>
            </div>
        </div>
    );
}
