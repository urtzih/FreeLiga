import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../hooks/useGroup';
import api from '../lib/api';
import { toast } from 'react-hot-toast';

interface Match {
  id: string;
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  scheduledDate: string;
  location: string;
  googleEventId?: string;
  gamesP1?: number;
  gamesP2?: number;
  matchStatus?: string;
}

interface EditFormData {
  scheduledDate: string;
  location: string;
}

export default function ScheduledMatchesPage() {
  const { user } = useAuth();
  const { currentGroup, loading: groupLoading } = useGroup();
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({ scheduledDate: '', location: '' });
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  // Fetch scheduled matches
  useEffect(() => {
    if (!currentGroup?.id) return;

    const fetchMatches = async () => {
      try {
        setLoading(true);
        const response = await api.get('/matches', {
          params: {
            groupId: currentGroup.id,
            scheduled: 'true',
          },
        });
        const matchesData = response.data;
        setMatches(matchesData || []);
      } catch (error) {
        console.error('Error fetching matches:', error);
        toast.error('Error al cargar los partidos programados');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [currentGroup?.id]);

  const isPlayerInMatch = (match: Match) => {
    return match.player1.id === user?.player?.id || match.player2.id === user?.player?.id;
  };

  const canEdit = (match: Match) => {
    return isPlayerInMatch(match) || user?.role === 'ADMIN';
  };

  const getFilteredMatches = () => {
    const now = new Date();
    
    return matches.filter(match => {
      const matchDate = new Date(match.scheduledDate);
      const isPast = matchDate < now;
      
      if (filterStatus === 'upcoming') return !isPast;
      if (filterStatus === 'past') return isPast;
      return true;
    }).sort((a, b) => {
      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
    });
  };

  const handleEditClick = (match: Match) => {
    setEditingMatchId(match.id);
    setEditFormData({
      scheduledDate: match.scheduledDate.replace('Z', '').slice(0, 16),
      location: match.location,
    });
  };

  const handleSaveEdit = async (matchId: string) => {
    try {
      const response = await api.put(`/matches/${matchId}`, editFormData);
      const matchData = response.data;

      setMatches(prev => prev.map(m => m.id === matchId ? matchData : m));
      setEditingMatchId(null);
      toast.success('Partido actualizado exitosamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el partido');
    }
  };

  const handleCancel = async (matchId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar este partido?')) return;

    try {
      await api.delete(`/matches/${matchId}`);

      setMatches(prev => prev.filter(m => m.id !== matchId));
      toast.success('Partido cancelado exitosamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al cancelar el partido');
    }
  };

  if (groupLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-gray-600">No tienes un grupo activo</p>
      </div>
    );
  }

  const filteredMatches = getFilteredMatches();

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Partidos Programados</h1>
        <p className="text-gray-600">{currentGroup.name}</p>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-3 mb-6">
        {(['all', 'upcoming', 'past'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {status === 'all' && 'Todos'}
            {status === 'upcoming' && 'Próximos'}
            {status === 'past' && 'Pasados'}
          </button>
        ))}
      </div>

      {/* Matches List */}
      {filteredMatches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 text-lg">
            {filterStatus === 'upcoming'
              ? 'No hay partidos programados proximamente'
              : filterStatus === 'past'
              ? 'No hay partidos pasados'
              : 'No hay partidos programados'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map(match => {
            const isEditing = editingMatchId === match.id;
            const matchDate = new Date(match.scheduledDate);
            const isPast = matchDate < new Date();
            const canEditMatch = canEdit(match) && !isPast;

            return (
              <div
                key={match.id}
                className={`bg-white rounded-lg shadow-md p-6 border-l-4 transition-all ${
                  isPast ? 'border-gray-400 opacity-75' : 'border-blue-500'
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Players */}
                  <div className="md:col-span-1">
                    <h3 className="font-semibold text-gray-800 text-lg mb-2">
                      {match.player1.name}
                    </h3>
                    <p className="text-gray-600 text-center mb-2">vs</p>
                    <h3 className="font-semibold text-gray-800 text-lg">
                      {match.player2.name}
                    </h3>
                  </div>

                  {/* Date and Location */}
                  <div className="md:col-span-2 space-y-3">
                    {isEditing ? (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Fecha y Hora</label>
                          <input
                            type="datetime-local"
                            value={editFormData.scheduledDate}
                            onChange={(e) =>
                              setEditFormData(prev => ({
                                ...prev,
                                scheduledDate: e.target.value,
                              }))
                            }
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Lugar</label>
                          <input
                            type="text"
                            value={editFormData.location}
                            onChange={(e) =>
                              setEditFormData(prev => ({
                                ...prev,
                                location: e.target.value,
                              }))
                            }
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">📅</span>
                          <div>
                            <p className="text-sm text-gray-600">Fecha y Hora</p>
                            <p className="font-semibold text-gray-800">
                              {format(matchDate, 'EEEE d MMMM yyyy HH:mm', { locale: es })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">📍</span>
                          <div>
                            <p className="text-sm text-gray-600">Lugar</p>
                            <p className="font-semibold text-gray-800">{match.location}</p>
                          </div>
                        </div>
                        {match.googleEventId && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">🔗</span>
                            <p className="text-sm text-blue-600">Sincronizado con Google Calendar</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {canEditMatch && (
                  <div className="mt-4 flex gap-2 border-t pt-4">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(match.id)}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingMatchId(null)}
                          className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500 transition-colors font-medium"
                        >
                          Cancelar Edición
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditClick(match)}
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleCancel(match.id)}
                          className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                          Cancelar Partido
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      {matches.length > 0 && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{matches.length}</p>
            <p className="text-gray-600 text-sm">Total de Partidos</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {matches.filter(m => new Date(m.scheduledDate) >= new Date()).length}
            </p>
            <p className="text-gray-600 text-sm">Próximos</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">
              {matches.filter(m => new Date(m.scheduledDate) < new Date()).length}
            </p>
            <p className="text-gray-600 text-sm">Pasados</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-orange-600">
              {matches.filter(m => m.googleEventId).length}
            </p>
            <p className="text-gray-600 text-sm">En Google Calendar</p>
          </div>
        </div>
      )}
    </div>
  );
}
