import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import PlayerHistory from './PlayerHistory';
import { useAdminQuery } from '../../hooks/useAdminQuery';

interface User {
    id: string;
    email: string;
    role: 'PLAYER' | 'ADMIN';
    isActive: boolean;
    lastConnection?: string | null;
    createdAt: string;
    player?: {
        id: string;
        name: string;
        nickname?: string;
        phone?: string;
        annualFeesPaid?: number[];
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
    const [activeTab, setActiveTab] = useState<'users' | 'history'>('users');
    const [page, setPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showFeesModal, setShowFeesModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [filterGroup, setFilterGroup] = useState('');
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
    const [filterFeeYears, setFilterFeeYears] = useState<number[]>([new Date().getFullYear()]); // Default to current year
    const [filterFeeStatus, setFilterFeeStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
    const [sortField, setSortField] = useState<'email' | 'name' | 'phone' | 'group' | 'role' | 'isActive' | 'createdAt' | 'lastConnection'>('createdAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [editingFees, setEditingFees] = useState<number[]>([]);

    // Handle search with Enter key or button
    const handleSearch = () => {
        setDebouncedSearchTerm(searchTerm);
        setPage(1);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };
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
        groupId: '',
        annualFeesPaid: [new Date().getFullYear()]
    });
    const [validationErrors, setValidationErrors] = useState({
        createName: '',
        createPhone: '',
        createEmail: '',
        editName: '',
        editPhone: '',
        editEmail: '',
    });

    // Funciones de validación
    const validateName = (name: string): string => {
        if (!name.trim()) {
            return 'El nombre es obligatorio';
        }
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
        if (!nameRegex.test(name)) {
            return 'El nombre solo puede contener letras';
        }
        if (name.length < 2) {
            return 'El nombre debe tener al menos 2 caracteres';
        }
        return '';
    };

    const validatePhone = (phone: string): string => {
        if (!phone.trim()) {
            return '';
        }
        const phoneRegex = /^[+]?[0-9\s()-]+$/;
        if (!phoneRegex.test(phone)) {
            return 'El teléfono solo puede contener números, espacios, paréntesis y guiones';
        }
        const digitsOnly = phone.replace(/[^0-9]/g, '');
        if (digitsOnly.length < 9) {
            return 'El teléfono debe tener al menos 9 dígitos';
        }
        if (digitsOnly.length > 15) {
            return 'El teléfono no puede tener más de 15 dígitos';
        }
        return '';
    };

    const validateEmail = (email: string): string => {
        if (!email.trim()) {
            return 'El email es obligatorio';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return 'Introduce un email válido';
        }
        return '';
    };

    // Fetch admin stats for available groups (active season)
    const { data: adminStats } = useAdminQuery({
        queryKey: ['adminStatsForUsers'],
        queryFn: async () => {
            const { data } = await api.get('/admin/stats');
            return data;
        }
    });
    const availableGroups = adminStats?.activeSeason?.groups || [];

    // Fetch users (paginated & filtered)
    const { data, isLoading } = useAdminQuery<UsersResponse>({
        queryKey: ['users', page, debouncedSearchTerm, filterActive],
        queryFn: async () => {
            let url = `/users?page=${page}&limit=20&search=${encodeURIComponent(debouncedSearchTerm)}`;
            if (filterActive === 'active') {
                url += '&isActive=true';
            } else if (filterActive === 'inactive') {
                url += '&isActive=false';
            }
            const { data } = await api.get(url);
            return data;
        }
    });

    // Client‑side sort and filtering
    const filteredUsers = (data?.users || [])
        .filter(user => {
            // Filter by group (client-side)
            // "" means all groups, "sin-grupo" means users without group
            let matchesGroup = true;
            if (filterGroup === 'sin-grupo') {
                matchesGroup = !user.player?.currentGroup?.id;
            } else if (filterGroup) {
                matchesGroup = user.player?.currentGroup?.id === filterGroup;
            }

            // Filter by fee years and status
            let matchesFeeYears = true;
            if (filterFeeYears.length > 0) {
                const paidYears = user.player?.annualFeesPaid || [];
                const paidAnySelected = filterFeeYears.some(year => paidYears.includes(year));
                
                if (filterFeeStatus === 'paid') {
                    // Show only those who paid ANY of the selected years
                    matchesFeeYears = paidAnySelected;
                } else if (filterFeeStatus === 'unpaid') {
                    // Show only those who paid NONE of the selected years
                    matchesFeeYears = !paidAnySelected;
                }
                // If 'all', don't filter
            }

            // El filtro de active/inactive ahora se hace en el backend
            return matchesGroup && matchesFeeYears;
        })
        .sort((a, b) => {
            let aVal: any, bVal: any;
            switch (sortField) {
                case 'email':
                    aVal = a.email; bVal = b.email; break;
                case 'name':
                    aVal = a.player?.name || ''; bVal = b.player?.name || ''; break;
                case 'phone':
                    aVal = a.player?.phone || ''; bVal = b.player?.phone || ''; break;
                case 'group':
                    aVal = a.player?.currentGroup?.name || ''; bVal = b.player?.currentGroup?.name || ''; break;
                case 'role':
                    aVal = a.role; bVal = b.role; break;
                case 'isActive':
                    aVal = a.isActive ? 1 : 0; bVal = b.isActive ? 1 : 0; break;
                case 'createdAt':
                    aVal = new Date(a.createdAt).getTime(); bVal = new Date(b.createdAt).getTime(); break;
                case 'lastConnection':
                    aVal = a.lastConnection ? new Date(a.lastConnection).getTime() : 0;
                    bVal = b.lastConnection ? new Date(b.lastConnection).getTime() : 0;
                    break;
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
    const createUserMutation = useMutation({
        mutationFn: async (newUser: typeof createForm) => {
            // Validar antes de enviar
            const nameError = validateName(newUser.name);
            const phoneError = validatePhone(newUser.phone);
            const emailError = validateEmail(newUser.email);

            if (nameError || phoneError || emailError) {
                throw new Error('Hay errores de validación en el formulario');
            }

            const { data } = await api.post('/users', newUser);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setShowCreateModal(false);
            setCreateForm({ email: '', password: '', name: '', nickname: '', phone: '', role: 'PLAYER', groupId: '', annualFeesPaid: [new Date().getFullYear()] });
            setValidationErrors({ createName: '', createPhone: '', createEmail: '', editName: '', editPhone: '', editEmail: '' });
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
            const errorData = error.response?.data?.error;
            let errorMessage = 'Error desconocido';
            
            if (Array.isArray(errorData)) {
                // Errores de validación de Zod
                errorMessage = errorData.map((e: any) => `${e.path?.join('.')}: ${e.message}`).join(', ');
            } else if (typeof errorData === 'string') {
                errorMessage = errorData;
            } else if (typeof errorData === 'object') {
                errorMessage = JSON.stringify(errorData);
            } else {
                errorMessage = error.message;
            }
            
            alert(`Error al actualizar usuario: ${errorMessage}`);
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

    const updateAnnualFeesMutation = useMutation({
        mutationFn: async ({ playerId, annualFeesPaid }: { playerId: string; annualFeesPaid: number[] }) => {
            const { data } = await api.put(`/players/${playerId}/annual-fees`, { annualFeesPaid });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setShowFeesModal(false);
            setSelectedUser(null);
            alert('Cuotas anuales actualizadas correctamente');
        },
        onError: (error: any) => {
            alert(`Error al actualizar cuotas: ${error.response?.data?.error || error.message}`);
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
        
        // Validar campos
        const nameError = validateName(editForm.name);
        const phoneError = validatePhone(editForm.phone);
        const emailError = validateEmail(editForm.email);
        
        setValidationErrors({
            ...validationErrors,
            editName: nameError,
            editPhone: phoneError,
            editEmail: emailError,
        });
        
        if (nameError || phoneError || emailError) {
            alert('Por favor, corrige los errores en el formulario');
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

    const handleOpenFeesModal = (user: User) => {
        if (!user.player) return;
        setSelectedUser(user);
        setEditingFees(Array.isArray(user.player.annualFeesPaid) ? [...user.player.annualFeesPaid] : []);
        setShowFeesModal(true);
    };

    const handleToggleFeeYear = (year: number) => {
        setEditingFees(prev => {
            const index = prev.indexOf(year);
            if (index > -1) {
                return prev.filter((_, i) => i !== index);
            } else {
                return [...prev, year].sort((a, b) => a - b);
            }
        });
    };

    const handleAddFeeYear = (year: number) => {
        if (!editingFees.includes(year)) {
            setEditingFees(prev => [...prev, year].sort((a, b) => a - b));
        }
    };

    const handleSaveFees = () => {
        if (!selectedUser?.player) return;
        updateAnnualFeesMutation.mutate({
            playerId: selectedUser.player.id,
            annualFeesPaid: editingFees
        });
    };

    const handleExportCSV = async () => {
        try {
            // Fetch ALL users (no pagination) for export
            const { data: allUsersData } = await api.get(`/users?page=1&limit=10000&search=${encodeURIComponent(debouncedSearchTerm)}`);
            const allUsers = allUsersData.users || [];

            // Apply client-side filters (group, sort)
            const exportUsers = allUsers
                .filter((user: User) => {
                    if (filterGroup && user.player?.currentGroup?.id !== filterGroup) return false;
                    return true;
                })
                .sort((a: User, b: User) => {
                    let aVal: any, bVal: any;
                    switch (sortField) {
                        case 'email': aVal = a.email; bVal = b.email; break;
                        case 'name': aVal = a.player?.name || ''; bVal = b.player?.name || ''; break;
                        case 'phone': aVal = a.player?.phone || ''; bVal = b.player?.phone || ''; break;
                        case 'group': aVal = a.player?.currentGroup?.name || ''; bVal = b.player?.currentGroup?.name || ''; break;
                        case 'role': aVal = a.role; bVal = b.role; break;
                        case 'isActive': aVal = a.isActive ? 1 : 0; bVal = b.isActive ? 1 : 0; break;
                        case 'createdAt': aVal = new Date(a.createdAt).getTime(); bVal = new Date(b.createdAt).getTime(); break;
                        default: return 0;
                    }
                    if (sortDirection === 'asc') return aVal > bVal ? 1 : -1;
                    return aVal < bVal ? 1 : -1;
                });

            if (!exportUsers.length) {
                alert('No hay usuarios para exportar');
                return;
            }

            const escapeCsvField = (field: any) => {
                if (field === null || field === undefined) return '""';
                const stringField = String(field);
                return `"${stringField.replace(/"/g, '""')}"`;
            };

            const headers = ['Email', 'Nombre', 'Apodo', 'Teléfono', 'Grupo', 'Rol', 'Fecha Registro', 'Estado'];
            const rows = exportUsers.map((user: User) => [
                escapeCsvField(user.email),
                escapeCsvField(user.player?.name || ''),
                escapeCsvField(user.player?.nickname || ''),
                escapeCsvField(user.player?.phone || ''),
                escapeCsvField(user.player?.currentGroup?.name || ''),
                escapeCsvField(user.role),
                escapeCsvField(new Date(user.createdAt).toLocaleDateString('es-ES')),
                escapeCsvField(user.isActive ? 'Activo' : 'Inactivo')
            ]);

            const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r: any) => r.join(';'))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('Error exporting CSV:', error);
            alert('Error al exportar CSV');
        }
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
                {activeTab === 'users' && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleExportCSV}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2"
                            title="Exportar todos los usuarios filtrados a CSV"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            CSV
                        </button>
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
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'users'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                >
                    👥 Usuarios
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'history'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                >
                    📊 Historial
                </button>
            </div>

            {/* Content */}
            {activeTab === 'users' && (
                <>
                    {/* Filters */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    🔍 Buscar por nombre o email
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Buscar usuario..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={handleSearch}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
                                    >
                                        Buscar
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    🏠 Filtrar por grupo
                                </label>
                                <select
                                    value={filterGroup}
                                    onChange={e => {
                                        setFilterGroup(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Todos los grupos</option>
                                    <option value="sin-grupo">Sin grupo</option>
                                    {availableGroups.map((g: any) => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    🔐 Filtrar por estado
                                </label>
                                <select
                                    value={filterActive}
                                    onChange={e => {
                                        setFilterActive(e.target.value as 'all' | 'active' | 'inactive');
                                        setPage(1); // Reset page when filter changes
                                    }}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Todos los estados</option>
                                    <option value="active">✓ Activos</option>
                                    <option value="inactive">✗ Inactivos</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                    💰 Filtrar por cuotas pagada
                                </label>
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Seleccionar años:</label>
                                        {Array.from({ length: new Date().getFullYear() - 2026 + 3 }, (_, i) => 2026 + i).map((year) => (
                                            <label key={year} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={filterFeeYears.includes(year)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFilterFeeYears([...filterFeeYears, year]);
                                                        } else {
                                                            setFilterFeeYears(filterFeeYears.filter(y => y !== year));
                                                        }
                                                        setPage(1);
                                                    }}
                                                    className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                                                />
                                                <span className="text-sm text-slate-700 dark:text-slate-300">{year}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {filterFeeYears.length > 0 && (
                                        <div className="border-t border-slate-200 dark:border-slate-600 pt-3 mt-3 space-y-2">
                                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Mostrar:</label>
                                            {[
                                                { value: 'all', label: 'Todos' },
                                                { value: 'paid', label: '✓ Que pagaron (alguno de estos años)' },
                                                { value: 'unpaid', label: '✗ Que no pagaron (ninguno de estos años)' }
                                            ].map((option) => (
                                                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="feeStatus"
                                                        value={option.value}
                                                        checked={filterFeeStatus === option.value}
                                                        onChange={() => {
                                                            setFilterFeeStatus(option.value as 'all' | 'paid' | 'unpaid');
                                                            setPage(1);
                                                        }}
                                                        className="w-4 h-4 cursor-pointer"
                                                    />
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">{option.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            <div className="flex items-center gap-1">ID</div>
                                        </th>
                                        <th onClick={() => handleSort('email')} className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none">
                                            <div className="flex items-center gap-1">Email {sortField === 'email' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}</div>
                                        </th>
                                        <th onClick={() => handleSort('name')} className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none">
                                            <div className="flex items-center gap-1">Jugador {sortField === 'name' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}</div>
                                        </th>
                                        <th onClick={() => handleSort('phone')} className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none">
                                            <div className="flex items-center gap-1">Teléfono {sortField === 'phone' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}</div>
                                        </th>
                                        <th onClick={() => handleSort('group')} className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none">
                                            <div className="flex items-center gap-1">Grupo {sortField === 'group' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}</div>
                                        </th>
                                        <th onClick={() => handleSort('createdAt')} className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none">
                                            <div className="flex items-center gap-1">Fecha Registro {sortField === 'createdAt' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}</div>
                                        </th>
                                        <th onClick={() => handleSort('lastConnection')} className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none">
                                            <div className="flex items-center gap-1">Última Conexión {sortField === 'lastConnection' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}</div>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {filteredUsers.map(user => (
                                        <tr key={user.id} className={`hover:bg-slate-50 dark:hover:bg-slate-900 ${user.role === 'ADMIN' ? 'bg-amber-50 dark:bg-amber-950/20' : ''}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400" title={user.id}>
                                                        {user.id.slice(0, 2)}...{user.id.slice(-1)}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(user.id);
                                                            alert('ID copiado al portapapeles');
                                                        }}
                                                        className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                                                        title="Copiar ID completo"
                                                    >
                                                        📋
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-slate-900 dark:text-white">{user.email}</span>
                                                    {user.role === 'ADMIN' && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
                                                            ⭐ Admin
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-600 dark:text-slate-400">{user.player?.name || '-'}</div>
                                                {user.player?.nickname && <div className="text-xs text-slate-400">{user.player.nickname}</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-600 dark:text-slate-400">{user.player?.phone || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-600 dark:text-slate-400">{user.player?.currentGroup?.name || 'Sin grupo'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-600 dark:text-slate-400">{new Date(user.createdAt).toLocaleDateString('es-ES')}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm">
                                                    {user.lastConnection ? (
                                                        <span className="text-slate-600 dark:text-slate-400">
                                                            {new Date(user.lastConnection).toLocaleDateString('es-ES')} {new Date(user.lastConnection).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 dark:text-slate-500 italic">Nunca</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => toggleActivationMutation.mutate({ userId: user.id, isActive: !user.isActive })}
                                                        className={`text-sm px-3 py-1 rounded-lg font-medium transition-colors ${user.isActive
                                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                                            : 'bg-red-600 text-white hover:bg-red-700'}`}
                                                        title={user.isActive ? 'Desactivar usuario' : 'Activar usuario'}
                                                    >
                                                        {user.isActive ? '✓ Activo' : '✗ Inactivo'}
                                                    </button>
                                                    <button onClick={() => handleOpenEditModal(user)} className="text-sm px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Editar</button>
                                                    <button 
                                                        onClick={() => handleOpenFeesModal(user)} 
                                                        className={`text-xs px-2 py-1 rounded border font-medium transition-colors ${
                                                            user.player?.annualFeesPaid?.includes(2026)
                                                                ? 'border-green-600 text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40'
                                                                : 'border-red-600 text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40'
                                                        }`}
                                                        title="Editar cuotas anuales"
                                                    >
                                                        {user.player?.annualFeesPaid?.includes(2026) ? '✓ 2026' : '✗ 2026'}
                                                    </button>
                                                    <button onClick={() => { setSelectedUser(user); setShowResetPassword(true); }} className="text-sm px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">Resetear</button>
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
                                        <input 
                                            type="email" 
                                            value={createForm.email} 
                                            onChange={e => {
                                                setCreateForm({ ...createForm, email: e.target.value });
                                                if (validationErrors.createEmail) {
                                                    setValidationErrors({ ...validationErrors, createEmail: validateEmail(e.target.value) });
                                                }
                                            }}
                                            onBlur={e => setValidationErrors({ ...validationErrors, createEmail: validateEmail(e.target.value) })}
                                            className={`w-full px-4 py-2 border ${validationErrors.createEmail ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white`} 
                                            placeholder="usuario@email.com"
                                        />
                                        {validationErrors.createEmail && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">❌ {validationErrors.createEmail}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Contraseña *</label>
                                        <input type="password" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white" minLength={6} placeholder="Mínimo 6 caracteres" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre Completo *</label>
                                        <input 
                                            type="text" 
                                            value={createForm.name} 
                                            onChange={e => {
                                                setCreateForm({ ...createForm, name: e.target.value });
                                                if (validationErrors.createName) {
                                                    setValidationErrors({ ...validationErrors, createName: validateName(e.target.value) });
                                                }
                                            }}
                                            onBlur={e => setValidationErrors({ ...validationErrors, createName: validateName(e.target.value) })}
                                            className={`w-full px-4 py-2 border ${validationErrors.createName ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white`} 
                                            placeholder="Nombre y apellidos"
                                        />
                                        {validationErrors.createName && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">❌ {validationErrors.createName}</p>
                                        )}
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Solo letras y espacios</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Apodo</label>
                                        <input type="text" value={createForm.nickname} onChange={e => setCreateForm({ ...createForm, nickname: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white" placeholder="Opcional" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Teléfono</label>
                                        <input 
                                            type="tel" 
                                            value={createForm.phone} 
                                            onChange={e => {
                                                // Solo permitir números, espacios, +, (, ), -
                                                const filtered = e.target.value.replace(/[^0-9+\s()-]/g, '');
                                                setCreateForm({ ...createForm, phone: filtered });
                                                if (validationErrors.createPhone) {
                                                    setValidationErrors({ ...validationErrors, createPhone: validatePhone(filtered) });
                                                }
                                            }}
                                            onBlur={e => setValidationErrors({ ...validationErrors, createPhone: validatePhone(e.target.value) })}
                                            className={`w-full px-4 py-2 border ${validationErrors.createPhone ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white`} 
                                            placeholder="+34 600 123 456"
                                        />
                                        {validationErrors.createPhone && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">❌ {validationErrors.createPhone}</p>
                                        )}
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Mínimo 9 dígitos</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Rol</label>
                                        <select 
                                            value={createForm.role} 
                                            onChange={e => {
                                                const newRole = e.target.value as 'PLAYER' | 'ADMIN';
                                                setCreateForm({ ...createForm, role: newRole, groupId: newRole === 'ADMIN' ? '' : createForm.groupId });
                                            }} 
                                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        >
                                            <option value="PLAYER">👤 Jugador</option>
                                            <option value="ADMIN">⭐ Administrador</option>
                                        </select>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Por defecto: Jugador</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Grupo (temporada activa)</label>
                                        <select 
                                            value={createForm.groupId} 
                                            onChange={e => setCreateForm({ ...createForm, groupId: e.target.value })} 
                                            disabled={createForm.role === 'ADMIN'}
                                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <option value="">Sin grupo</option>
                                            {availableGroups.map((g: any) => (
                                                <option key={g.id} value={g.id}>{g.name}</option>
                                            ))}
                                        </select>
                                        {createForm.role === 'ADMIN' && (
                                            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">⚠️ Los administradores no pueden estar en grupos</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">💰 Cuota pagada para años</label>
                                        <div className="space-y-2">
                                            {Array.from({ length: new Date().getFullYear() - 2026 + 3 }, (_, i) => 2026 + i).map((year) => (
                                                <label key={year} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={createForm.annualFeesPaid.includes(year)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setCreateForm({ ...createForm, annualFeesPaid: [...createForm.annualFeesPaid, year] });
                                                            } else {
                                                                setCreateForm({ ...createForm, annualFeesPaid: createForm.annualFeesPaid.filter(y => y !== year) });
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded border-slate-300 cursor-pointer"
                                                    />
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">{year}</span>
                                                </label>
                                            ))}
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
                                        <input 
                                            type="email" 
                                            value={editForm.email} 
                                            onChange={e => {
                                                setEditForm({ ...editForm, email: e.target.value });
                                                if (validationErrors.editEmail) {
                                                    setValidationErrors({ ...validationErrors, editEmail: validateEmail(e.target.value) });
                                                }
                                            }}
                                            onBlur={e => setValidationErrors({ ...validationErrors, editEmail: validateEmail(e.target.value) })}
                                            className={`w-full px-4 py-2 border ${validationErrors.editEmail ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white`} 
                                        />
                                        {validationErrors.editEmail && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">❌ {validationErrors.editEmail}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre Completo *</label>
                                        <input 
                                            type="text" 
                                            value={editForm.name} 
                                            onChange={e => {
                                                setEditForm({ ...editForm, name: e.target.value });
                                                if (validationErrors.editName) {
                                                    setValidationErrors({ ...validationErrors, editName: validateName(e.target.value) });
                                                }
                                            }}
                                            onBlur={e => setValidationErrors({ ...validationErrors, editName: validateName(e.target.value) })}
                                            className={`w-full px-4 py-2 border ${validationErrors.editName ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white`} 
                                        />
                                        {validationErrors.editName && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">❌ {validationErrors.editName}</p>
                                        )}
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Solo letras y espacios</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Apodo</label>
                                        <input type="text" value={editForm.nickname} onChange={e => setEditForm({ ...editForm, nickname: e.target.value })} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Teléfono</label>
                                        <input 
                                            type="tel" 
                                            value={editForm.phone} 
                                            onChange={e => {
                                                // Solo permitir números, espacios, +, (, ), -
                                                const filtered = e.target.value.replace(/[^0-9+\s()-]/g, '');
                                                setEditForm({ ...editForm, phone: filtered });
                                                if (validationErrors.editPhone) {
                                                    setValidationErrors({ ...validationErrors, editPhone: validatePhone(filtered) });
                                                }
                                            }}
                                            onBlur={e => setValidationErrors({ ...validationErrors, editPhone: validatePhone(e.target.value) })}
                                            className={`w-full px-4 py-2 border ${validationErrors.editPhone ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white`} 
                                        />
                                        {validationErrors.editPhone && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">❌ {validationErrors.editPhone}</p>
                                        )}
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Mínimo 9 dígitos</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Rol</label>
                                        <select 
                                            value={editForm.role} 
                                            onChange={e => {
                                                const newRole = e.target.value as 'PLAYER' | 'ADMIN';
                                                setEditForm({ ...editForm, role: newRole, groupId: newRole === 'ADMIN' ? '' : editForm.groupId });
                                            }} 
                                            disabled={!!selectedUser?.player?.currentGroup?.id}
                                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <option value="PLAYER">👤 Jugador</option>
                                            <option value="ADMIN">⭐ Administrador</option>
                                        </select>
                                        {selectedUser?.player?.currentGroup?.id ? (
                                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">⚠️ No se puede cambiar el rol mientras esté en un grupo activo</p>
                                        ) : (
                                            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">⚠️ Cambiar a Admin otorga permisos completos</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Grupo (temporada activa)</label>
                                        <select 
                                            value={editForm.groupId} 
                                            onChange={e => setEditForm({ ...editForm, groupId: e.target.value })} 
                                            disabled={editForm.role === 'ADMIN'}
                                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <option value="">Sin grupo</option>
                                            {availableGroups.map((g: any) => (
                                                <option key={g.id} value={g.id}>{g.name}</option>
                                            ))}
                                        </select>
                                        {editForm.role === 'ADMIN' && (
                                            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">⚠️ Los administradores no pueden estar en grupos</p>
                                        )}
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

                    {/* Annual Fees Modal */}
                    {showFeesModal && selectedUser && selectedUser.player && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Cuotas Anuales de Club</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">Jugador: <strong>{selectedUser.player.name}</strong></p>
                                
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Años en los que ha pagado la cuota:</label>
                                        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                                            {editingFees.length > 0 ? (
                                                editingFees.map((year) => (
                                                    <div key={year} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700">
                                                        <span className="font-semibold text-slate-900 dark:text-white">{year}</span>
                                                        <button
                                                            onClick={() => handleToggleFeeYear(year)}
                                                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                                        >
                                                            ✕ Quitar
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-slate-500 dark:text-slate-400 italic">Sin años registrados</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Añadir año:</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() + 1].map((year) => (
                                                <button
                                                    key={year}
                                                    onClick={() => handleAddFeeYear(year)}
                                                    disabled={editingFees.includes(year)}
                                                    className="px-4 py-2 rounded border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    {year}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">O prueba con otros años aquí:</p>
                                        <div className="flex gap-2 mt-2">
                                            <input 
                                                type="number" 
                                                id="customYear"
                                                placeholder="Ej: 2023" 
                                                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                                                min={2000}
                                                max={new Date().getFullYear() + 1}
                                            />
                                            <button
                                                onClick={() => {
                                                    const input = document.getElementById('customYear') as HTMLInputElement;
                                                    if (input && input.value) {
                                                        const year = parseInt(input.value, 10);
                                                        if (!isNaN(year) && year > 0) {
                                                            handleAddFeeYear(year);
                                                            input.value = '';
                                                        }
                                                    }
                                                }}
                                                className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors text-sm font-medium"
                                            >
                                                Añadir
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex space-x-3 mt-6">
                                    <button 
                                        onClick={handleSaveFees} 
                                        disabled={updateAnnualFeesMutation.isPending} 
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
                                    >
                                        {updateAnnualFeesMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                    <button 
                                        onClick={() => { setShowFeesModal(false); setSelectedUser(null); setEditingFees([]); }} 
                                        className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 font-medium transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Historial Tab */}
            {activeTab === 'history' && <PlayerHistory />}
        </div>
    );
}
