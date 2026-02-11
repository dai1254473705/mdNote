import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';
import { Calendar, Clock, CheckCircle2, AlertCircle, Plus, Edit2, Trash2, Bell, Inbox } from 'lucide-react';
import { cn } from '../../utils/cn';
import { MiniCalendar } from './MiniCalendar';
import { AddScheduleDialog } from './AddScheduleDialog';
import { useState, useEffect } from 'react';
import type { ScheduleItem } from '../../types';

export const SchedulePage = observer(() => {
    const { scheduleStore, toastStore } = useStore();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [quickTitle, setQuickTitle] = useState('');

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

    const handleToggleComplete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await scheduleStore.toggleComplete(id);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('确定要删除这个日程吗？')) {
            await scheduleStore.deleteSchedule(id);
            toastStore?.success('日程已删除');
        }
    };

    const handleEdit = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        scheduleStore.openEditDialog(id);
    };

    const handleQuickAdd = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && quickTitle.trim()) {
            const now = new Date();
            // Default to next hour if selected date is today, otherwise 9:00 AM on selected date
            const isToday = selectedDate.toDateString() === now.toDateString();
            const startTime = new Date(selectedDate);

            if (isToday) {
                startTime.setHours(now.getHours() + 1, 0, 0, 0);
            } else {
                startTime.setHours(9, 0, 0, 0);
            }

            const endTime = new Date(startTime);
            endTime.setHours(startTime.getHours() + 1);

            const success = await scheduleStore.addSchedule({
                title: quickTitle,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                reminders: []
            });

            if (success) {
                setQuickTitle('');
                toastStore?.success('日程已添加');
            }
        }
    };

    const groupedSchedules = scheduleStore.groupedSchedules;

    // Helper to get status color border class
    const getStatusBorderClass = (schedule: ScheduleItem) => {
        if (schedule.completed) return 'border-l-gray-300 dark:border-l-gray-600';
        if (isOverdue(schedule)) return 'border-l-red-500';

        const start = new Date(schedule.startTime);
        const now = new Date();
        const isToday = start.toDateString() === now.toDateString();

        if (isToday) return 'border-l-primary';
        return 'border-l-blue-300 dark:border-l-blue-700';
    };

    return (
        <div className="h-full flex px-6 py-6 gap-6 bg-gray-50/50 dark:bg-gray-900 overflow-hidden">
            {/* Left Sidebar (Calendar & Filters) */}
            <div className="w-72 flex flex-col gap-6 shrink-0">
                {/* Calendar Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-4">
                    <MiniCalendar
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                        schedules={scheduleStore.schedules}
                    />
                </div>

                {/* Filters */}
                <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
                    {[
                        { id: 'all', label: '全部日程', icon: <Inbox size={18} /> },
                        { id: 'today', label: '今天', icon: <Calendar size={18} />, count: scheduleStore.todayCount },
                        { id: 'upcoming', label: '即将到来', icon: <Clock size={18} /> },
                        { id: 'overdue', label: '已过期', icon: <AlertCircle size={18} />, count: scheduleStore.overdueCount },
                        { id: 'completed', label: '已完成', icon: <CheckCircle2 size={18} /> },
                    ].map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => scheduleStore.setFilter(filter.id as any)}
                            className={cn(
                                'flex items-center justify-between px-4 py-3 text-sm rounded-xl transition-all duration-200 group',
                                scheduleStore.filter === filter.id
                                    ? 'bg-white dark:bg-gray-800 text-primary shadow-sm font-medium'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200'
                            )}
                        >
                            <div className="flex items-center gap-3">
                                {filter.icon}
                                <span>{filter.label}</span>
                            </div>
                            {filter.count !== undefined && filter.count > 0 && (
                                <span className={cn(
                                    "text-xs px-2 py-0.5 rounded-full font-medium transition-colors",
                                    filter.id === 'overdue'
                                        ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 group-hover:bg-primary/10 group-hover:text-primary"
                                )}>
                                    {filter.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                {/* Header with Quick Add */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700/50 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                {scheduleStore.filter === 'today' ? '今天的日程' :
                                    scheduleStore.filter === 'upcoming' ? '即将到来的日程' :
                                        scheduleStore.filter === 'overdue' ? '过期的日程' :
                                            scheduleStore.filter === 'completed' ? '已完成的日程' :
                                                '全部日程'}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        <button
                            onClick={() => scheduleStore.openAddDialog()}
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-full transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 font-medium active:scale-95"
                        >
                            <Plus size={18} />
                            <span>添加日程</span>
                        </button>
                    </div>

                    {/* Quick Add Input */}
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                            <Plus size={20} />
                        </div>
                        <input
                            type="text"
                            value={quickTitle}
                            onChange={(e) => setQuickTitle(e.target.value)}
                            onKeyDown={handleQuickAdd}
                            placeholder="添加新任务，按回车快速创建..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-none rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-900 transition-all font-medium"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <span className="text-xs text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700">Enter</span>
                        </div>
                    </div>
                </div>

                {/* Schedule List */}
                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    {scheduleStore.isLoading ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            加载中...
                        </div>
                    ) : groupedSchedules.size === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20">
                            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                <Inbox size={48} className="text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">没有安排日程</h3>
                            <p className="text-gray-500 max-w-xs text-center">
                                {scheduleStore.filter === 'all'
                                    ? '好好休息，享受当下。或者点击上方输入框添加一个新的任务。'
                                    : '当前分类下没有任务，去看看其他分类吧。'}
                            </p>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-8">
                            {[...groupedSchedules.entries()].map(([groupName, schedules]) => (
                                <div key={groupName} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h3 className="flex items-center gap-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 pl-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                                        {groupName}
                                        <span className="text-xs font-normal bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-400">
                                            {schedules.length}
                                        </span>
                                    </h3>
                                    <div className="grid gap-3">
                                        {schedules.map((schedule) => (
                                            <div
                                                key={schedule.id}
                                                onClick={() => scheduleStore.openEditDialog(schedule.id)}
                                                className={cn(
                                                    'group relative flex items-start gap-4 p-4 rounded-xl border border-transparent bg-white dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
                                                    'border-l-4', // Left border for status
                                                    getStatusBorderClass(schedule),
                                                    schedule.completed && 'opacity-60 grayscale-[0.5]'
                                                )}
                                            >
                                                {/* Checkbox */}
                                                <button
                                                    onClick={(e) => handleToggleComplete(schedule.id, e)}
                                                    className={cn(
                                                        'mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0',
                                                        schedule.completed
                                                            ? 'bg-emerald-500 border-emerald-500 text-white scale-110'
                                                            : 'border-gray-300 dark:border-gray-600 text-transparent hover:border-primary hover:text-primary/20 bg-transparent'
                                                    )}
                                                >
                                                    <CheckCircle2 size={14} strokeWidth={3} />
                                                </button>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0 py-0.5">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <h4 className={cn(
                                                            'font-semibold text-base leading-snug truncate transition-all',
                                                            schedule.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-gray-100',
                                                            isOverdue(schedule) && !schedule.completed && 'text-red-600 dark:text-red-400'
                                                        )}>
                                                            {schedule.title}
                                                        </h4>

                                                        {/* Status Badges */}
                                                        {isOverdue(schedule) && !schedule.completed && (
                                                            <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                                <AlertCircle size={10} />
                                                                已过期
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-3 mt-2">
                                                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700/50 px-2.5 py-1 rounded-md">
                                                            <Clock size={12} className="text-primary" />
                                                            <span className="dark:text-gray-300">{formatDateRange(schedule.startTime, schedule.endTime)}</span>
                                                        </div>
                                                        {schedule.reminders.length > 0 && (
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md border border-gray-100 dark:border-gray-700">
                                                                <Bell size={12} />
                                                                <span>{formatReminders(schedule.reminders)}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {schedule.description && (
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed pl-1 border-l-2 border-gray-100 dark:border-gray-700 ml-0.5">
                                                            {schedule.description}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Hover Actions */}
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-200">
                                                    <button
                                                        onClick={(e) => handleEdit(schedule.id, e)}
                                                        className="p-2 bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 rounded-lg text-gray-400 hover:text-primary hover:border-primary/30 transition-colors"
                                                        title="编辑"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(schedule.id, e)}
                                                        className="p-2 bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                                                        title="删除"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
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

            {/* Add/Edit Dialog */}
            <AddScheduleDialog />
        </div>
    );
});
