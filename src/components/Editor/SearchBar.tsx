/*
 * @Author: daiyunzhou daiyunz@chanjet.com
 * @Date: 2026-02-03 18:52:12
 * @LastEditors: daiyunzhou daiyunz@chanjet.com
 * @LastEditTime: 2026-02-03 19:08:48
 * @FilePath: /zhixia-note/src/components/Editor/SearchBar.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';

interface SearchBarProps {
    show: boolean;
    onClose: () => void;
    onSearch: (query: string) => void;
    onNext: () => void;
    onPrev: () => void;
    current: number;
    total: number;
}

export interface SearchBarRef {
    focus: () => void;
}

export const SearchBar = forwardRef<SearchBarRef, SearchBarProps>(({ show, onClose, onSearch, onNext, onPrev, current, total }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        focus: () => {
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.select();
            }
        }
    }));

    useEffect(() => {
        if (show && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [show]);

    if (!show) return null;

    return (
        <div className="absolute top-4 right-8 z-50 flex items-center bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 p-1 animate-in slide-in-from-top-2 fade-in duration-200">
            <input
                ref={inputRef}
                type="text"
                className="w-48 px-2 py-1 text-sm bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                placeholder="Find..."
                onChange={(e) => onSearch(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        if (e.shiftKey) onPrev();
                        else onNext();
                    }
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        onClose();
                    }
                }}
            />
            <div className="flex items-center text-xs text-gray-500 border-l border-gray-200 dark:border-gray-700 mx-1 pl-2">
                {total > 0 ? `${current} of ${total}` : total === 0 ? 'No results' : ''}
            </div>
            <div className="flex items-center border-l border-gray-200 dark:border-gray-700 pl-1 ml-1 space-x-0.5">
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500" onClick={onPrev} title="Previous (Shift+Enter)">
                    <ChevronUp size={16} />
                </button>
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500" onClick={onNext} title="Next (Enter)">
                    <ChevronDown size={16} />
                </button>
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500" onClick={onClose} title="Close (Esc)">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
});

SearchBar.displayName = 'SearchBar';
