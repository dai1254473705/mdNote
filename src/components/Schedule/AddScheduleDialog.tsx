import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Plus, Trash2, Clock } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';
import type { ScheduleReminder } from '../../types';

interface ReminderOption {
  label: string;
  type: 'minutes' | 'hours' | 'days';
  value: number;
}

const reminderOptions: ReminderOption[] = [
  { label: '5分钟前', type: 'minutes', value: 5 },
  { label: '15分钟前', type: 'minutes', value: 15 },
  { label: '30分钟前', type: 'minutes', value: 30 },
  { label: '1小时前', type: 'hours', value: 1 },
  { label: '2小时前', type: 'hours', value: 2 },
  { label: '1天前', type: 'days', value: 1 },
  { label: '3天前', type: 'days', value: 3 },
  { label: '7天前', type: 'days', value: 7 },
];

export const AddScheduleDialog = observer(() => {
  const { scheduleStore, toastStore } = useStore();
  const { isOpen, editingId } = scheduleStore.addDialog;
  const editingSchedule = editingId ? scheduleStore.editingSchedule : undefined;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reminders, setReminders] = useState<ScheduleReminder[]>([]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      if (editingSchedule) {
        setTitle(editingSchedule.title);
        setDescription(editingSchedule.description || '');
        const start = new Date(editingSchedule.startTime);
        const end = new Date(editingSchedule.endTime);
        setStartDate(start.toISOString().split('T')[0]);
        setStartTime(start.toTimeString().slice(0, 5));
        setEndTime(end.toTimeString().slice(0, 5));
        setReminders(editingSchedule.reminders);
      } else {
        // Default to today, current time + 1 hour
        const now = new Date();
        const start = new Date(now.getTime() + 60 * 60 * 1000);
        const end = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        setStartDate(now.toISOString().split('T')[0]);
        setStartTime(start.toTimeString().slice(0, 5));
        setEndTime(end.toTimeString().slice(0, 5));
        setTitle('');
        setDescription('');
        setReminders([]);
      }
    }
  }, [isOpen, editingSchedule]);

  const handleAddReminder = () => {
    setReminders([...reminders, { type: 'minutes', value: 15 }]);
  };

  const handleRemoveReminder = (index: number) => {
    setReminders(reminders.filter((_, i) => i !== index));
  };

  const handleUpdateReminder = (index: number, option: ReminderOption) => {
    const updated = [...reminders];
    updated[index] = { type: option.type, value: option.value };
    setReminders(updated);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toastStore?.error('请输入日程标题');
      return;
    }

    if (!startDate || !startTime || !endTime) {
      toastStore?.error('请选择完整的开始和结束时间');
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${startDate}T${endTime}`);

    if (endDateTime <= startDateTime) {
      toastStore?.error('结束时间必须晚于开始时间');
      return;
    }

    const scheduleData = {
      title: title.trim(),
      description: description.trim() || undefined,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      reminders,
    };

    let success;
    if (editingId) {
      success = await scheduleStore.updateSchedule(editingId, scheduleData);
    } else {
      success = await scheduleStore.addSchedule(scheduleData);
    }

    if (success) {
      toastStore?.success(editingId ? '日程已更新' : '日程已添加');
      scheduleStore.closeAddDialog();
    } else {
      toastStore?.error('操作失败，请重试');
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && scheduleStore.closeAddDialog()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {editingId ? '编辑日程' : '添加日程'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                <X size={18} className="text-gray-500" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入日程标题"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="添加描述（可选）"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Time range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  开始时间 <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  结束时间 <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Reminders */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  提醒
                </label>
                <button
                  type="button"
                  onClick={handleAddReminder}
                  className="flex items-center gap-1 text-xs px-2 py-1 text-primary hover:bg-primary/10 rounded transition-colors"
                >
                  <Plus size={14} />
                  添加
                </button>
              </div>

              {reminders.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-2">点击"添加"设置提醒时间</p>
              ) : (
                <div className="space-y-2">
                  {reminders.map((reminder, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400" />
                      <select
                        value={`${reminder.type}-${reminder.value}`}
                        onChange={(e) => {
                          const [type, value] = e.target.value.split('-');
                          const option = reminderOptions.find(o => o.type === type && o.value === parseInt(value));
                          if (option) handleUpdateReminder(index, option);
                        }}
                        className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {reminderOptions.map(option => (
                          <option key={`${option.type}-${option.value}`} value={`${option.type}-${option.value}`}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveReminder(index)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
            <Dialog.Close asChild>
              <button className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                取消
              </button>
            </Dialog.Close>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm text-white bg-primary hover:bg-primary/90 rounded-md transition-colors"
            >
              {editingId ? '保存' : '添加'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
});
