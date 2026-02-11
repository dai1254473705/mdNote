import { useState, useEffect } from 'react';
import { X, Settings2, Clock, Check } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { observer } from 'mobx-react-lite';
import { useStore } from '../store';

interface GitSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const GitSettingsDialog = observer(({ open, onOpenChange }: GitSettingsDialogProps) => {
    const { gitStore } = useStore();
    const [enabled, setEnabled] = useState(false);
    const [interval, setInterval] = useState(30);

    // Sync local state with store when opening
    useEffect(() => {
        if (open) {
            setEnabled(gitStore.autoSyncConfig.enabled);
            setInterval(gitStore.autoSyncConfig.interval);
        }
    }, [open, gitStore.autoSyncConfig]);

    const handleSave = () => {
        gitStore.updateAutoSyncConfig(enabled, interval);
        onOpenChange(false);
    };

    const intervals = [
        { value: 2, label: '2 分钟' },
        { value: 5, label: '5 分钟' },
        { value: 10, label: '10 分钟' },
        { value: 30, label: '30 分钟' },
        { value: 60, label: '1 小时' },
        { value: 120, label: '2 小时' },
        { value: 1440, label: '1 天' },
    ];

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200" />
                <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 w-full max-w-md animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <Settings2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                Git 同步设置
                            </Dialog.Title>
                        </div>
                        <Dialog.Close asChild>
                            <button
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                                onClick={() => onOpenChange(false)}
                            >
                                <X size={18} className="text-gray-500" />
                            </button>
                        </Dialog.Close>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">

                        {/* Toggle Switch */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <label htmlFor="auto-sync" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    自动推送
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    定时自动提交并推送到远程仓库
                                </p>
                            </div>
                            <button
                                id="auto-sync"
                                onClick={() => setEnabled(!enabled)}
                                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                  ${enabled ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}
                `}
                            >
                                <span
                                    className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${enabled ? 'translate-x-6' : 'translate-x-1'}
                  `}
                                />
                            </button>
                        </div>

                        {/* Interval Select */}
                        {enabled && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <Clock size={16} />
                                    推送间隔
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {intervals.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setInterval(opt.value)}
                                            className={`
                        px-3 py-2 text-sm rounded-md border flex items-center justify-between transition-all
                        ${interval === opt.value
                                                    ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                }
                      `}
                                        >
                                            {opt.label}
                                            {interval === opt.value && <Check size={14} className="text-primary" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 rounded-b-lg">
                        <button
                            onClick={() => onOpenChange(false)}
                            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 text-sm bg-primary hover:bg-primary/90 text-white rounded-md transition-colors font-medium"
                        >
                            保存设置
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
});
