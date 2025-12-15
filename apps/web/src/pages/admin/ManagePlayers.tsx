import api from '../../lib/api';
import Loader from '../../components/Loader';
import { useAdminQuery } from '../../hooks/useAdminQuery';

export default function ManagePlayers() {
    const { data: players = [], isLoading } = useAdminQuery({
        queryKey: ['players'],
        queryFn: async () => {
            const { data } = await api.get('/players');
            return data;
        },
    });

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gestionar Jugadores</h1>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center"><Loader /></div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Teléfono</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Grupo Actual</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {players.map((player: any) => (
                                <tr key={player.id}>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">{player.name}</p>
                                            {player.nickname && (
                                                <p className="text-sm text-slate-500 dark:text-slate-400">"{player.nickname}"</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{player.email || '-'}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{player.phone || '-'}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                        {player.currentGroup?.name || 'Sin grupo'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
