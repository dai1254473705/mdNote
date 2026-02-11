
import { makeAutoObservable, runInAction, toJS } from 'mobx';
import { format } from 'date-fns';
import type { DiaryMeta } from '../types';
import type { RootStore } from './index';

export class DiaryStore {
    rootStore: RootStore;
    currentDate: Date = new Date();
    content: string = '';
    meta: DiaryMeta = {
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        tags: ['diary']
    };

    diaryFolderName: string = '';
    isConfigured: boolean = false;
    calendarData: Set<string> = new Set(); // Dates that have content: "YYYY-MM-DD"
    loading: boolean = false;
    saving: boolean = false;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this, { rootStore: false });
        this.init();
    }

    get diaryRootPath() {
        if (!this.diaryFolderName || !this.rootStore.fileStore.rootPath) return '';
        // Simple path join for frontend
        const root = this.rootStore.fileStore.rootPath.replace(/\/+$/, '');
        return `${root}/${this.diaryFolderName}`;
    }

    async init() {
        // Wait for fileStore to have a rootPath
        if (!this.rootStore.fileStore.rootPath) {
            // Retry or wait? FileStore should load initially. 
            // We can just rely on the component calling init or reacting.
            // But let's try to load from localStorage
        }

        const projectPath = this.rootStore.fileStore.rootPath;
        if (projectPath) {
            this.loadConfig(projectPath);
        }
    }

    loadConfig(projectPath: string) {
        const key = `diary_folder_${projectPath}`;
        const savedName = localStorage.getItem(key);
        if (savedName) {
            runInAction(() => {
                this.diaryFolderName = savedName;
                this.isConfigured = true;
            });
            this.loadDiary(this.currentDate);
            this.scanMonth(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1);
        } else {
            runInAction(() => {
                this.isConfigured = false;
            });
        }
    }

    async setConfig(folderName: string) {
        const projectPath = this.rootStore.fileStore.rootPath;
        if (!projectPath) return;

        // Create the directory
        await this.rootStore.fileStore.createDir(projectPath, folderName);

        // Save preference
        const key = `diary_folder_${projectPath}`;
        localStorage.setItem(key, folderName);

        runInAction(() => {
            this.diaryFolderName = folderName;
            this.isConfigured = true;
        });

        // Initialize data
        await this.loadDiary(this.currentDate);
        await this.scanMonth(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1);
    }

    setDate(date: Date) {
        this.currentDate = date;
        this.loadDiary(date);
        // Also scan month if changed
    }

    async loadDiary(date: Date) {
        if (!this.isConfigured) return;

        this.loading = true;
        const dateStr = format(date, 'yyyy-MM-dd');

        try {
            const res = await window.electronAPI.diaryRead(dateStr, this.diaryRootPath);
            runInAction(() => {
                if (res.success && res.data) {
                    this.content = res.data.content || '';
                    this.meta = {
                        ...res.data.meta,
                        title: res.data.meta?.title || dateStr,
                        date: dateStr,
                        tags: res.data.meta?.tags || ['diary']
                    };
                } else {
                    // New entry
                    this.content = '';
                    this.meta = {
                        title: dateStr,
                        date: dateStr,
                        tags: ['diary']
                    };
                }
                this.loading = false;
            });
        } catch (error) {
            console.error('Failed to load diary:', error);
            runInAction(() => {
                this.loading = false;
            });
        }
    }

    async saveDiary() {
        if (!this.isConfigured) return;

        this.saving = true;
        const dateStr = format(this.currentDate, 'yyyy-MM-dd');

        try {
            // Ensure meta has date
            const metaToSave = {
                ...toJS(this.meta),
                date: dateStr,
                updatedAt: Date.now()
            };
            if (!metaToSave.createdAt) metaToSave.createdAt = Date.now();

            await window.electronAPI.diarySave(dateStr, this.content, metaToSave, this.diaryRootPath);

            runInAction(() => {
                this.saving = false;
                this.calendarData.add(dateStr); // Mark as having content
            });

            // Refresh file tree in case we created a new year folder/file
            this.rootStore.fileStore.loadFileTree();

        } catch (error) {
            console.error('Failed to save diary:', error);
            runInAction(() => {
                this.saving = false;
            });
        }
    }

    updateContent(content: string) {
        this.content = content;
    }

    updateMeta(updates: Partial<DiaryMeta>) {
        this.meta = { ...this.meta, ...updates };
    }

    async scanMonth(year: number, month: number) {
        if (!this.isConfigured) return;

        try {
            const res = await window.electronAPI.diaryList(year, month, this.diaryRootPath);
            if (res.success && res.data) {
                const data = res.data;
                runInAction(() => {
                    data.forEach(date => this.calendarData.add(date));
                });
            }
        } catch (error) {
            console.error('Failed to scan month:', error);
        }
    }
}
