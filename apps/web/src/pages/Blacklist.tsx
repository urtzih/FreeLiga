import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useState, useMemo } from 'react';

interface BlacklistPlayer {
  id: string;
  name: string;
  nickname?: string;
  groupName: string;
  playedMatches?: number;
  injuredMatches?: number;
  totalMatches?: number;
  remainingMatches?: number;
}

type SortKey = 'name' | 'groupName' | 'playedMatches' | 'injuredMatches' | 'totalMatches' | 'remainingMatches' | 'unplayedPercentage';
type SortDirection = 'asc' | 'desc';

export default function Blacklist() {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [sortKey, setSortKey] = useState<SortKey>('remainingMatches');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Fetch blacklist for current season
  const {
    data: currentBlacklist,
    isLoading: currentLoading,
    error: currentError
  } = useQuery<BlacklistPlayer[]>({
    queryKey: ['blacklist', 'current'],
    queryFn: async () => {
      const { data } = await api.get('/players/blacklist/current');
      return data;
    },
  });

  // Fetch blacklist history
  const {
    data: historyBlacklist,
    isLoading: historyLoading,
    error: historyError
  } = useQuery<BlacklistPlayer[]>({
    queryKey: ['blacklist', 'history'],
    queryFn: async () => {
      const { data } = await api.get('/players/blacklist/history');
      return data;
    },
  });

  // Sort data based on current sort key and direction
  const sortedData = useMemo(() => {
    const data = activeTab === 'current' ? currentBlacklist : historyBlacklist;
    if (!data) return [];

    const sorted = [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortKey === 'unplayedPercentage') {
        const aTotal = a.totalMatches || 0;
        const bTotal = b.totalMatches || 0;
        aValue = aTotal > 0 ? (((a.remainingMatches || 0) + (a.injuredMatches || 0)) / aTotal) * 100 : 0;
        bValue = bTotal > 0 ? (((b.remainingMatches || 0) + (b.injuredMatches || 0)) / bTotal) * 100 : 0;
      } else {
        aValue = a[sortKey];
        bValue = b[sortKey];
      }

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

      // String comparison
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Number comparison
      if (typeof aValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return sorted;
  }, [currentBlacklist, historyBlacklist, activeTab, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      // Toggle direction if same column clicked
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column selected
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const getSortIndicator = (key: SortKey) => {
    if (sortKey !== key) return ` ${String.fromCodePoint(0x2195)}`;
    return sortDirection === 'asc' ? ` ${String.fromCodePoint(0x2191)}` : ` ${String.fromCodePoint(0x2193)}`;
  };

  const getUnplayedPercentage = (player: BlacklistPlayer) => {
    const total = player.totalMatches || 0;
    if (total <= 0) return 0;
    const injured = player.injuredMatches || 0;
    const remaining = player.remainingMatches || 0;
    const value = ((injured + remaining) / total) * 100;
    return Math.max(0, Math.min(100, value));
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 60) return 'bg-red-500';
    if (percentage >= 30) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const isLoading = currentLoading || historyLoading;
  const error = currentError || historyError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500 text-lg">Cargando lista negra...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 dark:text-red-400">
          Error cargando datos: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="club-page-hero p-8 mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {`${String.fromCodePoint(0x26A0)} Lista Negra`}
          </h1>
          <p className="club-page-hero-subtitle">
            {'Jugadores con menos participaci\u00F3n en la liga'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'current'
                ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            Partidos Restantes (Temporada Actual)
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'history'
                ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            Acumulado
          </button>
        </div>

        {/* Content */}
        {!sortedData || sortedData.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 text-center">
            <p className="text-slate-500 dark:text-slate-400">
              {activeTab === 'current'
                ? 'No hay jugadores con partidos restantes'
                : 'No hay datos disponibles'}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
            {/* Dynamic layout: Table on desktop, Cards on mobile */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                    <th 
                      className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      Jugador{getSortIndicator('name')}
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      onClick={() => handleSort('groupName')}
                    >
                      Liga{getSortIndicator('groupName')}
                    </th>
                    <th 
                      className="px-6 py-4 text-center text-sm font-semibold text-slate-900 dark:text-white cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      onClick={() => handleSort('totalMatches')}
                    >
                      Totales{getSortIndicator('totalMatches')}
                    </th>
                    <th 
                      className="px-6 py-4 text-center text-sm font-semibold text-slate-900 dark:text-white cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      onClick={() => handleSort('playedMatches')}
                    >
                      Jugados{getSortIndicator('playedMatches')}
                    </th>
                    <th 
                      className="px-6 py-4 text-center text-sm font-semibold text-slate-900 dark:text-white cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      onClick={() => handleSort('injuredMatches')}
                    >
                      Lesionados{getSortIndicator('injuredMatches')}
                    </th>
                    <th 
                      className="px-6 py-4 text-center text-sm font-semibold text-slate-900 dark:text-white cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      onClick={() => handleSort('remainingMatches')}
                    >
                      Restantes{getSortIndicator('remainingMatches')}
                    </th>
                    <th
                      className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      onClick={() => handleSort('unplayedPercentage')}
                    >
                      % no jugado{getSortIndicator('unplayedPercentage')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {sortedData.map((player, index) => (
                    (() => {
                      const unplayedPercentage = getUnplayedPercentage(player);
                      const progressColor = getProgressColor(unplayedPercentage);

                      return (
                    <tr
                      key={player.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                        index % 2 === 0
                          ? 'bg-white dark:bg-slate-800'
                          : 'bg-slate-50 dark:bg-slate-700/50'
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                        <div>
                          <p>{player.name}</p>
                          {player.nickname && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              ({player.nickname})
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {player.groupName}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-slate-900 dark:text-white font-semibold">
                        {player.totalMatches || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-slate-900 dark:text-white font-semibold">
                        {player.playedMatches || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-slate-900 dark:text-white font-semibold">
                        {player.injuredMatches || 0}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          (player.remainingMatches || 0) > 3
                            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        }`}>
                          {player.remainingMatches || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full min-w-[150px]">
                          <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className={`h-2.5 rounded-full ${progressColor}`}
                              style={{ width: `${unplayedPercentage.toFixed(1)}%` }}
                            />
                          </div>
                          <div className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300 text-right">
                            {unplayedPercentage.toFixed(1)}%
                          </div>
                        </div>
                      </td>
                    </tr>
                      );
                    })()
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-2 p-3">
              {sortedData.map((player) => {
                const unplayedPercentage = getUnplayedPercentage(player);
                const progressColor = getProgressColor(unplayedPercentage);
                
                return (
                  <div 
                    key={player.id}
                    className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-700/50"
                  >
                    <div className="space-y-1.5">
                      {/* Nombre y Liga */}
                      <div>
                        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{player.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{player.groupName}</p>
                      </div>

                      {/* Estadísticas en una fila */}
                      <div className="grid grid-cols-3 gap-1 text-center text-xs">
                        <div>
                          <p className="text-slate-600 dark:text-slate-300 font-semibold">{player.totalMatches || 0}</p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs">Total</p>
                        </div>
                        <div>
                          <p className="text-slate-600 dark:text-slate-300 font-semibold">{player.playedMatches || 0}</p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs">Jugados</p>
                        </div>
                        <div>
                          <p className={`font-semibold ${
                            (player.remainingMatches || 0) > 3
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                          }`}>
                            {player.remainingMatches || 0}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs">Rest.</p>
                        </div>
                      </div>

                      {/* Barra de progreso */}
                      <div className="pt-1">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${progressColor}`}
                              style={{ width: `${unplayedPercentage.toFixed(1)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-10 text-right">
                            {unplayedPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="bg-slate-100 dark:bg-slate-700 px-3 md:px-6 py-2 md:py-3 border-t border-slate-200 dark:border-slate-600">
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300">
                <span className="font-semibold">{sortedData.length}</span> jugador(es)
                {activeTab === 'current' && (
                  <>
                    {` con restantes ${String.fromCodePoint(0x26A0)}`}
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

