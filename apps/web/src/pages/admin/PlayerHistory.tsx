import { useState } from 'react';
import api from '../../lib/api';
import { useAdminQuery } from '../../hooks/useAdminQuery';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Función para calcular tendencia lineal (regresión lineal)
function calculateTrendLine(data: number[]): number[] {
    if (data.length < 2) return data;
    
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return x.map(xi => slope * xi + intercept);
}

function buildChartData(players: any[]) {
    if (players.length === 0) {
        return { labels: [], totalRegisteredData: [], activeData: [], inactiveData: [], trendLine: [] };
    }

    // Agrupar jugadores por fecha de registro (por día)
    const dateMap = new Map<string, { registered: number; active: number; inactive: number }>();
    
    players.forEach(player => {
        const date = new Date(player.registeredAt);
        const dateStr = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        
        const current = dateMap.get(dateStr) || { registered: 0, active: 0, inactive: 0 };
        current.registered++;
        if (player.isActive) {
            current.active++;
        } else {
            current.inactive++;
        }
        dateMap.set(dateStr, current);
    });

    // Ordenar por fecha y crear arrays acumulativos
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => 
        new Date(a).getTime() - new Date(b).getTime()
    );

    let cumulativeTotal = 0;
    let cumulativeActive = 0;
    let cumulativeInactive = 0;
    const labels: string[] = [];
    const totalRegisteredData: number[] = [];
    const activeData: number[] = [];
    const inactiveData: number[] = [];

    sortedDates.forEach(dateStr => {
        const count = dateMap.get(dateStr)!;
        cumulativeTotal += count.registered;
        cumulativeActive += count.active;
        cumulativeInactive += count.inactive;
        
        const date = new Date(dateStr);
        labels.push(date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }));
        totalRegisteredData.push(cumulativeTotal);
        activeData.push(cumulativeActive);
        inactiveData.push(cumulativeInactive);
    });

    // Calcular línea de tendencia basada en inscritos totales
    const trendLine = calculateTrendLine(totalRegisteredData);

    return { labels, totalRegisteredData, activeData, inactiveData, trendLine };
}

