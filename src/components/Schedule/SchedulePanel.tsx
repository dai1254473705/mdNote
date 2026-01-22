import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';
import { X, Calendar, Clock, CheckCircle2, AlertCircle, Plus, Edit2, Trash2, Bell } from 'lucide-react';
import { cn } from '../../utils/cn';
import { MiniCalendar } from './MiniCalendar';
import { AddScheduleDialog } from './AddScheduleDialog';
import { useState, useEffect } from 'react';
import type { ScheduleItem } from '../../types';

interface SchedulePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchedulePanel = observer(({ isOpen, onClose }: SchedulePanelProps) => {
  const { scheduleStore, toastStore } = useStore();
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (isOpen) {
      scheduleStore.loadSchedules();
    }
  }, [isOpen]);

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
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 animate-in fade-in"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed top-12 right-0 bottom-0 w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 z-40 shadow-lg transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-primary" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">日程清单</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => scheduleStore.setFilter('all')}
              className={cn(
                'text-sm transition-colors',
                scheduleStore.filter === 'all'
                  ? 'text-primary font-medium'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              全部
            </button>
            <button
              onClick={() => scheduleStore.setFilter('today')}
              className={cn(
                'text-sm transition-colors flex items-center gap-1',
                scheduleStore.filter === 'today'
                  ? 'text-primary font-medium'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              今天
              {scheduleStore.todayCount > 0 && (
                <span className="w-5 h-5 flex items-center justify-center bg-primary/20 text-primary text-xs rounded-full">
                  {scheduleStore.todayCount}
                </span>
              )}
            </button>
            <button
              onClick={() => scheduleStore.setFilter('overdue')}
              className={cn(
                'text-sm transition-colors flex items-center gap-1',
                scheduleStore.filter === 'overdue'
                  ? 'text-red-500 font-medium'
                  : 'text-gray-500 hover:text-red-500'
              )}
            >
              过期
              {scheduleStore.overdueCount > 0 && (
                <span className="w-5 h-5 flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-500 text-xs rounded-full">
                  {scheduleStore.overdueCount}
                </span>
              )}
            </button>
            <button
              onClick={() => scheduleStore.setFilter('upcoming')}
              className={cn(
                'text-sm transition-colors',
                scheduleStore.filter === 'upcoming'
                  ? 'text-primary font-medium'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              即将到来
            </button>
            <button
              onClick={() => scheduleStore.setFilter('completed')}
              className={cn(
                'text-sm transition-colors',
                scheduleStore.filter === 'completed'
                  ? 'text-primary font-medium'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              已完成
            </button>
          </div>

          {/* Calendar */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <MiniCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              schedules={scheduleStore.schedules}
            />
          </div>

          {/* Schedule List */}
          <div className="flex-1 overflow-y-auto p-4">
            {scheduleStore.isLoading ? (
              <div className="flex items-center justify-center h-32 text-gray-500">
                加载中...
              </div>
            ) : groupedSchedules.size === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <Calendar size={32} className="mb-2 text-gray-300" />
                <p className="text-sm">暂无日程</p>
              </div>
            ) : (
              <div className="space-y-4">
                {[...groupedSchedules.entries()].map(([groupName, schedules]) => (
                  <div key={groupName}>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      {groupName}
                    </h3>
                    <div className="space-y-2">
                      {schedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className={cn(
                            'p-3 rounded-lg border transition-all',
                            schedule.completed
                              ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60'
                              : isOverdue(schedule)
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <button
                              onClick={() => handleToggleComplete(schedule.id)}
                              className={cn(
                                'mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors',
                                schedule.completed
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                              )}
                            >
                              {schedule.completed && <CheckCircle2 size={14} />}
                            </button>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className={cn(
                                  'font-medium truncate',
                                  schedule.completed
                                    ? 'line-through text-gray-500'
                                    : isOverdue(schedule)
                                    ? 'text-red-700 dark:text-red-400'
                                    : 'text-gray-900 dark:text-gray-100'
                                )}>
                                  {schedule.title}
                                </h4>
                                {isOverdue(schedule) && !schedule.completed && (
                                  <AlertCircle size={14} className="text-red-500 shrink-0" />
                                )}
                              </div>

                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                <Clock size={12} />
                                <span>{formatDateRange(schedule.startTime, schedule.endTime)}</span>
                              </div>

                              {schedule.description && (
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                  {schedule.description}
                                </p>
                              )}

                              {schedule.reminders.length > 0 && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  <Bell size={12} />
                                  <span>提醒: {formatReminders(schedule.reminders)}</span>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEdit(schedule.id)}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                title="编辑"
                              >
                                <Edit2 size={14} className="text-gray-500" />
                              </button>
                              <button
                                onClick={() => handleDelete(schedule.id)}
                                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                title="删除"
                              >
                                <Trash2 size={14} className="text-gray-500 hover:text-red-500" />
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

          {/* Add Button */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={() => scheduleStore.openAddDialog()}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium"
            >
              <Plus size={18} />
              添加日程
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <AddScheduleDialog />
    </>
  );
});
