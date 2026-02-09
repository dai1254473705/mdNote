import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';
import { Calendar, Clock, CheckCircle2, AlertCircle, Plus, Edit2, Trash2, Bell } from 'lucide-react';
import { cn } from '../../utils/cn';
import { MiniCalendar } from './MiniCalendar';
import { AddScheduleDialog } from './AddScheduleDialog';
import { useState, useEffect } from 'react';
import type { ScheduleItem } from '../../types';

export const SchedulePage = observer(() => {
    const { scheduleStore, toastStore } = useStore();
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        scheduleStore.loadSchedules();
    }, [scheduleStore]);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateRange = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);

        const time = `${formatTime(start)} - ${formatTime(end)}`;

        // Check if multi-day
        if (startDate.toDateString() !== endDate.toDateString()) {
            return `${time} · 至 ${endDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}`;
        }

        return time;
    };

    const isOverdue = (schedule: ScheduleItem) => {
        return !schedule.completed && new Date(schedule.startTime) < new Date();
    };

    const formatReminders = (reminders: { type: string; value: number }[]) => {
        if (reminders.length === 0) return null;
        const labels = reminders.map(r => {
            if (r.type === 'minutes') return `${r.value}分钟`;
            if (r.type === 'hours') return `${r.value}小时`;
            return `${r.value}天`;
        });
        return labels.join(', ');
    };

    const handleToggleComplete = async (id: string) => {
        await scheduleStore.toggleComplete(id);
    };

    const handleDelete = async (id: string) => {
        if (confirm('确定要删除这个日程吗？')) {
            await scheduleStore.deleteSchedule(id);
            toastStore?.success('日程已删除');
        }
    };

    const handleEdit = (id: string) => {
        scheduleStore.openEditDialog(id);
    };

    const groupedSchedules = scheduleStore.groupedSchedules;

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
                <div className="flex items-center gap-2">
                    <Calendar size={20} className="text-primary" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">日程清单</h2>
                </div>
                {/* Actions can go here if needed */}
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar (Calendar & Filters) - Adjusted layout for page view */}
                <div className="w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0">
                    {/* Calendar */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                        <MiniCalendar
                            selectedDate={selectedDate}
                            onDateSelect={setSelectedDate}
                            schedules={scheduleStore.schedules}
                        />
                    </div>

                    {/* Stats / Filters */}
                    <div className="flex flex-col gap-1 p-4 overflow-y-auto">
                        <button
                            onClick={() => scheduleStore.setFilter('all')}
                            className={cn(
                                'flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
                                scheduleStore.filter === 'all'
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            )}
                        >
                            <span>全部</span>
                        </button>
                        <button
                            onClick={() => scheduleStore.setFilter('today')}
                            className={cn(
                                'flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
                                scheduleStore.filter === 'today'
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            )}
                        >
                            <span>今天</span>
                            {scheduleStore.todayCount > 0 && (
                                <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                                    {scheduleStore.todayCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => scheduleStore.setFilter('overdue')}
                            className={cn(
                                'flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
                                scheduleStore.filter === 'overdue'
                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 font-medium'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            )}
                        >
                            <span>过期</span>
                            {scheduleStore.overdueCount > 0 && (
                                <span className="bg-red-100 dark:bg-red-900/30 text-red-500 text-xs px-2 py-0.5 rounded-full">
                                    {scheduleStore.overdueCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => scheduleStore.setFilter('upcoming')}
                            className={cn(
                                'flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
                                scheduleStore.filter === 'upcoming'
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            )}
                        >
                            <span>即将到来</span>
                        </button>
                        <button
                            onClick={() => scheduleStore.setFilter('completed')}
                            className={cn(
                                'flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
                                scheduleStore.filter === 'completed'
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            )}
                        >
                            <span>已完成</span>
                        </button>
                    </div>

                    {/* Add Button */}
                    <div className="p-4 mt-auto">
                        <button
                            onClick={() => scheduleStore.openAddDialog()}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium"
                        >
                            <Plus size={18} />
                            添加日程
                        </button>
                    </div>
                </div>

                {/* Main List */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900/50">
                    {scheduleStore.isLoading ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            加载中...
                        </div>
                    ) : groupedSchedules.size === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <Calendar size={48} className="mb-4 text-gray-300" />
                            <p className="text-lg font-medium text-gray-400">暂无日程</p>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto space-y-6">
                            {[...groupedSchedules.entries()].map(([groupName, schedules]) => (
                                <div key={groupName}>
                                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 pl-1">
                                        {groupName}
                                    </h3>
                                    <div className="space-y-3">
                                        {schedules.map((schedule) => (
                                            <div
                                                key={schedule.id}
                                                className={cn(
                                                    'p-4 rounded-xl border shadow-sm transition-all bg-white dark:bg-gray-800',
                                                    schedule.completed
                                                        ? 'border-gray-200 dark:border-gray-700 opacity-60'
                                                        : isOverdue(schedule)
                                                            ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-md'
                                                )}
                                            >
                                                <div className="flex items-start gap-4">
                                                    {/* Checkbox */}
                                                    <button
                                                        onClick={() => handleToggleComplete(schedule.id)}
                                                        className={cn(
                                                            'mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0',
                                                            schedule.completed
                                                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                                                : 'border-gray-300 dark:border-gray-500 hover:border-primary'
                                                        )}
                                                    >
                                                        {schedule.completed && <CheckCircle2 size={12} strokeWidth={3} />}
                                                    </button>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className={cn(
                                                                'font-medium text-base truncate',
                                                                schedule.completed
                                                                    ? 'line-through text-gray-500'
                                                                    : isOverdue(schedule)
                                                                        ? 'text-red-700 dark:text-red-400'
                                                                        : 'text-gray-900 dark:text-gray-100'
                                                            )}>
                                                                {schedule.title}
                                                            </h4>
                                                            {isOverdue(schedule) && !schedule.completed && (
                                                                <AlertCircle size={16} className="text-red-500 shrink-0" />
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-2">
                                                            <div className="flex items-center gap-1">
                                                                <Clock size={14} />
                                                                <span>{formatDateRange(schedule.startTime, schedule.endTime)}</span>
                                                            </div>
                                                            {schedule.reminders.length > 0 && (
                                                                <div className="flex items-center gap-1">
                                                                    <Bell size={14} />
                                                                    <span>{formatReminders(schedule.reminders)}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {schedule.description && (
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                                                {schedule.description}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleEdit(schedule.id)}
                                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                            title="编辑"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(schedule.id)}
                                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors text-gray-400 hover:text-red-500"
                                                            title="删除"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Dialog - Keep this as a Dialog */}
            <AddScheduleDialog />
        </div>
    );
});
