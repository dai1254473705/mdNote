

import { observer } from 'mobx-react-lite';
import { Check, Trash2 } from 'lucide-react';
import type { TodoTask } from '../../types';

interface TodoTaskItemProps {
    task: TodoTask;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}

export const TodoTaskItem = observer(({ task, onToggle, onDelete }: TodoTaskItemProps) => {
    return (
        <div className="group flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all animate-in fade-in duration-300">
            <button
                onClick={() => onToggle(task.id)}
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.isCompleted
                    ? 'bg-gray-400 border-gray-400 dark:bg-gray-500 dark:border-gray-500'
                    : 'border-primary hover:bg-primary/10'
                    }`}
            >
                {task.isCompleted && <Check size={12} className="text-white" />}
            </button>

            <span
                className={`flex-1 text-sm transition-all ${task.isCompleted
                    ? 'text-gray-400 dark:text-gray-500 line-through'
                    : 'text-gray-900 dark:text-gray-100'
                    }`}
            >
                {task.title}
            </span>

            <button
                onClick={() => onDelete(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
                title="删除任务"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
});
