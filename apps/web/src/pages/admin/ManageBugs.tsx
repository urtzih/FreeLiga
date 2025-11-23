import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

interface BugReport {
  id: string;
  description: string;
  email?: string;
  status: 'OPEN' | 'ACK' | 'CLOSED';
  userAgent?: string;
  appVersion?: string;
  attachments?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ManageBugs() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: bugs = [], isLoading } = useQuery<BugReport[]>({
    queryKey: ['bugs', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await api.get(`/bugs?${params.toString()}`);
      return data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'OPEN' | 'ACK' | 'CLOSED' }) => {
      const { data } = await api.put(`/bugs/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
    }
  });

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Gestión de Bugs</h1>
        <p className="text-amber-100">Revisión y seguimiento de incidencias</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Filtros</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">Todos los estados</option>
            <option value="OPEN">Abiertos</option>
            <option value="ACK">Reconocidos</option>
            <option value="CLOSED">Cerrados</option>
          </select>
          <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
            Total: <span className="ml-1 font-semibold">{bugs.length}</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Listado de Bugs</h2>
        </div>
        {isLoading ? (
          <div className="p-12 text-center text-slate-600 dark:text-slate-400">Cargando...</div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {bugs.map(bug => (
              <div key={bug.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-6">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                        {bug.status}
                      </span>
                      {bug.appVersion && (
                        <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium">
                          v{bug.appVersion}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line">
                      {bug.description}
                    </p>
                    {bug.attachments && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {bug.attachments.split(':::').map((att, i) => {
                          const [name, data] = att.split('|');
                          return (
                            <a key={i} href={data} download={name} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded hover:underline">
                              📎 {name}
                            </a>
                          );
                        })}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                      {bug.email && <span>📧 {bug.email}</span>}
                      {bug.userAgent && <span title={bug.userAgent}>🖥️ UA: {bug.userAgent.slice(0,60)}{bug.userAgent.length>60?'…':''}</span>}
                      <span>⏱️ {new Date(bug.createdAt).toLocaleString('es-ES')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    {bug.status !== 'OPEN' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: bug.id, status: 'OPEN' })}
                        className="px-3 py-1 text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg"
                      >Reabrir</button>
                    )}
                    {bug.status === 'OPEN' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: bug.id, status: 'ACK' })}
                        className="px-3 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
                      >Reconocer</button>
                    )}
                    {bug.status !== 'CLOSED' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: bug.id, status: 'CLOSED' })}
                        className="px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 rounded-lg"
                      >Cerrar</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {bugs.length === 0 && (
              <div className="p-12 text-center text-slate-600 dark:text-slate-400">No hay bugs con este filtro.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
