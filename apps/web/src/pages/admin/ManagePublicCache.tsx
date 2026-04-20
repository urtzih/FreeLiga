import { useEffect, useMemo, useState } from 'react';
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

interface CacheHistoryEntry {
 scope: 'public' | 'private' | 'all' | 'data';
 key?: string;
 pattern?: string;
 userId?: string;
 reason?: string;
 at: string;
}

interface CacheStats {
 size: number;
 entries: CacheEntry[];
 history?: CacheHistoryEntry[];
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
 const [showRawJson, setShowRawJson] = useState(false);

 const [searchTerm, setSearchTerm] = useState('');
 const [typeFilter, setTypeFilter] = useState<'all' | 'public' | 'private' | 'data'>('all');

 const [groupId, setGroupId] = useState('');
 const [playerId, setPlayerId] = useState('');
 const [seasonId, setSeasonId] = useState('');

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
 setMessage(`Caché pública invalidada correctamente (${when}).`);

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

 const invalidatePattern = async (pattern: string, successLabel: string) => {
 try {
 setLoading(true);
 setMessage(null);
 setError(null);

 const encoded = encodeURIComponent(pattern);
 await api.post(`/public/cache/invalidate/pattern/${encoded}`);
 setMessage(successLabel);
 setTimeout(() => loadStats(), 500);
 } catch (err: any) {
 const apiError = err?.response?.data?.error;
 setError(apiError || 'Error al invalidar la caché');
 } finally {
 setLoading(false);
 }
 };

 const invalidateByGroup = async () => {
 if (!groupId) return;
 await invalidatePattern(`^private:group:${groupId}:detail`, `Caché privada del grupo ${groupId} invalidada.`);
 await invalidatePattern(`^private:classification:[^:]*:${groupId}:`, `Clasificación privada del grupo ${groupId} invalidada.`);
 };

 const invalidateByPlayer = async () => {
 if (!playerId) return;
 await invalidatePattern(`^private:player:${playerId}:`, `Caché privada del jugador ${playerId} invalidada.`);
 };

 const invalidateBySeason = async () => {
 if (!seasonId) return;
 await invalidatePattern(`^private:classification:${seasonId}:`, `Clasificaciones privadas de la temporada ${seasonId} invalidadas.`);
 };

 const filteredEntries = useMemo(() => {
 const entries = stats?.entries ?? [];
 return entries.filter((entry) => {
 const matchesType = typeFilter === 'all' || entry.type === typeFilter;
 const matchesSearch = !searchTerm || entry.key.toLowerCase().includes(searchTerm.toLowerCase());
 return matchesType && matchesSearch;
 });
 }, [stats, searchTerm, typeFilter]);

 const formatTime = (seconds: number): string => {
 if (seconds < 60) return `${seconds}s`;
 if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
 return `${Math.floor(seconds / 3600)}h`;
 };

 const getTypeColor = (type: string) => {
 if (type === 'public') return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
 if (type === 'private') return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
 return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
 };

 const copyToClipboard = async (text: string) => {
 try {
 await navigator.clipboard.writeText(text);
 setMessage('Clave copiada al portapapeles');
 } catch {
 setError('No se pudo copiar la clave');
 }
 };

