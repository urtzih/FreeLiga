import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    SortingState,
    ColumnDef,
} from '@tanstack/react-table';
import api from '../../lib/api';

interface ClassificationRow {
    playerId: string;
    playerName: string;
    nickname?: string;
    currentGroup?: string;
    totalMatches: number;
    wins: number;
    losses: number;
    draws: number;
    winPercentage: number;
    setsWon: number;
    setsLost: number;
    averas: number;
}

export default function GlobalClassification() {
    const [sorting, setSorting] = useState<SortingState>([{ id: 'wins', desc: true }]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState({
        seasonId: '',
        groupId: '',
        startDate: '',
        endDate: '',
    });

    const { data: classification = [], isLoading } = useQuery({
        queryKey: ['classification', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.seasonId) params.append('seasonId', filters.seasonId);
            if (filters.groupId) params.append('groupId', filters.groupId);
            if (filters.startDate) params.append('startDate', new Date(filters.startDate).toISOString());
            if (filters.endDate) params.append('endDate', new Date(filters.endDate).toISOString());

            const { data } = await api.get(`/classification?${params.toString()}`);
            return data;
        },
    });

    const { data: seasons = [] } = useQuery({
        queryKey: ['seasons'],
        queryFn: async () => {
            const { data } = await api.get('/seasons');
            return data;
        },
    });

    const { data: groups = [] } = useQuery({
        queryKey: ['groups'],
        queryFn: async () => {
            const { data } = await api.get('/groups');
            return data;
        },
    });

    const columns: ColumnDef<ClassificationRow>[] = [
        {
            accessorKey: 'playerName',
            header: 'Jugador',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium text-slate-900 dark:text-white">{row.original.playerName}</p>
                    {row.original.nickname && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">"{row.original.nickname}"</p>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'currentGroup',
            header: 'Grupo',
            cell: ({ getValue }) => (
                <span className="text-slate-700 dark:text-slate-300">{getValue() as string || '-'}</span>
            ),
        },
        {
            accessorKey: 'wins',
            header: 'Victorias',
            cell: ({ getValue }) => (
                <span className="font-bold text-green-600 dark:text-green-400">{getValue() as number}</span>
            ),
        },
        {
            accessorKey: 'losses',
            header: 'Derrotas',
            cell: ({ getValue }) => (
                <span className="font-bold text-red-600 dark:text-red-400">{getValue() as number}</span>
            ),
        },
        {
            accessorKey: 'winPercentage',
            header: '% Victorias',
            cell: ({ getValue }) => (
                <span className="font-medium text-blue-600 dark:text-blue-400">{getValue() as number}%</span>
            ),
        },
        {
            accessorKey: 'setsWon',
            header: 'Sets+',
            cell: ({ getValue }) => (
                <span className="text-slate-900 dark:text-white">{getValue() as number}</span>
            ),
        },
        {
            accessorKey: 'setsLost',
            header: 'Sets-',
            cell: ({ getValue }) => (
                <span className="text-slate-900 dark:text-white">{getValue() as number}</span>
            ),
        },
        {
            accessorKey: 'averas',
            header: 'Average',
            cell: ({ getValue }) => {
                const value = getValue() as number;
                return (
                    <span className={`font-bold ${value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {value >= 0 ? '+' : ''}{value}
                    </span>
                );
            },
        },
    ];

    const table = useReactTable({
        data: classification,
        columns,
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    return (
        <div className="space-y-6">
            {/* Encabezado */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
                <h1 className="text-3xl font-bold mb-2">Clasificación Global</h1>
                <p className="text-purple-100">Clasificaciones y estadísticas de todos los jugadores</p>
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Filtros</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Buscar Jugador
                        </label>
                        <input
                            type="text"
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            placeholder="Buscar por nombre..."
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Temporada
                        </label>
                        <select
                            value={filters.seasonId}
                            onChange={(e) => setFilters({ ...filters, seasonId: e.target.value, groupId: '' })}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Todas las Temporadas</option>
                            {seasons.map((season: any) => (
                                <option key={season.id} value={season.id}>{season.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Grupo
                        </label>
                        <select
                            value={filters.groupId}
                            onChange={(e) => setFilters({ ...filters, groupId: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Todos los Grupos</option>
                            {groups.map((group: any) => (
                                <option key={group.id} value={group.id}>{group.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Rango de Fechas
                        </label>
                        <div className="flex space-x-2">
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="flex-1 px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="flex-1 px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-slate-600 dark:text-slate-400">Cargando...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <th
                                                key={header.id}
                                                className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                <div className="flex items-center space-x-1">
                                                    <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                                                    {header.column.getIsSorted() && (
                                                        <span>{header.column.getIsSorted() === 'asc' ? '↑' : '↓'}</span>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {table.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {table.getRowModel().rows.length === 0 && (
                            <div className="p-12 text-center text-slate-600 dark:text-slate-400">
                                No se encontraron jugadores con los filtros seleccionados
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
