import type { ThemeMode } from '../types';
import { observer } from 'mobx-react-lite';
import { useStore } from '../store';
import { RefreshCw, Check, AlertCircle, Sun, Moon, Monitor, Palette, Eye, Edit3, Columns, FolderOpen, Calendar, Key, Keyboard as KeyboardIcon, Trash2, MoreHorizontal, HelpCircle } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '../utils/cn';
import { THEME_COLORS } from '../constants/theme';
import { useState } from 'react';
import { KeyboardShortcutDialog } from './KeyboardShortcutDialog';
import { TrashDialog } from './TrashDialog';

interface ToolbarProps {
  onHelpClick?: () => void;
  onScheduleClick?: () => void;
  onPasswordManagerClick?: () => void;
}

export const Toolbar = observer(({ onHelpClick, onScheduleClick, onPasswordManagerClick }: ToolbarProps) => {
  const { gitStore, uiStore, fileStore, scheduleStore, trashStore } = useStore();

  const [isKeyboardShortcutOpen, setIsKeyboardShortcutOpen] = useState(false);
  const [isTrashDialogOpen, setIsTrashDialogOpen] = useState(false);

  const handleSync = () => {
    gitStore.sync();
  };

  const getSyncStatusUI = () => {
    if (gitStore.isSyncing) {
      if (gitStore.syncStep === 'committing') {
        return {
          icon: <RefreshCw size={15} className="animate-spin text-amber-500" />,
          text: `Committing ${gitStore.status.modified}...`,
          className: "text-amber-600 bg-amber-50 dark:bg-amber-900/10"
        };
      }
      return {
        icon: <RefreshCw size={15} className="animate-spin text-primary" />,
        text: 'Pushing...',
        className: "text-primary bg-primary/10"
      };
    }

    if (gitStore.status.status === 'error') {
      return {
        icon: <AlertCircle size={15} className="text-red-500" />,
        text: 'Error',
        className: "text-red-600 bg-red-50 dark:bg-red-900/10 hover:bg-red-100"
      };
    }

    if (gitStore.status.modified > 0) {
      return {
        icon: <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />,
        text: `${gitStore.status.modified}`,
        className: "text-amber-600 bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100"
      };
    }

    if (gitStore.status.ahead > 0) {
      return {
        icon: <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />,
        text: `${gitStore.status.ahead}`,
        className: "text-blue-600 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100"
      };
    }

    return {
      icon: <Check size={15} className="text-emerald-500" />,
      text: 'Synced',
      className: "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
    };
  };

  const statusUI = getSyncStatusUI();



  const handleOpenLogDirectory = async () => {
    const res = await window.electronAPI.openLogDirectory();
    if (!res.success) {
      fileStore.toastStore?.error('无法打开日志目录');
    }
  };

  return (
    <>
      <div className="h-11 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-4 shrink-0 z-10 pl-24">
        {/* Left: Brand */}
        <div className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-200 select-none">
          {fileStore.projectName && (
            <div className="flex items-center gap-2 px-2">
              <span className="text-sm text-gray-400 dark:text-gray-500">/</span>
              <span className="text-sm font-semibold">{fileStore.projectName}</span>
            </div>
          )}
        </div>

        {/* Right: Actions - Reorganized with better grouping */}
        <div className="flex items-center gap-1">

          {/* ===== Group 1: View Mode ===== */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-md p-0.5 mr-1">
            <button
              onClick={() => uiStore.setViewMode('editor')}
              className={cn(
                "p-1.5 rounded-sm transition-all",
                uiStore.viewMode === 'editor'
                  ? "bg-white dark:bg-gray-700 shadow-sm text-primary"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
              title="仅编辑器"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={() => uiStore.setViewMode('split')}
              className={cn(
                "p-1.5 rounded-sm transition-all",
                uiStore.viewMode === 'split'
                  ? "bg-white dark:bg-gray-700 shadow-sm text-primary"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
              title="分屏"
            >
              <Columns size={14} />
            </button>
            <button
              onClick={() => uiStore.setViewMode('preview')}
              className={cn(
                "p-1.5 rounded-sm transition-all",
                uiStore.viewMode === 'preview'
                  ? "bg-white dark:bg-gray-700 shadow-sm text-primary"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
              title="仅预览"
            >
              <Eye size={14} />
            </button>
          </div>

          {/* ===== Group 2: Sync Status ===== */}
          <button
            onClick={handleSync}
            disabled={gitStore.isSyncing}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200 mr-1",
              statusUI.className
            )}
            title={gitStore.status.errorMessage || `最后同步: ${gitStore.status.lastSyncTime ? new Date(gitStore.status.lastSyncTime).toLocaleTimeString() : '从未同步'}`}
          >
            {statusUI.icon}
            <span className="hidden sm:inline">{statusUI.text}</span>
          </button>



          {/* ===== Group 4: More Tools ===== */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors text-gray-500 hover:text-primary mr-0.5"
                title="更多工具"
              >
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[160px] bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 p-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                align="end"
                sideOffset={5}
              >
                <DropdownMenu.Item
                  className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded outline-none"
                  onSelect={() => setIsKeyboardShortcutOpen(true)}
                >
                  <KeyboardIcon size={14} className="mr-2 text-gray-500" />
                  快捷键设置
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded outline-none"
                  onSelect={handleOpenLogDirectory}
                >
                  <FolderOpen size={14} className="mr-2 text-gray-500" />
                  打开日志目录
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* ===== Group 5: Quick Actions ===== */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors text-gray-500 hover:text-primary relative mr-0.5"
                title="快捷功能"
              >
                <Calendar size={16} />
                {(scheduleStore.overdueCount > 0 || (trashStore && trashStore.trashCount > 0)) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[160px] bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 p-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                align="end"
                sideOffset={5}
              >
                <DropdownMenu.Item
                  className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded outline-none"
                  onSelect={onScheduleClick}
                >
                  <Calendar size={14} className="mr-2 text-blue-500" />
                  日程清单
                  {scheduleStore.overdueCount > 0 && (
                    <span className="ml-auto w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded outline-none"
                  onSelect={onPasswordManagerClick}
                >
                  <Key size={14} className="mr-2 text-amber-500" />
                  密码管理器
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded outline-none"
                  onSelect={() => setIsTrashDialogOpen(true)}
                >
                  <Trash2 size={14} className="mr-2 text-gray-500" />
                  回收站
                  {trashStore && trashStore.trashCount > 0 && (
                    <span className="ml-auto w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                <DropdownMenu.Item
                  className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded outline-none"
                  onClick={onHelpClick}
                >
                  <HelpCircle size={14} className="mr-2 text-gray-500" />
                  帮助文档
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* ===== Group 6: Theme ===== */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors flex items-center gap-1"
                style={{ color: 'var(--color-primary)' }}
                title="主题设置"
              >
                <Palette size={16} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="w-52 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-50 animate-in fade-in zoom-in-95 duration-100"
                align="end"
                sideOffset={5}
              >
                {/* Mode Selection */}
                <div className="mb-3">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">模式</div>
                  <div className="flex bg-gray-100 dark:bg-gray-900 rounded-md p-0.5">
                    {[
                      { value: 'light', icon: Sun, label: '浅色' },
                      { value: 'dark', icon: Moon, label: '深色' },
                      { value: 'system', icon: Monitor, label: '自动' },
                    ].map((mode) => (
                      <button
                        key={mode.value}
                        onClick={() => uiStore.setThemeMode(mode.value as ThemeMode)}
                        className={cn(
                          "flex-1 flex items-center justify-center py-1.5 text-xs rounded-sm transition-all",
                          uiStore.themeMode === mode.value
                            ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white font-medium"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        )}
                        title={mode.label}
                      >
                        <mode.icon size={12} />
                      </button>
                    ))}
                  </div>
                </div>

                <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-2" />

                {/* Color Selection */}
                <div className="mb-3">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">主题色</div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {THEME_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => uiStore.setThemeColor(color.value)}
                        className={cn(
                          "w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600 transition-transform hover:scale-110 focus:outline-none",
                          uiStore.themeColor === color.value && "ring-2 ring-offset-2 dark:ring-offset-gray-800 scale-110"
                        )}
                        style={{ backgroundColor: color.value, borderColor: uiStore.themeColor === color.value ? color.value : undefined }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>


                {/* Markdown Theme Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">MD 样式</div>
                  </div>
                  <div className="text-[10px] font-medium text-gray-400 mb-1 mt-2 first:mt-0">基础样式 (跟随主题)</div>
                  <div className="grid grid-cols-4 gap-1 mb-2">
                    {[
                      { value: 'classic', label: '经典' },
                      { value: 'elegant', label: '优雅' },
                      { value: 'minimal', label: '简约' },
                      { value: 'bubble', label: '活泼' },
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => uiStore.setMarkdownTheme(theme.value)}
                        className={cn(
                          "px-2 py-1 text-xs rounded-md transition-colors text-center",
                          uiStore.markdownTheme === theme.value
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium"
                            : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        )}
                      >
                        {theme.label}
                      </button>
                    ))}
                  </div>

                  <div className="text-[10px] font-medium text-gray-400 mb-1">特色主题 (独立样式)</div>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { value: 'github', label: 'GitHub' },
                      { value: 'obsidian', label: '黑曜石' },
                      { value: 'bear', label: '小熊' },
                      { value: 'candy', label: '糖果' },
                      { value: 'macaron', label: '马卡龙' },
                      { value: 'pudding', label: '布丁' },
                      { value: 'cloud', label: '云朵' },
                      { value: 'ruby', label: '红宝石' },
                      { value: 'meadow', label: '草原绿' },
                      { value: 'kraft', label: '锤子便签' },
                      { value: 'geek-black', label: '极客黑' },
                      { value: 'cute-green', label: '萌绿' },
                      { value: 'full-stack-blue', label: '全栈蓝' },
                      { value: 'rose-purple', label: '蔷薇紫' },
                      { value: 'minimal-black', label: '极简黑' },
                      { value: 'purple-night', label: '凝夜紫' },
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => uiStore.setMarkdownTheme(theme.value)}
                        className={cn(
                          "px-2 py-1 text-xs rounded-md transition-colors text-center",
                          uiStore.markdownTheme === theme.value
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium"
                            : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        )}
                      >
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </div>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div >

      {/* Keyboard Shortcut Dialog */}
      < KeyboardShortcutDialog
        isOpen={isKeyboardShortcutOpen}
        onClose={() => setIsKeyboardShortcutOpen(false)}
      />

      {/* Trash Dialog */}
      <TrashDialog
        isOpen={isTrashDialogOpen}
        onClose={() => setIsTrashDialogOpen(false)}
      />
    </>
  );
});
