import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { FileCode, FileText, Copy, X } from 'lucide-react';
import { useStore } from '../../store';
import { marked, Renderer } from 'marked';
import { cn } from '../../utils/cn';

interface PreviewFloatingToolsProps {
    previewRef: React.RefObject<HTMLDivElement>;
}

export const PreviewFloatingTools = observer(({ previewRef }: PreviewFloatingToolsProps) => {
    const { fileStore, uiStore } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    const handleCopy = () => {
        if (!previewRef.current) return;

        const selection = window.getSelection();
        if (!selection) return;

        try {
            // Select the preview content
            const range = document.createRange();
            // Use the first child of the ref, which is the actual content div
            // Or just the ref itself if it contains the content directly
            // previewRef points to the scrolling container in Editor/index.tsx, 
            // but Preview component renders the content. 
            // Wait, in Editor/index.tsx: 
            // <div ref={previewRef} ...> <Preview ... /> </div>
            // So previewRef is the wrapper. The content is inside. 
            // We should target the specific Markdown container.
            const contentElement = previewRef.current.querySelector('.markdown-theme-container') || previewRef.current;

            range.selectNodeContents(contentElement);
            selection.removeAllRanges();
            selection.addRange(range);

            // Execute copy
            const success = document.execCommand('copy');

            // Clear selection
            selection.removeAllRanges();

            if (success) {
                fileStore.toastStore?.success('已复制预览内容');
            } else {
                fileStore.toastStore?.error('复制失败');
            }
        } catch (error) {
            console.error('Copy error:', error);
            fileStore.toastStore?.error('复制出错');
        }
        setIsOpen(false);
    };

    const handleExport = async (type: 'html' | 'pdf') => {
        if (!fileStore.currentFile || !fileStore.currentContent) return;

        setIsExporting(true);
        try {
            const renderer = new Renderer();

            renderer.image = ({ href, title, text }: { href: string; title?: string | null; text: string }) => {
                if (!href) return text;

                let src = href;
                let style = '';

                try {
                    const urlObj = new URL(href, 'http://dummy');
                    const width = urlObj.searchParams.get('w');
                    const height = urlObj.searchParams.get('h');

                    if (width) style += `width: ${width};`;
                    if (height) style += `height: ${height};`;
                } catch {
                    // Ignore parsing errors
                }

                if (!href.startsWith('http') && !href.startsWith('data:') && !href.startsWith('media:')) {
                    if (fileStore.currentFile) {
                        const currentFilePath = fileStore.currentFile.path;
                        const lastSlashIndex = currentFilePath.lastIndexOf('/');
                        if (lastSlashIndex !== -1) {
                            const currentDir = currentFilePath.substring(0, lastSlashIndex);
                            const absolutePath = `${currentDir}/${href}`;
                            src = `media://local${absolutePath}`;
                        }
                    }
                }

                return `<img src="${src}" alt="${text}" title="${title || ''}" style="${style}" />`;
            };

            const htmlBody = await marked.parse(fileStore.currentContent, { renderer });

            // CSS Extraction Logic
            let themeCss = '';
            try {
                for (const sheet of Array.from(document.styleSheets)) {
                    try {
                        const rules = sheet.cssRules;
                        for (const rule of Array.from(rules)) {
                            // Extract base markdown container rules and specific theme rules
                            if (rule.cssText.includes('.markdown-theme-container') || rule.cssText.includes('.md-style-')) {
                                themeCss += rule.cssText + '\n';
                            }
                            if (rule.type === CSSRule.IMPORT_RULE || rule.type === CSSRule.FONT_FACE_RULE) {
                                themeCss += rule.cssText + '\n';
                            }
                        }
                    } catch (e) {
                        console.warn('Could not read rules from stylesheet', sheet.href, e);
                    }
                }
            } catch (e) {
                console.error('Failed to extract theme CSS:', e);
            }

            const themeClass = (!uiStore.markdownTheme || uiStore.markdownTheme === 'default')
                ? 'prose max-w-none p-6 md:p-10 lg:p-12'
                : `markdown-theme-container md-style-${uiStore.markdownTheme} p-6 md:p-10 lg:p-12`;

            const fullHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${fileStore.currentFile.name}</title>
<style>
  /* Base Reset & Layout */
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    margin: 0;
    padding: 0;
    line-height: 1.6;
    color: #24292f;
    background-color: #ffffff;
  }
  
  /* Container Wrapper */
  .export-container {
    max-width: 100%;
    margin: 0 auto;
    padding: 2em;
  }

  /* Default basic styles */
  table { border-collapse: collapse; width: 100%; }
  img { max-width: 100%; }
  
  /* Extracted Theme CSS */
  ${themeCss}
</style>
</head>
<body>
  <div class="export-container">
    <div class="${themeClass}">
      ${htmlBody}
    </div>
  </div>
</body>
</html>`;




            let res;
            if (type === 'html') {
                res = await window.electronAPI.exportHtml(fullHtml, fileStore.currentFile.name.replace('.md', '.html'));
            } else {
                res = await window.electronAPI.exportPdf(fullHtml, fileStore.currentFile.name.replace('.md', '.pdf'));
            }

            if (res.success) {
                fileStore.toastStore?.success(`已导出 ${fileStore.currentFile.name.replace('.md', type === 'html' ? '.html' : '.pdf')}`);
            } else if (res.error !== 'Canceled') {
                fileStore.toastStore?.error(`导出失败: ${res.error}`);
            }
        } catch (error) {
            console.error('Export error:', error);
            fileStore.toastStore?.error(`导出错误: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsExporting(false);
            setIsOpen(false);
        }
    };

    return (
        <div className="absolute bottom-8 right-8 flex flex-col items-end gap-3 z-50">
            {/* Options Menu */}
            <div
                className={cn(
                    "flex flex-col items-end gap-3 transition-all duration-300 origin-bottom-right",
                    isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-4 pointer-events-none"
                )}
            >
                <button
                    onClick={() => handleExport('pdf')}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition transform hover:scale-105 active:scale-95 border border-gray-100 dark:border-gray-700/50"
                >
                    <span className="text-sm font-medium">导出 PDF</span>
                    <FileText size={18} className="text-red-500" />
                </button>

                <button
                    onClick={() => handleExport('html')}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition transform hover:scale-105 active:scale-95 border border-gray-100 dark:border-gray-700/50"
                >
                    <span className="text-sm font-medium">导出 HTML</span>
                    <FileCode size={18} className="text-blue-500" />
                </button>

                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition transform hover:scale-105 active:scale-95 border border-gray-100 dark:border-gray-700/50"
                >
                    <span className="text-sm font-medium">复制内容</span>
                    <Copy size={18} className="text-emerald-500" />
                </button>
            </div>

            {/* Main Trigger Button */}
            <button
                onClick={toggleMenu}
                className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-300 transform hover:scale-110 active:scale-95 focus:outline-none",
                    isOpen
                        ? "bg-gray-200 dark:bg-gray-700 rotate-90 text-gray-600 dark:text-gray-300"
                        : "bg-primary text-white rotate-0"
                )}
                title="工具箱"
            >
                {isOpen ? <X size={24} /> : <div className="text-2xl mb-1">⚡️</div>}
            </button>
        </div>
    );
});
