import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import Spinner from '../../components/Spinner';
import { useToast } from '../../contexts/ToastContext';
import { usePushNotification } from '../../hooks/usePushNotification';
import { useLanguage } from '../../contexts/LanguageContext';
import PlayerAvatar from '../../components/PlayerAvatar';
import { hasGenericEmail } from '../../utils/profileCompletion';

interface PlayerProfile {
  id: string;
  name: string;
  nickname?: string;
  phone?: string;
  photoDataUrl?: string | null;
  calendarEnabled?: boolean;
  competitionStatus?: 'ACTIVE' | 'FROZEN';
}

const MAX_PROFILE_PHOTO_SOURCE_BYTES = 5 * 1024 * 1024;
const MAX_PROFILE_PHOTO_DATA_URL_LENGTH = 700_000;
const PROFILE_PHOTO_SIZE = 320;
const PROFILE_PHOTO_PREVIEW_SIZE = 288;

interface PhotoCropState {
  objectUrl: string;
  image: HTMLImageElement;
  zoom: number;
  offsetX: number;
  offsetY: number;
}

interface PhotoDragState {
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

async function loadProfilePhoto(file: File): Promise<PhotoCropState> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('invalidType');
  }

  if (file.size > MAX_PROFILE_PHOTO_SOURCE_BYTES) {
    throw new Error('sourceTooLarge');
  }

  const objectUrl = URL.createObjectURL(file);

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('loadFailed'));
    };
    element.src = objectUrl;
  });

  return {
    objectUrl,
    image,
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  };
}

function cropProfilePhoto(crop: PhotoCropState): string {
  const canvas = document.createElement('canvas');
  canvas.width = PROFILE_PHOTO_SIZE;
  canvas.height = PROFILE_PHOTO_SIZE;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('loadFailed');
  }

  const baseScale = Math.max(
    PROFILE_PHOTO_SIZE / crop.image.naturalWidth,
    PROFILE_PHOTO_SIZE / crop.image.naturalHeight
  );
  const drawWidth = crop.image.naturalWidth * baseScale * crop.zoom;
  const drawHeight = crop.image.naturalHeight * baseScale * crop.zoom;
  const maxOffsetX = Math.max(0, (drawWidth - PROFILE_PHOTO_SIZE) / 2);
  const maxOffsetY = Math.max(0, (drawHeight - PROFILE_PHOTO_SIZE) / 2);
  const drawX = (PROFILE_PHOTO_SIZE - drawWidth) / 2 + crop.offsetX * maxOffsetX;
  const drawY = (PROFILE_PHOTO_SIZE - drawHeight) / 2 + crop.offsetY * maxOffsetY;

  context.drawImage(crop.image, drawX, drawY, drawWidth, drawHeight);
  const dataUrl = canvas.toDataURL('image/webp', 0.82);

  if (dataUrl.length > MAX_PROFILE_PHOTO_DATA_URL_LENGTH) {
    throw new Error('optimizedTooLarge');
  }

  return dataUrl;
}

function clampCropOffset(value: number) {
  return Math.max(-1, Math.min(1, value));
}

function getCropMaxOffsets(crop: PhotoCropState, previewSize = PROFILE_PHOTO_PREVIEW_SIZE) {
  const baseScale = Math.max(
    previewSize / crop.image.naturalWidth,
    previewSize / crop.image.naturalHeight
  );
  const width = crop.image.naturalWidth * baseScale * crop.zoom;
  const height = crop.image.naturalHeight * baseScale * crop.zoom;

  return {
    maxOffsetX: Math.max(0, (width - previewSize) / 2),
    maxOffsetY: Math.max(0, (height - previewSize) / 2),
    width,
    height,
  };
}

