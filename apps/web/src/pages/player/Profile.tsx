import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import Spinner from '../../components/Spinner';
import { useToast } from '../../contexts/ToastContext';
import { usePushNotification } from '../../hooks/usePushNotification';

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
  const pushNotification = usePushNotification();
  const notificationPermission =
    typeof Notification !== 'undefined' ? Notification.permission : 'default';

  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs = 10000): Promise<T> => {
    console.log('[PushDebug] withTimeout:start', { timeoutMs });
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        console.error('[PushDebug] withTimeout:timeout');
        reject(new Error('La operación ha tardado demasiado. Inténtalo de nuevo.'));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };

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
  const [isPushToggleBusy, setIsPushToggleBusy] = useState(false);

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

  const handlePushNotificationToggle = async () => {
    console.log('[PushDebug] toggle:click', {
      isPushToggleBusy,
      isSupported: pushNotification.isSupported,
      isSubscribed: pushNotification.isSubscribed,
    });

    if (isPushToggleBusy) return;

    const currentState = pushNotification.isSubscribed;
    const newState = !currentState;
    console.log('[PushDebug] toggle:state-change', { currentState, newState });
    
    try {
      setIsPushToggleBusy(true);
      console.log('[PushDebug] toggle:busy=true');

      if (newState) {
        if (!pushNotification.isSupported) {
          showToast('❌ Tu navegador no soporta notificaciones push', 'error');
          console.log('[PushDebug] toggle:abort:not-supported');
          return;
        }

        console.log('[PushDebug] toggle:subscribe:start');
        await withTimeout(pushNotification.subscribe(), 12000);
        console.log('[PushDebug] toggle:subscribe:done');
      } else {
        if (pushNotification.isSubscribed) {
          console.log('[PushDebug] toggle:unsubscribe:start');
          await withTimeout(pushNotification.unsubscribe(), 12000);
          console.log('[PushDebug] toggle:unsubscribe:done');
        } else {
          console.log('[PushDebug] toggle:unsubscribe:skip-no-active-subscription');
        }
      }
      showToast(
        newState ? '✅ Notificaciones activadas en este dispositivo' : '✅ Notificaciones desactivadas en este dispositivo',
        'success'
      );
    } catch (error: any) {
      const errorMessage = error?.message || pushNotification.error || 'Error al cambiar notificaciones push';
      showToast(`❌ ${errorMessage}`, 'error');
      console.error('[PushDebug] toggle:error', error);
    } finally {
      setIsPushToggleBusy(false);
      console.log('[PushDebug] toggle:busy=false');
    }
  };

  const handleOpenNotificationSettings = () => {
    try {
      const siteDetailsUrl = `chrome://settings/content/siteDetails?site=${encodeURIComponent(window.location.origin)}`;
      const opened = window.open(siteDetailsUrl, '_blank');

      if (!opened) {
        showToast('Abre manualmente chrome://settings/content/notifications y permite este sitio', 'warning');
      }
    } catch {
      showToast('Abre manualmente la configuración de notificaciones del navegador y permite este sitio', 'warning');
    }
  };

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
        <div className="club-page-hero p-8 transition-all duration-300">
          <h1 className="text-3xl font-bold mb-2">Mi perfil</h1>
          <p className="club-page-hero-subtitle">Gestiona tu información personal</p>
        </div>
      )}

      {/* Formulario */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Información del Jugador</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm club-btn-yellow"
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
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
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
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
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
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
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
                    (Ojo, todavía esta en fase de prueba) Funcionalidad de Calendario
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

            {/* Notificaciones Push */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    🔔 Notificaciones Push
                    {!pushNotification.isSupported && (
                      <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-0.5 rounded">
                        No soportado
                      </span>
                    )}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Recibe notificaciones sobre nuevas temporadas, partidos y actualizaciones
                  </p>
                  {notificationPermission === 'denied' && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                      <p className="text-xs text-red-700 dark:text-red-300">
                        🚫 El navegador tiene las notificaciones bloqueadas para este sitio.
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Debes permitirlas en la configuración del navegador y luego volver a activar el interruptor.
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenNotificationSettings}
                        className="mt-2 text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                      >
                        Abrir configuración de notificaciones
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handlePushNotificationToggle}
                  disabled={!pushNotification.isSupported || isPushToggleBusy}
                  className={`w-12 h-6 rounded-full appearance-none relative transition-colors ${
                    pushNotification.isSupported && !isPushToggleBusy
                      ? 'cursor-pointer'
                      : 'cursor-not-allowed opacity-60'
                  } ${
                    pushNotification.isSubscribed
                      ? 'bg-green-500'
                      : 'bg-slate-300 dark:bg-slate-600'
                  }
                    before:content-[''] before:absolute before:w-5 before:h-5 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-transform before:shadow-md
                    ${pushNotification.isSubscribed ? 'before:translate-x-6' : ''}`}
                >
                  {isPushToggleBusy && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </button>
              </label>
              {pushNotification.error && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Error: {pushNotification.error}
                </p>
              )}
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
                  className="flex-1 px-6 py-3 club-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateMutation.isPending ? 'Guardando...' : '💾 Guardar Cambios'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                  className="flex-1 px-6 py-3 club-btn-subtle"
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
              className="px-4 py-2 text-sm club-btn-yellow"
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
                  className="flex-1 px-6 py-3 club-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateEmailMutation.isPending ? 'Actualizando...' : '✓ Confirmar Cambio'}
                </button>
                <button
                  type="button"
                  onClick={handleEmailCancel}
                  disabled={updateEmailMutation.isPending}
                  className="flex-1 px-6 py-3 club-btn-subtle"
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
              className="px-4 py-2 text-sm club-btn-yellow"
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
                  placeholder="⬢⬢⬢⬢⬢⬢⬢⬢"
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
                  className="flex-1 px-6 py-3 club-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatePasswordMutation.isPending ? 'Actualizando...' : '✓ Confirmar Cambio'}
                </button>
                <button
                  type="button"
                  onClick={handlePasswordCancel}
                  disabled={updatePasswordMutation.isPending}
                  className="flex-1 px-6 py-3 club-btn-subtle"
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
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">ℹ️ Información</h3>
        <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
          <li>⬢ Tu nombre y teléfono son visibles para otros jugadores de tu grupo</li>
          <li>⬢ Puedes cambiar tu email y contraseña en cualquier momento</li>
          <li>⬢ El email debe ser único en el sistema</li>
          <li>⬢ La contraseña debe tener al menos 6 caracteres</li>
          <li>⬢ Los cambios se aplicarán inmediatamente tras guardar</li>
        </ul>
      </div>
    </div>
  );
}



