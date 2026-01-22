import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';
import { X, Plus, Trash2, Droplet, RotateCcw, Clock, Settings } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';

export const DrinkReminderDialog = observer(() => {
  const { drinkReminderStore, toastStore } = useStore();
  const { isOpen } = drinkReminderStore.settingsDialog;

  // Local state for editing messages
  const [messages, setMessages] = useState<string[]>([...drinkReminderStore.config.messages]);
  const [newMessage, setNewMessage] = useState('');

  // Local state for time settings
  const [startHour, setStartHour] = useState(drinkReminderStore.config.startHour);
  const [endHour, setEndHour] = useState(drinkReminderStore.config.endHour);
  const [intervalMinutes, setIntervalMinutes] = useState(drinkReminderStore.config.intervalMinutes);

  // Reset local state when dialog opens
  useState(() => {
    if (isOpen) {
      setMessages([...drinkReminderStore.config.messages]);
      setStartHour(drinkReminderStore.config.startHour);
      setEndHour(drinkReminderStore.config.endHour);
      setIntervalMinutes(drinkReminderStore.config.intervalMinutes);
    }
  });

  const handleAddMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, newMessage.trim()]);
      setNewMessage('');
    }
  };

  const handleRemoveMessage = (index: number) => {
    setMessages(messages.filter((_, i) => i !== index));
  };

  const handleSaveMessages = async () => {
    const success = await drinkReminderStore.updateMessages(messages);
    if (success) {
      toastStore?.success('提醒文案已更新');
    } else {
      toastStore?.error('更新失败，请重试');
    }
  };

  const handleResetMessages = async () => {
    const success = await drinkReminderStore.resetMessages();
    if (success) {
      setMessages([...drinkReminderStore.config.messages]);
      toastStore?.success('已恢复默认文案');
    }
  };

  const handleSaveTimeSettings = async () => {
    // Validate
    if (startHour >= endHour) {
      toastStore?.error('开始时间必须早于结束时间');
      return;
    }

    if (intervalMinutes < 1 || intervalMinutes > 60) {
      toastStore?.error('提醒间隔必须在 1-60 分钟之间');
      return;
    }

    const success = await drinkReminderStore.updateConfig({
      startHour,
      endHour,
      intervalMinutes,
    });

    if (success) {
      toastStore?.success('时间设置已更新');
    } else {
      toastStore?.error('更新失败，请重试');
    }
  };

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && drinkReminderStore.closeSettings()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-in zoom-in-95 duration-200 max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Droplet className="text-blue-500" size={20} />
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                饮水提醒设置
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                <X size={18} className="text-gray-500" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Droplet size={16} className="text-blue-500" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  当前状态
                </span>
              </div>
              <span className="text-sm text-blue-600 dark:text-blue-400">
                {drinkReminderStore.statusText}
              </span>
            </div>

            {/* Time Settings */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  时间设置
                </h3>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      开始时间
                    </label>
                    <select
                      value={startHour}
                      onChange={(e) => setStartHour(parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 6).map(h => (
                        <option key={h} value={h}>{formatHour(h)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      结束时间
                    </label>
                    <select
                      value={endHour}
                      onChange={(e) => setEndHour(parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 12).map(h => (
                        <option key={h} value={h}>{formatHour(h)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    提醒间隔（分钟）
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="60"
                      step="1"
                      value={intervalMinutes}
                      onChange={(e) => setIntervalMinutes(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-16 text-center">
                      {intervalMinutes}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    {[15, 30, 60, 120].map(minutes => (
                      <button
                        key={minutes}
                        onClick={() => setIntervalMinutes(minutes)}
                        className={`text-xs px-2 py-1 rounded ${
                          intervalMinutes === minutes
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {minutes}分钟
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSaveTimeSettings}
                  className="w-full py-2 text-sm bg-primary hover:bg-primary/90 text-white rounded-md transition-colors"
                >
                  保存时间设置
                </button>
              </div>
            </div>

            {/* Message Settings */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Settings size={16} className="text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    提醒文案 ({messages.length}条)
                  </h3>
                </div>
                <button
                  onClick={handleResetMessages}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <RotateCcw size={12} />
                  恢复默认
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {messages.map((message, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md group">
                    <span className="text-xs text-gray-400 mt-1">{index + 1}.</span>
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                      {message}
                    </span>
                    <button
                      onClick={() => handleRemoveMessage(index)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                    >
                      <Trash2 size={12} className="text-red-500" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMessage()}
                  placeholder="添加自定义提醒文案..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleAddMessage}
                  className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                >
                  <Plus size={16} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <button
                onClick={handleSaveMessages}
                className="w-full py-2 text-sm bg-primary hover:bg-primary/90 text-white rounded-md transition-colors"
              >
                保存文案
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Dialog.Close asChild>
              <button className="w-full py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                关闭
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
});
