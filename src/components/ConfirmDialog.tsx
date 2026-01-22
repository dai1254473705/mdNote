import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'warning' | 'danger' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = '确定',
  cancelLabel = '取消',
  type = 'warning',
  onConfirm,
  onCancel
}: ConfirmDialogProps) => {
  const getIconColor = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      case 'info':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      default:
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onCancel}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 w-full max-w-md animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${getIconColor()}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                onClick={onCancel}
              >
                <X size={18} className="text-gray-500" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-700 dark:text-gray-300">
              {message}
            </p>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 rounded-b-lg">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-md transition-colors ${
                type === 'danger'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-primary hover:bg-primary/90 text-white'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

// Hook to manage confirm dialog
export const useConfirmDialog = () => {
  const [dialogState, setDialogState] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'warning' | 'danger' | 'info';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: '确定',
    cancelLabel: '取消',
    type: 'warning'
  });

  const confirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      confirmLabel?: string;
      cancelLabel?: string;
      type?: 'warning' | 'danger' | 'info';
    }
  ) => {
    return new Promise<boolean>((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        confirmLabel: options?.confirmLabel,
        cancelLabel: options?.cancelLabel,
        type: options?.type,
        onConfirm: () => {
          onConfirm();
          resolve(true);
          setDialogState(prev => ({ ...prev, isOpen: false }));
        }
      });
    });
  };

  const closeConfirm = () => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  };

  return {
    dialogState,
    confirm,
    closeConfirm
  };
};
