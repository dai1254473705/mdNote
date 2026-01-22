import { X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: '⌘ + N', description: '新建笔记', category: '文件' },
  { key: '⌘ + S', description: '保存笔记', category: '文件' },
  { key: '⌘ + W', description: '关闭当前标签', category: '标签' },
  { key: '⌘ + Tab', description: '切换到下一个标签', category: '标签' },
  { key: '⌘ + Shift + Tab', description: '切换到上一个标签', category: '标签' },
  { key: '⌘ + E', description: '导出笔记', category: '文件' },
  { key: '⌘ + /', description: '显示/隐藏快捷键帮助', category: '帮助' },
  { key: '⌘ + B', description: '切换侧边栏', category: '视图' },
  { key: '⌘ + Shift + I', description: '打开开发者工具', category: '开发' },
];

export const KeyboardShortcuts = ({ isOpen, onClose }: KeyboardShortcutsProps) => {
  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 w-full max-w-lg animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              键盘快捷键
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                onClick={onClose}
              >
                <X size={20} className="text-gray-500" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {categories.map(category => (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts
                    .filter(s => s.category === category)
                    .map(shortcut => (
                      <div
                        key={shortcut.key}
                        className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <span className="text-gray-700 dark:text-gray-300">{shortcut.description}</span>
                        <kbd className="px-2 py-1 text-sm font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-600">
                          {shortcut.key}
                        </kbd>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              提示：所有快捷键均可在编辑器中使用
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
