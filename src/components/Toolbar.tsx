import type { ThemeMode, ViewMode } from '../types';
import { observer } from 'mobx-react-lite';
import { useStore } from '../store';
import { RefreshCw, Check, AlertCircle, Sun, Moon, Monitor, Palette, Cloud, UploadCloud, Eye, Edit3, Columns, HelpCircle, Download, FileCode, FileText } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '../utils/cn';
import { THEME_COLORS } from '../constants/theme';
import { useState } from 'react';
import { MarkdownHelp } from './MarkdownHelp';
import { marked } from 'marked';

export const Toolbar = observer(() => {
  const { gitStore, uiStore, fileStore } = useStore();
  const [showHelp, setShowHelp] = useState(false);

  const handleSync = () => {
    gitStore.sync();
  };

  const getSyncStatusUI = () => {
    if (gitStore.isSyncing) {
      if (gitStore.syncStep === 'committing') {
        return {
          icon: <RefreshCw size={16} className="animate-spin text-amber-500" />,
          text: `Committing ${gitStore.status.modified} files...`,
          className: "text-amber-600 bg-amber-50 dark:bg-amber-900/10"
        };
      }
      return {
        icon: <RefreshCw size={16} className="animate-spin text-primary" />,
        text: 'Pushing to cloud...',
        className: "text-primary bg-primary/10"
      };
    }
    
    if (gitStore.status.status === 'error') {
      return {
        icon: <AlertCircle size={16} className="text-red-500" />,
        text: 'Sync Error',
        className: "text-red-600 bg-red-50 dark:bg-red-900/10 hover:bg-red-100"
      };
    }

    if (gitStore.status.modified > 0) {
      return {
        icon: <Cloud size={16} className="text-amber-500" />,
        text: `${gitStore.status.modified} Unsaved`,
        className: "text-amber-600 bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100"
      };
    }

    if (gitStore.status.ahead > 0) {
      return {
        icon: <UploadCloud size={16} className="text-blue-500" />,
        text: `${gitStore.status.ahead} Ahead`,
        className: "text-blue-600 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100"
      };
    }

    return {
      icon: <Check size={16} className="text-emerald-500" />,
      text: 'Synced',
      className: "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
    };
  };

  const statusUI = getSyncStatusUI();

  const handleExport = async (type: 'html' | 'pdf') => {
    if (!fileStore.currentFile || !fileStore.currentContent) return;
    
    // Generate HTML
    const htmlBody = await marked.parse(fileStore.currentContent);
    
    // Basic Template
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${fileStore.currentFile.name}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; padding: 2em; max-width: 900px; margin: 0 auto; line-height: 1.6; color: #333; }
  h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25; }
  h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
  h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
  p { margin-top: 0; margin-bottom: 16px; }
  code { padding: .2em .4em; margin: 0; font-size: 85%; background-color: rgba(27,31,35,.05); border-radius: 3px; }
  pre { padding: 16px; overflow: auto; font-size: 85%; line-height: 1.45; background-color: #f6f8fa; border-radius: 3px; }
  pre code { background-color: transparent; padding: 0; }
  blockquote { padding: 0 1em; color: #6a737d; border-left: .25em solid #dfe2e5; margin: 0; }
  img { max-width: 100%; box-sizing: content-box; background-color: #fff; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
  table th, table td { padding: 6px 13px; border: 1px solid #dfe2e5; }
  table tr { background-color: #fff; border-top: 1px solid #c6cbd1; }
  table tr:nth-child(2n) { background-color: #f6f8fa; }
</style>
</head>
<body>
${htmlBody}
</body>
</html>`;

    if (type === 'html') {
       await window.electronAPI.exportHtml(fullHtml, fileStore.currentFile.name.replace('.md', '.html'));
    } else {
       await window.electronAPI.exportPdf(fullHtml, fileStore.currentFile.name.replace('.md', '.pdf'));
    }
  };

  return (
    <>
      <div className="h-12 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-4 shrink-0 z-10 pl-24">
         {/* Left: Brand / Breadcrumbs */}
        <div className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-200 select-none">
          {fileStore.projectName && (
            <div className="flex items-center gap-2 px-2">
              <span className="text-sm text-gray-400 dark:text-gray-500">/</span>
              <span className="text-sm font-semibold">{fileStore.projectName}</span>
            </div>
          )}
        </div>

         {/* Right: Actions */}
         <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-md p-0.5 mr-2">
              <button
                onClick={() => uiStore.setViewMode('editor')}
                className={cn(
                  "p-1.5 rounded-sm transition-all",
                  uiStore.viewMode === 'editor' 
                    ? "bg-white dark:bg-gray-700 shadow-sm text-primary" 
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                )}
                title="Editor Only"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={() => uiStore.setViewMode('split')}
                className={cn(
                  "p-1.5 rounded-sm transition-all",
                  uiStore.viewMode === 'split' 
                    ? "bg-white dark:bg-gray-700 shadow-sm text-primary" 
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                )}
                title="Split View"
              >
                <Columns size={16} />
              </button>
              <button
                onClick={() => uiStore.setViewMode('preview')}
                className={cn(
                  "p-1.5 rounded-sm transition-all",
                  uiStore.viewMode === 'preview' 
                    ? "bg-white dark:bg-gray-700 shadow-sm text-primary" 
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                )}
                title="Preview Only"
              >
                <Eye size={16} />
              </button>
            </div>

            {/* Sync Button */}
            <button 
              onClick={handleSync}
              disabled={gitStore.isSyncing}
              className={cn(
                 "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                 statusUI.className
              )}
              title={gitStore.status.errorMessage || `Last synced: ${gitStore.status.lastSyncTime ? new Date(gitStore.status.lastSyncTime).toLocaleTimeString() : 'Never'}`}
            >
               {statusUI.icon}
               <span>{statusUI.text}</span>
            </button>

            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Export Menu */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors text-gray-500 hover:text-primary"
                  title="Export"
                >
                  <Download size={18} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="min-w-[160px] bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 p-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                  align="end"
                  sideOffset={5}
                >
                  <DropdownMenu.Item
                    className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded outline-none"
                    onSelect={() => handleExport('html')}
                  >
                    <FileCode size={14} className="mr-2" /> Export to HTML
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded outline-none"
                    onSelect={() => handleExport('pdf')}
                  >
                    <FileText size={14} className="mr-2" /> Export to PDF
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* Help Button */}
            <button
              onClick={() => setShowHelp(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors text-gray-500 hover:text-primary"
              title="Markdown Syntax Help"
            >
              <HelpCircle size={18} />
            </button>

            {/* Unified Theme Picker */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                 <button 
                   className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors flex items-center gap-2"
                   style={{ color: 'var(--color-primary)' }}
                   title="Theme Settings"
                 >
                   <Palette size={18} />
                   <div className="text-gray-600 dark:text-gray-300">
                      {uiStore.themeMode === 'dark' ? <Moon size={14} /> : uiStore.themeMode === 'light' ? <Sun size={14} /> : <Monitor size={14} />}
                   </div>
                 </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                 <DropdownMenu.Content 
                   className="w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50 animate-in fade-in zoom-in-95 duration-100"
                   align="end"
                   sideOffset={5}
                 >
                   {/* Mode Selection */}
                   <div className="mb-4">
                     <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Mode</div>
                     <div className="flex bg-gray-100 dark:bg-gray-900 rounded-md p-1">
                       {[
                         { value: 'light', icon: Sun, label: 'Light' },
                         { value: 'dark', icon: Moon, label: 'Dark' },
                         { value: 'system', icon: Monitor, label: 'Auto' },
                       ].map((mode) => (
                          <button
                            key={mode.value}
                            onClick={() => uiStore.setThemeMode(mode.value as ThemeMode)}
                            className={cn(
                             "flex-1 flex items-center justify-center gap-2 py-1.5 text-sm rounded-sm transition-all",
                             uiStore.themeMode === mode.value 
                               ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white font-medium" 
                               : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                           )}
                           title={mode.label}
                         >
                           <mode.icon size={14} />
                           <span className="text-xs">{mode.label}</span>
                         </button>
                       ))}
                     </div>
                   </div>

                   <div className="h-px bg-gray-200 dark:bg-gray-700 my-3" />

                   {/* Color Selection */}
                   <div>
                     <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Accent Color</div>
                     <div className="grid grid-cols-6 gap-2">
                       {THEME_COLORS.map((color) => (
                         <button
                           key={color.value}
                           onClick={() => uiStore.setThemeColor(color.value)}
                           className={cn(
                             "w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800",
                             uiStore.themeColor === color.value && "ring-2 ring-offset-2 dark:ring-offset-gray-800 scale-110"
                           )}
                           style={{ backgroundColor: color.value, borderColor: uiStore.themeColor === color.value ? color.value : undefined }}
                           title={color.name}
                         />
                       ))}
                     </div>
                   </div>

                   <div className="h-px bg-gray-200 dark:bg-gray-700 my-3" />

                   {/* Markdown Theme Selection */}
                   <div>
                     <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Layout Style</div>
                     <div className="space-y-1">
                       {[
                         { value: 'default', label: 'Default (Minimal)' },
                         { value: 'classic', label: 'Classic (Border)' },
                         { value: 'bubble', label: 'Bubble (Card)' },
                         { value: 'ribbon', label: 'Ribbon (Solid)' },
                         { value: 'tech', label: 'Tech (Counter)' },
                         { value: 'elegant', label: 'Elegant (Serif)' },
                       ].map((theme) => (
                         <button
                           key={theme.value}
                           onClick={() => uiStore.setMarkdownTheme(theme.value)}
                           className={cn(
                             "w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors",
                             uiStore.markdownTheme === theme.value 
                               ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium" 
                               : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                           )}
                         >
                           <div className="flex items-center justify-between">
                             <span>{theme.label}</span>
                             {uiStore.markdownTheme === theme.value && <Check size={14} className="text-primary" />}
                           </div>
                         </button>
                       ))}
                     </div>
                   </div>
                 </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
         </div>
      </div>
      <MarkdownHelp isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
});
