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
  gamesP1?: number;
  gamesP2?: number;
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
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Calendario de Partidos</h1>
        <p className="text-gray-600">{currentGroup.name}</p>
      </div>

      {/* Google Calendar Integration */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800">Google Calendar</h3>
          <p className="text-sm text-gray-600">
            {isGoogleConnected
              ? '✓ Conectado - Los partidos se sincronizan automáticamente'
              : 'Conecta con Google Calendar para sincronizar partidos'}
          </p>
        </div>
        <button
          onClick={isGoogleConnected ? handleDisconnectGoogle : handleConnectGoogle}
          disabled={isConnectingGoogle}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isGoogleConnected
              ? 'bg-gray-400 text-white hover:bg-gray-500'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:bg-gray-300`}
        >
          {isConnectingGoogle ? 'Conectando...' : isGoogleConnected ? 'Desconectar' : 'Conectar'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <CalendarView
            matches={uniqueMatches}
            currentUserId={user?.player?.id}
            onMatchClick={(match) => {
              setSelectedMatch(match);
              setShowDetail(true);
            }}
          />
        </div>

        {/* Sidebar - Schedule Form or Match Detail */}
        <div className="space-y-4">
          {showDetail && selectedMatch ? (
            <MatchDetail
              match={selectedMatch}
              isPlayer={isPlayerInMatch(selectedMatch)}
              currentUserId={user?.player?.id}
              onCancel={() => setShowDetail(false)}
              onEdit={() => {
                // TODO: Implementar edición
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
          ) : showForm ? (
            <ScheduleMatchForm
              groupId={currentGroup.id}
              players={players}
              matches={matches}
              currentUserId={user?.player?.id}
              onSubmit={handleScheduleMatch}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
            >
              + Programar Partido
            </button>
          )}
        </div>
      </div>

      {/* Upcoming Matches List */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Próximos Partidos</h2>
        <div className="space-y-3">
          {upcomingMatches.map(match => (
            <div
              key={match.id}
              onClick={() => {
                setSelectedMatch(match);
                setShowDetail(true);
              }}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex-1">
                <p className="font-semibold text-gray-800">
                  {getOpponentName(match)}
                </p>
                <p className="text-sm text-gray-600">
                  📍 {match.location}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(match.scheduledDate).toLocaleString('es-ES')}
                </p>
              </div>
              {match.googleEventId && (
                <div className="ml-4 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  📅 Google
                </div>
              )}
            </div>
          ))}
        </div>
        {upcomingMatches.length === 0 && (
          <p className="text-gray-500 text-center py-4">No hay próximos partidos programados</p>
        )}
      </div>

      {/* Recent Matches */}
      {playedMatches.length > 0 && (
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xl font-bold text-slate-900">Jugados</h2>
          </div>
          <div className="divide-y divide-slate-200">
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
                <div key={match.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <p className="font-medium text-slate-900">vs {getOpponentName(match)}</p>
                        <p className="text-sm text-slate-600">{displayDate}</p>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-slate-900">{resultText}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