function getCropPreviewStyle(crop: PhotoCropState): React.CSSProperties {
  const { maxOffsetX, maxOffsetY, width, height } = getCropMaxOffsets(crop);

  return {
    backgroundImage: `url(${crop.objectUrl})`,
    backgroundSize: `${width}px ${height}px`,
    backgroundPosition: `calc(50% + ${crop.offsetX * maxOffsetX}px) calc(50% + ${crop.offsetY * maxOffsetY}px)`,
  };
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const tr = (es: string, eu: string) => (language === 'eu' ? eu : es);
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
    photoDataUrl: null as string | null,
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
  const [photoCrop, setPhotoCrop] = useState<PhotoCropState | null>(null);
  const [photoDrag, setPhotoDrag] = useState<PhotoDragState | null>(null);

  useEffect(() => {
    return () => {
      if (photoCrop) {
        URL.revokeObjectURL(photoCrop.objectUrl);
      }
    };
  }, [photoCrop]);

  // Inicializar formulario cuando carguen los datos
  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name || '',
        nickname: player.nickname || '',
        phone: player.phone || '',
        photoDataUrl: player.photoDataUrl || null,
        calendarEnabled: player.calendarEnabled ?? false,
      });
    }
  }, [player]);

  useEffect(() => {
    if (user?.email) {
      setNewEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (searchParams.get('edit') === 'email') {
      setIsEditingEmail(true);
    }

    if (searchParams.get('complete') === 'profile') {
      setIsEditing(true);
    }
  }, [searchParams]);

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
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      await refreshUser();
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

  const updateCompetitionStatusMutation = useMutation({
    mutationFn: async (competitionStatus: 'ACTIVE' | 'FROZEN') => {
      const { data: response } = await api.patch(`/players/${playerId}/competition-status`, { competitionStatus });
      return response;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['player', playerId] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      await refreshUser();
      showToast(
        player?.competitionStatus === 'FROZEN'
          ? tr('Has salido de nevera. Volverás a entrar en futuras temporadas.', 'Izoztetik atera zara. Etorkizuneko denboraldietan berriz sartuko zara.')
          : tr('Te hemos puesto en nevera. No se te añadirá a la siguiente temporada.', 'Izozte egoeran jarri zaitugu. Ez zaituzte hurrengo denboraldian sartuko.'),
        'success'
      );
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
        photoDataUrl: player.photoDataUrl || null,
        calendarEnabled: player.calendarEnabled ?? false,
      });
    }
    setIsEditing(false);
  };

  const closePhotoCrop = () => {
    setPhotoCrop((current) => {
      if (current) {
        URL.revokeObjectURL(current.objectUrl);
      }
      return null;
    });
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const crop = await loadProfilePhoto(file);
      setPhotoCrop((current) => {
        if (current) {
          URL.revokeObjectURL(current.objectUrl);
        }
        return crop;
      });
    } catch (error: any) {
      const messageByCode: Record<string, string> = {
        invalidType: tr('Elige una imagen JPG, PNG o WebP.', 'Aukeratu JPG, PNG edo WebP irudi bat.'),
        sourceTooLarge: tr('La imagen original no puede superar 5 MB.', 'Jatorrizko irudiak ezin ditu 5 MB gainditu.'),
        optimizedTooLarge: tr('La imagen sigue siendo demasiado grande. Prueba con otra foto.', 'Irudia handiegia da oraindik. Probatu beste argazki batekin.'),
        loadFailed: tr('No se pudo leer la imagen.', 'Ezin izan da irudia irakurri.'),
      };
      showToast(messageByCode[error?.message] || tr('No se pudo preparar la foto.', 'Ezin izan da argazkia prestatu.'), 'error');
    }
  };

  const handleApplyPhotoCrop = () => {
    if (!photoCrop) return;

    try {
      const photoDataUrl = cropProfilePhoto(photoCrop);
      setFormData({ ...formData, photoDataUrl });
      closePhotoCrop();
    } catch (error: any) {
      const messageByCode: Record<string, string> = {
        optimizedTooLarge: tr('La imagen sigue siendo demasiado grande. Prueba con otra foto.', 'Irudia handiegia da oraindik. Probatu beste argazki batekin.'),
        loadFailed: tr('No se pudo leer la imagen.', 'Ezin izan da irudia irakurri.'),
      };
      showToast(messageByCode[error?.message] || tr('No se pudo preparar la foto.', 'Ezin izan da argazkia prestatu.'), 'error');
    }
  };

  const handlePhotoCropPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!photoCrop) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    setPhotoDrag({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: photoCrop.offsetX,
      offsetY: photoCrop.offsetY,
    });
  };

  const handlePhotoCropPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!photoCrop || !photoDrag || photoDrag.pointerId !== event.pointerId) return;

    const { maxOffsetX, maxOffsetY } = getCropMaxOffsets(photoCrop);
    const nextOffsetX = maxOffsetX === 0
      ? 0
      : clampCropOffset(photoDrag.offsetX + (event.clientX - photoDrag.startX) / maxOffsetX);
    const nextOffsetY = maxOffsetY === 0
      ? 0
      : clampCropOffset(photoDrag.offsetY + (event.clientY - photoDrag.startY) / maxOffsetY);

    setPhotoCrop({
      ...photoCrop,
      offsetX: nextOffsetX,
      offsetY: nextOffsetY,
    });
  };

  const handlePhotoCropPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (photoDrag?.pointerId === event.pointerId) {
      setPhotoDrag(null);
    }
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
    if (hasGenericEmail(newEmail)) {
      showToast(tr('Introduce un email real, no uno de @ejemplo.com', 'Sartu benetako email bat, ez @ejemplo.com domeinukoa'), 'warning');
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
      {photoCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {tr('Recortar foto de perfil', 'Profileko argazkia moztu')}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {tr('Coloca la cara dentro del círculo. Así se verá en la liga.', 'Jarri aurpegia zirkuluaren barruan. Horrela ikusiko da ligan.')}
              </p>
            </div>

            <div className="p-6 space-y-5">
              <div
                className={`mx-auto h-72 w-72 touch-none select-none rounded-full bg-slate-100 dark:bg-slate-900 bg-no-repeat shadow-inner ring-4 ring-amber-300 dark:ring-amber-600 ${photoDrag ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={getCropPreviewStyle(photoCrop)}
                role="slider"
                aria-label={tr('Arrastra para colocar la foto dentro del círculo', 'Arrastatu argazkia zirkuluaren barruan kokatzeko')}
                aria-valuemin={-1}
                aria-valuemax={1}
                aria-valuenow={Math.round(photoCrop.offsetX * 100) / 100}
                tabIndex={0}
                onPointerDown={handlePhotoCropPointerDown}
                onPointerMove={handlePhotoCropPointerMove}
                onPointerUp={handlePhotoCropPointerEnd}
                onPointerCancel={handlePhotoCropPointerEnd}
              />
              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                {tr('Arrastra la foto dentro del círculo para centrarla.', 'Arrastatu argazkia zirkuluaren barruan erdiratzeko.')}
              </p>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {tr('Zoom', 'Zooma')}
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={photoCrop.zoom}
                    onChange={(event) => setPhotoCrop({ ...photoCrop, zoom: Number(event.target.value) })}
                    className="mt-2 w-full accent-amber-500"
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={closePhotoCrop}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {tr('Cancelar', 'Utzi')}
                </button>
                <button
                  type="button"
                  onClick={handleApplyPhotoCrop}
                  className="px-4 py-2 text-sm club-btn-yellow"
                >
                  {tr('Usar esta foto', 'Argazki hau erabili')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
              <PlayerAvatar
                name={formData.name || player?.name}
                photoDataUrl={formData.photoDataUrl}
                size="xl"
                alt={tr('Foto de perfil', 'Profileko argazkia')}
              />
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {tr('Foto de perfil', 'Profileko argazkia')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {tr('Visible solo para jugadores con sesión iniciada.', 'Saioa hasita duten jokalariek bakarrik ikusiko dute.')}
                  </p>
                </div>
                {isEditing && (
                  <div className="flex flex-wrap gap-2">
                    <label className="px-4 py-2 text-sm club-btn-yellow cursor-pointer">
                      {formData.photoDataUrl
                        ? tr('Cambiar foto', 'Argazkia aldatu')
                        : tr('Añadir foto', 'Argazkia gehitu')}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                    {formData.photoDataUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, photoDataUrl: null })}
                        className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        {tr('Quitar foto', 'Argazkia kendu')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

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

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{tr('Estado de competición', 'Lehiaketa egoera')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {tr('Controla si quieres seguir entrando en próximas temporadas.', 'Kontrolatu ea hurrengo denboraldietan sartzen jarraitu nahi duzun.')}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
            player?.competitionStatus === 'FROZEN'
              ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300'
              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
          }`}>
            {player?.competitionStatus === 'FROZEN' ? tr('❄ En nevera', '❄ Izoztean') : tr('Disponible', 'Prest')}
          </span>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900 dark:border-cyan-800 dark:bg-cyan-950/20 dark:text-cyan-100">
            <p>{tr('Si te pones en nevera seguirás pudiendo entrar en la app, tu historial no se borra y tu temporada actual no se recalcula.', 'Izoztean jartzen bazara, aplikazioan sartzen jarraitu ahal izango duzu, zure historia ez da ezabatuko eta uneko denboraldia ez da berriz kalkulatuko.')}</p>
            <p className="mt-2">{tr('Lo que sí cambia es que no se te añadirá automáticamente a la siguiente temporada ni a sus grupos.', 'Aldatuko dena da ez zaituztela automatikoki hurrengo denboraldira eta haren taldeetara gehituko.')}</p>
            <Link
              to="/help"
              className="mt-3 inline-flex text-sm font-semibold text-cyan-700 underline decoration-cyan-400 underline-offset-2 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
            >
              {tr('¿Qué significa nevera y cómo se cambia?', 'Zer da izoztea eta nola aldatzen da?')}
            </Link>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={updateCompetitionStatusMutation.isPending}
              onClick={() => updateCompetitionStatusMutation.mutate(player?.competitionStatus === 'FROZEN' ? 'ACTIVE' : 'FROZEN')}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                player?.competitionStatus === 'FROZEN'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-cyan-600 text-white hover:bg-cyan-700'
              }`}
            >
              {updateCompetitionStatusMutation.isPending && (
                <Spinner size="sm" className="[&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-white" />
              )}
              {updateCompetitionStatusMutation.isPending
                ? tr('Actualizando...', 'Eguneratzen...')
                : player?.competitionStatus === 'FROZEN'
                  ? tr('Salir de nevera', 'Izoztetik atera')
                  : tr('Ponerme en nevera', 'Izoztean jarri')}
            </button>
          </div>
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



