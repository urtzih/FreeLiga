import { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';

interface Match {
  id: string;
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  scheduledDate: string;
  date?: string;
  location: string;
  googleEventId?: string;
  gamesP1?: number | null;
  gamesP2?: number | null;
  matchStatus?: string;
}

interface CalendarViewProps {
  matches: Match[];
  currentUserId?: string;
  onDayClick?: (date: Date) => void;
  onMatchClick?: (match: Match) => void;
}

export default function CalendarView({ matches, currentUserId, onDayClick, onMatchClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);

  // Función para obtener el nombre del oponente o ambos nombres
  const getMatchTitle = (match: Match) => {
    if (!currentUserId) return `${match.player1.name} vs ${match.player2.name}`;
    if (match.player1.id === currentUserId) return match.player2.name;
    if (match.player2.id === currentUserId) return match.player1.name;
    return `${match.player1.name} vs ${match.player2.name}`;
  };

  useEffect(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Lunes = 1
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    setCalendarDays(eachDayOfInterval({ start: calendarStart, end: calendarEnd }));
  }, [currentDate]);

  const getMatchesForDate = (date: Date) => {
    return matches.filter(m => {
      // Usar scheduledDate para partidos programados y date para partidos jugados
      const matchDateString = m.scheduledDate || m.date;
      if (!matchDateString) return false;
      const matchDate = new Date(matchDateString);
      return (
        matchDate.getFullYear() === date.getFullYear() &&
        matchDate.getMonth() === date.getMonth() &&
        matchDate.getDate() === date.getDate()
      );
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="w-full">
      {/* Header con Navegación */}
      <div className="flex items-center justify-between mb-6 gap-2">
        <button
          onClick={previousMonth}
          className="px-3 py-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium text-slate-700 dark:text-slate-300 text-sm sm:text-base"
        >
          ← Anterior
        </button>
        <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white text-center flex-1">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h2>
        <button
          onClick={nextMonth}
          className="px-3 py-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium text-slate-700 dark:text-slate-300 text-sm sm:text-base"
        >
          Siguiente →
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {days.map(day => (
          <div key={day} className="text-center font-semibold text-slate-600 dark:text-slate-400 text-xs sm:text-sm py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Días del calendario */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 bg-slate-50 dark:bg-slate-900 p-2 sm:p-3 rounded-lg">
        {calendarDays.map(date => {
          const dayMatches = getMatchesForDate(date);
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isCurrentDay = isToday(date);

          return (
            <div
              key={date.toISOString()}
              onClick={() => onDayClick?.(date)}
              className={`aspect-square p-1 sm:p-2 rounded-lg border-2 transition-all cursor-pointer flex flex-col ${
                isCurrentDay
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 shadow-md'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              } ${
                !isCurrentMonth ? 'opacity-30' : ''
              } hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-400`}
            >
              {/* Día */}
              <div className={`text-xs sm:text-sm font-bold mb-1 ${
                isCurrentDay
                  ? 'text-blue-600 dark:text-blue-300'
                  : 'text-slate-700 dark:text-slate-300'
              }`}>
                {format(date, 'd')}
              </div>

              {/* Indicadores de partidos */}
              <div className="flex-1 flex flex-col gap-0.5 overflow-hidden justify-end">
                {dayMatches.slice(0, 3).map((match) => {
                  const isPlayed = match.matchStatus === 'PLAYED' && match.gamesP1 != null && match.gamesP2 != null;
                  const isUserInMatch = currentUserId && (match.player1.id === currentUserId || match.player2.id === currentUserId);
                  
                  let bgColor = 'bg-gray-400 dark:bg-gray-500';
                  
                  if (isUserInMatch) {
                    if (!isPlayed) {
                      bgColor = 'bg-blue-500 dark:bg-blue-600';
                    } else {
                      const userScore = match.player1.id === currentUserId ? match.gamesP1 : match.gamesP2;
                      const oppScore = match.player1.id === currentUserId ? match.gamesP2 : match.gamesP1;
                      if (userScore != null && oppScore != null) {
                        if (userScore > oppScore) {
                          bgColor = 'bg-green-500 dark:bg-green-600';
                        } else if (userScore < oppScore) {
                          bgColor = 'bg-red-500 dark:bg-red-600';
                        }
                      }
                    }
                  }
                  
                  const matchTitle = getMatchTitle(match);
                  const matchTime = format(new Date(match.scheduledDate || match.date || ''), 'HH:mm');
                  
                  // Para partidos jugados, mostrar contrincante + resultado
                  let displayText = '';
                  if (isPlayed && isUserInMatch) {
                    const userScore = match.player1.id === currentUserId ? match.gamesP1 : match.gamesP2;
                    const oppScore = match.player1.id === currentUserId ? match.gamesP2 : match.gamesP1;
                    displayText = `${matchTitle} ${userScore}-${oppScore}`;
                  } else if (isPlayed) {
                    // Si no es el usuario pero está jugado, mostrar solo resultado
                    displayText = `${match.player1.name.split(' ')[0]} ${match.gamesP1}-${match.gamesP2} ${match.player2.name.split(' ')[0]}`;
                  } else {
                    // Partidos programados: mostrar hora + contrincante
                    displayText = `${matchTime} ${matchTitle.split(' ').slice(0, 2).join(' ')}`;
                  }
                  
                  return (
                    <div
                      key={match.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMatchClick?.(match);
                      }}
                      className={`rounded-md cursor-pointer hover:opacity-80 transition-all ${bgColor} group relative`}
                      title={`${matchTitle} @ ${matchTime}`}
                    >
                      {/* Indicador visual para mobile */}
                      <div className="sm:hidden h-1.5 sm:h-2 rounded-full w-full" />
                      
                      {/* Tooltip visible en desktop con información diferente según estado */}
                      <div className="hidden sm:block text-xs p-1 text-white font-semibold truncate">
                        {displayText}
                      </div>
                    </div>
                  );
                })}
                {dayMatches.length > 3 && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 px-1 font-semibold text-center">+{dayMatches.length - 3}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
