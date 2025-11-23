import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import api from '../../lib/api';
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

    if (isLoading || loadingClassification) {
        return <div className="text-center py-12">Cargando...</div>;
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

    return (
        <div className="space-y-6">
            {/* Encabezado */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{group.name}</h1>
                    <p className="text-slate-600 dark:text-slate-400">{group.season.name}</p>
                </div>
                {group.whatsappUrl && (
                    <a
                        href={group.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Grupo WhatsApp
                    </a>
                )}
            </div>

            {/* Indicadores de Progreso */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium opacity-90">Días Restantes</span>
                        <span className="text-2xl">⏰</span>
                    </div>
                    <p className="text-4xl font-bold">{daysRemaining > 0 ? daysRemaining : 0}</p>
                    <p className="text-sm opacity-75 mt-1">Hasta el {endDate.toLocaleDateString('es-ES')}</p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium opacity-90">Progreso</span>
                        <span className="text-2xl">📊</span>
                    </div>
                    <p className="text-4xl font-bold">{completionPercentage}%</p>
                    <p className="text-sm opacity-75 mt-1">{matchesPlayed} / {totalPossibleMatches} partidos</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium opacity-90">Total Jugadores</span>
                        <span className="text-2xl">👥</span>
                    </div>
                    <p className="text-4xl font-bold">{totalPlayers}</p>
                    <p className="text-sm opacity-75 mt-1">Activos en el grupo</p>
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
                                        {classification.map((row) => {
                                            // Calculate injuries for this player
                                            const playerInjuries = group.matches.filter((m: any) =>
                                                (m.player1Id === row.playerId || m.player2Id === row.playerId) &&
                                                m.matchStatus === 'INJURY'
                                            ).length;

                                            // Calculate remaining matches
                                            // Total matches per player = totalPlayers - 1
                                            // Played matches (including injuries) = wins + losses + playerInjuries (if losses doesn't include injuries, need to check)
                                            // Assuming 'losses' from API includes all lost matches. 
                                            // Let's re-verify how losses are calculated in backend or just use local calculation if possible.
                                            // Backend: losses = playerMatches.filter(m => m.winnerId && m.winnerId !== player.id).length
                                            // If matchStatus is INJURY, there is usually a winnerId set to the non-injured player.
                                            // So injuries are likely already counted in wins/losses.
                                            // But we want to show them explicitly.

                                            // Wait, if I want to show "Remaining", I need (Total Possible) - (Played).
                                            // Played = Wins + Losses.
                                            // So Remaining = (totalPlayers - 1) - (row.wins + row.losses).

                                            const totalMatchesForPlayer = totalPlayers - 1;
                                            const played = row.wins + row.losses;
                                            const remaining = totalMatchesForPlayer - played;

                                            return (
                                                <tr key={row.playerId} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
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
                            <div>
                                <h3 className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Top 10 (Victorias / Derrotas / Restantes)</h3>
                                <Bar
                                    data={{
                                        labels: classification.slice(0, 10).map(c => c.playerName.split(' ')[0]),
                                        datasets: [
                                            {
                                                label: 'Victorias',
                                                data: classification.slice(0, 10).map(c => c.wins),
                                                backgroundColor: 'rgba(34,197,94,0.6)'
                                            },
                                            {
                                                label: 'Derrotas',
                                                data: classification.slice(0, 10).map(c => c.losses),
                                                backgroundColor: 'rgba(239,68,68,0.6)'
                                            },
                                            {
                                                label: 'Restantes',
                                                data: classification.slice(0, 10).map(c => {
                                                    const played = c.wins + c.losses;
                                                    return (totalPlayers - 1) - played;
                                                }),
                                                backgroundColor: 'rgba(148, 163, 184, 0.6)'
                                            },
                                            {
                                                label: 'Con Lesión',
                                                data: classification.slice(0, 10).map(c => {
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
                                        responsive: true,
                                        plugins: {
                                            legend: { position: 'bottom' },
                                            title: { display: false, text: '' }
                                        },
                                        scales: { y: { beginAtZero: true } }
                                    }}
                                />
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
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Jugador
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Contacto
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {group.groupPlayers.map((gp: any, index: number) => (
                                <tr key={gp.id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            {index < 2 && <span className="text-xl">🏆</span>}
                                            {index >= totalPlayers - 2 && <span className="text-xl">⚠️</span>}
                                            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                                #{gp.rankingPosition}
                                            </span>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">{gp.player.name}</p>
                                                {gp.player.nickname && (
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">"{gp.player.nickname}"</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <ContactButtons phone={gp.player.phone} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Partidos Recientes */}
            {group.matches.length > 0 && (

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Partidos Recientes</h2>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {group.matches.slice(0, 10).map((match: any) => (
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
        </div >
    );
}

function ContactButtons({ phone }: { phone?: string }) {
    if (!phone) {
        return <span className="text-sm text-slate-400">Sin información de contacto</span>;
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(phone);
        alert('¡Teléfono copiado!');
    };

    return (
        <div className="flex items-center space-x-2">
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
        </div>
    );
}
