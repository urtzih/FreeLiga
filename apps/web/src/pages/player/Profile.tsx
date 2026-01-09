import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import Spinner from '../../components/Spinner';
import { useToast } from '../../contexts/ToastContext';

interface PlayerProfile {
  id: string;
  name: string;
  nickname?: string;
  phone?: string;
  calendarEnabled?: boolean;
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const playerId = user?.player?.id;
  const [showBanner, setShowBanner] = useState(true);
  const { showToast } = useToast();

  // Función helper para procesar errores
  const getErrorMessage = (error: any): string => {
    const errorData = error.response?.data?.error;
    
    if (typeof errorData === 'string') {
      return errorData;
    }
    
    if (Array.isArray(errorData)) {
      return errorData.map((e: any) => e.message || e.toString()).join(', ');
    }
    
    if (typeof errorData === 'object' && errorData !== null) {
      return errorData.message || 'Error desconocido';
    }
    
    return error.message || 'Error desconocido';
  };

  // Auto-dismiss banner after 10s
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBanner(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  const { data: player, isLoading } = useQuery<PlayerProfile>({
    queryKey: ['player', playerId],
    queryFn: async () => {
      const { data } = await api.get(`/players/${playerId}`);
      return data;
    },
    enabled: !!playerId
  });

  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    phone: '',
    calendarEnabled: false,
  });

  const [newEmail, setNewEmail] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  // Inicializar formulario cuando carguen los datos
  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name || '',
        nickname: player.nickname || '',
        phone: player.phone || '',
        calendarEnabled: player.calendarEnabled ?? false,
      });
    }
  }, [player]);

  useEffect(() => {
    if (user?.email) {
      setNewEmail(user.email);
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<PlayerProfile>) => {
      const { data: response } = await api.patch(`/players/${playerId}/profile`, data);
      return response;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['player', playerId] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      await refreshUser();
      setIsEditing(false);
      showToast('✅ Perfil actualizado correctamente', 'success');
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error);
      showToast(`Error: ${errorMessage}`, 'error');
    }
  });

  const updateEmailMutation = useMutation({
    mutationFn: async (newEmail: string) => {
      const { data: response } = await api.patch('/users/me/email', { newEmail });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setIsEditingEmail(false);
      showToast('✅ Email actualizado correctamente. Por favor, vuelve a iniciar sesión.', 'success');
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error);
      showToast(`Error: ${errorMessage}`, 'error');
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const { data: response } = await api.patch('/users/me/password', data);
      return response;
    },
    onSuccess: () => {
      setIsEditingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('✅ Contraseña actualizada correctamente', 'success');
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error);
      showToast(`Error: ${errorMessage}`, 'error');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('El nombre es obligatorio', 'warning');
      return;
    }
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (player) {
      setFormData({
        name: player.name || '',
        nickname: player.nickname || '',
        phone: player.phone || '',
        calendarEnabled: player.calendarEnabled ?? false,
      });
    }
    setIsEditing(false);
  };

  const handleEmailCancel = () => {
    if (user?.email) {
      setNewEmail(user.email);
    }
    setIsEditingEmail(false);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      showToast('Introduce un email válido', 'warning');
      return;
    }
    if (newEmail === user?.email) {
      showToast('El nuevo email es igual al actual', 'warning');
      return;
    }
    updateEmailMutation.mutate(newEmail);
  };

  const handlePasswordCancel = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsEditingPassword(false);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'warning');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('Las contraseñas no coinciden', 'warning');
      return;
    }

    updatePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  if (!playerId) {
    return <div className="text-center py-12 text-slate-600">No hay jugador asociado</div>;
  }

  if (isLoading) {
    return <div className="text-center py-12 text-slate-600">Cargando perfil...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      {showBanner && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-lg transition-all duration-300">
          <h1 className="text-3xl font-bold mb-2">Mi Perfil</h1>
          <p className="text-blue-100">Gestiona tu información personal</p>
        </div>
      )}

      {/* Formulario */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Información del Jugador</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              ✏️ Editar
            </button>
          )}
        </div>

        <div className="p-6 relative">
          {/* Loading Overlay */}
          {updateMutation.isPending && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-b-2xl flex items-center justify-center z-10">
              <Spinner size="lg" />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nombre Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="Tu nombre completo"
                required
              />
            </div>

            {/* Apodo */}
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Apodo / Alias
              </label>
              <input
                type="text"
                id="nickname"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="Opcional"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="+34 600 123 456"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Visible para otros jugadores del grupo
              </p>
            </div>

            {/* Calendario */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Funcionalidad de Calendario
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Habilita la programación de partidos y sincronización con Google Calendar
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.calendarEnabled}
                  onChange={(e) => setFormData({ ...formData, calendarEnabled: e.target.checked })}
                  disabled={!isEditing}
                  className={`w-12 h-6 rounded-full appearance-none relative cursor-pointer transition-colors ${
                    isEditing ? 'cursor-pointer' : 'cursor-not-allowed'
                  } ${
                    formData.calendarEnabled
                      ? 'bg-green-500'
                      : 'bg-slate-300 dark:bg-slate-600'
                  } ${!isEditing ? 'disabled:opacity-60' : ''}
                    before:content-[''] before:absolute before:w-5 before:h-5 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-transform before:shadow-md
                    ${formData.calendarEnabled ? 'before:translate-x-6' : ''}`}
                />
              </label>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Este es tu email de acceso. Puedes cambiarlo en la sección de abajo.
              </p>
            </div>

            {/* Botones */}
            {isEditing && (
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors"
                >
                  {updateMutation.isPending ? 'Guardando...' : '💾 Guardar Cambios'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                  className="flex-1 px-6 py-3 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  ❌ Cancelar
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Sección de cambio de email */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cambiar Email de Acceso</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Actualiza tu email para iniciar sesión</p>
          </div>
          {!isEditingEmail && (
            <button
              onClick={() => setIsEditingEmail(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              🔑 Cambiar Email
            </button>
          )}
        </div>

        <div className="p-6 relative">
          {/* Loading Overlay */}
          {updateEmailMutation.isPending && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-b-2xl flex items-center justify-center z-10">
              <Spinner size="lg" />
            </div>
          )}

          {isEditingEmail ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="newEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nuevo Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="newEmail"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="nuevo@email.com"
                  required
                />
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Deberás iniciar sesión nuevamente después de cambiar el email
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={updateEmailMutation.isPending}
                  className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg font-medium transition-colors"
                >
                  {updateEmailMutation.isPending ? 'Actualizando...' : '✓ Confirmar Cambio'}
                </button>
                <button
                  type="button"
                  onClick={handleEmailCancel}
                  disabled={updateEmailMutation.isPending}
                  className="flex-1 px-6 py-3 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  ❌ Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-slate-600 dark:text-slate-400">
                Email actual: <strong className="text-slate-900 dark:text-white">{user?.email}</strong>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sección de cambio de contraseña */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cambiar Contraseña</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Actualiza tu contraseña de acceso</p>
          </div>
          {!isEditingPassword && (
            <button
              onClick={() => setIsEditingPassword(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              🔐 Cambiar Contraseña
            </button>
          )}
        </div>

        <div className="p-6 relative">
          {updatePasswordMutation.isPending && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-b-2xl flex items-center justify-center z-10">
              <Spinner size="lg" />
            </div>
          )}

          {isEditingPassword ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Contraseña Actual <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nueva Contraseña <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Confirmar Nueva Contraseña <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Repite la nueva contraseña"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={updatePasswordMutation.isPending}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors"
                >
                  {updatePasswordMutation.isPending ? 'Actualizando...' : '✓ Confirmar Cambio'}
                </button>
                <button
                  type="button"
                  onClick={handlePasswordCancel}
                  disabled={updatePasswordMutation.isPending}
                  className="flex-1 px-6 py-3 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  ❌ Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-slate-600 dark:text-slate-400">
                Haz clic en "Cambiar Contraseña" para actualizar tu contraseña de acceso
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">ℹ️ Información</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• Tu nombre y teléfono son visibles para otros jugadores de tu grupo</li>
          <li>• Puedes cambiar tu email y contraseña en cualquier momento</li>
          <li>• El email debe ser único en el sistema</li>
          <li>• La contraseña debe tener al menos 6 caracteres</li>
          <li>• Los cambios se aplicarán inmediatamente tras guardar</li>
        </ul>
      </div>
    </div>
  );
}
