
import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../store';
import { TodoListSidebar } from './TodoListSidebar';
import { TodoTaskItem } from './TodoTaskItem';
import { Plus, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const TodoPage = observer(() => {
    const { todoStore } = useStore();
    const [newTaskTitle, setNewTaskTitle] = useState('');

    // Auto-focus input when switching lists
    useEffect(() => {
        setNewTaskTitle('');
    }, [todoStore.activeListId]);

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTaskTitle.trim()) {
            todoStore.addTask(newTaskTitle);
            setNewTaskTitle('');
        }
    };

    const handleSelect = (id: string) => {
        todoStore.setActiveList(id);
    }

    const handleAddList = (name: string, icon: string) => {
        todoStore.addList(name, icon);
    }

    const handleDeleteList = (id: string) => {
        todoStore.deleteList(id);
    }

    const handleToggleTask = (id: string) => {
        todoStore.toggleTask(id);
    }

    const handleDeleteTask = (id: string) => {
        todoStore.deleteTask(id);
    }

    const activeList = todoStore.activeList;
    const uncompletedTasks = todoStore.activeUncompletedTasks;
    const completedTasks = todoStore.activeCompletedTasks;

    if (!activeList) return null;

    return (
        <div className="flex h-full bg-white dark:bg-gray-900 overflow-hidden">
            {/* Sidebar */}
            <TodoListSidebar
                lists={todoStore.lists}
                activeListId={todoStore.activeListId}
                onSelect={handleSelect}
                onAdd={handleAddList}
                onDelete={handleDeleteList}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-800">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-end justify-between mb-1">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                            {activeList.name}
                        </h1>
                        <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {format(new Date(), 'M月d日, EEEE', { locale: zhCN })}
                        </span>
                    </div>
                </div>

                {/* Task List */}
                <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
                    {/* Add Task Input */}
                    <form onSubmit={handleAddTask} className="mb-6">
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                <Plus size={20} />
                            </div>
                            <input
                                type="text"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="添加任务..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-transparent focus:bg-white dark:focus:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-gray-100 transition-all placeholder-gray-400 dark:placeholder-gray-500"
                            />
                        </div>
                    </form>

                    {/* Uncompleted Tasks */}
                    <div className="space-y-2 mb-8">
                        {uncompletedTasks.map((task) => (
                            <TodoTaskItem
                                key={task.id}
                                task={task}
                                onToggle={handleToggleTask}
                                onDelete={handleDeleteTask}
                            />
                        ))}
                    </div>

                    {/* Completed Tasks */}
                    {completedTasks.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 px-1 flex items-center gap-2">
                                <CheckSquare size={14} />
                                已完成 ({completedTasks.length})
                            </h3>
                            <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                                {completedTasks.map((task) => (
                                    <TodoTaskItem
                                        key={task.id}
                                        task={task}
                                        onToggle={handleToggleTask}
                                        onDelete={handleDeleteTask}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {todoStore.activeTasks.length === 0 && (
                        <div className="flex flex-col items-center justify-center mt-20 text-gray-400 dark:text-gray-500">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <CheckSquare size={32} className="opacity-50" />
                            </div>
                            <p>还没有任务，添加一个吧！</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