 const downloadJson = () => {
 if (!stats) return;
 const json = JSON.stringify(stats, null, 2);
 const blob = new Blob([json], { type: 'application/json' });
 const url = URL.createObjectURL(blob);
 const link = document.createElement('a');
 link.href = url;
 link.download = `cache-stats-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
 link.click();
 URL.revokeObjectURL(url);
 };

 return (
 <div className="space-y-6">
 <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-slate-900 dark:text-white">⚡ Gestión de caché</h1>
 <p className="text-slate-600 dark:text-slate-400 mt-2">
 Este panel muestra la caché en memoria del API. Se usa para reducir lecturas a BD y acelerar la app.
 La caché se limpia al reiniciar la API.
 </p>
 </div>
 <div className="flex flex-col items-end gap-1">
 <div className="flex flex-wrap gap-2 justify-end">
 <button
 onClick={loadStats}
 disabled={loadingStats}
 className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium transition-colors disabled:opacity-60"
 >
 🔄 Recargar
 </button>
 <button
 onClick={() => setShowRawJson((prev) => !prev)}
 disabled={!stats}
 className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium transition-colors disabled:opacity-60"
 >
 {showRawJson ? 'Ocultar JSON' : 'Ver JSON'}
 </button>
 <button
 onClick={downloadJson}
 disabled={!stats}
 className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium transition-colors disabled:opacity-60"
 >
 Descargar JSON
 </button>
 </div>
 <span className="text-xs text-slate-500 dark:text-slate-400">
 Actualiza métricas, historial y tabla de claves
 </span>
 </div>
 </div>
 </div>

 {showRawJson && stats && (
 <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
 <h2 className="text-lg font-semibold text-slate-900 dark:text-white">JSON actual</h2>
 <pre className="mt-4 max-h-96 overflow-auto text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
{JSON.stringify(stats, null, 2)}
 </pre>
 </div>
 )}

 <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl p-5 text-sm">
 <h2 className="text-base font-semibold text-slate-900 dark:text-white">Resumen rápido</h2>
 <ul className="mt-3 space-y-2">
 <li>Caché pública: TTL semanal. Caché privada: TTL 24h con invalidaciones por grupo activo.</li>
 <li>Si hay muchos misses, la caché aún no está caliente o se está invalidando con frecuencia.</li>
 <li>Si el hit rate es bajo de forma sostenida, revisa TTL e invalidaciones.</li>
 </ul>
 </div>

 <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
 <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Glosario de métricas</h2>
 <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-300">
 <div><strong>Entradas:</strong> claves en caché actualmente.</div>
 <div><strong>Hit Rate:</strong> porcentaje de lecturas resueltas desde caché.</div>
 <div><strong>Hits:</strong> lecturas servidas desde caché.</div>
 <div><strong>Misses:</strong> lecturas que llegaron a BD/servicio.</div>
 <div><strong>Sets:</strong> escrituras en caché.</div>
 <div><strong>Invalidations:</strong> borrados manuales o automáticos.</div>
 <div><strong>Expirations:</strong> entradas caducadas por TTL.</div>
 </div>
 </div>

 {stats && (
 <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
 <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4">
 <div className="text-3xl font-bold text-amber-600">{stats.size}</div>
 <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Entradas en caché</p>
 </div>
 <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-4">
 <div className="text-3xl font-bold text-green-600">{stats.metrics.hitRate.toFixed(1)}%</div>
 <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Tasa de aciertos</p>
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
 <div className="text-3xl font-bold text-amber-600">{stats.metrics.sets}</div>
 <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Sets</p>
 </div>
 </div>
 )}

 <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Invalidación global</h2>
 <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
 Borra entradas de caché para forzar recálculo inmediato.
 </p>
 </div>
 <div className="flex flex-col items-start sm:items-end gap-2">
 <div className="flex flex-wrap gap-2">
 <button
 onClick={invalidateAllCache}
 disabled={loading}
 className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium transition-colors whitespace-nowrap"
 >
 {loading ? 'Invalidando...' : 'Pública'}
 </button>
 <button
 onClick={invalidatePrivateCache}
 disabled={loading}
 className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium transition-colors whitespace-nowrap"
 >
 {loading ? 'Invalidando...' : 'Privada'}
 </button>
 <button
 onClick={invalidateAllScopesCache}
 disabled={loading}
 className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium transition-colors whitespace-nowrap"
 >
 {loading ? 'Invalidando...' : 'Todo'}
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
 {message}
 </div>
 )}

 {error && (
 <div className="mt-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 text-sm">
 {error}
 </div>
 )}
 </div>

 <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
 <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Invalidación por entidad</h2>
 <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="space-y-2">
 <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Grupo ID</label>
 <input value={groupId} onChange={e => setGroupId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
 <button onClick={invalidateByGroup} disabled={!groupId || loading} className="px-3 py-2 rounded-lg bg-amber-600 text-white text-sm">Invalidar grupo</button>
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Jugador ID</label>
 <input value={playerId} onChange={e => setPlayerId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
 <button onClick={invalidateByPlayer} disabled={!playerId || loading} className="px-3 py-2 rounded-lg bg-amber-600 text-white text-sm">Invalidar jugador</button>
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Temporada ID</label>
 <input value={seasonId} onChange={e => setSeasonId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
 <button onClick={invalidateBySeason} disabled={!seasonId || loading} className="px-3 py-2 rounded-lg bg-amber-600 text-white text-sm">Invalidar temporada</button>
 </div>
 </div>
 </div>

 <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
 <div className="p-6 border-b border-slate-200 dark:border-slate-700">
 <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
 <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
 Entradas en caché ({stats?.size || 0})
 </h2>
 <div className="flex flex-col sm:flex-row gap-2">
 <input
 value={searchTerm}
 onChange={e => setSearchTerm(e.target.value)}
 placeholder="Buscar por clave"
 className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
 />
 <select
 value={typeFilter}
 onChange={e => setTypeFilter(e.target.value as any)}
 className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
 >
 <option value="all">Todos</option>
 <option value="public">Público</option>
 <option value="private">Privado</option>
 <option value="data">Otros</option>
 </select>
 </div>
 </div>
 </div>

 {loadingStats ? (
 <div className="p-8 text-center">
 <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
 <p className="mt-2 text-slate-600 dark:text-slate-400">Cargando datos de caché...</p>
 </div>
 ) : stats && filteredEntries.length > 0 ? (
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
 {filteredEntries.map((entry) => (
 <tr key={entry.key} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
 <td className="px-6 py-4">
 <code className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-900 dark:text-slate-200 font-mono truncate max-w-xs">
 {entry.key}
 </code>
 <div className="mt-1">
 <button
 onClick={() => copyToClipboard(entry.key)}
 className="text-xs text-amber-600 hover:underline"
 >
 Copiar
 </button>
 </div>
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
 {entry.isExpired ? 'Expirado' : `${formatTime(entry.expiresInSeconds)}`}
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
 {invalidatingKey === entry.key ? '...' : 'Borrar'}
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 ) : (
 <div className="p-8 text-center text-slate-600 dark:text-slate-400">
 No hay entradas en caché
 </div>
 )}
 </div>

 <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
 <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Historial de invalidaciones</h2>
 <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
 {(stats?.history ?? []).length === 0 && (
 <div>No hay historial disponible.</div>
 )}
 {(stats?.history ?? []).map((entry, idx) => (
 <div key={`${entry.at}-${idx}`} className="flex flex-wrap gap-2 items-center">
 <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700">{entry.scope}</span>
 <span>{new Date(entry.at).toLocaleString('es-ES')}</span>
 {entry.key && <span className="text-xs">key: {entry.key}</span>}
 {entry.pattern && <span className="text-xs">pattern: {entry.pattern}</span>}
 {entry.userId && <span className="text-xs">user: {entry.userId}</span>}
 </div>
 ))}
 </div>
 </div>

 <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
 <p className="font-semibold">Notas</p>
 <ul className="mt-2 space-y-1">
 <li>Caché pública: TTL semanal. Caché privada: TTL 24h.</li>
 <li>La caché es en memoria y se pierde al reiniciar la API.</li>
 <li>Si ves datos antiguos en el navegador, haz un hard refresh.</li>
 </ul>
 </div>
 </div>
 );
}



