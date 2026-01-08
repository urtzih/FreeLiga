import { useState, useMemo } from 'react';
import { z } from 'zod';
import { format } from 'date-fns';

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
  gamesP1?: number;
  gamesP2?: number;
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

  // Obtener nombre del jugador actual
  const currentPlayerName = useMemo(() => {
    return players.find(p => p.id === currentUserId)?.name || 'Tu jugador';
  }, [players, currentUserId]);

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
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Programar Partido</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contrincante
        </label>
        <select
          name="player2Id"
          value={formData.player2Id}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Selecciona contrincante</option>
          {availableOpponents.map(player => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </select>
        {errors.player2Id && <p className="text-red-500 text-sm mt-1">{errors.player2Id}</p>}
        {availableOpponents.length === 0 && (
          <p className="text-amber-600 text-sm mt-1">
            ⚠️ No hay contrincantes disponibles en este grupo
          </p>
        )}
      </div>

      {/* Date and Time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fecha y Hora
        </label>
        
        {/* Date */}
        <div className="mb-3">
          <label className="block text-xs text-gray-600 mb-1">Fecha</label>
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Time - Hour and Minute */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Hora</label>
            <select
              value={timeHour}
              onChange={(e) => handleTimeChange(e.target.value, timeMinute)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-xs text-gray-600 mb-1">Minutos</label>
            <select
              value={timeMinute}
              onChange={(e) => handleTimeChange(timeHour, e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="00">00</option>
              <option value="30">30</option>
            </select>
          </div>
        </div>

        {errors.scheduledDate && (
          <p className="text-red-500 text-sm mt-1">{errors.scheduledDate}</p>
        )}
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lugar
        </label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="Ej: Mendi, pista 2"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || isLoading || availableOpponents.length === 0}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
        >
          {isSubmitting ? 'Programando...' : 'Programar Partido'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
