import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../hooks/useGroup';
import CalendarView from '../components/Calendar/CalendarView';
import ScheduleMatchForm from '../components/Calendar/ScheduleMatchForm';
import MatchDetail from '../components/Calendar/MatchDetail';
import api from '../lib/api';
import { toast } from 'react-hot-toast';

interface Match {
  id: string;
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  scheduledDate: string;
  date?: string;
  location: string;
  googleEventId?: string;
  gamesP1?: number | null;
  gamesP2?: number | null;
  matchStatus?: string;
  isScheduled?: boolean;
}

interface Player {
  id: string;
  name: string;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const { currentGroup, loading: groupLoading } = useGroup();
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  // Helpers para vistas
  const uniqueMatches = useMemo(() => {
    const map = new Map<string, Match>();
    matches.forEach(m => {
      if (m.id) {
        map.set(m.id, m);
      }
    });
    return Array.from(map.values());
  }, [matches]);

  const getOpponentName = (match: Match) => {
    const currentId = user?.player?.id;
    if (!currentId) return `${match.player1.name} vs ${match.player2.name}`;
    if (match.player1.id === currentId) return match.player2.name;
    if (match.player2.id === currentId) return match.player1.name;
    return `${match.player1.name} vs ${match.player2.name}`;
  };

  const upcomingMatches = uniqueMatches.filter(m => {
    // Solo partidos programados (isScheduled = true o sin resultado)
    const isScheduled = m.isScheduled === true || (m.gamesP1 === null && m.gamesP2 === null);
    if (!isScheduled) return false;
    
    // Excluir partidos ya jugados
    if (m.matchStatus === 'PLAYED' && m.gamesP1 !== null && m.gamesP2 !== null) return false;
    
    // Incluir solo partidos futuros (programados)
    if (m.scheduledDate) {
      const matchDate = new Date(m.scheduledDate);
      const now = new Date();
      return matchDate >= now;
    }
    return false;
  });

  const playedMatches = uniqueMatches
    .filter(m => m.matchStatus === 'PLAYED' && m.gamesP1 !== null && m.gamesP2 !== null)
    .sort((a, b) => {
      const dateA = new Date(a.date || a.scheduledDate).getTime();
      const dateB = new Date(b.date || b.scheduledDate).getTime();
      return dateB - dateA;
    });

