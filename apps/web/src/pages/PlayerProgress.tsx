import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title, Filler } from 'chart.js';
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title, Filler);

interface MatchByDate { date: string; result: 'WIN' | 'LOSS'; opponent: string; score: string; }
interface MovementRecord { seasonName: string; seasonEndDate: string; groupName: string; movement: 'PROMOTION' | 'RELEGATION' | 'STAY'; finalRank: number; isFallback?: boolean; }
interface SeasonSummaryRecord {
  seasonId: string;
  seasonName: string;
  seasonStartDate: string;
  seasonEndDate: string;
  groupName: string;
  finalRank: number | null;
  movement: 'PROMOTION' | 'RELEGATION' | 'STAY' | string;
  isFallback: boolean;
  wins: number;
  losses: number;
}

export default function PlayerProgress() {
  const { user, isAdmin } = useAuth();
  const playerId = user?.player?.id;

  // Selector de fechas
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const { data: matchData, isLoading: matchLoading, error: matchError } = useQuery<MatchByDate[]>({
    queryKey: ['playerMatchesByDate', playerId],
    enabled: !!playerId,
    queryFn: async () => {
      const { data } = await api.get(`/players/${playerId}/matches-by-date`);
      return data;
    }
  });

  const { data: movements, isLoading: movementsLoading, error: movementsError } = useQuery<MovementRecord[]>({
    queryKey: ['playerMovements', playerId],
    enabled: !!playerId,
    queryFn: async () => {
      const { data } = await api.get(`/players/${playerId}/movements`);
      return data;
    }
  });

  const { data: seasonSummary, isLoading: summaryLoading, error: summaryError } = useQuery<SeasonSummaryRecord[]>({
    queryKey: ['playerSeasonSummary', playerId],
    enabled: !!playerId,
    queryFn: async () => {
      const { data } = await api.get(`/players/${playerId}/season-summary`);
      return data;
    }
  });

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONS/RETURNS
  // Filtrar datos por rango de fechas
  const filteredMatches = useMemo(() => {
    if (!Array.isArray(matchData)) return [];
    if (!dateRange.start && !dateRange.end) return matchData;

    return matchData.filter(m => {
      if (!m.date) return false;
      const matchDate = new Date(m.date);
      if (isNaN(matchDate.getTime())) return false;

      const start = dateRange.start ? new Date(dateRange.start) : null;
      const end = dateRange.end ? new Date(dateRange.end) : null;

      if (start && matchDate < start) return false;
      if (end && matchDate > end) return false;
      return true;
    });
  }, [matchData, dateRange]);

  // Calcular victorias y derrotas acumuladas con tendencia
  const cumulativeData = useMemo(() => {
    let wins = 0;
    let losses = 0;
    return filteredMatches.map(m => {
      if (m.result === 'WIN') wins++;
      else losses++;
      return { date: m.date, wins, losses, opponent: m.opponent, score: m.score };
    });
  }, [filteredMatches]);

  // Calcular línea de tendencia
  const winsTrend = useMemo(() => {
    const data = cumulativeData.map(d => d.wins);
    const n = data.length;
    if (n === 0) return [];

    const xMean = (n - 1) / 2;
    const yMean = data.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (data[i] - yMean);
      denominator += (i - xMean) ** 2;
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    return data.map((_, i) => slope * i + intercept);
  }, [cumulativeData]);

  // NOW check conditions AFTER all hooks
  if (!playerId) return <div className="text-slate-500">No hay jugador asociado.</div>;
  if (matchLoading || movementsLoading || summaryLoading) return <div className="text-slate-500">Cargando progreso...</div>;
  if (matchError || movementsError || summaryError) return <div className="text-red-600 dark:text-red-400 text-sm">Error cargando datos de progreso.</div>;
  if (!matchData || !movements || !seasonSummary) return <div className="text-slate-500">Sin datos</div>;

  // Gráfico: Victorias/Derrotas por fecha
  const matchChartData = {
    labels: cumulativeData.map(m => {
      try {
        return new Date(m.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      } catch (e) {
        return m.date;
      }
    }),
    datasets: [
      {
        label: 'Victorias Acumuladas',
        data: cumulativeData.map(d => d.wins),
        borderColor: 'rgb(34,197,94)',
        backgroundColor: 'rgba(34,197,94,0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'Derrotas Acumuladas',
        data: cumulativeData.map(d => d.losses),
        borderColor: 'rgb(239,68,68)',
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'Tendencia de Victorias',
        data: winsTrend,
        borderColor: 'rgba(34,197,94,0.5)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0
      }
    ]
  };

  // Gráfico: Evolución de Grupo por Temporada
  const movementChartData = {
    labels: movements.map(m => {
      try {
        return new Date(m.seasonEndDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' });
      } catch (e) {
        return m.seasonName;
      }
    }),
    datasets: [
      {
        label: 'Nivel de Grupo',
        data: movements.map(m => {
          // Extraer número de grupo (ej: "Grupo 1" -> 1)
          const match = m.groupName.match(/\d+/);
          return match ? parseInt(match[0]) : 0;
        }),
        borderColor: 'rgb(99,102,241)',
        backgroundColor: 'rgba(99,102,241,0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: movements.map(m =>
          m.movement === 'PROMOTION' ? 'rgb(34,197,94)' :
            m.movement === 'RELEGATION' ? 'rgb(239,68,68)' :
              'rgb(148,163,184)'
        ),
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }
    ]
  };

  const fallbackSeasons = useMemo(() => {
    const seasons = movements.filter(m => m.isFallback).map(m => m.seasonName);
    return Array.from(new Set(seasons));
  }, [movements]);

  const fallbackSeasonLinks = useMemo(() => {
    return seasonSummary
      .filter(s => s.isFallback)
      .map(s => ({ id: s.seasonId, name: s.seasonName }));
  }, [seasonSummary]);

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 md:p-8 text-white shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Progreso del Jugador</h1>
        <p className="text-sm md:text-base text-indigo-100">Evolución de resultados y movimientos entre grupos</p>
      </div>

      {/* Selector de rango de fechas */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Filtrar por fechas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Desde</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Hasta</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setDateRange({ start: '', end: '' })}
              className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
            >
              Restablecer
            </button>
          </div>
        </div>
      </div>

      {/* Gráfico: Victorias/Derrotas por Fecha */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Victorias y Derrotas por Fecha</h2>
        {filteredMatches.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">No hay partidos registrados en este rango</p>
        ) : (
          <div className="relative h-64 sm:h-80 md:h-96 lg:h-[450px]">
            <Line data={matchChartData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                  callbacks: {
                    title: (items) => {
                      const idx = items[0].dataIndex;
                      return `${cumulativeData[idx].date} vs ${cumulativeData[idx].opponent}`;
                    },
                    label: (item) => {
                      if (item.dataset.label === 'Tendencia de Victorias') return '';
                      return `${item.dataset.label}: ${item.parsed.y}`;
                    }
                  }
                }
              },
              scales: {
                x: { title: { display: true, text: 'Fecha del Partido' } },
                y: { beginAtZero: true, title: { display: true, text: 'Acumulado' }, ticks: { stepSize: 1 } }
              }
            }} />
          </div>
        )}
      </div>

      {/* Gráfico: Evolución de Grupo por Temporada */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Evolución de Grupo por Temporada</h2>
        {isAdmin && fallbackSeasons.length > 0 && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-100">
            <p className="text-sm font-semibold">Aviso para administradores</p>
            <p className="text-sm mt-1">
              Algunas temporadas se muestran sin cierre aprobado. La evolución se ha inferido desde la inscripción en grupos y no incluye ascensos/descensos reales.
            </p>
            <p className="text-sm mt-1">Temporadas afectadas: {fallbackSeasons.join(', ')}</p>
            {fallbackSeasonLinks.length > 0 && (
              <p className="text-sm mt-1">
                Revisa el estado en{' '}
                <Link
                  to="/admin/seasons"
                  className="underline text-amber-900 dark:text-amber-100 hover:text-amber-700 dark:hover:text-amber-200"
                >
                  Gestionar temporadas
                </Link>
                . Temporadas afectadas: {fallbackSeasonLinks.map(s => s.name).join(', ')}.
              </p>
            )}
          </div>
        )}
        {movements.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">No hay historial de movimientos entre grupos</p>
        ) : (
          <>
            <div className="relative h-64 sm:h-80 md:h-96 lg:h-[450px]">
              <Line data={movementChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      title: (items) => {
                        const idx = items[0].dataIndex;
                        return movements[idx].seasonName;
                      },
                      label: (item) => {
                        const idx = item.dataIndex;
                        const mov = movements[idx];
                        const movText = mov.movement === 'PROMOTION' ? '📈 Ascenso' : mov.movement === 'RELEGATION' ? '📉 Descenso' : '➡️ Se mantiene';
                        return [`${mov.groupName}`, `${movText}`, `Posición final: ${mov.finalRank}`];
                      }
                    }
                  }
                },
                scales: {
                  x: { 
                    title: { display: true, text: 'Temporada' },
                    grid: { display: false }
                  },
                  y: { 
                    reverse: true,
                    beginAtZero: false,
                    title: { display: true, text: 'Grupo (1 = mejor nivel)' },
                    ticks: { 
                      stepSize: 1,
                      callback: function(value) {
                        return 'Grupo ' + value;
                      }
                    },
                    grid: { color: 'rgba(148,163,184,0.1)' }
                  }
                }
              }} />
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                <span className="text-slate-700 dark:text-slate-300">Ascenso</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
                <span className="text-slate-700 dark:text-slate-300">Descenso</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-slate-400 border-2 border-white"></div>
                <span className="text-slate-700 dark:text-slate-300">Se mantiene</span>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Resumen por temporada</h3>
              {seasonSummary.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm">No hay datos por temporada</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2 pr-4">Temporada</th>
                        <th className="py-2 pr-4">Clasificación</th>
                        <th className="py-2 pr-4">Ganados</th>
                        <th className="py-2 pr-4">Perdidos</th>
                        <th className="py-2 pr-4">Variación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seasonSummary.map((row, idx) => {
                        const prev = idx > 0 ? seasonSummary[idx - 1] : null;
                        const currRank = row.finalRank;
                        const prevRank = prev?.finalRank ?? null;
                        let trend = '—';
                        let trendClass = 'text-slate-500 dark:text-slate-400';
                        if (currRank && prevRank) {
                          if (currRank < prevRank) { trend = '↑ Mejora'; trendClass = 'text-green-600 dark:text-green-400'; }
                          else if (currRank > prevRank) { trend = '↓ Empeora'; trendClass = 'text-red-600 dark:text-red-400'; }
                          else { trend = '→ Igual'; trendClass = 'text-slate-600 dark:text-slate-300'; }
                        }
                        return (
                          <tr key={row.seasonId} className="border-b border-slate-100 dark:border-slate-800">
                            <td className="py-2 pr-4 text-slate-900 dark:text-white">{row.seasonName}</td>
                            <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">{row.finalRank ?? '—'}</td>
                            <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">{row.wins}</td>
                            <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">{row.losses}</td>
                            <td className={`py-2 pr-4 ${trendClass}`}>{trend}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
