import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import api from '../../lib/api';

export default function GroupView() {
    const { id } = useParams<{ id: string }>();

    const { data: group, isLoading } = useQuery({
        queryKey: ['group', id],
        queryFn: async () => {
            const { data } = await api.get(`/groups/${id}`);
            return data;
        },
    });

    if (isLoading) {
        return <div className="text-center py-12">Cargando...</div>;
    }

    if (!group) {
        return <div className="text-center py-12">Grupo no encontrado</div>;
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
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{group.name}</h1>
                <p className="text-slate-600 dark:text-slate-400">{group.season.name}</p>
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

            {/* Tabla de Clasificación */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Clasificación Actual</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Posición
                                </th>
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
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {index < 2 && <span className="text-xl mr-2">🏆</span>}
                                            {index >= totalPlayers - 2 && <span className="text-xl mr-2">⚠️</span>}
                                            <span className="text-lg font-bold text-slate-900 dark:text-white">
                                                #{gp.rankingPosition}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">{gp.player.name}</p>
                                            {gp.player.nickname && (
                                                <p className="text-sm text-slate-500 dark:text-slate-400">"{gp.player.nickname}"</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <ContactButtons
                                            phone={gp.player.phone}
                                            name={gp.player.name}
                                        />
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
            )}
        </div>
    );
}

function ContactButtons({ phone, name }: { phone?: string; name: string }) {
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
                href={`tel:${phone}`}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm font-medium"
                title="Llamar"
            >
                📞
            </a>
            <a
                href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors text-sm font-medium"
                title="WhatsApp"
            >
                💬
            </a>
            <button
                onClick={handleCopy}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                title="Copiar teléfono"
            >
                📋
            </button>
        </div>
    );
}
