import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../hooks/useGroup';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../lib/api';
import { toast } from 'react-hot-toast';

interface Match {
  id: string;
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  group?: { season?: { isActive?: boolean } };
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
  const { t, dateFnsLocale } = useLanguage();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({ scheduledDate: '', location: '' });
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'past'>('upcoming');

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
        toast.error(t('scheduledMatches.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [currentGroup?.id, t]);

  const isPlayerInMatch = (match: Match) => {
    return match.player1.id === user?.player?.id || match.player2.id === user?.player?.id;
  };

  const canEdit = (match: Match) => {
    const isAdmin = user?.role === 'ADMIN';
    const isActiveSeason = match.group?.season?.isActive === true;
    return isAdmin || (isPlayerInMatch(match) && isActiveSeason);
  };

  const getUpdateErrorMessage = (error: any) => {
    const apiError = error?.response?.data?.error;
    if (typeof apiError === 'string') {
      return apiError;
    }
    return t('scheduledMatches.updateError');
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
      toast.success(t('scheduledMatches.updateSuccess'));
    } catch (error: any) {
      toast.error(getUpdateErrorMessage(error));
    }
  };

  const handleCancel = async (matchId: string) => {
    if (!confirm(t('scheduledMatches.cancelConfirm'))) return;

    try {
      await api.delete(`/matches/${matchId}`);

      setMatches(prev => prev.filter(m => m.id !== matchId));
      toast.success(t('scheduledMatches.cancelSuccess'));
    } catch (error: any) {
      toast.error(error.message || t('scheduledMatches.cancelError'));
    }
  };

  if (groupLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-club-yellow-600"></div>
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-club-black-600">{t('scheduledMatches.noActiveGroup')}</p>
      </div>
    );
  }

  const filteredMatches = getFilteredMatches();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-club-black-900 mb-2">{t('scheduledMatches.title')}</h1>
        <p className="text-club-black-600">{currentGroup.name}</p>
      </div>

      <div className="flex gap-3 mb-6">
        {(['all', 'upcoming', 'past'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === status
                ? 'bg-club-black-900 text-club-yellow-300'
                : 'bg-amber-100 text-club-black-800 hover:bg-amber-200'
            }`}
          >
            {status === 'all' && t('scheduledMatches.filterAll')}
            {status === 'upcoming' && t('scheduledMatches.filterUpcoming')}
            {status === 'past' && t('scheduledMatches.filterPast')}
          </button>
        ))}
      </div>

      {filteredMatches.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md border border-amber-200 p-8 text-center">
          <p className="text-club-black-600 text-lg">
            {filterStatus === 'upcoming'
              ? t('scheduledMatches.emptyUpcoming')
              : filterStatus === 'past'
              ? t('scheduledMatches.emptyPast')
              : t('scheduledMatches.emptyAll')}
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
                className={`bg-white rounded-lg shadow-md border border-amber-200 p-6 border-l-4 transition-all ${
                  isPast ? 'border-gray-400 opacity-75' : 'border-club-yellow-500'
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <h3 className="font-semibold text-club-black-900 text-lg mb-2">
                      {match.player1.name}
                    </h3>
                    <p className="text-club-black-600 text-center mb-2">vs</p>
                    <h3 className="font-semibold text-club-black-900 text-lg">
                      {match.player2.name}
                    </h3>
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    {isEditing ? (
                      <>
                        <div>
                          <label className="text-sm font-medium text-club-black-700">{t('scheduledMatches.fieldDateTime')}</label>
                          <input
                            type="datetime-local"
                            value={editFormData.scheduledDate}
                            onChange={(e) =>
                              setEditFormData(prev => ({
                                ...prev,
                                scheduledDate: e.target.value,
                              }))
                            }
                            className="w-full mt-1 px-3 py-2 border border-amber-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-club-black-700">{t('scheduledMatches.fieldLocation')}</label>
                          <input
                            type="text"
                            value={editFormData.location}
                            onChange={(e) =>
                              setEditFormData(prev => ({
                                ...prev,
                                location: e.target.value,
                              }))
                            }
                            className="w-full mt-1 px-3 py-2 border border-amber-200 rounded-lg"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-club-black-600">📅</span>
                          <div>
                            <p className="text-sm text-club-black-600">{t('scheduledMatches.fieldDateTime')}</p>
                            <p className="font-semibold text-club-black-900">
                              {format(matchDate, 'EEEE d MMMM yyyy HH:mm', { locale: dateFnsLocale })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-club-black-600">📍</span>
                          <div>
                            <p className="text-sm text-club-black-600">{t('scheduledMatches.fieldLocation')}</p>
                            <p className="font-semibold text-club-black-900">{match.location}</p>
                          </div>
                        </div>
                        {match.googleEventId && (
                          <div className="flex items-center gap-2">
                            <span className="text-club-black-600">🔗</span>
                            <p className="text-sm text-club-yellow-700">{t('scheduledMatches.googleSync')}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {canEditMatch && (
                  <div className="mt-4 flex gap-2 border-t pt-4">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(match.id)}
                          className="flex-1 bg-club-yellow-500 text-club-black-900 py-2 rounded-lg hover:bg-club-yellow-400 transition-colors font-medium"
                        >
                          {t('scheduledMatches.save')}
                        </button>
                        <button
                          onClick={() => setEditingMatchId(null)}
                          className="flex-1 bg-gray-300 text-club-black-800 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                        >
                          {t('scheduledMatches.cancelEdit')}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditClick(match)}
                          className="flex-1 bg-club-black-900 text-club-yellow-300 py-2 rounded-lg hover:bg-club-black-800 transition-colors font-medium"
                        >
                          {t('scheduledMatches.edit')}
                        </button>
                        <button
                          onClick={() => handleCancel(match.id)}
                          className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                          {t('scheduledMatches.cancelMatch')}
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

      {matches.length > 0 && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-club-black-900">{matches.length}</p>
            <p className="text-club-black-600 text-sm">{t('scheduledMatches.totalMatches')}</p>
          </div>
          <div className="bg-club-yellow-50 border border-club-yellow-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-club-yellow-700">
              {matches.filter(m => new Date(m.scheduledDate) >= new Date()).length}
            </p>
            <p className="text-club-black-600 text-sm">{t('scheduledMatches.totalUpcoming')}</p>
          </div>
          <div className="bg-gray-100 border border-amber-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-club-black-700">
              {matches.filter(m => new Date(m.scheduledDate) < new Date()).length}
            </p>
            <p className="text-club-black-600 text-sm">{t('scheduledMatches.totalPast')}</p>
          </div>
          <div className="bg-club-black-900 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-club-yellow-300">
              {matches.filter(m => m.googleEventId).length}
            </p>
            <p className="text-club-yellow-100 text-sm">{t('scheduledMatches.totalGoogle')}</p>
          </div>
        </div>
      )}
    </div>
  );
}


