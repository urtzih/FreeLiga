import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

interface Row { playerId: string; playerName: string; nickname?: string; wins: number; losses: number; winPercentage: number; setsWon: number; setsLost: number; average: number; }

export default function History() {
  const [filters, setFilters] = useState({ startDate: '', endDate: '', seasonId: '' });

  const { data: classification = [], isLoading } = useQuery<Row[]>({
    queryKey: ['historyClassification', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', new Date(filters.startDate).toISOString());
      if (filters.endDate) params.append('endDate', new Date(filters.endDate).toISOString());
      if (filters.seasonId) params.append('seasonId', filters.seasonId);
      const { data } = await api.get(`/classification?${params.toString()}`);
      return data;
    }
  });

  const { data: seasons = [] } = useQuery<any[]>({ queryKey: ['seasons'], queryFn: async () => { const { data } = await api.get('/seasons'); return data; } });

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Historia</h1>
        <p className="text-pink-100">Explora rendimiento acumulado en cualquier rango temporal o temporada.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Rango y Temporada</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fecha Inicio</label>
            <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fecha Fin</label>
            <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Temporada</label>
            <select value={filters.seasonId} onChange={e => setFilters({ ...filters, seasonId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              <option value="">Todas</option>
              {seasons.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Se excluye la selección de grupos para simplificar: usa temporada + fechas.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Resultados ({classification.length})</h2>
        </div>
        {isLoading ? (
          <div className="p-12 text-center text-slate-600 dark:text-slate-400">Calculando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Jugador</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Victorias</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Derrotas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">% Victorias</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sets +</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sets -</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {classification.map(row => (
                  <tr key={row.playerId} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{row.playerName}</div>
                      {row.nickname && <div className="text-xs text-slate-500 dark:text-slate-400">"{row.nickname}"</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="font-bold text-green-600 dark:text-green-400">{row.wins}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="font-bold text-red-600 dark:text-red-400">{row.losses}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="font-medium text-blue-600 dark:text-blue-400">{row.winPercentage}%</span></td>
                    <td className="px-6 py-4 whitespace-nowrap">{row.setsWon}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{row.setsLost}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`font-bold ${row.average>=0?'text-green-600 dark:text-green-400':'text-red-600 dark:text-red-400'}`}>{row.average>=0?'+':''}{row.average}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {classification.length === 0 && (
              <div className="p-12 text-center text-slate-600 dark:text-slate-400">Sin partidos en el rango seleccionado.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
