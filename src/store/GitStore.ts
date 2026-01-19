import { makeAutoObservable, runInAction } from 'mobx';
import type { GitStatus } from '../types';
import type { ToastStore } from './ToastStore';

export class GitStore {
  status: GitStatus = {
    status: 'idle',
    ahead: 0,
    behind: 0,
    modified: 0,
    conflictedFiles: [],
    files: {}
  };
  isSyncing: boolean = false;
  syncStep: 'idle' | 'committing' | 'syncing' = 'idle';
  autoSyncIntervalId: ReturnType<typeof setInterval> | null = null;
  checkStatusIntervalId: ReturnType<typeof setInterval> | null = null;
  
  private toastStore: ToastStore;

  constructor(toastStore: ToastStore) {
    makeAutoObservable(this);
    this.toastStore = toastStore;
    this.startStatusLoop();
    this.startAutoSyncLoop();
  }

  // Poll status every 10s
  startStatusLoop() {
    this.checkStatus();
    this.checkStatusIntervalId = setInterval(() => {
      this.checkStatus();
    }, 10000);
  }

  // Auto sync every 2 mins
  startAutoSyncLoop() {
    this.autoSyncIntervalId = setInterval(() => {
      this.autoSync();
    }, 120000);
  }

  async checkStatus() {
    try {
      const res = await window.electronAPI.getGitStatus();
      if (res.success && res.data) {
        runInAction(() => {
          this.status = res.data!;
        });
      }
    } catch (error) {
      console.error('Failed to check git status:', error);
    }
  }

  async autoSync() {
    if (this.isSyncing) return;
    
    // Refresh status first
    await this.checkStatus();

    // Check if we need to commit
    if (this.status.modified && this.status.modified > 0) {
      await this.handleFullSync('Auto sync: ' + new Date().toLocaleString(), true);
    } else if (this.status.ahead > 0 || this.status.behind > 0) {
      await this.sync(true);
    }
  }

  async handleFullSync(commitMessage: string, silent: boolean = false) {
    if (this.isSyncing) return;
    this.isSyncing = true;
    
    try {
      // 1. Commit
      if (this.status.modified && this.status.modified > 0) {
        runInAction(() => this.syncStep = 'committing');
        await this.commit(commitMessage);
      }

      // 2. Sync (Pull & Push)
      runInAction(() => this.syncStep = 'syncing');
      await this.syncInternal();
      
      if (!silent) {
        this.toastStore.success('Sync completed successfully');
      }

    } catch (error) {
       console.error('Full sync failed:', error);
       if (!silent) {
         this.toastStore.error('Sync failed: ' + (error instanceof Error ? error.message : String(error)));
       }
    } finally {
      runInAction(() => {
        this.isSyncing = false;
        this.syncStep = 'idle';
      });
    }
  }

  // Internal commit helper - doesn't manage isSyncing state itself if called from handleFullSync
  private async commit(message: string) {
    try {
      const res = await window.electronAPI.commitGit(message);
      if (res.success && res.data) {
        runInAction(() => {
          this.status = res.data!;
        });
        // Optional: toast for commit? Maybe too noisy for auto-sync.
        // Let's keep it silent or only for manual?
        // handleFullSync calls this.
      }
    } catch (error) {
      console.error('Failed to commit:', error);
      throw error;
    }
  }

  // Public sync method (for button click when no changes)
  async sync(silent: boolean = false) {
    if (this.isSyncing) return;
    
    // Check if we have unsaved changes first
    if (this.status.modified && this.status.modified > 0) {
        await this.handleFullSync('Manual sync: ' + new Date().toLocaleString(), silent);
        return;
    }

    this.isSyncing = true;
    runInAction(() => this.syncStep = 'syncing');
    try {
      await this.syncInternal();
      if (!silent) {
        this.toastStore.success('Sync completed successfully');
      }
    } catch {
      if (!silent) {
        this.toastStore.error('Sync failed');
      }
    } finally {
      runInAction(() => {
        this.isSyncing = false;
        this.syncStep = 'idle';
      });
    }
  }

  async addFile(path: string) {
    try {
      const res = await window.electronAPI.addGit(path);
      if (res.success) {
        await this.checkStatus();
      }
    } catch (e) {
      console.error('Add file failed', e);
    }
  }

  async getDiff(path: string): Promise<string> {
    try {
      const res = await window.electronAPI.getGitDiff(path);
      return res.success && res.data ? res.data : '';
    } catch (e) {
      console.error('Get diff failed', e);
      return '';
    }
  }

  async openPath(path: string) {
    // We don't have this API yet, assume user wants "Show in Finder"
    // Use `electron.shell.showItemInFolder` via new IPC
    try {
      await window.electronAPI.showItemInFolder(path);
    } catch (e) {
      console.error(e);
    }
  }

  private async syncInternal() {
    try {
      const res = await window.electronAPI.syncGit();
      if (res.success && res.data) {
        runInAction(() => {
          this.status = res.data!;
        });
      } else if (!res.success) {
        throw new Error(res.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to sync:', error);
      runInAction(() => {
        this.status.status = 'error';
        this.status.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      });
      throw error;
    }
  }
}
