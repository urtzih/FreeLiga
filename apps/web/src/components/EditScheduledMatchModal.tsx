import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';

interface Match {
  id: string;
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  scheduledDate: string;
  location: string;
  notes?: string;
}

interface EditScheduledMatchModalProps {
  match: Match;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EditScheduledMatchModal({
  match,
  isOpen,
  onClose,
  onSuccess,
}: EditScheduledMatchModalProps) {
  const [formData, setFormData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    location: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (match && isOpen) {
      const matchDate = new Date(match.scheduledDate);
      const dateStr = matchDate.toISOString().split('T')[0];
      const timeStr = `${String(matchDate.getHours()).padStart(2, '0')}:${String(
        matchDate.getMinutes()
      ).padStart(2, '0')}`;

      setFormData({
        scheduledDate: dateStr,
        scheduledTime: timeStr,
        location: match.location || '',
        notes: match.notes || '',
      });
      setError('');
    }
  }, [match, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.scheduledDate || !formData.scheduledTime) {
      setError('La fecha y hora son requeridas');
      return;
    }

    if (!formData.location.trim()) {
      setError('La ubicación es requerida');
      return;
    }

    try {
      setIsLoading(true);
      const [year, month, day] = formData.scheduledDate.split('-');
      const [hours, minutes] = formData.scheduledTime.split(':');

      const scheduledDateTime = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
      );

      const response = await api.put(`/matches/${match.id}`, {
        scheduledDate: scheduledDateTime.toISOString(),
        location: formData.location,
        notes: formData.notes || null,
      });

      if (response.status === 200) {
        toast.success('Programación actualizada');
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        (typeof err.message === 'string' ? err.message : 'Error al actualizar la programación');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Editar Programación
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información del partido */}
          <div className="text-center mb-4">
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">
              Enfrentamiento
            </p>
            <div className="flex items-center justify-center space-x-4 font-bold text-lg text-slate-900 dark:text-white">
              <span>{match.player1.name}</span>
              <span className="text-slate-400">vs</span>
              <span>{match.player2.name}</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) =>
                setFormData({ ...formData, scheduledDate: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              required
            />
          </div>

          {/* Hora */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Hora
            </label>
            <input
              type="time"
              value={formData.scheduledTime}
              onChange={(e) =>
                setFormData({ ...formData, scheduledTime: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              required
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Horario permitido: 08:00 - 21:00
            </p>
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Ubicación
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Ej: Mendi, pista 2"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              required
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Notas (Opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Ej: Pista 05, entrada por la puerta sur..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Máximo 200 caracteres
            </p>
          </div>

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '⏳ Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
