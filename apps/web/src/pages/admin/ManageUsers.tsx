import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

interface User {
    id: string;
    email: string;
    role: 'PLAYER' | 'ADMIN';
    createdAt: string;
    player?: {
        id: string;
        name: string;
        nickname?: string;
        phone?: string;
        currentGroup?: {
            id: string;
            name: string;
        };
    };
}

interface UsersResponse {
    users: User[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export default function ManageUsers() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGroup, setFilterGroup] = useState('');
    const [editForm, setEditForm] = useState({
        email: '',
        name: '',
        nickname: '',
        phone: '',
        role: 'PLAYER' as 'PLAYER' | 'ADMIN',
        groupId: ''
    });

    // Obtener temporada activa y grupos para asignar
    const { data: adminStats } = useQuery<{ activeSeason?: { id: string; groups: Array<{ id: string; name: string }> } }>({
        queryKey: ['adminStatsForUsers'],
        queryFn: async () => {
            const { data } = await api.get('/admin/stats');
            return data;
        },
        staleTime: 30_000,
    });
    const availableGroups = adminStats?.activeSeason?.groups || [];

    const { data, isLoading } = useQuery<UsersResponse>({
        queryKey: ['users', page],
        queryFn: async () => {
            const { data } = await api.get(`/users?page=${page}&limit=20`);
            return data;
        },
    });

    // Filter users client-side
    const filteredUsers = data?.users.filter(user => {
        const matchesSearch = !searchTerm ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.player?.name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesGroup = !filterGroup ||
            user.player?.currentGroup?.id === filterGroup;

        return matchesSearch && matchesGroup;
    }) || [];

    const updateRoleMutation = useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: 'PLAYER' | 'ADMIN' }) => {
            const { data } = await api.put(`/users/${userId}/role`, { role });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setSelectedUser(null);
        },
    });

    const resetPasswordMutation = useMutation({
        mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
            const { data } = await api.post(`/users/${userId}/reset-password`, { newPassword });
            return data;
        },
        onSuccess: () => {
            setShowResetPassword(false);
            setNewPassword('');
            setSelectedUser(null);
            alert('Contraseña restablecida correctamente');
        },
    });

    const updateUserMutation = useMutation({
        mutationFn: async ({ userId, userData, playerId, previousGroupId }: { userId: string; userData: any; playerId?: string; previousGroupId?: string }) => {
            // excluir groupId del body del usuario
            const { groupId, ...userBody } = userData;
            const { data: updated } = await api.put(`/users/${userId}`, userBody);

            // gestionar cambio de grupo si procede
            if (playerId) {
                const newGroupId = groupId;
                if (newGroupId && newGroupId !== previousGroupId) {
                    // quitar de grupo anterior
                    if (previousGroupId) {
                        await api.delete(`/groups/${previousGroupId}/players/${playerId}`);
                    }
                    // añadir al nuevo
                    await api.post(`/groups/${newGroupId}/players`, { playerId });
                } else if (!newGroupId && previousGroupId) {
                    // quitar grupo sin reasignar
                    await api.delete(`/groups/${previousGroupId}/players/${playerId}`);
                }
            }
            return updated;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['adminStatsForUsers'] });
            setShowEditModal(false);
            setSelectedUser(null);
            alert('Usuario actualizado correctamente');
        },
        onError: (error: any) => {
            console.error('Error actualizando usuario:', error);
            alert(`Error al actualizar usuario: ${error.response?.data?.error || error.message}`);
        },
    });

    const handleRoleChange = (user: User, newRole: 'PLAYER' | 'ADMIN') => {
        if (confirm(`¿Cambiar el rol de ${user.email} a ${newRole}?`)) {
            updateRoleMutation.mutate({ userId: user.id, role: newRole });
        }
    };

    const handleResetPassword = () => {
        if (!selectedUser || !newPassword) return;
        if (newPassword.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        if (confirm(`¿Restablecer la contraseña de ${selectedUser.email}?`)) {
            resetPasswordMutation.mutate({ userId: selectedUser.id, newPassword });
        }
    };

    const handleOpenEditModal = (user: User) => {
        setSelectedUser(user);
        setEditForm({
            email: user.email,
            name: user.player?.name || '',
            nickname: user.player?.nickname || '',
            phone: user.player?.phone || '',
            role: user.role,
            groupId: user.player?.currentGroup?.id || ''
        });
        setShowEditModal(true);
        <div className="text-lg text-slate-600 dark:text-slate-400">Cargando usuarios...</div>
            </div >
        );
}

