
import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Plus, Sun, Briefcase, ShoppingBag, List, Trash2, FolderOpen } from 'lucide-react';
import { useStore } from '../../store';
import type { TodoList } from '../../types';

interface TodoListSidebarProps {
    lists: TodoList[];
    activeListId: string;
    onSelect: (id: string) => void;
    onAdd: (name: string, icon: string) => void;
    onDelete: (id: string) => void;
}

const ICONS: Record<string, React.ReactNode> = {
    Sun: <Sun size={18} />,
    Briefcase: <Briefcase size={18} />,
    ShoppingBag: <ShoppingBag size={18} />,
    List: <List size={18} />,
};

export const TodoListSidebar = observer(({ lists, activeListId, onSelect, onAdd, onDelete }: TodoListSidebarProps) => {
    const { todoStore } = useStore();
    const [isAdding, setIsAdding] = useState(false);
    const [newListName, setNewListName] = useState('');

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newListName.trim()) {
            onAdd(newListName, 'List');
            setNewListName('');
            setIsAdding(false);
        }
    };

    return (
        <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
            <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 px-2">清单</h2>

                <div className="space-y-1">
                    {lists.map((list) => (
                        <div
                            key={list.id}
                            className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeListId === list.id
                                ? 'bg-primary/10 text-primary'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                                }`}
                            onClick={() => onSelect(list.id)}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <span className={activeListId === list.id ? 'text-primary' : 'text-gray-500'}>
                                    {ICONS[list.icon] || <List size={18} />}
                                </span>
                                <span className="truncate font-medium">{list.name}</span>
                            </div>

                            {!list.isDefault && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(list.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                                    title="删除清单"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-4 mt-auto border-t border-gray-200 dark:border-gray-700">
                {isAdding ? (
                    <form onSubmit={handleAddSubmit} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            placeholder="清单名称..."
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            autoFocus
                            onBlur={() => {
                                // Delay to allow form submission if clicking enter
                                setTimeout(() => {
                                    if (!newListName.trim()) setIsAdding(false);
                                }, 200)
                            }}
                        />
                    </form>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsAdding(true)}
                            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors flex-1 px-2 py-1"
                        >
                            <Plus size={18} />
                            <span className="font-medium">新建清单</span>
                        </button>
                        <button
                            onClick={() => {
                                todoStore.openDataFolder();
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                            title="打开数据文件夹"
                        >
                            <FolderOpen size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});
