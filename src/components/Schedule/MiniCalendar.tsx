import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { ScheduleItem } from '../../types';

interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  schedules?: ScheduleItem[];
  className?: string;
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  selectedDate,
  onDateSelect,
  schedules = [],
  className,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Get days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];

    // Empty cells before first day
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [year, month, firstDayOfMonth, daysInMonth]);

  // Get schedules for a specific day
  const getSchedulesForDay = (date: Date) => {
    return schedules.filter(s => {
      const scheduleDate = new Date(s.startTime);
      return (
        scheduleDate.getFullYear() === date.getFullYear() &&
        scheduleDate.getMonth() === date.getMonth() &&
        scheduleDate.getDate() === date.getDate() &&
        !s.completed
      );
    });
  };

  const hasSchedulesToday = (date: Date) => {
    return getSchedulesForDay(date).length > 0;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const isSelected = (date: Date) => {
    return (
      selectedDate.getFullYear() === date.getFullYear() &&
      selectedDate.getMonth() === date.getMonth() &&
      selectedDate.getDate() === date.getDate()
    );
  };

  const isPastDay = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1));
  };

  const handleTodayClick = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="上个月"
        >
          <ChevronLeft size={16} className="text-gray-600 dark:text-gray-400" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {year}年{month + 1}月
          </span>
        </div>

        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="下个月"
        >
          <ChevronRight size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Today button */}
      <button
        onClick={handleTodayClick}
        className="w-full mb-3 py-1 text-xs text-primary hover:bg-primary/10 rounded transition-colors"
      >
        今天
      </button>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs text-gray-500 dark:text-gray-400 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="h-7" />;
          }

          const selected = isSelected(date);
          const today = isToday(date);
          const past = isPastDay(date);
          const hasEvents = hasSchedulesToday(date);

          return (
            <button
              key={index}
              onClick={() => {
                setCurrentMonth(new Date(date));
                onDateSelect(date);
              }}
              className={cn(
                'h-7 w-full text-xs rounded relative transition-colors',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
                selected && 'bg-primary text-white hover:bg-primary/90',
                !selected && today && 'font-semibold',
                !selected && past && 'text-gray-400 dark:text-gray-600',
                !selected && !past && !selected && 'text-gray-700 dark:text-gray-300'
              )}
            >
              <span className="relative z-10">{date.getDate()}</span>
              {hasEvents && !selected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
              {today && !selected && (
                <span className="absolute inset-0 border border-primary rounded" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
