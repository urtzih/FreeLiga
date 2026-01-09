import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

  // Determinar si el usuario actual ganó o perdió
  const getResultColor = () => {
    if (!currentUserId || !hasResult) return 'purple';
    
    const userIsP1 = match.player1.id === currentUserId;
    const userIsP2 = match.player2.id === currentUserId;
    
    if (!userIsP1 && !userIsP2) return 'purple'; // Usuario no está en el partido
    
    const userGames = userIsP1 ? match.gamesP1 : match.gamesP2;
    const oppGames = userIsP1 ? match.gamesP2 : match.gamesP1;
    
    if ((userGames ?? 0) > (oppGames ?? 0)) return 'green'; // Ganó
    if ((userGames ?? 0) < (oppGames ?? 0)) return 'red'; // Perdió
    return 'purple'; // Empate (no debería ocurrir en squash)
  };

  const resultColor = getResultColor();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6 w-full border border-slate-200 dark:border-slate-700">
      <div className="space-y-4">
        {/* Título Principal */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            vs. {getOpponentName()}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-2">
            {match.googleEventId && (
              <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-semibold">
                📅 Google Sync
              </span>
            )}
          </p>
        </div>

        {/* Fecha y Hora */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
          <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-200 font-semibold uppercase">🕐 Fecha y Hora</p>
          <p className="text-base sm:text-lg font-bold text-blue-900 dark:text-blue-100 mt-2">
            {format(matchDate, 'EEEE d MMMM', { locale: es })}
          </p>
          <p className="text-sm sm:text-base font-semibold text-blue-800 dark:text-blue-200">
            {format(matchDate, 'HH:mm', { locale: es })}
          </p>
        </div>

        {/* Ubicación */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-semibold uppercase">📍 Ubicación</p>
          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">{match.location}</p>
        </div>

        {/* Resultado */}
        {hasResult && (
          <div className={`bg-gradient-to-br p-4 rounded-lg border ${
            resultColor === 'green' 
              ? 'from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200 dark:border-green-700'
              : resultColor === 'red'
              ? 'from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 border-red-200 dark:border-red-700'
              : 'from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border-purple-200 dark:border-purple-700'
          }`}>
            <p className={`text-xs sm:text-sm font-semibold uppercase ${
              resultColor === 'green'
                ? 'text-green-700 dark:text-green-200'
                : resultColor === 'red'
                ? 'text-red-700 dark:text-red-200'
                : 'text-purple-700 dark:text-purple-200'
            }`}>🏆 Resultado</p>
            <p className={`text-base sm:text-lg font-bold mt-2 ${
              resultColor === 'green'
                ? 'text-green-900 dark:text-green-100'
                : resultColor === 'red'
                ? 'text-red-900 dark:text-red-100'
                : 'text-purple-900 dark:text-purple-100'
            }`}>
              {match.player1.name} <span className="text-lg">{match.gamesP1} - {match.gamesP2}</span> {match.player2.name}
            </p>
          </div>
        )}

        {/* Status */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-semibold uppercase">ℹ️ Estado</p>
          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">
            {match.matchStatus === 'PLAYED' && hasResult && '✅ Jugado'}
            {!hasResult && '📅 Programado'}
            {match.matchStatus === 'CANCELLED' && '❌ Cancelado'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-2">
          {isPlayer && !hasResult && (
            <>
              <button
                onClick={onEdit}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-400 transition-all font-semibold text-sm sm:text-base shadow-md hover:shadow-lg"
              >
                {isLoading ? '⏳ Guardando...' : '✏️ Editar'}
              </button>
              <button
                onClick={onDelete}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2.5 rounded-lg hover:from-red-700 hover:to-red-800 disabled:from-slate-400 disabled:to-slate-400 transition-all font-semibold text-sm sm:text-base shadow-md hover:shadow-lg"
              >
                {isLoading ? '⏳ Eliminando...' : '❌ Cancelar'}
              </button>
            </>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-100 py-2.5 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500 transition-all font-semibold text-sm sm:text-base"
            >
              ✕ Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
