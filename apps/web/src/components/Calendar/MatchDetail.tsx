import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

interface MatchDetailProps {
  match: Match;
  isPlayer?: boolean;
  currentUserId?: string;
  onEdit?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
}

export default function MatchDetail({
  match,
  isPlayer = false,
  currentUserId,
  onEdit,
  onCancel,
  onDelete,
  isLoading = false,
}: MatchDetailProps) {
  const matchDate = new Date(match.scheduledDate);
  const hasResult = match.gamesP1 !== null && match.gamesP2 !== null;

  // Determinar el oponente si el usuario actual está en el partido
  const getOpponentName = () => {
    if (!currentUserId) return `${match.player1.name} vs ${match.player2.name}`;
    if (match.player1.id === currentUserId) return match.player2.name;
    if (match.player2.id === currentUserId) return match.player1.name;
    return `${match.player1.name} vs ${match.player2.name}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
      <div className="space-y-4">
        {/* Title */}
        <div className="border-b pb-4">
          <h3 className="text-2xl font-bold text-gray-800">
            vs. {getOpponentName()}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {match.googleEventId && '📅'} Sincronizado con Google Calendar
          </p>
        </div>

        {/* Date and Time */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Fecha y Hora</p>
          <p className="text-lg font-semibold text-gray-800">
            {format(matchDate, 'EEEE d MMMM yyyy HH:mm', { locale: es })}
          </p>
        </div>

        {/* Location */}
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">📍 Lugar</p>
          <p className="text-lg font-semibold text-gray-800">{match.location}</p>
        </div>

        {/* Result if exists */}
        {hasResult && (
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Resultado</p>
            <p className="text-xl font-bold text-gray-800">
              {match.player1.name} {match.gamesP1} - {match.gamesP2} {match.player2.name}
            </p>
          </div>
        )}

        {/* Status */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Estado</p>
          <p className="text-lg font-semibold text-gray-800">
            {match.matchStatus === 'PLAYED' && hasResult && '✓ Jugado'}
            {!hasResult && '📅 Programado'}
            {match.matchStatus === 'CANCELLED' && '✕ Cancelado'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="border-t pt-4 space-y-2">
          {isPlayer && (
            <>
              <button
                onClick={onEdit}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
              >
                {isLoading ? 'Guardando...' : 'Editar'}
              </button>
              <button
                onClick={onDelete}
                disabled={isLoading}
                className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors font-medium"
              >
                {isLoading ? 'Eliminando...' : 'Cancelar Partido'}
              </button>
            </>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