return (
    <div className="space-y-6">
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-lg">
            <h1 className="text-3xl font-bold mb-2">Gestión de Usuarios</h1>
            <p className="text-blue-100">Administrar usuarios y permisos del sistema</p>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Buscar por nombre o email
                    </label>
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Filtrar por grupo
                    </label>
                    <select
                        value={filterGroup}
                        onChange={(e) => setFilterGroup(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Todos los grupos</option>
                        {availableGroups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>

        {/* Lista de Usuarios */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Usuarios ({filteredUsers.length} de {data?.pagination.total || 0})
                </h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Jugador
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Grupo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Rol
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Fecha Registro
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                                        {user.email}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-slate-600 dark:text-slate-400">
                                        {user.player?.name || '-'}
                                    </div>
                                    {user.player?.nickname && (
                                        <div className="text-xs text-slate-400">"{user.player.nickname}"</div>
                                    )}
                                    {user.player?.phone && (
                                        <div className="text-xs text-slate-400">{user.player.phone}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-slate-600 dark:text-slate-400">
                                        {user.player?.currentGroup?.name || 'Sin grupo'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select
                                        value={user.role}
                                        onChange={(e) =>
                                            handleRoleChange(user, e.target.value as 'PLAYER' | 'ADMIN')
                                        }
                                        className="text-sm px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    >
                                        <option value="PLAYER">Jugador</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-slate-600 dark:text-slate-400">
                                        {new Date(user.createdAt).toLocaleDateString('es-ES')}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleOpenEditModal(user)}
                                            className="text-sm px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setShowResetPassword(true);
                                            }}
                                            className="text-sm px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Resetear Contraseña
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            {data && data.pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                            Página {data.pagination.page} de {data.pagination.totalPages}
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                                disabled={page === data.pagination.totalPages}
                                className="px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Modal de Editar Usuario */}
        {showEditModal && selectedUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                        Editar Usuario
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Nombre Completo *
                            </label>
                            <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Apodo
                            </label>
                            <input
                                type="text"
                                value={editForm.nickname}
                                onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Rol
                                </label>
                                <select
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'PLAYER' | 'ADMIN' })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                >
                                    <option value="PLAYER">Jugador</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Grupo (temporada activa)
                                </label>
                                <select
                                    value={editForm.groupId}
                                    onChange={(e) => setEditForm({ ...editForm, groupId: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                >
                                    <option value="">Sin grupo</option>
                                    {availableGroups.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-3 mt-6">
                        <button
                            onClick={handleUpdateUser}
                            disabled={updateUserMutation.isPending}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {updateUserMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                        <button
                            onClick={() => {
                                setShowEditModal(false);
                                setSelectedUser(null);
                            }}
                            className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Modal de Resetear Contraseña */}
        {showResetPassword && selectedUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                        Resetear Contraseña
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                        Usuario: <strong>{selectedUser.email}</strong>
                    </p>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Nueva Contraseña
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={handleResetPassword}
                            disabled={resetPasswordMutation.isPending}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {resetPasswordMutation.isPending ? 'Reseteando...' : 'Resetear'}
                        </button>
                        <button
                            onClick={() => {
                                setShowResetPassword(false);
                                setNewPassword('');
                                setSelectedUser(null);
                            }}
                            className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
);
}
