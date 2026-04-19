import { format } from 'date-fns';
import { useLanguage } from '../../contexts/LanguageContext';

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
  const { t, dateFnsLocale } = useLanguage();
  const matchDate = new Date(match.scheduledDate);
  const hasResult = match.gamesP1 !== null && match.gamesP2 !== null;

  const getOpponentName = () => {
    if (!currentUserId) return `${match.player1.name} vs ${match.player2.name}`;
    if (match.player1.id === currentUserId) return match.player2.name;
    if (match.player2.id === currentUserId) return match.player1.name;
    return `${match.player1.name} vs ${match.player2.name}`;
  };

  const getResultColor = () => {
    if (!currentUserId || !hasResult) return 'purple';

    const userIsP1 = match.player1.id === currentUserId;
    const userIsP2 = match.player2.id === currentUserId;

    if (!userIsP1 && !userIsP2) return 'purple';

    const userGames = userIsP1 ? match.gamesP1 : match.gamesP2;
    const oppGames = userIsP1 ? match.gamesP2 : match.gamesP1;

    if ((userGames ?? 0) > (oppGames ?? 0)) return 'green';
    if ((userGames ?? 0) < (oppGames ?? 0)) return 'red';
    return 'purple';
  };

  const resultColor = getResultColor();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 sm:p-6 w-full border border-slate-200 dark:border-slate-700">
      <div className="space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            vs. {getOpponentName()}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-2">
            {match.googleEventId && (
              <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-1 rounded text-xs font-semibold">
                📅 {t('matchDetail.googleSync')}
              </span>
            )}
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900 dark:to-amber-800 p-4 rounded-lg border border-amber-200 dark:border-amber-700">
          <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-200 font-semibold uppercase">🕐 {t('matchDetail.dateTime')}</p>
          <p className="text-base sm:text-lg font-bold text-amber-900 dark:text-amber-100 mt-2">
            {format(matchDate, 'EEEE d MMMM', { locale: dateFnsLocale })}
          </p>
          <p className="text-sm sm:text-base font-semibold text-amber-800 dark:text-amber-200">
            {format(matchDate, 'HH:mm', { locale: dateFnsLocale })}
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-semibold uppercase">📍 {t('matchDetail.location')}</p>
          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">{match.location}</p>
        </div>

        {hasResult && (
          <div className={`bg-gradient-to-br p-4 rounded-lg border ${
            resultColor === 'green'
              ? 'from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200 dark:border-green-700'
              : resultColor === 'red'
              ? 'from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 border-red-200 dark:border-red-700'
              : 'from-amber-50 to-amber-100 dark:from-amber-900 dark:to-amber-800 border-amber-200 dark:border-amber-700'
          }`}>
            <p className={`text-xs sm:text-sm font-semibold uppercase ${
              resultColor === 'green'
                ? 'text-green-700 dark:text-green-200'
                : resultColor === 'red'
                ? 'text-red-700 dark:text-red-200'
                : 'text-amber-700 dark:text-amber-200'
            }`}>🏆 {t('matchDetail.result')}</p>
            <p className={`text-base sm:text-lg font-bold mt-2 ${
              resultColor === 'green'
                ? 'text-green-900 dark:text-green-100'
                : resultColor === 'red'
                ? 'text-red-900 dark:text-red-100'
                : 'text-amber-900 dark:text-amber-100'
            }`}>
              {match.player1.name} <span className="text-lg">{match.gamesP1} - {match.gamesP2}</span> {match.player2.name}
            </p>
          </div>
        )}

        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-semibold uppercase">ℹ️ {t('matchDetail.status')}</p>
          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">
            {match.matchStatus === 'PLAYED' && hasResult && `✅ ${t('matchDetail.statusPlayed')}`}
            {!hasResult && `📅 ${t('matchDetail.statusScheduled')}`}
            {match.matchStatus === 'CANCELLED' && `❌ ${t('matchDetail.statusCancelled')}`}
          </p>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-2">
          {isPlayer && !hasResult && (
            <>
              <button
                onClick={onEdit}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-2.5 rounded-lg hover:from-amber-700 hover:to-amber-800 disabled:from-slate-400 disabled:to-slate-400 transition-all font-semibold text-sm sm:text-base shadow-md hover:shadow-lg"
              >
                {isLoading ? `⏳ ${t('matchDetail.saving')}` : `✏️ ${t('matchDetail.edit')}`}
              </button>
              <button
                onClick={onDelete}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2.5 rounded-lg hover:from-red-700 hover:to-red-800 disabled:from-slate-400 disabled:to-slate-400 transition-all font-semibold text-sm sm:text-base shadow-md hover:shadow-lg"
              >
                {isLoading ? `⏳ ${t('matchDetail.deleting')}` : `❌ ${t('matchDetail.cancelMatch')}`}
              </button>
            </>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-100 py-2.5 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500 transition-all font-semibold text-sm sm:text-base"
            >
              ✕ {t('common.close')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

