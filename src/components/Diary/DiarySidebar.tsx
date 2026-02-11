
import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Settings, Calendar as CalendarIcon } from 'lucide-react';
import { useStore } from '../../store';

export const DiarySidebar: React.FC = observer(() => {
    const { diaryStore } = useStore();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isCollapsed, setIsCollapsed] = useState(false);

    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    // Fill start of week
    const startDay = days[0].getDay(); // 0 (Sun) - 6 (Sat)
    const emptyDays = Array.from({ length: startDay });

    const prevMonth = () => {
        const newDate = subMonths(currentMonth, 1);
        setCurrentMonth(newDate);
        diaryStore.scanMonth(newDate.getFullYear(), newDate.getMonth() + 1);
    };

    const nextMonth = () => {
        const newDate = addMonths(currentMonth, 1);
        setCurrentMonth(newDate);
        diaryStore.scanMonth(newDate.getFullYear(), newDate.getMonth() + 1);
    };

    const handleDateClick = (date: Date) => {
        diaryStore.setDate(date);
    };


    return (
        <div
            className={`
                h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300
                ${isCollapsed ? 'w-12' : 'w-64'}
            `}
        >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                {!isCollapsed && (
                    <h2 className="text-lg font-semibold flex items-center gap-2 whitespace-nowrap overflow-hidden">
                        <CalendarIcon size={20} />
                        日记
                    </h2>
                )}
                <div className={`flex gap-1 ${isCollapsed ? 'w-full justify-center flex-col items-center' : ''}`}>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"
                        title={isCollapsed ? "展开" : "收起"}
                    >
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>

                    {!isCollapsed && (
                        <button
                            onClick={() => {
                                // Reset config to show setup screen
                                runInAction(() => {
                                    diaryStore.isConfigured = false;
                                });
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"
                            title="切换文件夹"
                        >
                            <Settings size={16} />
                        </button>
                    )}
                </div>
            </div>

            {!isCollapsed && (
                <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={prevMonth} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="font-medium">{format(currentMonth, 'yyyy年 M月')}</span>
                        <button onClick={nextMonth} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-gray-500">
                        <div>日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {emptyDays.map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}
                        {days.map(day => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const hasContent = diaryStore.calendarData.has(dateStr);
                            const isSelected = isSameDay(day, diaryStore.currentDate);
                            const isToday = isSameDay(day, new Date());

                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => handleDateClick(day)}
                                    className={`
                                        h-8 w-8 rounded-full flex items-center justify-center text-sm relative transition-colors
                                        ${isSelected ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}
                                        ${isToday && !isSelected ? 'text-blue-500 font-bold' : ''}
                                    `}
                                >
                                    {format(day, 'd')}
                                    {hasContent && (
                                        <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {!isCollapsed && (
                <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 truncate" title={diaryStore.diaryFolderName}>
                    文件夹: {diaryStore.diaryFolderName}
                </div>
            )}
        </div>
    );
});
