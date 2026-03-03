import { useState } from 'react';
import api from '../../lib/api';

export default function ManagePublicCache() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const invalidateCache = async () => {
        try {
            setLoading(true);
            setMessage(null);
            setError(null);

            const { data } = await api.post('/public/cache/invalidate/admin');
            const when = data?.at ? new Date(data.at).toLocaleString('es-ES') : 'ahora';
            setMessage(`Caché pública invalidada correctamente (${when}).`);
        } catch (err: any) {
            const apiMessage = err?.response?.data?.error;
            setError(apiMessage || 'No se pudo invalidar la caché pública');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Caché Pública</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                    Invalida la caché de endpoints públicos para forzar recálculo inmediato en la home pública.
                </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Acción rápida</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Afecta a: public:stats, public:stats:historical, public:recent-matches, public:groups-summary y clasificación pública por grupo.
                        </p>
                    </div>
                    <button
                        onClick={invalidateCache}
                        disabled={loading}
                        className="px-5 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium transition-colors"
                    >
                        {loading ? 'Invalidando...' : 'Invalidar caché pública'}
                    </button>
                </div>

                {message && (
                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 text-green-700 px-4 py-3 text-sm">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
