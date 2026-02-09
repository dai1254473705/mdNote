import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';
import { Trash2, RotateCcw, Clock, FileText, Folder, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export const TrashPage = observer(() => {
    const { trashStore, fileStore, toastStore } = useStore();
    const [isRestoring, setIsRestoring] = useState<string | null>(null);
    const [showConfirmEmpty, setShowConfirmEmpty] = useState(false);

    const trashItemsByDate = trashStore.getTrashItemsByDate();

    const handleRestore = async (itemId: string) => {
        setIsRestoring(itemId);
        try {
            const writeFile = async (path: string, content: string): Promise<boolean> => {
                const result = await window.electronAPI.saveFile(path, content);
                return result.success || false;
            };

            const success = await trashStore.restoreFromTrash(itemId, writeFile);
            if (success) {
                toastStore?.success('文件已恢复');
                await fileStore.loadFileTree(); // Refresh file tree
            } else {
                toastStore?.error('恢复文件失败');
            }
        } catch (error) {
            console.error('Restore error:', error);
            toastStore?.error('恢复文件时出错');
        } finally {
            setIsRestoring(null);
        }
    };

    const handlePermanentDelete = (itemId: string) => {
        if (confirm('确定要永久删除此文件吗？此操作无法撤销。')) {
            trashStore.permanentlyDelete(itemId);
            toastStore?.success('文件已永久删除');
        }
    };

    const handleEmptyTrash = () => {
        trashStore.emptyTrash();
        toastStore?.success('回收站已清空');
        setShowConfirmEmpty(false);
    };

    const getRelativePath = (fullPath: string): string => {
        if (!fileStore.rootPath) return fullPath;
        return fullPath.replace(fileStore.rootPath, '').replace(/^\//, '');
    };

    const formatDate = (timestamp: number): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays < 7) {
            return `${diffDays}天前`;
        } else {
            return date.toLocaleDateString('zh-CN');
        }
    };

    const isExpired = (deletedAt: number): boolean => {
        const now = Date.now();
        const maxAge = trashStore.autoCleanupDays * 24 * 60 * 60 * 1000;
        return now - deletedAt > maxAge;
    };

    const allTrashItems = trashStore.getAllTrashItems();
    const expiredCount = allTrashItems.filter(item => isExpired(item.deletedAt)).length;

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <Trash2 size={20} className="text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            回收站
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {allTrashItems.length} 个项目 · {trashStore.formattedTrashSize}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {allTrashItems.length > 0 && (
                        <button
                            onClick={() => setShowConfirmEmpty(true)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        >
                            <Trash2 size={16} />
                            清空回收站
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 bg-gray-50 dark:bg-gray-900/50">
                {allTrashItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                            <Trash2 size={40} className="text-gray-300" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">回收站为空</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                            删除的文件会显示在这里，{trashStore.autoCleanupDays}天后自动清除
                        </p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto">
                        {/* Expired items warning */}
                        {expiredCount > 0 && (
                            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
                                <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-medium text-amber-900 dark:text-amber-300 mb-1">即将过期的项目</h4>
                                    <p className="text-sm text-amber-800 dark:text-amber-400/80">
                                        {expiredCount} 个项目即将过期，将在清除时永久删除。建议尽快检查是否需要恢复。
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Trash items by date */}
                        {Array.from(trashItemsByDate.entries()).map(([date, items]) => (
                            <div key={date} className="mb-8">
                                <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 sticky top-0 bg-gray-50 dark:bg-gray-900/50 backdrop-blur-sm py-2 z-10">
                                    {date}
                                </div>
                                <div className="space-y-3">
                                    {items.map((item) => {
                                        const expired = isExpired(item.deletedAt);
                                        const restoring = isRestoring === item.id;

                                        return (
                                            <div
                                                key={item.id}
                                                className={`p-4 rounded-xl border transition-all hover:shadow-md ${expired
                                                        ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50'
                                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary/30'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    {/* Icon */}
                                                    <div className={`p-3 rounded-lg shrink-0 ${item.type === 'directory'
                                                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                                            : 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400'
                                                        }`}>
                                                        {item.type === 'directory' ? <Folder size={20} /> : <FileText size={20} />}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0 pt-1">
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <span className="font-medium text-gray-900 dark:text-gray-100 truncate text-base">
                                                                {item.name}
                                                            </span>
                                                            {expired && (
                                                                <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-full">
                                                                    即将过期
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                                <Clock size={12} />
                                                                <span>删除于: {formatDate(item.deletedAt)}</span>
                                                            </div>
                                                            <span className="text-gray-300 dark:text-gray-600">|</span>
                                                            <div className="flex items-center gap-1.5" title={item.originalPath}>
                                                                <Folder size={12} />
                                                                <span className="truncate max-w-[200px]">{getRelativePath(item.originalPath)}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2 shrink-0 self-center">
                                                        <button
                                                            onClick={() => handleRestore(item.id)}
                                                            disabled={restoring}
                                                            className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-50 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800"
                                                            title="恢复"
                                                        >
                                                            {restoring ? (
                                                                <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                                            ) : (
                                                                <RotateCcw size={20} />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handlePermanentDelete(item.id)}
                                                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800"
                                                            title="永久删除"
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Directory children preview */}
                                                {item.type === 'directory' && item.children && item.children.length > 0 && (
                                                    <div className="ml-[52px] mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                                                        <p className="text-xs font-medium text-gray-500 mb-2">包含内容 ({item.children.length})</p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {item.children.slice(0, 4).map((child) => (
                                                                <div key={child.id} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-2 py-1.5 rounded">
                                                                    {child.type === 'directory' ? <Folder size={12} /> : <FileText size={12} />}
                                                                    <span className="truncate">{child.name}</span>
                                                                </div>
                                                            ))}
                                                            {item.children.length > 4 && (
                                                                <div className="text-xs text-gray-400 px-2 py-1.5">
                                                                    +{item.children.length - 4} 更多...
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Empty Trash Confirmation Dialog */}
            {showConfirmEmpty && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">清空回收站？</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                            确定要永久删除回收站中的所有文件吗？<br />一旦执行，此操作将<b>无法撤销</b>。
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirmEmpty(false)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors font-medium"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleEmptyTrash}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium shadow-sm"
                            >
                                确认清空
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});
