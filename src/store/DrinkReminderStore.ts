import { makeAutoObservable, runInAction } from 'mobx';
import type { DrinkReminderConfig } from '../types';

export class DrinkReminderStore {
  config: DrinkReminderConfig & { nextReminderTime?: string | null } = {
    enabled: false,
    startHour: 9,
    endHour: 18,
    intervalMinutes: 60,
    messages: [],
    nextReminderTime: null,
  };
  isLoading: boolean = false;

  // Settings dialog state
  settingsDialog: {
    isOpen: boolean;
  } = {
    isOpen: false,
  };

  constructor() {
    makeAutoObservable(this);
    this.loadConfig();
  }

  async loadConfig() {
    this.isLoading = true;
    try {
      const res = await window.electronAPI.drinkReminderGetConfig();
      if (res.success && res.data) {
        runInAction(() => {
          this.config = res.data!;
        });
      }
    } catch (error) {
      console.error('Failed to load drink reminder config:', error);
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async toggle() {
    try {
      const res = await window.electronAPI.drinkReminderToggle();
      if (res.success && res.data) {
        runInAction(() => {
          this.config = res.data!;
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to toggle drink reminder:', error);
      return false;
    }
  }

  async updateConfig(updates: Partial<DrinkReminderConfig>) {
    try {
      const res = await window.electronAPI.drinkReminderUpdateConfig(updates);
      if (res.success && res.data) {
        runInAction(() => {
          this.config = res.data!;
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update drink reminder config:', error);
      return false;
    }
  }

  async updateMessages(messages: string[]) {
    try {
      const res = await window.electronAPI.drinkReminderUpdateMessages(messages);
      if (res.success && res.data) {
        runInAction(() => {
          this.config.messages = res.data!;
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update drink reminder messages:', error);
      return false;
    }
  }

  async resetMessages() {
    try {
      const res = await window.electronAPI.drinkReminderResetMessages();
      if (res.success && res.data) {
        runInAction(() => {
          this.config.messages = res.data!;
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to reset drink reminder messages:', error);
      return false;
    }
  }

  openSettings() {
    this.settingsDialog.isOpen = true;
  }

  closeSettings() {
    this.settingsDialog.isOpen = false;
  }

  // Computed
  get isActive(): boolean {
    const now = new Date();
    const currentHour = now.getHours();

    return this.config.enabled &&
      currentHour >= this.config.startHour &&
      currentHour < this.config.endHour;
  }

  get statusText(): string {
    if (!this.config.enabled) {
      return '已关闭';
    }

    const now = new Date();
    const currentHour = now.getHours();

    if (currentHour < this.config.startHour) {
      return `未开始 (${this.config.startHour}:00 开始)`;
    }

    if (currentHour >= this.config.endHour) {
      return '已结束';
    }

    return `运行中 · 下次: ${this.config.nextReminderTime || '--:--'}`;
  }
}
