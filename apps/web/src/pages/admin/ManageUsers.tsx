import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import api from '../../lib/api';

interface User {
    id: string;
    email: string;
    role: 'PLAYER' | 'ADMIN';
    isActive: boolean;
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

    // UI state
    const [page, setPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGroup, setFilterGroup] = useState('');
    const [sortField, setSortField] = useState<'email' | 'name' | 'group' | 'role' | 'isActive' | 'createdAt'>('createdAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [editForm, setEditForm] = useState({
        email: '',
        name: '',
        nickname: '',
        phone: '',
        role: 'PLAYER' as 'PLAYER' | 'ADMIN',
        groupId: ''
    });
    const [createForm, setCreateForm] = useState({
        email: '',
        password: '',
        name: '',
        nickname: '',
        phone: '',
        role: 'PLAYER' as 'PLAYER' | 'ADMIN',
        groupId: ''
    });

    // Fetch admin stats for available groups (active season)
    const { data: adminStats } = useQuery({
        queryKey: ['adminStatsForUsers'],
        queryFn: async () => {
            const { data } = await api.get('/admin/stats');
            return data;
        }
    });
    const availableGroups = adminStats?.activeSeason?.groups || [];

    // Fetch users (paginated)
    const { data, isLoading } = useQuery<UsersResponse>({
        queryKey: ['users', page],
        queryFn: async () => {
            const { data } = await api.get(`/users?page=${page}&limit=20`);
            return data;
        }
    });

    // Client‑side filter & sort
    const filteredUsers = (data?.users || [])
        .filter(user => {
            const matchesSearch =
                !searchTerm ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.player?.name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesGroup = !filterGroup || user.player?.currentGroup?.id === filterGroup;
            return matchesSearch && matchesGroup;
        })
        .sort((a, b) => {
            let aVal: any, bVal: any;
            switch (sortField) {
                case 'email':
                    aVal = a.email; bVal = b.email; break;
                case 'name':
                    aVal = a.player?.name || ''; bVal = b.player?.name || ''; break;
                case 'group':
                    aVal = a.player?.currentGroup?.name || ''; bVal = b.player?.currentGroup?.name || ''; break;
                case 'role':
                    aVal = a.role; bVal = b.role; break;
                case 'isActive':
                    aVal = a.isActive ? 1 : 0; bVal = b.isActive ? 1 : 0; break;
                case 'createdAt':
                    aVal = new Date(a.createdAt).getTime(); bVal = new Date(b.createdAt).getTime(); break;
                default:
                    aVal = ''; bVal = '';
            }
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

    const handleSort = (field: typeof sortField) => {
        if (sortField === field) {
            setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Mutations
    const updateRoleMutation = useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: 'PLAYER' | 'ADMIN' }) => {
            const { data } = await api.put(`/users/${userId}/role`, { role });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });

    const createUserMutation = useMutation({
        mutationFn: async (newUser: typeof createForm) => {
            const { data } = await api.post('/users', newUser);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setShowCreateModal(false);
            setCreateForm({ email: '', password: '', name: '', nickname: '', phone: '', role: 'PLAYER', groupId: '' });
        },
        onError: (error: any) => {
            alert(`Error al crear usuario: ${error.response?.data?.error || error.message}`);
        }
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
        }
    });

    const updateUserMutation = useMutation({
        mutationFn: async ({ userId, userData, playerId, previousGroupId }: { userId: string; userData: any; playerId?: string; previousGroupId?: string }) => {
            const { groupId, ...userBody } = userData;
            const { data: updated } = await api.put(`/users/${userId}`, userBody);
            if (playerId) {
                const newGroupId = groupId;
                if (newGroupId && newGroupId !== previousGroupId) {
                    if (previousGroupId) {
                        await api.delete(`/groups/${previousGroupId}/players/${playerId}`);
                    }
                    await api.post(`/groups/${newGroupId}/players`, { playerId });
                } else if (!newGroupId && previousGroupId) {
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
            alert(`Error al actualizar usuario: ${error.response?.data?.error || error.message}`);
        }
    });

    const toggleActivationMutation = useMutation({
        mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
            const { data } = await api.put(`/users/${userId}`, { isActive });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            alert('Estado de usuario actualizado correctamente');
        },
        onError: (error: any) => {
            alert(`Error al actualizar estado: ${error.response?.data?.error || error.message}`);
        }
    });

    // Handlers for modals
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
    };

    const handleUpdateUser = () => {
        if (!selectedUser) return;
        if (!editForm.email || !editForm.name) {
            alert('El email y el nombre son obligatorios');
            return;
        }
        updateUserMutation.mutate({
            userId: selectedUser.id,
            userData: editForm,
            playerId: selectedUser.player?.id,
            previousGroupId: selectedUser.player?.currentGroup?.id
        });
    };

    const handleResetPassword = () => {
        if (!selectedUser || !newPassword) return;
        if (newPassword.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        resetPasswordMutation.mutate({ userId: selectedUser.id, newPassword });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-lg text-slate-600 dark:text-slate-400">Cargando usuarios...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Usuarios</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Crear Usuario
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Buscar por nombre o email</label>
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Filtrar por grupo</label>
                        <select
                            value={filterGroup}
                            onChange={e => setFilterGroup(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="">Todos los grupos</option>
                            {availableGroups.map((g: any) => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Users table */}
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
                                <th onClick={() => handleSort('email')} className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none">
                                    <div className="flex items-center gap-1">Email {sortField === 'email' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}</div>
                                </th>
                                <th onClick={() => handleSort('name')} className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none">
                                    <div className="flex items-center gap-1">Jugador {sortField === 'name' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}</div>
                                </th>
                                <th onClick={() => handleSort('group')} className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none">
                                    <div className="flex items-center gap-1">Grupo {sortField === 'group' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}</div>
                                </th>
                                <th onClick={() => handleSort('role')} className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none">
                                    <div className="flex items-center gap-1">Rol {sortField === 'role' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}</div>
                                </th>
                                <th onClick={() => handleSort('createdAt')} className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none">
                                    <div className="flex items-center gap-1">Fecha Registro {sortField === 'createdAt' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}</div>
                                </th>
                                <th onClick={() => handleSort('isActive')} className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none">
                                    <div className="flex items-center gap-1">Estado {sortField === 'isActive' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}</div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-900 dark:text-white">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-600 dark:text-slate-400">{user.player?.name || '-'}</div>
                                        {user.player?.nickname && <div className="text-xs text-slate-400">{user.player.nickname}</div>}
                                        {user.player?.phone && <div className="text-xs text-slate-400">{user.player.phone}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-600 dark:text-slate-400">{user.player?.currentGroup?.name || 'Sin grupo'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={user.role}
                                            onChange={e => updateRoleMutation.mutate({ userId: user.id, role: e.target.value as 'PLAYER' | 'ADMIN' })}
                                            className="text-sm px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        >
                                            <option value="PLAYER">Jugador</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-600 dark:text-slate-400">{new Date(user.createdAt).toLocaleDateString('es-ES')}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => toggleActivationMutation.mutate({ userId: user.id, isActive: !user.isActive })}
                                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${user.isActive
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'}`}
                                        >
                                            {user.isActive ? '✓ Activo' : '✗ Inactivo'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex space-x-2">
                                            <button onClick={() => handleOpenEditModal(user)} className="text-sm px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Editar</button>
                                            <button onClick={() => { setSelectedUser(user); setShowResetPassword(true); }} className="text-sm px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Resetear Contraseña</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 space-x-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
                    >Anterior</button>
                    <span className="text-sm">Página {page} de {data.pagination.totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                        disabled={page === data.pagination.totalPages}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
                    >Siguiente</button>
                </div>
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Crear Nuevo Usuario</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email *</label>
                                <input type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Contraseña *</label>
                                <input type="password" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre Completo *</label>
                                <input type="text" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Apodo</label>
                                <input type="text" value={createForm.nickname} onChange={e => setCreateForm({ ...createForm, nickname: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Teléfono</label>
                                <input type="tel" value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Rol</label>
                                    <select value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value as 'PLAYER' | 'ADMIN' })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                                        <option value="PLAYER">Jugador</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Grupo (temporada activa)</label>
                                    <select value={createForm.groupId} onChange={e => setCreateForm({ ...createForm, groupId: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                                        <option value="">Sin grupo</option>
                                        {availableGroups.map((g: any) => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex space-x-3 mt-6">
                                <button onClick={() => createUserMutation.mutate(createForm)} disabled={createUserMutation.isPending} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                                    {createUserMutation.isPending ? 'Creando...' : 'Crear Usuario'}
                                </button>
                                <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Editar Usuario</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email *</label>
                                <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre Completo *</label>
                                <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Apodo</label>
                                <input type="text" value={editForm.nickname} onChange={e => setEditForm({ ...editForm, nickname: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Teléfono</label>
                                <input type="tel" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Rol</label>
                                    <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value as 'PLAYER' | 'ADMIN' })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                        <option value="PLAYER">Jugador</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Grupo (temporada activa)</label>
                                    <select value={editForm.groupId} onChange={e => setEditForm({ ...editForm, groupId: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                        <option value="">Sin grupo</option>
                                        {availableGroups.map((g: any) => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex space-x-3 mt-6">
                                <button onClick={handleUpdateUser} disabled={updateUserMutation.isPending} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                                    {updateUserMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                                <button onClick={() => { setShowEditModal(false); setSelectedUser(null); }} className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetPassword && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Resetear Contraseña</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">Usuario: <strong>{selectedUser.email}</strong></p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nueva Contraseña</label>
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                        </div>
                        <div className="flex space-x-3">
                            <button onClick={handleResetPassword} disabled={resetPasswordMutation.isPending} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                {resetPasswordMutation.isPending ? 'Reseteando...' : 'Resetear'}
                            </button>
                            <button onClick={() => { setShowResetPassword(false); setNewPassword(''); setSelectedUser(null); }} className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
