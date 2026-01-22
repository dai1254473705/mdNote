import { makeAutoObservable, runInAction } from 'mobx';
import type { ScheduleItem, ScheduleReminder } from '../types';

export type ScheduleFilter = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';

export class ScheduleStore {
  schedules: ScheduleItem[] = [];
  filter: ScheduleFilter = 'all';
  selectedDate: Date | null = null;
  isLoading: boolean = false;

  // Add/Edit dialog state
  addDialog: {
    isOpen: boolean;
    editingId?: string;
  } = {
    isOpen: false,
  };

  constructor() {
    makeAutoObservable(this);
    this.loadSchedules();
    this.setupNotificationListener();
  }

  private setupNotificationListener() {
    // Listen for notifications from main process
    window.electronAPI.onScheduleNotification(() => {
      // When notification is clicked, refresh schedules and show panel
      this.loadSchedules();
    });
  }

  async loadSchedules() {
    this.isLoading = true;
    try {
      const res = await window.electronAPI.scheduleGetAll();
      if (res.success && res.data) {
        runInAction(() => {
          this.schedules = res.data!;
        });
      }
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  async addSchedule(schedule: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    reminders: ScheduleReminder[];
  }) {
    try {
      const res = await window.electronAPI.scheduleAdd({
        ...schedule,
        completed: false,
      });

      if (res.success && res.data) {
        runInAction(() => {
          this.schedules.push(res.data!);
          this.closeAddDialog();
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to add schedule:', error);
      return false;
    }
  }

  async updateSchedule(id: string, updates: Partial<ScheduleItem>) {
    try {
      const res = await window.electronAPI.scheduleUpdate(id, updates);
      if (res.success && res.data) {
        runInAction(() => {
          const index = this.schedules.findIndex(s => s.id === id);
          if (index !== -1) {
            this.schedules[index] = res.data!;
          }
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update schedule:', error);
      return false;
    }
  }

  async deleteSchedule(id: string) {
    try {
      const res = await window.electronAPI.scheduleDelete(id);
      if (res.success) {
        runInAction(() => {
          this.schedules = this.schedules.filter(s => s.id !== id);
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      return false;
    }
  }

  async toggleComplete(id: string) {
    try {
      const res = await window.electronAPI.scheduleToggleComplete(id);
      if (res.success && res.data) {
        runInAction(() => {
          const index = this.schedules.findIndex(s => s.id === id);
          if (index !== -1) {
            this.schedules[index] = res.data!;
          }
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to toggle complete:', error);
      return false;
    }
  }

  // Computed properties

  get filteredSchedules(): ScheduleItem[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (this.filter) {
      case 'today':
        return this.schedules.filter(s => {
          const startTime = new Date(s.startTime);
          return startTime >= today && startTime <= endOfToday;
        });
      case 'upcoming':
        return this.schedules.filter(s => {
          const startTime = new Date(s.startTime);
          return startTime > now && !s.completed;
        });
      case 'overdue':
        return this.schedules.filter(s => {
          const startTime = new Date(s.startTime);
          return startTime < now && !s.completed;
        });
      case 'completed':
        return this.schedules.filter(s => s.completed);
      default:
        return this.schedules;
    }
  }

  get groupedSchedules(): Map<string, ScheduleItem[]> {
    const groups = new Map<string, ScheduleItem[]>();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Sort filtered schedules by start time
    const sorted = [...this.filteredSchedules].sort((a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    sorted.forEach(schedule => {
      const startDate = new Date(schedule.startTime);
      const scheduleDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      let groupKey: string;

      if (schedule.completed) {
        groupKey = '已完成';
      } else if (startDate < now) {
        groupKey = '已过期';
      } else if (scheduleDate.getTime() === today.getTime()) {
        groupKey = '今天';
      } else if (scheduleDate.getTime() === tomorrow.getTime()) {
        groupKey = '明天';
      } else if (scheduleDate.getTime() === yesterday.getTime()) {
        groupKey = '昨天';
      } else {
        groupKey = startDate.toLocaleDateString('zh-CN', {
          month: 'long',
          day: 'numeric',
          weekday: 'short',
        });
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(schedule);
    });

    return groups;
  }

  get todayCount(): number {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    return this.schedules.filter(s => {
      const startTime = new Date(s.startTime);
      return startTime >= today && startTime <= endOfToday && !s.completed;
    }).length;
  }

  get overdueCount(): number {
    const now = new Date();
    return this.schedules.filter(s => {
      const startTime = new Date(s.startTime);
      return startTime < now && !s.completed;
    }).length;
  }

  // Actions

  setFilter(filter: ScheduleFilter) {
    this.filter = filter;
  }

  setSelectedDate(date: Date | null) {
    this.selectedDate = date;
  }

  openAddDialog() {
    this.addDialog = {
      isOpen: true,
    };
  }

  openEditDialog(id: string) {
    this.addDialog = {
      isOpen: true,
      editingId: id,
    };
  }

  closeAddDialog() {
    this.addDialog = {
      isOpen: false,
    };
  }

  get editingSchedule(): ScheduleItem | undefined {
    if (!this.addDialog.editingId) return undefined;
    return this.schedules.find(s => s.id === this.addDialog.editingId);
  }
}
