import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title, Filler } from 'chart.js';
import { useLanguage } from '../contexts/LanguageContext';
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title, Filler);

interface MatchByDate { date: string; result: 'WIN' | 'LOSS'; opponent: string; score: string; }
interface MovementRecord { seasonName: string; seasonEndDate: string; groupName: string; movement: 'PROMOTION' | 'RELEGATION' | 'STAY'; finalRank: number; isFallback?: boolean; }
interface SeasonSummaryRecord {
  seasonId: string;
  seasonName: string;
  seasonStartDate: string;
  seasonEndDate: string;
  groupId: string | null;
  groupName: string;
  finalRank: number | null;
  movement: 'PROMOTION' | 'RELEGATION' | 'STAY' | string;
  isFallback: boolean;
  wins: number;
  losses: number;
}

export default function PlayerProgress() {
  const { user, isAdmin } = useAuth();
  const { language, localeCode } = useLanguage();
  const playerId = user?.player?.id;
  const tr = (es: string, eu: string) => (language === 'eu' ? eu : es);

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

  const ROLLING_WINDOW_SIZE = 5;
  // Rendimiento por partido: balance acumulado (sube/baja) y porcentaje móvil de victorias.
  const performanceData = useMemo(() => {
    let wins = 0;
    let losses = 0;
    return filteredMatches.map((m, index) => {
      if (m.result === 'WIN') wins++;
      else losses++;

      const balance = wins - losses;
      const windowStart = Math.max(0, index - (ROLLING_WINDOW_SIZE - 1));
      const windowMatches = filteredMatches.slice(windowStart, index + 1);
      const windowWins = windowMatches.filter(match => match.result === 'WIN').length;
      const rollingWinRate = windowMatches.length > 0 ? (windowWins / windowMatches.length) * 100 : 0;

      return {
        date: m.date,
        opponent: m.opponent,
        score: m.score,
        result: m.result,
        balance,
        rollingWinRate
      };
    });
  }, [filteredMatches]);

  const fallbackSeasons = useMemo(() => {
    if (!Array.isArray(movements)) return [];
    const seasons = movements.filter(m => m.isFallback).map(m => m.seasonName);
    return Array.from(new Set(seasons));
  }, [movements]);

  const fallbackSeasonLinks = useMemo(() => {
    if (!Array.isArray(seasonSummary)) return [];
    return seasonSummary
      .filter(s => s.isFallback)
      .map(s => ({ id: s.seasonId, name: s.seasonName }));
  }, [seasonSummary]);

  const globalVisualStats = useMemo(() => {
    if (!Array.isArray(matchData)) {
      return {
        wins: 0,
        losses: 0,
        setsWon: 0,
        setsLost: 0,
        average: 0,
        totalMatches: 0,
      };
    }

    let wins = 0;
    let losses = 0;
    let setsWon = 0;
    let setsLost = 0;

    matchData.forEach((match) => {
      if (match.result === 'WIN') wins += 1;
      if (match.result === 'LOSS') losses += 1;

      const [wonSetsRaw, lostSetsRaw] = String(match.score || '').split('-');
      const wonSets = Number(wonSetsRaw);
      const lostSets = Number(lostSetsRaw);

      if (Number.isFinite(wonSets) && Number.isFinite(lostSets)) {
        setsWon += wonSets;
        setsLost += lostSets;
      }
    });

    return {
      wins,
      losses,
      setsWon,
      setsLost,
      average: setsWon - setsLost,
      totalMatches: wins + losses,
    };
  }, [matchData]);

  // NOW check conditions AFTER all hooks
  if (!playerId) return <div className="text-slate-500">{tr('No hay jugador asociado.', 'Ez dago jokalaririk lotuta.')}</div>;
  if (matchLoading || movementsLoading || summaryLoading) return <div className="text-slate-500">{tr('Cargando progreso...', 'Aurrerapena kargatzen...')}</div>;
  if (matchError || movementsError || summaryError) return <div className="text-red-600 dark:text-red-400 text-sm">{tr('Error cargando datos de progreso.', 'Errorea aurrerapen datuak kargatzean.')}</div>;
  if (!matchData || !movements || !seasonSummary) return <div className="text-slate-500">{tr('Sin datos', 'Daturik ez')}</div>;

  // Gráfico: Rendimiento por fecha
  const matchChartData = {
    labels: performanceData.map(m => {
      try {
        return new Date(m.date).toLocaleDateString(localeCode, { day: '2-digit', month: 'short' });
      } catch (e) {
        return m.date;
      }
    }),
    datasets: [
      {
        label: tr('Balance (victorias - derrotas)', 'Balantzea (garaipenak - porrotak)'),
        data: performanceData.map(d => d.balance),
        borderColor: 'rgb(217,119,6)',
        backgroundColor: 'rgba(245,158,11,0.15)',
        borderWidth: 3,
        fill: false,
        tension: 0.25,
        pointRadius: 7,
        pointHoverRadius: 10,
        pointBackgroundColor: performanceData.map(d => (d.result === 'WIN' ? 'rgb(34,197,94)' : 'rgb(239,68,68)')),
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        yAxisID: 'yBalance'
      }
    ]
  };

  // Gráfico: Evolución de Grupo por Temporada
  const movementChartData = {
    labels: movements.map(m => m.seasonName),
    datasets: [
      {
        label: tr('Nivel de grupo', 'Talde maila'),
        data: movements.map(m => {
          // Extraer número de grupo (ej: "Grupo 1" -> 1)
          const match = m.groupName.match(/\d+/);
          return match ? parseInt(match[0], 10) : null;
        }),
        borderColor: 'rgb(202,138,4)',
        backgroundColor: 'rgba(234,179,8,0.12)',
        borderWidth: 3.5,
        fill: false,
        tension: 0.2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: movements.map(m =>
          m.movement === 'PROMOTION' ? 'rgb(34,197,94)' :
            m.movement === 'RELEGATION' ? 'rgb(239,68,68)' :
              'rgb(148,163,184)'
        ),
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        spanGaps: false
      }
    ]
  };

  const totalMatchesSafe = globalVisualStats.totalMatches;
  const hasMatchData = totalMatchesSafe > 0;
  const winRate = hasMatchData ? (globalVisualStats.wins / totalMatchesSafe) * 100 : 0;
  const lossRate = hasMatchData ? 100 - winRate : 0;

  const totalSets = globalVisualStats.setsWon + globalVisualStats.setsLost;
  const hasSetData = totalSets > 0;
  const setsWonRate = hasSetData ? (globalVisualStats.setsWon / totalSets) * 100 : 0;
  const setsLostRate = hasSetData ? 100 - setsWonRate : 0;

  const globalRingStyle = {
    background: hasMatchData
      ? `conic-gradient(rgb(22, 163, 74) 0% ${winRate}%, rgb(239, 68, 68) ${winRate}% 100%)`
      : 'conic-gradient(#94a3b8 0% 100%)',
  };

  return (
    <div className="space-y-8">
      <div className="club-page-hero p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">{tr('Progreso del Jugador', 'Jokalariaren Aurrerapena')}</h1>
        <p className="text-sm md:text-base club-page-hero-subtitle">{tr('Evolución de resultados y movimientos entre grupos', 'Emaitzen bilakaera eta taldeen arteko mugimenduak')}</p>
      </div>

      {/* Selector de rango de fechas */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">{tr('Filtrar por fechas', 'Dataz iragazi')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">{tr('Desde', 'Noiztik')}</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">{tr('Hasta', 'Noiz arte')}</label>
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
              {tr('Restablecer', 'Berrezarri')}
            </button>
          </div>
        </div>
      </div>

      {/* Gráfico: Rendimiento por Fecha */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{tr('Rendimiento por Fecha', 'Errendimendua Dataren Arabera')}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          {tr(
            'Linea azul: balance acumulado (puede subir y bajar). Puntos verdes: victoria. Puntos rojos: derrota.',
            'Lerro urdina: metatutako balantzea (igo eta jaitsi daiteke). Puntu berdeak: garaipena. Puntu gorriak: porrota.',
          )}
        </p>
        {filteredMatches.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">{tr('No hay partidos registrados en este rango', 'Ez dago tarte honetan erregistratutako partidarik')}</p>
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
                      return `${performanceData[idx].date} ${tr('vs', 'vs')} ${performanceData[idx].opponent}`;
                    },
                    label: (item) => {
                      return `${item.dataset.label}: ${item.parsed.y}`;
                    },
                    afterBody: (items) => {
                      const idx = items[0].dataIndex;
                      return `${tr('Marcador', 'Markagailua')}: ${performanceData[idx].score}`;
                    }
                  }
                }
              },
              scales: {
                x: { title: { display: true, text: tr('Fecha del partido', 'Partidaren data') } },
                yBalance: {
                  type: 'linear',
                  position: 'left',
                  beginAtZero: true,
                  title: { display: true, text: tr('Balance (V-D)', 'Balantzea (G-P)') },
                  ticks: { stepSize: 1 },
                  grid: { color: 'rgba(148,163,184,0.16)' }
                }
              }
            }} />
          </div>
        )}
      </div>

      {/* Gráfico: Evolución de Grupo por Temporada */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{tr('Evolución de Grupo por Temporada', 'Taldearen Bilakaera Denboraldika')}</h2>
        {isAdmin && fallbackSeasons.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-100">
            <p className="text-sm font-semibold">{tr('Aviso para administradores', 'Administratzaileentzako oharra')}</p>
            <p className="text-sm mt-1">
              {tr(
                'Algunas temporadas se muestran sin cierre aprobado. La evolución se ha inferido desde la inscripción en grupos y no incluye ascensos/descensos reales.',
                'Denboraldi batzuk itxiera onarturik gabe agertzen dira. Bilakaera taldeetako inskripziotik ondorioztatu da, eta ez ditu igoera/jaitsiera errealak barne hartzen.',
              )}
            </p>
            <p className="text-sm mt-1">{tr('Temporadas afectadas', 'Kaltetutako denboraldiak')}: {fallbackSeasons.join(', ')}</p>
            {fallbackSeasonLinks.length > 0 && (
              <p className="text-sm mt-1">
                {tr('Revisa el estado en', 'Egoera hemen berrikusi')}{' '}
                <Link
                  to="/admin/seasons"
                    className="underline text-amber-900 dark:text-amber-100 hover:text-amber-700 dark:hover:text-amber-200"
                >
                  {tr('Gestionar temporadas', 'Denboraldiak kudeatu')}
                </Link>
                . {tr('Temporadas afectadas', 'Kaltetutako denboraldiak')}: {fallbackSeasonLinks.map(s => s.name).join(', ')}.
              </p>
            )}
          </div>
        )}
        {movements.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">{tr('No hay historial de movimientos entre grupos', 'Ez dago taldeen arteko mugimendu historikorik')}</p>
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
                        const movText = mov.movement === 'PROMOTION'
                          ? tr('📈 Ascenso', '📈 Igoera')
                          : mov.movement === 'RELEGATION'
                            ? tr('📉 Descenso', '📉 Jaitsiera')
                            : tr('➡️ Se mantiene', '➡️ Mantendu');
                        return [`${mov.groupName}`, `${movText}`, `${tr('Posición final', 'Azken postua')}: ${mov.finalRank}`];
                      }
                    }
                  }
                },
                scales: {
                  x: { 
                    title: { display: true, text: tr('Temporada', 'Denboraldia') },
                    grid: { display: false }
                  },
                  y: { 
                    reverse: true,
                    min: 1,
                    max: 8,
                    title: { display: true, text: tr('Grupo (1 = mejor nivel)', 'Taldea (1 = mailarik onena)') },
                    ticks: { 
                      stepSize: 1,
                      callback: function(value) {
                        return tr('Grupo ', 'Taldea ') + value;
                      }
                    },
                    grid: { color: 'rgba(148,163,184,0.18)' }
                  }
                }
              }} />
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                <span className="text-slate-700 dark:text-slate-300">{tr('Ascenso', 'Igoera')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
                <span className="text-slate-700 dark:text-slate-300">{tr('Descenso', 'Jaitsiera')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-slate-400 border-2 border-white"></div>
                <span className="text-slate-700 dark:text-slate-300">{tr('Se mantiene', 'Mantendu')}</span>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">{tr('Resumen por temporada', 'Denboraldiaren laburpena')}</h3>
              {seasonSummary.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm">{tr('No hay datos por temporada', 'Ez dago daturik denboraldika')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2 pr-4">{tr('Temporada', 'Denboraldia')}</th>
                        <th className="py-2 pr-4">{tr('Clasificación', 'Sailkapena')}</th>
                        <th className="py-2 pr-4">{tr('Ganados', 'Irabaziak')}</th>
                        <th className="py-2 pr-4">{tr('Perdidos', 'Galduak')}</th>
                        <th className="py-2 pr-4">{tr('Variación', 'Aldaketa')}</th>
                        <th className="py-2 pr-4">{tr('Grupo', 'Taldea')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seasonSummary.map((row) => {
                        let movementLabel = tr('→ Se mantiene', '→ Mantendu');
                        let movementClass = 'text-slate-600 dark:text-slate-300';

                        if (row.movement === 'PROMOTION') {
                          movementLabel = tr('↑ Ascenso', '↑ Igoera');
                          movementClass = 'text-green-600 dark:text-green-400';
                        } else if (row.movement === 'RELEGATION') {
                          movementLabel = tr('↓ Descenso', '↓ Jaitsiera');
                          movementClass = 'text-red-600 dark:text-red-400';
                        }

                        return (
                          <tr key={row.seasonId} className="border-b border-slate-100 dark:border-slate-800">
                            <td className="py-2 pr-4 text-slate-900 dark:text-white">{row.seasonName}</td>
                            <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">{row.finalRank ?? '—'}</td>
                            <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">{row.wins}</td>
                            <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">{row.losses}</td>
                            <td className={`py-2 pr-4 ${movementClass}`}>{movementLabel}</td>
                            <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">
                              {row.groupId ? (
                                <Link
                                  to={`/groups/${row.groupId}`}
                                  className="text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 underline underline-offset-2"
                                >
                                  {row.groupName}
                                </Link>
                              ) : (
                                '—'
                              )}
                            </td>
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

      <div className="relative overflow-hidden rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
        <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.16),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(245,158,11,0.18),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.12),transparent_40%)]" />
        <div className="relative p-4 md:p-6 grid md:grid-cols-2 gap-4 md:gap-6 items-stretch">
          <div className="md:col-span-2 flex items-center justify-between gap-2 md:gap-3 overflow-x-auto">
            <h2 className="text-sm md:text-lg font-bold text-slate-900 dark:text-white whitespace-nowrap shrink-0">
              {tr('Estadisticas globales', 'Estatistika globalak')}
            </h2>
            <Link
              to="/matches/history"
              className="inline-flex items-center px-3 md:px-4 py-2 text-xs md:text-base club-btn-yellow hover:!translate-y-0 hover:!shadow-lg whitespace-nowrap shrink-0"
            >
              {tr('Ver historico de partidos', 'Partiden historikoa ikusi')} →
            </Link>
          </div>

          <div className="h-full flex flex-col items-center justify-center gap-2 py-2 md:py-3">
            <div
              className="relative w-full max-w-[180px] md:max-w-[260px] aspect-square rounded-full p-2 md:p-3 shadow-inner ring-1 ring-slate-300 dark:ring-slate-600"
              style={globalRingStyle}
            >
              <div className="h-full w-full rounded-full bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center">
                <p className="text-xl md:text-4xl font-black text-slate-900 dark:text-white leading-none">
                  {hasMatchData ? `${winRate.toFixed(0)}%` : '0%'}
                </p>
                <p className="text-[11px] md:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {tr('Victorias/Derrotas', 'Garaipenak/Porrotak')}
                </p>
              </div>
            </div>
            {!hasMatchData && (
              <p className="text-xs md:text-sm text-amber-700 dark:text-amber-300 text-center">
                {tr('Sin datos suficientes', 'Ez dago datu nahikorik')}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="grid gap-2 grid-cols-1">
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2">
                <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400">{tr('Partidos jugados', 'Jokatutako partidak')}</p>
                <p className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white">{totalMatchesSafe}</p>
              </div>
            </div>

            <MetricBar
              label={`${tr('Victorias', 'Garaipenak')} (${globalVisualStats.wins})`}
              value={winRate}
              color="from-green-500 to-green-600"
            />
            <MetricBar
              label={`${tr('Derrotas', 'Porrotak')} (${globalVisualStats.losses})`}
              value={lossRate}
              color="from-red-500 to-red-600"
            />
            <MetricBar
              label={`${tr('Sets a favor', 'Aldeko setak')} (${globalVisualStats.setsWon})`}
              value={setsWonRate}
              color="from-sky-500 to-indigo-500"
            />
            <MetricBar
              label={`${tr('Sets en contra', 'Aurkako setak')} (${globalVisualStats.setsLost})`}
              value={setsLostRate}
              color="from-fuchsia-500 to-violet-500"
            />

            <div className="pt-1 flex items-center justify-between">
              <p className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400">
                {tr('Tendencia average', 'Average joera')}
              </p>
              <span className="px-2.5 py-1 rounded-full text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600">
                {globalVisualStats.average > 0 ? '+' : ''}{globalVisualStats.average}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
        <p className="text-xs md:text-sm font-semibold text-slate-500 dark:text-slate-400">{safeValue.toFixed(1)}%</p>
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}



