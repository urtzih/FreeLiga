import { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isBefore,
  startOfDay,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
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
      const matchDate = new Date(m.scheduledDate || m.date);
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={previousMonth}
          className="px-4 py-2 hover:bg-gray-200 rounded-lg transition-colors"
        >
          ← Anterior
        </button>
        <h2 className="text-2xl font-bold text-gray-800">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h2>
        <button
          onClick={nextMonth}
          className="px-4 py-2 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Siguiente →
        </button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {days.map(day => (
          <div
            key={day}
            className="text-center font-semibold text-gray-600 py-3 text-sm uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map(date => {
          const dayMatches = getMatchesForDate(date);
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isTodayDate = isToday(date);
          const isPastDate = isBefore(startOfDay(date), startOfDay(new Date()));

          return (
            <div
              key={date.toString()}
              onClick={() => onDayClick?.(date)}
              className={`min-h-32 p-2 rounded-lg border-2 cursor-pointer transition-all ${
                !isCurrentMonth ? 'bg-gray-50 text-gray-300 border-gray-200' : ''
              } ${
                isTodayDate
                  ? 'border-blue-500 bg-blue-50'
                  : isCurrentMonth
                  ? 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                  : ''
              } ${isPastDate && !isTodayDate ? 'opacity-50' : ''}`}
            >
              <div
                className={`font-semibold text-sm mb-1 ${
                  isTodayDate ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                {format(date, 'd')}
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {dayMatches.map(match => {
                  const isPlayed = match.matchStatus === 'PLAYED' && match.gamesP1 !== null && match.gamesP2 !== null;
                  const isUserInMatch = currentUserId && (match.player1.id === currentUserId || match.player2.id === currentUserId);
                  
                  // Determinar color según estado y resultado
                  let bgColor = 'bg-gray-100 text-gray-700 hover:bg-gray-200'; // Default: gris (no involucrado)
                  
                  if (isUserInMatch) {
                    if (!isPlayed) {
                      // Partido programado → azul
                      bgColor = 'bg-blue-100 text-blue-800 hover:bg-blue-200';
                    } else {
                      // Partido jugado → verde si ganó, rojo si perdió
                      const userIsP1 = match.player1.id === currentUserId;
                      const userScore = userIsP1 ? match.gamesP1 : match.gamesP2;
                      const opponentScore = userIsP1 ? match.gamesP2 : match.gamesP1;
                      
                      if (userScore !== null && opponentScore !== null) {
                        if (userScore > opponentScore) {
                          bgColor = 'bg-green-100 text-green-800 hover:bg-green-200'; // Ganó
                        } else if (userScore < opponentScore) {
                          bgColor = 'bg-red-100 text-red-800 hover:bg-red-200'; // Perdió
                        } else {
                          bgColor = 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'; // Empate (raro pero posible)
                        }
                      }
                    }
                  }
                  
                  const resultText = isPlayed ? `${match.gamesP1}-${match.gamesP2}` : '';
                  const matchTitle = getMatchTitle(match);

                  return (
                    <div
                      key={match.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMatchClick?.(match);
                      }}
                      className={`text-xs ${bgColor} p-1.5 rounded cursor-pointer truncate transition-colors`}
                      title={`${matchTitle}\n${match.location}${resultText ? `\nResultado: ${resultText}` : ''}`}
                    >
                      <div className="font-semibold truncate">
                        vs. {matchTitle}
                      </div>
                      {resultText && (
                        <div className="text-xs font-bold">
                          {resultText}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
