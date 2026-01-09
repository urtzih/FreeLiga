import { useState, useMemo } from 'react';
import { z } from 'zod';

interface Player {
  id: string;
  name: string;
}

interface Match {
  id: string;
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  scheduledDate: string;
  location: string;
  googleEventId?: string;
  gamesP1?: number | null;
  gamesP2?: number | null;
  matchStatus?: string;
}

interface ScheduleMatchFormProps {
  groupId: string;
  players: Player[];
  matches?: Match[];
  onSubmit: (data: {
    player1Id: string;
    player2Id: string;
    scheduledDate: string;
    location: string;
  }) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  currentUserId?: string;
}

const scheduleMatchSchema = z.object({
  player1Id: z.string().min(1, 'Selecciona el primer jugador'),
  player2Id: z.string().min(1, 'Selecciona el segundo jugador'),
  scheduledDate: z.string().min(1, 'Selecciona fecha y hora'),
  location: z.string().min(1, 'Ingresa el lugar del partido'),
});

type ScheduleMatchFormData = z.infer<typeof scheduleMatchSchema>;

export default function ScheduleMatchForm({
  players,
  matches = [],
  onSubmit,
  onCancel,
  isLoading = false,
  currentUserId,
}: ScheduleMatchFormProps) {
  const [formData, setFormData] = useState<ScheduleMatchFormData>({
    player1Id: currentUserId || '',
    player2Id: '',
    scheduledDate: '',
    location: '',
  });
  const [timeHour, setTimeHour] = useState('12');
  const [timeMinute, setTimeMinute] = useState('00');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtrar oponentes disponibles (solo jugadores con los que NO has jugado)
  const availableOpponents = useMemo(() => {
    if (!currentUserId) return players.filter(p => p.id !== currentUserId);

    // Crear Set de oponentes con los que ya ha jugado
    const playedOpponentIds = new Set(
      matches
        .filter(match =>
          match.player1.id === currentUserId || match.player2.id === currentUserId
        )
        .map(match =>
          match.player1.id === currentUserId ? match.player2.id : match.player1.id
        )
    );

    // Filtrar: excluir usuario actual y contrincantes ya jugados
    const available = players.filter(
      p => p.id !== currentUserId && !playedOpponentIds.has(p.id)
    );

    console.log('=== ScheduleMatchForm Debug ===');
    console.log('currentUserId:', currentUserId);
    console.log('all players:', players);
    console.log('all matches:', matches);
    console.log('played opponent IDs:', Array.from(playedOpponentIds));
    console.log('available opponents:', available);

    return available;
  }, [players, matches, currentUserId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleTimeChange = (hour: string, minute: string) => {
    setTimeHour(hour);
    setTimeMinute(minute);
    
    // Construir datetime-local format: YYYY-MM-DDTHH:mm
    if (formData.scheduledDate) {
      const dateOnly = formData.scheduledDate.split('T')[0];
      const fullDateTime = `${dateOnly}T${hour}:${minute}`;
      setFormData(prev => ({
        ...prev,
        scheduledDate: fullDateTime,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que los dos jugadores sean diferentes
    if (formData.player1Id === formData.player2Id) {
      setErrors({ player2Id: 'Debes seleccionar un contrincante diferente' });
      return;
    }

    try {
      scheduleMatchSchema.parse(formData);
      setIsSubmitting(true);
      await onSubmit(formData);
      setFormData({
        player1Id: currentUserId || '',
        player2Id: '',
        scheduledDate: '',
        location: '',
      });
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          const path = err.path[0] as string;
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6 space-y-5 border border-slate-200 dark:border-slate-700">
      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">📅 Programar Partido</h3>
      
      {/* Contrincante */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
          👥 Contrincante
        </label>
        <select
          name="player2Id"
          value={formData.player2Id}
          onChange={handleChange}
          className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-all font-medium"
        >
          <option value="">Selecciona un contrincante</option>
          {availableOpponents.map(player => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
        {errors.player2Id && <p className="text-red-500 dark:text-red-400 text-sm mt-2 font-semibold">⚠️ {errors.player2Id}</p>}
        {availableOpponents.length === 0 && (
          <p className="text-amber-600 dark:text-amber-400 text-sm mt-2 font-semibold">
            ⚠️ No hay contrincantes disponibles en este grupo
          </p>
        )}
      </div>

      {/* Fecha y Hora */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">🕐 Fecha y Hora</h4>
        
        {/* Date */}
        <div className="mb-4">
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Fecha</label>
          <input
            type="date"
            name="scheduledDate"
            value={formData.scheduledDate.split('T')[0] || ''}
            onChange={(e) => {
              const newDate = e.target.value;
              const fullDateTime = newDate ? `${newDate}T${timeHour}:${timeMinute}` : '';
              setFormData(prev => ({
                ...prev,
                scheduledDate: fullDateTime,
              }));
            }}
            className="w-full px-3 py-2.5 border-2 border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-600 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-all text-sm"
          />
        </div>

        {/* Time - Hour and Minute */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Hora</label>
            <select
              value={timeHour}
              onChange={(e) => handleTimeChange(e.target.value, timeMinute)}
              className="w-full px-3 py-2.5 border-2 border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-600 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-all text-sm font-medium"
            >
              {Array.from({ length: 14 }, (_, i) => {
                const hour = i + 8;
                return (
                  <option key={hour} value={String(hour).padStart(2, '0')}>
                    {String(hour).padStart(2, '0')}:00
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Minutos</label>
            <select
              value={timeMinute}
              onChange={(e) => handleTimeChange(timeHour, e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-600 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-all text-sm font-medium"
            >
              <option value="00">00</option>
              <option value="30">30</option>
            </select>
          </div>
        </div>

        {errors.scheduledDate && (
          <p className="text-red-500 dark:text-red-400 text-sm mt-3 font-semibold">⚠️ {errors.scheduledDate}</p>
        )}
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
          📍 Lugar del Partido
        </label>
        <select
          name="location"
          value={formData.location}
          onChange={handleChange}
          className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-all text-sm"
        >
          <option value="">Selecciona una ubicación</option>
          <option value="FRONTONES BETI-JAI">FRONTONES BETI-JAI</option>
          <option value="POL. ARIZNABARRA">POL. ARIZNABARRA</option>
          <option value="POL. ABETXUKO">POL. ABETXUKO</option>
          <option value="C.C. HEGOALDE">C.C. HEGOALDE</option>
        </select>
        {errors.location && <p className="text-red-500 dark:text-red-400 text-sm mt-2 font-semibold">⚠️ {errors.location}</p>}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || isLoading || availableOpponents.length === 0}
          className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-slate-400 disabled:to-slate-400 transition-all font-semibold text-sm sm:text-base shadow-md hover:shadow-lg disabled:shadow-none"
        >
          {isSubmitting ? '⏳ Programando...' : '✓ Programar'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-100 py-3 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500 transition-all font-semibold text-sm sm:text-base"
          >
            ✕ Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
