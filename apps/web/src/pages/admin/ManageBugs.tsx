import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Loader from '../../components/Loader';
import { useToast } from '../../contexts/ToastContext';

interface BugComment {
  id: string;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

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
  comments?: BugComment[];
}

export default function ManageBugs() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expandedBugs, setExpandedBugs] = useState<Set<string>>(new Set());
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

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

  const deleteBugMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/bugs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
      showToast('Bug eliminado permanentemente', 'success');
    }
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ bugId, comment }: { bugId: string; comment: string }) => {
      const { data } = await api.post(`/bugs/${bugId}/comments`, { comment });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bugs'] });
      setCommentTexts(prev => ({ ...prev, [variables.bugId]: '' }));
      showToast('Comentario añadido', 'success');
    }
  });

  const toggleBugExpansion = (bugId: string) => {
    setExpandedBugs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bugId)) {
        newSet.delete(bugId);
      } else {
        newSet.add(bugId);
      }
      return newSet;
    });
  };

  const handleDeleteBug = (bugId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este bug permanentemente? Esta acción no se puede deshacer.')) {
      deleteBugMutation.mutate(bugId);
    }
  };

  const handleAddComment = (bugId: string) => {
    const comment = commentTexts[bugId]?.trim();
    if (!comment) {
      showToast('El comentario no puede estar vacío', 'error');
      return;
    }
    addCommentMutation.mutate({ bugId, comment });
  };

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
          <div className="p-12 text-center"><Loader /></div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {bugs.map(bug => {
              const isExpanded = expandedBugs.has(bug.id);
              const hasComments = bug.comments && bug.comments.length > 0;
              
              return (
                <div key={bug.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-6">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          bug.status === 'OPEN' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' :
                          bug.status === 'ACK' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                          'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                        }`}>
                          {bug.status}
                        </span>
                        {bug.appVersion && (
                          <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium">
                            v{bug.appVersion}
                          </span>
                        )}
                        {hasComments && (
                          <span className="text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-medium">
                            💬 {bug.comments.length}
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

                      {/* Comments section */}
                      {isExpanded && (
                        <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">💬 Comentarios / Retroalimentación</h3>
                          
                          {/* Existing comments */}
                          {hasComments && (
                            <div className="space-y-2 mb-4">
                              {bug.comments.map(comment => (
                                <div key={comment.id} className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                      {comment.user.email}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                      {new Date(comment.createdAt).toLocaleString('es-ES')}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line">
                                    {comment.comment}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add new comment */}
                          <div className="flex gap-2">
                            <textarea
                              value={commentTexts[bug.id] || ''}
                              onChange={(e) => setCommentTexts(prev => ({ ...prev, [bug.id]: e.target.value }))}
                              placeholder="Añade retroalimentación o comentarios sobre este bug..."
                              className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              rows={2}
                            />
                            <button
                              onClick={() => handleAddComment(bug.id)}
                              disabled={addCommentMutation.isPending}
                              className="px-4 py-2 text-sm bg-amber-600 text-white hover:bg-amber-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {addCommentMutation.isPending ? '...' : 'Añadir'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => toggleBugExpansion(bug.id)}
                        className="px-3 py-1 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60 rounded-lg"
                        title={isExpanded ? 'Ocultar comentarios' : 'Ver/Añadir comentarios'}
                      >
                        {isExpanded ? '▲ Ocultar' : '💬 Comentar'}
                      </button>
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
                      <button
                        onClick={() => handleDeleteBug(bug.id)}
                        disabled={deleteBugMutation.isPending}
                        className="px-3 py-1 text-xs bg-red-600 text-white hover:bg-red-700 rounded-lg disabled:opacity-50"
                        title="Eliminar permanentemente"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {bugs.length === 0 && (
              <div className="p-12 text-center text-slate-600 dark:text-slate-400">No hay bugs con este filtro.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
