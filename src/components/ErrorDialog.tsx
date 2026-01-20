import { X, Copy, Check, AlertCircle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';

interface ErrorDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string;
  onClose: () => void;
}

export const ErrorDialog = ({ isOpen, title, message, details, onClose }: ErrorDialogProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const fullText = details ? `${message}\n\n${details}` : message;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 w-full max-w-3xl max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                onClick={onClose}
              >
                <X size={20} className="text-gray-500" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Error Message */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">错误信息</h3>
              <p className="text-gray-900 dark:text-gray-100 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3 rounded">
                {message}
              </p>
            </div>

            {/* Error Details */}
            {details && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">详细日志</h3>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check size={12} className="text-green-600" />
                        <span>已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>复制</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                  {details}
                </pre>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              关闭
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

// Hook to manage error dialog state
export const useErrorDialog = () => {
  const [errorState, setErrorState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    details: '',
  });

  const showError = (title: string, message: string, details?: string) => {
    setErrorState({
      isOpen: true,
      title,
      message,
      details,
    });
  };

  const closeError = () => {
    setErrorState((prev) => ({ ...prev, isOpen: false }));
  };

  return {
    errorState,
    showError,
    closeError,
  };
};
