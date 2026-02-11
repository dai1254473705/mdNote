
import { makeAutoObservable, runInAction, toJS } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import type { TodoData, TodoList, TodoTask } from '../types';

export class TodoStore {
    lists: TodoList[] = [];
    tasks: TodoTask[] = [];
    activeListId: string = 'default';
    isLoading: boolean = false;

    constructor() {
        makeAutoObservable(this);
        this.loadData();
    }

    // Load data from backend
    async loadData() {
        this.isLoading = true;
        try {
            const response = await window.electronAPI.loadTodoData();
            if (response.success && response.data) {
                runInAction(() => {
                    this.lists = response.data!.lists;
                    this.tasks = response.data!.tasks;

                    // Ensure default list exists
                    if (this.lists.length === 0) {
                        this.lists.push({
                            id: 'default',
                            name: '我的一天',
                            icon: 'Sun',
                            isDefault: true
                        });
                    }

                    // Set active list to default if current active list doesn't exist
                    if (!this.lists.find(l => l.id === this.activeListId)) {
                        this.activeListId = this.lists[0].id;
                    }
                });
            }
        } catch (error) {
            console.error('Failed to load todo data:', error);
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    // Save data to backend
    async saveData() {
        const data: TodoData = {
            lists: toJS(this.lists),
            tasks: toJS(this.tasks)
        };
        try {
            await window.electronAPI.saveTodoData(data);
        } catch (error) {
            console.error('Failed to save todo data:', error);
        }
    }

    // Open data folder in system file explorer
    async openDataFolder() {
        try {
            const res = await window.electronAPI.getTodoDataPath();
            if (res.success && res.data) {
                await window.electronAPI.showItemInFolder(res.data);
            }
        } catch (error) {
            console.error('Failed to open data folder:', error);
        }
    }

    // Actions
    setActiveList(listId: string) {
        this.activeListId = listId;
    }

    addTask(title: string, listId: string = this.activeListId) {
        if (!title.trim()) return;

        const newTask: TodoTask = {
            id: uuidv4(),
            title: title.trim(),
            isCompleted: false,
            createdAt: Date.now(),
            listId
        };

        this.tasks.push(newTask);
        this.saveData();
    }

    toggleTask(taskId: string) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.isCompleted = !task.isCompleted;
            this.saveData();
        }
    }

    deleteTask(taskId: string) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveData();
    }

    addList(name: string, icon: string = 'List') {
        if (!name.trim()) return;

        const newList: TodoList = {
            id: uuidv4(),
            name: name.trim(),
            icon
        };

        this.lists.push(newList);
        this.activeListId = newList.id;
        this.saveData();
    }

    deleteList(listId: string) {
        // Don't delete default list
        const list = this.lists.find(l => l.id === listId);
        if (list?.isDefault) return;

        this.lists = this.lists.filter(l => l.id !== listId);
        // Delete associated tasks
        this.tasks = this.tasks.filter(t => t.listId !== listId);

        // Switch to default list if active list was deleted
        if (this.activeListId === listId) {
            this.activeListId = this.lists[0]?.id || 'default';
        }

        this.saveData();
    }

    renameList(listId: string, newName: string) {
        const list = this.lists.find(l => l.id === listId);
        if (list) {
            list.name = newName.trim();
            this.saveData();
        }
    }

    // Computeds
    get activeList() {
        return this.lists.find(l => l.id === this.activeListId);
    }

    get activeTasks() {
        return this.tasks.filter(t => t.listId === this.activeListId);
    }

    get activeUncompletedTasks() {
        return this.activeTasks.filter(t => !t.isCompleted);
    }

    get activeCompletedTasks() {
        return this.activeTasks.filter(t => t.isCompleted);
    }
}
