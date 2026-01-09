import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import Loader from '../../components/Loader';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ClassificationRow {
    playerId: number;
    playerName: string;
    wins: number;
    losses: number;
    setsWon: number;
    setsLost: number;
}

export default function GroupView() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const calendarEnabled = user?.player?.calendarEnabled ?? false;

    const { data: group, isLoading } = useQuery({
        queryKey: ['group', id],
        queryFn: async () => {
            const { data } = await api.get(`/groups/${id}`);
            return data;
        },
    });

    const { data: classification, isLoading: loadingClassification, error: classificationError } = useQuery<ClassificationRow[]>({
        queryKey: ['classification', id],
        queryFn: async () => {
            const { data } = await api.get(`/classification?groupId=${id}`);
            return data;
        },
        enabled: !!id
    });

    // Filter matches for current player
    const myMatches = group?.matches.filter((match: any) => {
        const isMyMatch = match.player1Id === user?.player?.id || match.player2Id === user?.player?.id;
        if (!isMyMatch) return false;
        
        // Si calendario deshabilitado, filtrar partidos programados sin resultado
        if (!calendarEnabled) {
            const isScheduled = match.scheduledDate && (!match.gamesP1 || !match.gamesP2);
            if (isScheduled) return false;
        }
        
        return true;
    }) || [];

    if (isLoading || loadingClassification) {
        return <div className="py-12"><Loader /></div>;
    }

    if (!group) {
        return <div className="text-center py-12">Grupo no encontrado</div>;
    }

    if (classificationError) {
        return <div className="text-center py-12 text-red-600">Error cargando clasificación</div>;
    }

    const totalPlayers = group.groupPlayers.length;
    const totalPossibleMatches = (totalPlayers * (totalPlayers - 1)) / 2;
    const matchesPlayed = group.matches.filter((m: any) => m.matchStatus === 'PLAYED').length;
    const completionPercentage = totalPossibleMatches > 0
        ? Math.round((matchesPlayed / totalPossibleMatches) * 100)
        : 0;

    // Calcular días restantes
    const endDate = new Date(group.season.endDate);
    const today = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Función para exportar CSV del grupo
    const handleExportGroupCSV = () => {
        if (!group.groupPlayers) return;

        const rows: string[] = [];
        rows.push('Posición,Jugador,Partidos Ganados,Partidos Perdidos,Sets Ganados,Sets Perdidos,Movimiento');

        const sortedPlayers = [...group.groupPlayers].sort((a: any, b: any) => a.rankingPosition - b.rankingPosition);
        sortedPlayers.forEach((gp: any) => {
            const movement = gp.rankingPosition <= 2 ? 'ASCENSO' : gp.rankingPosition > totalPlayers - 2 ? 'DESCENSO' : 'MANTIENE';
            const wins = group.matches.filter((m: any) => m.matchStatus === 'PLAYED' && m.winnerId === gp.playerId).length || 0;
            const losses = group.matches.filter((m: any) => m.matchStatus === 'PLAYED' && ((m.player1Id === gp.playerId && m.winnerId === m.player2Id) || (m.player2Id === gp.playerId && m.winnerId === m.player1Id))).length || 0;

            let setsWon = 0, setsLost = 0;
            group.matches.forEach((m: any) => {
                if (m.matchStatus === 'PLAYED') {
                    if (m.player1Id === gp.playerId) {
                        setsWon += m.gamesP1;
                        setsLost += m.gamesP2;
                    } else if (m.player2Id === gp.playerId) {
                        setsWon += m.gamesP2;
                        setsLost += m.gamesP1;
                    }
                }
            });

            rows.push(`${gp.rankingPosition},"${gp.player.name}",${wins},${losses},${setsWon},${setsLost},"${movement}"`);
        });

        const csv = rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `clasificacion_${group.name.replace(/\s+/g, '_')}.csv`);
        link.click();
    };

    return (
        <div className="space-y-6">
            {/* Encabezado */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{group.name}</h1>
                    <p className="text-slate-600 dark:text-slate-400">{group.season.name}</p>
                </div>
                <div className="flex gap-2">
                    {user?.role === 'ADMIN' && (
                        <button
                            onClick={handleExportGroupCSV}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-sm"
                            title="Descargar clasificación como CSV"
                        >
                            📥 CSV
                        </button>
                    )}
                    {group.whatsappUrl && (
                        <a
                            href={group.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-sm whitespace-nowrap h-fit self-center"
                            title="Grupo WhatsApp"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            <span className="hidden sm:inline">Grupo WhatsApp</span>
                            <span className="sm:hidden">WhatsApp</span>
                        </a>
                    )}
                </div>
            </div>

            {/* Indicadores de Progreso */}
            <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 md:p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs md:text-sm font-medium opacity-90">Días Restantes</span>
                        <span className="text-xl md:text-2xl">⏰</span>
                    </div>
                    <p className="text-3xl md:text-4xl font-bold">{daysRemaining > 0 ? daysRemaining : 0}</p>
                    <p className="text-xs md:text-sm opacity-75 mt-1">Hasta el {endDate.toLocaleDateString('es-ES')}</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 md:p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs md:text-sm font-medium opacity-90">Progreso</span>
                        <span className="text-xl md:text-2xl">📊</span>
                    </div>
                    <p className="text-3xl md:text-4xl font-bold">{completionPercentage}%</p>
                    <p className="text-xs md:text-sm opacity-75 mt-1">{matchesPlayed} / {totalPossibleMatches} partidos</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 md:p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs md:text-sm font-medium opacity-90">Total Jugadores</span>
                        <span className="text-xl md:text-2xl">👥</span>
                    </div>
                    <p className="text-3xl md:text-4xl font-bold">{totalPlayers}</p>
                    <p className="text-xs md:text-sm opacity-75 mt-1">Activos en el grupo</p>
                </div>
            </div>

            {/* Estadísticas del Grupo */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Estadísticas del Grupo</h2>
                    {classification && classification.length > 0 && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">{classification.length} jugadores</span>
                    )}
                </div>
                <div className="p-6 space-y-6">
                    {!classification || classification.length === 0 ? (
                        <p className="text-sm text-slate-600 dark:text-slate-400">Sin partidos registrados todavía.</p>
                    ) : (
                        <>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-900">
                                        <tr>
                                            <th className="px-3 py-2 text-center font-medium text-slate-600 dark:text-slate-400">Pos</th>
                                            <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400">Jugador</th>
                                            <th className="px-3 py-2 text-center font-medium text-slate-600 dark:text-slate-400">Victorias</th>
                                            <th className="px-3 py-2 text-center font-medium text-slate-600 dark:text-slate-400">Derrotas</th>
                                            <th className="px-3 py-2 text-center font-medium text-slate-600 dark:text-slate-400">Restantes</th>
                                            <th className="px-3 py-2 text-center font-medium text-slate-600 dark:text-slate-400">Lesión</th>
                                            <th className="px-3 py-2 text-center font-medium text-slate-600 dark:text-slate-400">Sets +</th>
                                            <th className="px-3 py-2 text-center font-medium text-slate-600 dark:text-slate-400">Sets -</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {classification.map((row, idx) => {
                                            // Calculate injuries for this player
                                            const playerInjuries = group.matches.filter((m: any) =>
                                                (m.player1Id === row.playerId || m.player2Id === row.playerId) &&
                                                m.matchStatus === 'INJURY'
                                            ).length;

                                            // Calculate remaining matches
                                            const totalMatchesForPlayer = totalPlayers - 1;
                                            const played = row.wins + row.losses;
                                            const remaining = totalMatchesForPlayer - played;
                                            
                                            // Determinar ascenso/descenso
                                            const isPromotion = idx < 2; // Top 2: ascenso
                                            const isRelegation = idx >= totalPlayers - 2; // Últimos 2: descenso
                                            
                                            const rowClass = isPromotion 
                                                ? "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30" 
                                                : isRelegation 
                                                ? "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
                                                : "hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors";

                                            return (
                                                <tr key={row.playerId} className={rowClass}>
                                                    <td className="px-3 py-2 text-center font-semibold text-slate-600 dark:text-slate-400">{idx + 1}</td>
                                                    <td className="px-3 py-2">{row.playerName}</td>
                                                    <td className="px-3 py-2 text-center font-semibold text-green-600 dark:text-green-400">{row.wins}</td>
                                                    <td className="px-3 py-2 text-center font-semibold text-red-600 dark:text-red-400">{row.losses}</td>
                                                    <td className="px-3 py-2 text-center font-semibold text-slate-600 dark:text-slate-400">{remaining}</td>
                                                    <td className="px-3 py-2 text-center font-semibold text-orange-600 dark:text-orange-400">{playerInjuries}</td>
                                                    <td className="px-3 py-2 text-center">{row.setsWon}</td>
                                                    <td className="px-3 py-2 text-center">{row.setsLost}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="w-full hidden md:block">
                                <h3 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300">Todos los Jugadores (Victorias / Derrotas / Restantes)</h3>
                                <div className="w-full" style={{ maxHeight: '600px' }}>
                                    <Bar
                                        data={{
                                            labels: classification.map(c => c.playerName.split(' ')[0]),
                                            datasets: [
                                                {
                                                    label: 'Victorias',
                                                    data: classification.map(c => c.wins),
                                                    backgroundColor: 'rgba(34,197,94,0.6)'
                                                },
                                                {
                                                    label: 'Derrotas',
                                                    data: classification.map(c => c.losses),
                                                    backgroundColor: 'rgba(239,68,68,0.6)'
                                                },
                                                {
                                                    label: 'Restantes',
                                                    data: classification.map(c => {
                                                        const played = c.wins + c.losses;
                                                        return (totalPlayers - 1) - played;
                                                    }),
                                                    backgroundColor: 'rgba(148, 163, 184, 0.6)'
                                                },
                                                {
                                                    label: 'Con Lesión',
                                                    data: classification.map(c => {
                                                        return group.matches.filter((m: any) =>
                                                            (m.player1Id === c.playerId || m.player2Id === c.playerId) &&
                                                            m.matchStatus === 'INJURY'
                                                        ).length;
                                                    }),
                                                    backgroundColor: 'rgba(249, 115, 22, 0.6)'
                                                }
                                            ]
                                        }}
                                        options={{
                                            indexAxis: window.innerWidth < 768 ? 'y' : 'x',
                                            responsive: true,
                                            maintainAspectRatio: true,
                                            plugins: {
                                                legend: { position: 'bottom' },
                                                title: { display: false, text: '' }
                                            },
                                            scales: { 
                                                y: { beginAtZero: true, max: Math.max(...classification.slice(0, 10).map(c => Math.max(c.wins, c.losses))) + 2 }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Clasificación Actual (Ranking interno) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Clasificación Actual</h2>
                </div>
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Jugador
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Resultado Directo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Contacto
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {group.groupPlayers
                                .filter((gp: any) => gp.player.user?.role !== 'ADMIN')
                                .map((gp: any, index: number) => {
                                    const isCurrentUser = gp.playerId === user?.player?.id;
                                    
                                    // Buscar enfrentamiento directo
                                    const directMatch = group.matches.find((m: any) =>
                                        m.matchStatus === 'PLAYED' && (
                                            (m.player1Id === user?.player?.id && m.player2Id === gp.playerId) ||
                                            (m.player2Id === user?.player?.id && m.player1Id === gp.playerId)
                                        )
                                    );
                                    
                                    let resultText = 'No jugado';
                                    let resultColor = 'text-slate-400';
                                    
                                    if (directMatch) {
                                        const won = directMatch.winnerId === user?.player?.id;
                                        const lost = directMatch.winnerId === gp.playerId;
                                        
                                        if (won) {
                                            resultText = directMatch.player1Id === user?.player?.id 
                                                ? `✓ ${directMatch.gamesP1}-${directMatch.gamesP2}` 
                                                : `✓ ${directMatch.gamesP2}-${directMatch.gamesP1}`;
                                            resultColor = 'text-green-600 dark:text-green-400 font-semibold';
                                        } else if (lost) {
                                            resultText = directMatch.player1Id === user?.player?.id 
                                                ? `✗ ${directMatch.gamesP1}-${directMatch.gamesP2}` 
                                                : `✗ ${directMatch.gamesP2}-${directMatch.gamesP1}`;
                                            resultColor = 'text-red-600 dark:text-red-400 font-semibold';
                                        }
                                    }
                                    
                                    return (
                                        <tr 
                                            key={gp.id} 
                                            className={`hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    {index < 2 && <span className="text-xl">🏆</span>}
                                                    {index >= totalPlayers - 2 && <span className="text-xl">⚠️</span>}
                                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                                        #{gp.rankingPosition}
                                                    </span>
                                                    <div>
                                                        <p className={`font-medium ${isCurrentUser ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                                                            {gp.player.name} {isCurrentUser && '(Tú)'}
                                                        </p>
                                                        {gp.player.nickname && (
                                                            <p className="text-sm text-slate-500 dark:text-slate-400">"{gp.player.nickname}"</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {isCurrentUser ? (
                                                    <span className="text-sm text-slate-400 dark:text-slate-500 italic">—</span>
                                                ) : (
                                                    <span className={`text-sm ${resultColor}`}>
                                                        {resultText}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {isCurrentUser ? (
                                                    <span className="text-sm text-slate-400 dark:text-slate-500 italic">Eres tú</span>
                                                ) : (
                                                    <ContactButtons phone={gp.player.phone} email={gp.player.user?.email} />
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>

                {/* Vista Móvil - Cards */}
                <div className="md:hidden space-y-3 p-4">
                    {group.groupPlayers
                        .filter((gp: any) => gp.player.user?.role !== 'ADMIN')
                        .map((gp: any, index: number) => {
                            const isCurrentUser = gp.playerId === user?.player?.id;
                            
                            const directMatch = group.matches.find((m: any) =>
                                m.matchStatus === 'PLAYED' && (
                                    (m.player1Id === user?.player?.id && m.player2Id === gp.playerId) ||
                                    (m.player2Id === user?.player?.id && m.player1Id === gp.playerId)
                                )
                            );
                            
                            let resultText = 'No jugado';
                            let resultColor = 'text-slate-400';
                            
                            if (directMatch) {
                                const won = directMatch.winnerId === user?.player?.id;
                                const lost = directMatch.winnerId === gp.playerId;
                                
                                if (won) {
                                    resultText = directMatch.player1Id === user?.player?.id 
                                        ? `✓ ${directMatch.gamesP1}-${directMatch.gamesP2}` 
                                        : `✓ ${directMatch.gamesP2}-${directMatch.gamesP1}`;
                                    resultColor = 'text-green-600 dark:text-green-400 font-semibold';
                                } else if (lost) {
                                    resultText = directMatch.player1Id === user?.player?.id 
                                        ? `✗ ${directMatch.gamesP1}-${directMatch.gamesP2}` 
                                        : `✗ ${directMatch.gamesP2}-${directMatch.gamesP1}`;
                                    resultColor = 'text-red-600 dark:text-red-400 font-semibold';
                                }
                            }

                            return (
                                <div 
                                    key={gp.id} 
                                    className={`p-4 rounded-lg border ${isCurrentUser ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div>
                                                {index < 2 && <span className="text-lg">🏆</span>}
                                                {index >= totalPlayers - 2 && <span className="text-lg">⚠️</span>}
                                                {index >= 2 && index < totalPlayers - 2 && <span className="text-sm font-bold text-slate-500">#{gp.rankingPosition}</span>}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-semibold text-sm ${isCurrentUser ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                                                    #{gp.rankingPosition} {gp.player.name} {isCurrentUser && '(Tú)'}
                                                </p>
                                                {gp.player.nickname && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">"{gp.player.nickname}"</p>
                                                )}
                                                {!isCurrentUser && (
                                                    <p className={`text-xs mt-2 ${resultColor}`}>{resultText}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {!isCurrentUser && (
                                        <div className="mt-3 flex gap-2">
                                            <ContactButtons phone={gp.player.phone} email={gp.player.user?.email} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* Partidos Recientes */}
            {group.matches.length > 0 && (

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Partidos Recientes</h2>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {group.matches
                            .filter((match: any) => match.matchStatus === 'PLAYED' && match.gamesP1 !== null && match.gamesP2 !== null)
                            .slice(0, 10)
                            .map((match: any) => (
                            <div key={match.id} className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <span className={`font-medium ${match.winnerId === match.player1Id ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
                                                {match.player1.name}
                                            </span>
                                            <span className="text-slate-600 dark:text-slate-400">vs</span>
                                            <span className={`font-medium ${match.winnerId === match.player2Id ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
                                                {match.player2.name}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                            {new Date(match.date).toLocaleDateString('es-ES')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {match.gamesP1} - {match.gamesP2}
                                        </p>
                                        {match.matchStatus !== 'PLAYED' && (
                                            <p className="text-xs text-orange-600 dark:text-orange-400 uppercase">
                                                {match.matchStatus === 'INJURY' ? 'LESIÓN' : 'CANCELADO'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )
            }

            {/* Mis Partidos - Matches for the current player */}
            {user?.player?.id && myMatches.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Mis Partidos</h2>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            {myMatches.filter((m: any) => m.matchStatus === 'PLAYED' && m.gamesP1 !== null && m.gamesP2 !== null).length} jugados de {myMatches.length} totales
                        </span>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {myMatches
                            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((match: any) => {
                                const isPlayer1 = match.player1Id === user?.player?.id;
                                const opponent = isPlayer1 ? match.player2 : match.player1;
                                const myScore = isPlayer1 ? match.gamesP1 : match.gamesP2;
                                const opponentScore = isPlayer1 ? match.gamesP2 : match.gamesP1;
                                const won = match.winnerId === user?.player?.id;
                                const played = match.matchStatus === 'PLAYED' && match.gamesP1 !== null && match.gamesP2 !== null;

                                return (
                                    <div key={match.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3">
                                                    {played && (
                                                        <span className="text-2xl">
                                                            {won ? '✅' : '❌'}
                                                        </span>
                                                    )}
                                                    {!played && (
                                                        <span className="text-2xl">⏳</span>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-white">
                                                            vs {opponent.name}
                                                        </p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                                            {new Date(played ? match.date : (match.scheduledDate || match.date)).toLocaleDateString('es-ES', { 
                                                                day: '2-digit', 
                                                                month: '2-digit', 
                                                                year: 'numeric',
                                                                ...(match.scheduledDate && !played ? { hour: '2-digit', minute: '2-digit' } : {})
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {played ? (
                                                    <>
                                                        <p className={`text-2xl font-bold ${won ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                            {myScore} - {opponentScore}
                                                        </p>
                                                        {match.matchStatus === 'INJURY' && (
                                                            <p className="text-xs text-orange-600 dark:text-orange-400 uppercase mt-1">
                                                                LESIÓN
                                                            </p>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        Pendiente
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}
        </div >
    );
}

function ContactButtons({ phone, email }: { phone?: string; email?: string }) {
    const hasValidEmail = email && !email.endsWith('@ejemplo.com');
    
    if (!phone && !hasValidEmail) {
        return <span className="text-sm text-slate-400">Sin información de contacto</span>;
    }

    return (
        <div className="flex items-center space-x-2 flex-wrap">
            {phone && (
                <>
                    <a
                        href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors text-sm font-medium inline-flex items-center gap-2"
                        title="WhatsApp"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        WhatsApp
                    </a>
                    <a
                        href={`tel:${phone}`}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm font-medium"
                        title="Llamar"
                    >
                        📞 Llamar
                    </a>
                </>
            )}
            {hasValidEmail && (
                <a
                    href={`mailto:${email}`}
                    className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors text-sm font-medium"
                    title="Enviar email"
                >
                    ✉️ Email
                </a>
            )}
        </div>
    );
}
