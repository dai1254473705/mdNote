import React, { useEffect, useState } from 'react';
import { X, BookOpen, Network, Keyboard, Loader2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { observer } from 'mobx-react-lite';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HelpItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  filePath: string;
}

const helpDocs: HelpItem[] = [
  {
    title: 'Mermaid 图表语法',
    description: '学习如何创建流程图、时序图、思维导图等各种图表',
    icon: <Network size={24} />,
    category: '图表',
    filePath: '01-Mermaid图表语法指南.md'
  },
  {
    title: 'Markdown 语法',
    description: '掌握 Markdown 基础语法，写出漂亮的笔记',
    icon: <BookOpen size={24} />,
    category: '写作',
    filePath: '02-Markdown语法完全指南.md'
  },
  {
    title: '快捷键指南',
    description: '查看所有快捷键，提升你的笔记效率',
    icon: <Keyboard size={24} />,
    category: '效率',
    filePath: '03-快捷键完全指南.md'
  }
];

export const HelpDialog = observer(({ isOpen, onClose }: HelpDialogProps) => {
  const [selectedDoc, setSelectedDoc] = useState<HelpItem | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && !selectedDoc) {
      setSelectedDoc(helpDocs[0]);
    }
  }, [isOpen, selectedDoc]);

  useEffect(() => {
    if (selectedDoc && isOpen) {
      loadDocContent(selectedDoc.filePath);
    }
  }, [selectedDoc, isOpen]);

  const loadDocContent = async (filePath: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await window.electronAPI.readHelpDoc(filePath);
      if (result.success && result.data) {
        setContent(result.data);
      } else {
        setError(result.error || '无法加载文档内容');
      }
    } catch (err) {
      console.error('Failed to load help doc:', err);
      setError('加载文档失败');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedDoc) return null;

  // Inner component to handle async markdown rendering
  const MarkdownContent = ({ markdown, className }: { markdown: string; className?: string }) => {
    const [html, setHtml] = useState('');

    useEffect(() => {
      const render = async () => {
        const rendered = await marked(markdown);
        setHtml(DOMPurify.sanitize(rendered));
      };
      render();
    }, [markdown]);

    return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 w-full max-w-6xl h-[85vh] animate-in zoom-in-95 duration-200 flex overflow-hidden">
          {/* Left Sidebar - Doc List */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <BookOpen size={20} />
                帮助文档
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                  onClick={onClose}
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </Dialog.Close>
            </div>

            <div className="space-y-2">
              {helpDocs.map((doc) => (
                <button
                  key={doc.title}
                  onClick={() => setSelectedDoc(doc)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedDoc.title === doc.title
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${selectedDoc.title === doc.title ? 'text-white' : 'text-primary'}`}>
                      {doc.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${selectedDoc.title === doc.title ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                        {doc.title}
                      </div>
                      <div className={`text-xs mt-1 ${selectedDoc.title === doc.title ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                        {doc.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                💡 <strong>提示：</strong>按 <kbd className="px-1 py-0.5 bg-white dark:bg-gray-700 rounded">⌘ + H</kbd> 随时打开帮助文档
              </p>
            </div>
          </div>

          {/* Right Content - Doc Detail */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                  {selectedDoc.category}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {selectedDoc.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {selectedDoc.description}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-800">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">加载中...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
                    <button
                      onClick={() => loadDocContent(selectedDoc.filePath)}
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                    >
                      重试
                    </button>
                  </div>
                </div>
              ) : (
                <MarkdownContent
                  markdown={content}
                  className="prose prose-sm dark:prose-invert max-w-none
                    prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-gray-100
                    prose-h1:text-3xl prose-h1:mt-6 prose-h1:mb-4
                    prose-h2:text-2xl prose-h2:mt-5 prose-h2:mb-3
                    prose-h3:text-xl prose-h3:mt-4 prose-h3:mb-2
                    prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:my-2
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-gray-900 dark:prose-strong:text-gray-100
                    prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm
                    prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950
                    prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic
                    prose-table:text-sm prose-table:my-4
                    prose-th:bg-gray-100 dark:prose-th:bg-gray-700 prose-th:font-semibold
                    prose-td:border prose-td:border-gray-200 dark:prose-td:border-gray-700 prose-td:px-3 prose-td:py-2
                    prose-th:border prose-th:border-gray-200 dark:prose-th:border-gray-700 prose-th:px-3 prose-th:py-2
                    prose-ul:my-2 prose-li:marker:text-primary
                    prose-ol:my-2
                  "
                />
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
});