  // Fetch scheduled matches
  useEffect(() => {
    if (!currentGroup?.id) return;

    const fetchMatches = async () => {
      try {
        setLoading(true);
        // Cargar ambos: partidos programados Y partidos jugados (solo con resultado)
        const [scheduledRes, playedRes] = await Promise.all([
          api.get('/matches', {
            params: {
              groupId: currentGroup.id,
              scheduled: 'true',
            },
          }),
          api.get('/matches', {
            params: {
              groupId: currentGroup.id,
              matchStatus: 'PLAYED',
              withResults: 'true',
            },
          }),
        ]);

        // Combinar sin duplicados
        const merged = new Map<string, Match>();
        [...(scheduledRes.data || []), ...(playedRes.data || [])].forEach((m: Match) => {
          merged.set(m.id, m);
        });
        const allMatches = Array.from(merged.values());
        console.log('All matches loaded:', allMatches);
        setMatches(allMatches);
      } catch (error) {
        console.error('Error fetching matches:', error);
        toast.error('Error al cargar los partidos');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [currentGroup?.id]);

  // Fetch group players
  useEffect(() => {
    if (!currentGroup?.id) return;

    const fetchPlayers = async () => {
      try {
        const response = await api.get(`/groups/${currentGroup.id}/players`);
        console.log('Players loaded from API:', response.data);
        setPlayers(response.data || []);
      } catch (error) {
        console.error('Error fetching players:', error);
      }
    };

    fetchPlayers();
  }, [currentGroup?.id]);

  // Check Google Calendar connection status
  useEffect(() => {
    const checkGoogleConnection = async () => {
      try {
        const response = await api.get('/auth/google-calendar/status');
        setIsGoogleConnected(response.data.connected || false);
      } catch (error) {
        console.error('Error checking Google Calendar status:', error);
      }
    };

    checkGoogleConnection();
  }, []);

  const handleScheduleMatch = async (data: {
    player1Id: string;
    player2Id: string;
    scheduledDate: string;
    location: string;
  }) => {
    try {
      // Convertir scheduledDate a ISO string completo
      const scheduledDateISO = new Date(data.scheduledDate).toISOString();
      
      console.log('Sending match data:', {
        groupId: currentGroup?.id,
        player1Id: data.player1Id,
        player2Id: data.player2Id,
        scheduledDate: scheduledDateISO,
        location: data.location,
      });

      const response = await api.post('/matches', {
        groupId: currentGroup?.id,
        player1Id: data.player1Id,
        player2Id: data.player2Id,
        scheduledDate: scheduledDateISO,
        location: data.location,
      });

      setMatches(prev => {
        const map = new Map<string, Match>();
        [...prev, response.data].forEach(m => {
          if (m.id) map.set(m.id, m);
        });
        return Array.from(map.values());
      });
      setShowForm(false);
      toast.success('¡Partido programado exitosamente!');
    } catch (error: any) {
      console.error('Error scheduling match:', error.response?.data || error);
      console.error('Full error object:', JSON.stringify(error.response?.data, null, 2));
      toast.error(error.response?.data?.error || error.message || 'Error al programar el partido');
    }
  };

  const handleConnectGoogle = async () => {
    try {
      setIsConnectingGoogle(true);
      const response = await api.get('/auth/google-calendar/auth-url');
      window.location.href = response.data.authUrl;
    } catch (error: any) {
      toast.error('Error al conectar con Google Calendar');
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await api.post('/auth/google-calendar/disconnect');
      setIsGoogleConnected(false);
      toast.success('Google Calendar desconectado');
    } catch (error: any) {
      toast.error('Error al desconectar Google Calendar');
    }
  };

  const isPlayerInMatch = (match: Match) => {
    return match.player1.id === user?.player?.id || match.player2.id === user?.player?.id;
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
      <div className="p-6 text-center">
        <p className="text-gray-600">No tienes un grupo activo</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-md border-b border-slate-200 dark:border-slate-700 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1">Calendario</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{currentGroup.name}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Upcoming Matches List */}
        <div id="upcoming" className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Próximos Partidos</h2>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {upcomingMatches.length > 0 ? (
              upcomingMatches.map(match => (
                <div
                  key={match.id}
                  onClick={() => {
                    setSelectedMatch(match);
                    setShowDetail(true);
                  }}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        vs {getOpponentName(match)}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        📍 {match.location}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(match.scheduledDate).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {match.googleEventId && (
                      <div className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded whitespace-nowrap">
                        📅 Google
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-center py-8">No hay próximos partidos programados</p>
            )}
          </div>
        </div>

        {/* Action Button - Programar */}
        <button
          onClick={() => setShowForm(!showForm)}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
            showForm
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {showForm ? '✕ Cancelar' : '+ Programar'}
        </button>

        {/* Schedule Form Modal */}
        {showForm && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
            <ScheduleMatchForm
              groupId={currentGroup.id}
              players={players}
              matches={matches}
              currentUserId={user?.player?.id}
              onSubmit={handleScheduleMatch}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Calendar - Full Width */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Calendario Mensual</h2>
          <div className="overflow-x-auto">
            <CalendarView
              matches={uniqueMatches}
              currentUserId={user?.player?.id}
              onMatchClick={(match) => {
                setSelectedMatch(match);
                setShowDetail(true);
              }}
            />
          </div>
        </div>

        {/* Match Detail Modal */}
        {showDetail && selectedMatch && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetail(false)}
          >
            <div 
              className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <MatchDetail
                match={selectedMatch}
                isPlayer={isPlayerInMatch(selectedMatch)}
                currentUserId={user?.player?.id}
                onCancel={() => setShowDetail(false)}
                onEdit={() => {
                  setShowDetail(false);
                }}
                onDelete={async () => {
                  try {
                    await api.delete(`/matches/${selectedMatch.id}`);
                    setMatches(prev => prev.filter(m => m.id !== selectedMatch.id));
                    setShowDetail(false);
                    toast.success('Partido cancelado');
                  } catch (error: any) {
                    toast.error(error.message || 'Error al cancelar el partido');
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Played Matches */}
        {playedMatches.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Partidos Jugados</h2>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {playedMatches.slice(0, 5).map(match => {
                const currentId = user?.player?.id;
                const userIsP1 = match.player1.id === currentId;
                const userIsP2 = match.player2.id === currentId;
                const userGames = userIsP1 ? match.gamesP1 : userIsP2 ? match.gamesP2 : match.gamesP1;
                const oppGames = userIsP1 ? match.gamesP2 : userIsP2 ? match.gamesP1 : match.gamesP2;
                const icon = userIsP1 || userIsP2
                  ? (userGames ?? 0) > (oppGames ?? 0) ? '✅' : (userGames ?? 0) === (oppGames ?? 0) ? '➖' : '❌'
                  : '🏅';
                const resultText = `${match.gamesP1 ?? '-'}-${match.gamesP2 ?? '-'}`;
                const displayDate = new Date(match.date || match.scheduledDate).toLocaleDateString('es-ES');

                return (
                  <div key={match.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-2xl flex-shrink-0">{icon}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white truncate">vs {getOpponentName(match)}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{displayDate}</p>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white flex-shrink-0">{resultText}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Google Calendar Integration */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 dark:text-white">Google Calendar</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {isGoogleConnected
                  ? '✓ Conectado - Sincronización automática'
                  : 'Conecta para sincronizar partidos con tu calendario'}
              </p>
            </div>
            <button
              onClick={isGoogleConnected ? handleDisconnectGoogle : handleConnectGoogle}
              disabled={isConnectingGoogle}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm ${
                isGoogleConnected
                  ? 'bg-gray-400 text-white hover:bg-gray-500'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:bg-gray-300`}
            >
              {isConnectingGoogle ? 'Conectando...' : isGoogleConnected ? 'Desconectar' : 'Conectar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