export default function PlayerHistory() {
    const [viewMode, setViewMode] = useState<'timeline' | 'chart'>('chart');

    // Fetch all users with complete history
    const { data: players = [], isLoading } = useAdminQuery({
        queryKey: ['playerHistory'],
        queryFn: async () => {
            const { data } = await api.get('/admin/player-history');
            return data;
        },
    });

    if (isLoading) {
        return <div className="text-center py-12">Cargando historial...</div>;
    }

    // Build chart data: Inscripciones y estado a lo largo del tiempo
    const chartData = buildChartData(players);

    // Group players by registration month for timeline view
    const timelineEvents = players.map((player: any) => ({
        ...player,
        monthRegistered: new Date(player.registeredAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long'
        })
    })).sort((a: any, b: any) => 
        new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
    );

    // Statistics
    const totalRegistered = players.length;
    const activeCount = players.filter((p: any) => p.isActive).length;
    const inactiveCount = totalRegistered - activeCount;

    // Prepare chart configuration
    const chartConfig = {
        labels: chartData.labels,
        datasets: [
            {
                label: 'Inscripciones Totales',
                data: chartData.totalRegisteredData,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
            {
                label: 'Activos Acumulados',
                data: chartData.activeData,
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
            {
                label: 'Desactivados Acumulados',
                data: chartData.inactiveData,
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Historial de Jugadores</h1>
                <p className="text-slate-600 dark:text-slate-400">Línea temporal de inscripción y actividad de jugadores</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium opacity-90">Total Registrados</span>
                        <span className="text-2xl">👥</span>
                    </div>
                    <p className="text-4xl font-bold">{totalRegistered}</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium opacity-90">Activos</span>
                        <span className="text-2xl">✅</span>
                    </div>
                    <p className="text-4xl font-bold">{activeCount}</p>
                    <p className="text-sm opacity-75 mt-1">{totalRegistered > 0 ? Math.round((activeCount / totalRegistered) * 100) : 0}%</p>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium opacity-90">Inactivos</span>
                        <span className="text-2xl">❌</span>
                    </div>
                    <p className="text-4xl font-bold">{inactiveCount}</p>
                    <p className="text-sm opacity-75 mt-1">{totalRegistered > 0 ? Math.round((inactiveCount / totalRegistered) * 100) : 0}%</p>
                </div>
            </div>

            {/* View Mode Tabs */}
            <div className="flex gap-2 justify-between items-center border-b border-slate-200 dark:border-slate-700">
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('chart')}
                        className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                            viewMode === 'chart'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        📈 Gráfico
                    </button>
                    <button
                        onClick={() => setViewMode('timeline')}
                        className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                            viewMode === 'timeline'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        📋 Lista
                    </button>
                </div>
                {viewMode === 'timeline' && (
                    <button
                        onClick={() => {
                            const escapeCsvField = (field: any) => {
                                if (field === null || field === undefined) return '""';
                                const stringField = String(field);
                                return `"${stringField.replace(/"/g, '""')}"`;
                            };

                            const headers = ['Email', 'Jugador', 'Estado', 'Fecha Registro', 'Temporada', 'Grupo', 'Posición Final', 'Movimiento'];
                            const rows = timelineEvents.map((player: any) => {
                                const row = [
                                    escapeCsvField(player.email),
                                    escapeCsvField(player.playerName),
                                    player.isActive ? 'Activo' : 'Inactivo',
                                    new Date(player.registeredAt).toLocaleDateString('es-ES'),
                                ];
                                
                                // Add seasonal history
                                if (player.seasonHistories && player.seasonHistories.length > 0) {
                                    const seasonData = player.seasonHistories
                                        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                                    row.push(
                                        escapeCsvField(seasonData.season || ''),
                                        escapeCsvField(seasonData.group || ''),
                                        seasonData.finalRank ? String(seasonData.finalRank) : '',
                                        seasonData.movement || ''
                                    );
                                } else {
                                    row.push('', '', '', '');
                                }
                                
                                return row;
                            });

                            const csv = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
                            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                            const link = document.createElement('a');
                            const url = URL.createObjectURL(blob);
                            link.setAttribute('href', url);
                            link.setAttribute('download', `historial_jugadores_${new Date().toISOString().split('T')[0]}.csv`);
                            link.click();
                        }}
                        className="px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                        title="Descargar historial como CSV"
                    >
                        📥 CSV
                    </button>
                )}
            </div>

            {/* Chart View */}
            {viewMode === 'chart' && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Evolución de Inscripciones</h2>
                    {chartData.labels.length > 0 ? (
                        <div className="h-96">
                            <Line
                                data={chartConfig}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'top',
                                            labels: {
                                                color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#374151',
                                            },
                                        },
                                        title: {
                                            display: false,
                                        },
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            grid: {
                                                color: document.documentElement.classList.contains('dark') ? '#475569' : '#e5e7eb',
                                            },
                                            ticks: {
                                                color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#374151',
                                            },
                                        },
                                        x: {
                                            grid: {
                                                color: document.documentElement.classList.contains('dark') ? '#475569' : '#e5e7eb',
                                            },
                                            ticks: {
                                                color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#374151',
                                            },
                                        },
                                    },
                                }}
                            />
                        </div>
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-center py-12">
                            Sin datos disponibles para mostrar el gráfico
                        </p>
                    )}
                </div>
            )}

            {/* Timeline View */}
            {viewMode === 'timeline' && (
                <div className="space-y-3">
                {timelineEvents.length === 0 ? (
                    <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-8 text-center text-slate-600 dark:text-slate-400">
                        <p>No hay jugadores para mostrar</p>
                    </div>
                ) : (
                    timelineEvents.map((player: any) => (
                        <div
                            key={player.playerId}
                            className={`rounded-lg border-2 transition-colors ${
                                player.isActive
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                            }`}
                        >
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`text-2xl ${player.isActive ? '✅' : '❌'}`}></div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                                                {player.playerName}
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{player.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                            Registrado
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {new Date(player.registeredAt).toLocaleDateString('es-ES')}
                                        </p>
                                    </div>
                                </div>

                                {/* Seasonal history */}
                                {player.seasonHistories && player.seasonHistories.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-slate-300 dark:border-slate-600">
                                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Historial por temporada:</p>
                                        <div className="space-y-1">
                                            {player.seasonHistories
                                                .sort((a: any, b: any) => 
                                                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                                                )
                                                .map((history: any, idx: number) => (
                                                    <div key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                        <span className="inline-block w-24 font-medium">{history.season}</span>
                                                        {history.group ? (
                                                            <>
                                                                <span className="text-slate-500">•</span>
                                                                <span>{history.group}</span>
                                                                <span className="text-slate-500">•</span>
                                                                <span>Posición: #{history.finalRank || '-'}</span>
                                                                {history.movement && (
                                                                    <>
                                                                        <span className="text-slate-500">•</span>
                                                                        <span className="font-medium">
                                                                            {history.movement === 'PROMOTION' && '📈 Ascenso'}
                                                                            {history.movement === 'RELEGATION' && '📉 Descenso'}
                                                                            {history.movement === 'STAY' && '➡️ Mantiene'}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="text-slate-400">Sin grupo asignado</span>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                </div>
            )}
        </div>
    );
}
