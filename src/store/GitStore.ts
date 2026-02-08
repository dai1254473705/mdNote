import { makeAutoObservable, runInAction } from 'mobx';
import type { GitStatus } from '../types';
import type { ToastStore } from './ToastStore';
import type { UIStore } from './UIStore';

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
  syncStep: 'idle' | 'committing' | 'syncing' | 'pulling' | 'pushing' = 'idle';
  autoSyncIntervalId: ReturnType<typeof setInterval> | null = null;
  checkStatusIntervalId: ReturnType<typeof setInterval> | null = null;
  autoSyncConfig: { enabled: boolean; interval: number } = { enabled: false, interval: 30 };

  private toastStore: ToastStore;
  private uiStore?: UIStore;

  constructor(toastStore: ToastStore, uiStore?: UIStore) {
    makeAutoObservable(this);
    this.toastStore = toastStore;
    this.uiStore = uiStore;
    this.startStatusLoop();
    this.startStatusLoop();
    this.loadConfig();
  }

  async loadConfig() {
    try {
      const res = await window.electronAPI.getConfig();
      if (res.success && res.data && res.data.git) {
        const gitConfig = res.data.git;
        runInAction(() => {
          this.autoSyncConfig = {
            enabled: gitConfig.autoSync,
            interval: gitConfig.autoSyncInterval
          };
        });
        if (this.autoSyncConfig.enabled) {
          this.startAutoSyncLoop();
        }
      }
    } catch (e) {
      console.error('Failed to load git config', e);
    }
  }

  updateAutoSyncConfig(enabled: boolean, interval: number) {
    runInAction(() => {
      this.autoSyncConfig = { enabled, interval };
    });

    // Save to config
    window.electronAPI.getConfig().then(res => {
      if (res.success && res.data) {
        const newConfig = { ...res.data, git: { autoSync: enabled, autoSyncInterval: interval } };
        window.electronAPI.saveConfig(newConfig);
      }
    });

    if (enabled) {
      this.startAutoSyncLoop();
    } else {
      this.stopAutoSyncLoop();
    }
  }

  stopAutoSyncLoop() {
    if (this.autoSyncIntervalId) {
      clearInterval(this.autoSyncIntervalId);
      this.autoSyncIntervalId = null;
    }
  }

  // Poll status every 30s (reduced from 10s for better performance)
  startStatusLoop() {
    this.checkStatus();
    this.checkStatusIntervalId = setInterval(() => {
      this.checkStatus();
    }, 30000);
  }

  // Auto sync based on config interval
  startAutoSyncLoop() {
    this.stopAutoSyncLoop(); // Clear existing
    if (!this.autoSyncConfig.enabled) return;

    const intervalMs = this.autoSyncConfig.interval * 60 * 1000;
    console.log(`Starting auto sync loop every ${this.autoSyncConfig.interval} mins (${intervalMs}ms)`);

    this.autoSyncIntervalId = setInterval(() => {
      this.autoSync();
    }, intervalMs);
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
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.toastStore.error(`Sync failed: ${errorMessage}`, 10000);

        // Show detailed error dialog
        if (this.uiStore) {
          this.uiStore.showErrorDialog(
            '同步失败',
            errorMessage,
            error instanceof Error ? error.stack : String(error)
          );
        }
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
    } catch (error) {
      console.error('Sync failed:', error);
      if (!silent) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.toastStore.error(`Sync failed: ${errorMessage}`, 10000); // 显示10秒

        // Show detailed error dialog
        if (this.uiStore) {
          this.uiStore.showErrorDialog(
            '同步失败',
            errorMessage,
            error instanceof Error ? error.stack : String(error)
          );
        }
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
      // 1. Pull
      runInAction(() => this.syncStep = 'pulling');
      const pullRes = await window.electronAPI.pullGit();
      if (!pullRes.success) throw new Error(pullRes.error || 'Pull failed');
      runInAction(() => this.status = pullRes.data!);

      // 2. Push
      runInAction(() => this.syncStep = 'pushing');
      const pushRes = await window.electronAPI.pushGit();
      if (!pushRes.success) throw new Error(pushRes.error || 'Push failed');
      runInAction(() => this.status = pushRes.data!);

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
