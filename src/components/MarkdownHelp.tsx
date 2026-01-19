import React from 'react';
import { X } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';

interface MarkdownHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const helpItems = [
  { label: 'Headers', syntax: '# H1\n## H2\n### H3' },
  { label: 'Bold', syntax: '**Bold**' },
  { label: 'Italic', syntax: '*Italic*' },
  { label: 'Strikethrough', syntax: '~~Strike~~' },
  { label: 'Blockquote', syntax: '> Quote' },
  { label: 'List (Unordered)', syntax: '- Item 1\n- Item 2' },
  { label: 'List (Ordered)', syntax: '1. First\n2. Second' },
  { label: 'Code (Inline)', syntax: '`code`' },
  { label: 'Code (Block)', syntax: '```js\nconsole.log("Hello");\n```' },
  { label: 'Link', syntax: '[Link Text](url)' },
  { label: 'Image', syntax: '![Alt Text](url)' },
  { label: 'Table', syntax: '| Header | Header |\n| --- | --- |\n| Cell | Cell |' },
  { label: 'Horizontal Rule', syntax: '---' },
];

export const MarkdownHelp: React.FC<MarkdownHelpProps> = ({ isOpen, onClose }) => {
  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                  >
                    Markdown Syntax Guide
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mt-2 max-h-[60vh] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {helpItems.map((item, index) => (
                        <tr key={index}>
                          <td className="py-2 pr-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {item.label}
                          </td>
                          <td className="py-2 text-sm text-gray-500 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-900/50 rounded px-2 whitespace-pre-wrap">
                            {item.syntax}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
