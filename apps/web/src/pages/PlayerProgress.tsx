import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useState, useMemo } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title, Filler } from 'chart.js';
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title, Filler);

interface MatchByDate { date: string; result: 'WIN' | 'LOSS'; opponent: string; score: string; }
interface MovementRecord { seasonName: string; groupName: string; movement: 'PROMOTION' | 'RELEGATION' | 'STAY'; finalRank: number; }

export default function PlayerProgress() {
  const { user } = useAuth();
  const playerId = user?.player?.id;

  // Selector de fechas
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const { data: matchData, isLoading: matchLoading, error: matchError } = useQuery<MatchByDate[]>({
    queryKey: ['playerMatchesByDate', playerId],
    enabled: !!playerId,
    queryFn: async () => {
      const { data } = await api.get(`/players/${playerId}/matches-by-date`);
      return data;
    },
    staleTime: 60_000
  });

  const { data: movements, isLoading: movementsLoading, error: movementsError } = useQuery<MovementRecord[]>({
    queryKey: ['playerMovements', playerId],
    enabled: !!playerId,
    queryFn: async () => {
      const { data } = await api.get(`/players/${playerId}/movements`);
      return data;
    },
    staleTime: 60_000
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
  if (matchLoading || movementsLoading) return <div className="text-slate-500">Cargando progreso...</div>;
  if (matchError || movementsError) return <div className="text-red-600 dark:text-red-400 text-sm">Error cargando datos de progreso.</div>;
  if (!matchData || !movements) return <div className="text-slate-500">Sin datos</div>;

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

  // Gráfico: Ascensos/Descensos por temporada
  const movementChartData = {
    labels: movements.map(m => m.seasonName),
    datasets: [
      {
        label: 'Posición Final',
        data: movements.map(m => m.finalRank),
        backgroundColor: movements.map(m =>
          m.movement === 'PROMOTION' ? 'rgba(34,197,94,0.8)' :
            m.movement === 'RELEGATION' ? 'rgba(239,68,68,0.8)' :
              'rgba(148,163,184,0.8)'
        ),
        borderColor: movements.map(m =>
          m.movement === 'PROMOTION' ? 'rgb(34,197,94)' :
            m.movement === 'RELEGATION' ? 'rgb(239,68,68)' :
              'rgb(148,163,184)'
        ),
        borderWidth: 2
      }
    ]
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Progreso del Jugador</h1>
        <p className="text-indigo-100">Evolución de resultados y movimientos entre grupos</p>
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
          <Line data={matchChartData} options={{
            responsive: true,
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
        )}
      </div>

      {/* Gráfico: Ascensos/Descensos */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Historial de Ascensos y Descensos</h2>
        {movements.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">No hay historial de movimientos entre grupos</p>
        ) : (
          <>
            <Bar data={movementChartData} options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (item) => {
                      const idx = item.dataIndex;
                      const mov = movements[idx];
                      const movText = mov.movement === 'PROMOTION' ? '🟢 Ascenso' : mov.movement === 'RELEGATION' ? '🔴 Descenso' : '⚪ Se mantiene';
                      return [`Posición: ${mov.finalRank}`, `${movText}`, `Grupo: ${mov.groupName}`];
                    }
                  }
                }
              },
              scales: {
                x: { title: { display: true, text: 'Temporada' } },
                y: { reverse: true, beginAtZero: false, title: { display: true, text: 'Posición Final (1 = mejor)' }, ticks: { stepSize: 1 } }
              }
            }} />
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span className="text-slate-700 dark:text-slate-300">Ascenso</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span className="text-slate-700 dark:text-slate-300">Descenso</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-slate-400"></div>
                <span className="text-slate-700 dark:text-slate-300">Se mantiene</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
