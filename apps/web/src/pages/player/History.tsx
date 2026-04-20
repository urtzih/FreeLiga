import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../lib/api';

interface Row {
    playerId: string;
    playerName: string;
    nickname?: string;
    wins: number;
    losses: number;
    winPercentage: number;
    setsWon: number;
    setsLost: number;
    average: number;
}

interface Season {
    id: string;
    name: string;
}

const ITEMS_PER_PAGE = 10;

export default function History() {
    const { language } = useLanguage();
    const tr = (es: string, eu: string) => (language === 'eu' ? eu : es);

    const [filters, setFilters] = useState({ startDate: '', endDate: '', seasonId: '' });
    const [currentPage, setCurrentPage] = useState(1);

    const { data: classification = [], isLoading } = useQuery<Row[]>({
        queryKey: ['historyClassification', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', new Date(filters.startDate).toISOString());
            if (filters.endDate) params.append('endDate', new Date(filters.endDate).toISOString());
            if (filters.seasonId) params.append('seasonId', filters.seasonId);
            const { data } = await api.get(`/classification?${params.toString()}`);
            return data;
        },
    });

    const { data: seasons = [] } = useQuery<Season[]>({
        queryKey: ['seasons'],
        queryFn: async () => {
            const { data } = await api.get('/seasons');
            return data;
        },
    });

    const totalItems = classification.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const safeTotalPages = totalPages || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedData = classification.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    return (
        <div className="space-y-6">
            <div className="club-page-hero p-4 md:p-8">
                <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">{tr('Historia', 'Historia')}</h1>
                <p className="text-sm md:text-base club-page-hero-subtitle">
                    {tr(
                        'Explora rendimiento acumulado en cualquier rango temporal o temporada.',
                        'Aztertu metatutako errendimendua edozein denbora tarte edo denboralditan.',
                    )}
                </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{tr('Rango y Temporada', 'Tartea eta denboraldia')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{tr('Fecha de inicio', 'Hasiera data')}</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{tr('Fecha de fin', 'Amaiera data')}</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{tr('Temporada', 'Denboraldia')}</label>
                        <select
                            value={filters.seasonId}
                            onChange={(e) => setFilters({ ...filters, seasonId: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="">{tr('Todas', 'Guztiak')}</option>
                            {seasons.map((season) => (
                                <option key={season.id} value={season.id}>
                                    {season.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                    {tr(
                        'Se excluye la selecci\u00F3n de grupos para simplificar: usa temporada + fechas.',
                        'Errazteko, taldeen aukeraketa kanpoan uzten da: erabili denboraldia + datak.',
                    )}
                </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {tr('Resultados', 'Emaitzak')} ({totalItems}) - {tr('P\u00E1gina', 'Orria')} {currentPage} {tr('de', '/')} {safeTotalPages}
                    </h2>
                </div>
                {isLoading ? (
                    <div className="p-12 text-center text-slate-600 dark:text-slate-400">{tr('Calculando...', 'Kalkulatzen...')}</div>
                ) : (
                    <>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-900">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{tr('Jugador', 'Jokalaria')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{tr('Victorias', 'Garaipenak')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{tr('Derrotas', 'Porrotak')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">% {tr('Victorias', 'Garaipenak')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{tr('Sets +', 'Setak +')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{tr('Sets -', 'Setak -')}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Average</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {paginatedData.map((row) => (
                                        <tr key={row.playerId} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-slate-900 dark:text-white">{row.playerName}</div>
                                                {row.nickname && <div className="text-xs text-slate-500 dark:text-slate-400">"{row.nickname}"</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-bold text-green-600 dark:text-green-400">{row.wins}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-bold text-red-600 dark:text-red-400">{row.losses}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-medium text-amber-600 dark:text-amber-400">{row.winPercentage}%</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{row.setsWon}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{row.setsLost}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`font-bold ${row.average >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {row.average >= 0 ? '+' : ''}
                                                    {row.average}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {totalItems === 0 && (
                                <div className="p-12 text-center text-slate-600 dark:text-slate-400">
                                    {tr('Sin partidos en el rango seleccionado.', 'Ez dago partidarik aukeratutako tartean.')}
                                </div>
                            )}
                        </div>

                        <div className="md:hidden space-y-3 p-4">
                            {totalItems === 0 ? (
                                <div className="p-12 text-center text-slate-600 dark:text-slate-400">
                                    {tr('Sin partidos en el rango seleccionado.', 'Ez dago partidarik aukeratutako tartean.')}
                                </div>
                            ) : (
                                paginatedData.map((row) => (
                                    <div key={row.playerId} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-700/50">
                                        <p className="font-semibold text-sm text-slate-900 dark:text-white">{row.playerName}</p>
                                        {row.nickname && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">"{row.nickname}"</p>}
                                        <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs">
                                            <div>
                                                <p className="font-bold text-green-600 dark:text-green-400">{row.wins}</p>
                                                <p className="text-slate-500 dark:text-slate-400">{tr('Vict.', 'Gar.')}</p>
                                            </div>
                                            <div>
                                                <p className="font-bold text-red-600 dark:text-red-400">{row.losses}</p>
                                                <p className="text-slate-500 dark:text-slate-400">{tr('Derrot.', 'Porr.')}</p>
                                            </div>
                                            <div>
                                                <p className="font-medium text-amber-600 dark:text-amber-400">{row.winPercentage}%</p>
                                                <p className="text-slate-500 dark:text-slate-400">%Win</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs">
                                            <div>
                                                <p className="font-semibold text-slate-600 dark:text-slate-300">{row.setsWon}</p>
                                                <p className="text-slate-500 dark:text-slate-400">{tr('Sets+', 'Setak+')}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-600 dark:text-slate-300">{row.setsLost}</p>
                                                <p className="text-slate-500 dark:text-slate-400">{tr('Sets-', 'Setak-')}</p>
                                            </div>
                                            <div>
                                                <p className={`font-bold ${row.average >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {row.average >= 0 ? '+' : ''}
                                                    {row.average}
                                                </p>
                                                <p className="text-slate-500 dark:text-slate-400">Avg</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="px-3 md:px-6 py-2 md:py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-center items-center gap-2 md:gap-4">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-2 md:px-4 py-1 md:py-2 rounded-lg bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors text-sm md:text-base"
                                >
                                    <span className="md:hidden">{tr('Anterior', 'Aurrekoa')}</span>
                                    <span className="hidden md:inline">{tr('Anterior', 'Aurrekoa')}</span>
                                </button>
                                <span className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 flex flex-col md:flex-row items-center gap-1 md:gap-0">
                                    <span className="md:hidden">
                                        {currentPage}/{safeTotalPages}
                                    </span>
                                    <span className="hidden md:inline">
                                        {tr('P\u00E1gina', 'Orria')} <span className="font-bold">{currentPage}</span> {tr('de', '/')} <span className="font-bold">{safeTotalPages}</span>
                                    </span>
                                </span>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, safeTotalPages))}
                                    disabled={currentPage === safeTotalPages}
                                    className="px-2 md:px-4 py-1 md:py-2 rounded-lg bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors text-sm md:text-base"
                                >
                                    <span className="md:hidden">{tr('Siguiente', 'Hurrengoa')}</span>
                                    <span className="hidden md:inline">{tr('Siguiente', 'Hurrengoa')}</span>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
