import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

interface PlayerProfile {
  id: string;
  name: string;
  nickname?: string;
  phone?: string;
  email?: string;
}

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const playerId = user?.player?.id;
  const [showBanner, setShowBanner] = useState(true);

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
    email: ''
  });

  const [isEditing, setIsEditing] = useState(false);

  // Inicializar formulario cuando carguen los datos
  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name || '',
        nickname: player.nickname || '',
        phone: player.phone || '',
        email: player.email || ''
      });
    }
  }, [player]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<PlayerProfile>) => {
      const { data: response } = await api.patch(`/players/${playerId}/profile`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player', playerId] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setIsEditing(false);
      alert('✅ Perfil actualizado correctamente');
    },
    onError: (error: any) => {
      alert(`❌ Error: ${error.response?.data?.error || error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('El nombre es obligatorio');
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
        email: player.email || ''
      });
    }
    setIsEditing(false);
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

        <div className="p-6">
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

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email Público
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="email@ejemplo.com"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Diferente al email de login (opcional)
              </p>
            </div>

            {/* Email de Login (solo lectura) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email de Acceso
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Para cambiar el email de acceso contacta con un administrador
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

      {/* Información adicional */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">ℹ️ Información</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• Tu nombre y teléfono son visibles para otros jugadores de tu grupo</li>
          <li>• El email de acceso no puede modificarse desde aquí</li>
          <li>• Los cambios se aplicarán inmediatamente tras guardar</li>
        </ul>
      </div>
    </div>
  );
}
