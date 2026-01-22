import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { app, Notification, BrowserWindow, nativeImage } from 'electron';
import { logService } from './logService';

export interface Reminder {
  type: 'minutes' | 'hours' | 'days';
  value: number;
  notified?: boolean;
}

export interface ScheduleItem {
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  reminders: Reminder[];
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Helper function to get the app icon path
const getAppIcon = () => {
  // Try multiple possible paths for the icon
  const possiblePaths = [
    // Production build
    path.join(__dirname, '../dist/zhixia-logo.png'),
    // Development
    path.join(__dirname, '../../public/zhixia-logo.png'),
    path.join(__dirname, '../../../public/zhixia-logo.png'),
    // Fallback
    path.join(process.cwd(), 'public/zhixia-logo.png'),
    path.join(process.cwd(), 'build/zhixia-logo.png'),
  ];

  for (const iconPath of possiblePaths) {
    try {
      if (fs.existsSync(iconPath)) {
        const image = nativeImage.createFromPath(iconPath);
        if (image && !image.isEmpty()) {
          return image;
        }
      }
    } catch (e) {
      // Ignore error
    }
  }
  return undefined;
};

class ScheduleService {
  private scheduleFilePath: string;
  private schedules: ScheduleItem[] = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private dailyCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.scheduleFilePath = path.join(userDataPath, 'schedules.json');
    this.loadSchedules();
    this.startReminderCheck();
    this.startDailyReminder();
  }

  private loadSchedules() {
    try {
      if (fs.existsSync(this.scheduleFilePath)) {
        const data = fs.readFileSync(this.scheduleFilePath, 'utf-8');
        this.schedules = JSON.parse(data);
        logService.log(`Loaded ${this.schedules.length} schedules`);
      } else {
        this.schedules = [];
        this.saveSchedules();
      }
    } catch (error) {
      logService.error(`Failed to load schedules: ${error}`);
      this.schedules = [];
    }
  }

  private saveSchedules() {
    try {
      fsPromises.writeFile(this.scheduleFilePath, JSON.stringify(this.schedules, null, 2));
    } catch (error) {
      logService.error(`Failed to save schedules: ${error}`);
    }
  }

  private startReminderCheck() {
    // Check every minute for reminders
    this.checkInterval = setInterval(() => {
      this.checkReminders();
    }, 60 * 1000);

    // Also check immediately on startup
    this.checkReminders();
  }

  private startDailyReminder() {
    // Check every minute if it's 9 AM
    this.dailyCheckInterval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 9 && now.getMinutes() === 0) {
        this.sendDailyReminder();
      }
    }, 60 * 1000);
  }

  private checkReminders() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const schedule of this.schedules) {
      if (schedule.completed) continue;

      const startTime = new Date(schedule.startTime);

      // Check if schedule is overdue
      if (startTime < now) {
        this.showNotification({
          title: `过期任务: ${schedule.title}`,
          body: `任务已过期，请重新安排时间`,
          scheduleId: schedule.id
        });
        continue;
      }

      // Check each reminder
      for (const reminder of schedule.reminders) {
        if (reminder.notified) continue;

        const reminderTime = this.calculateReminderTime(startTime, reminder);

        if (reminderTime <= now && reminderTime > new Date(now.getTime() - 60 * 1000)) {
          // Show notification
          this.showNotification({
            title: `日程提醒: ${schedule.title}`,
            body: `${this.formatDate(startTime)} 开始`,
            scheduleId: schedule.id
          });

          // Mark as notified
          reminder.notified = true;
          this.saveSchedules();
        }
      }
    }
  }

  private sendDailyReminder() {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Find schedules for today and overdue
    const todaySchedules = this.schedules.filter(s => {
      if (s.completed) return false;
      const startTime = new Date(s.startTime);
      return startTime <= endOfDay;
    });

    // Also include overdue
    const overdueSchedules = todaySchedules.filter(s => new Date(s.startTime) < now);

    if (todaySchedules.length === 0) {
      this.showNotification({
        title: '今日日程',
        body: '今天没有安排日程',
        scheduleId: 'daily'
      });
    } else {
      const todayList = todaySchedules
        .filter(s => new Date(s.startTime) >= new Date(now.setHours(0,0,0,0)))
        .map(s => {
          const time = new Date(s.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
          return `${time} ${s.title}`;
        });

      const overdueList = overdueSchedules.map(s => s.title);

      let body = '';
      if (todayList.length > 0) {
        body += `今日安排:\n${todayList.join('\n')}`;
      }
      if (overdueList.length > 0) {
        if (body) body += '\n\n';
        body += `过期任务:\n${overdueList.join('\n')}`;
      }

      this.showNotification({
        title: '今日日程提醒',
        body,
        scheduleId: 'daily'
      });
    }
  }

  private calculateReminderTime(startTime: Date, reminder: Reminder): Date {
    const result = new Date(startTime);

    switch (reminder.type) {
      case 'minutes':
        result.setMinutes(result.getMinutes() - reminder.value);
        break;
      case 'hours':
        result.setHours(result.getHours() - reminder.value);
        break;
      case 'days':
        result.setDate(result.getDate() - reminder.value);
        break;
    }

    return result;
  }

  private formatDate(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    if (targetDate.getTime() === today.getTime()) {
      return `今天 ${time}`;
    } else if (targetDate.getTime() === today.getTime() + 24 * 60 * 60 * 1000) {
      return `明天 ${time}`;
    } else {
      return date.toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  private showNotification({ title, body, scheduleId }: { title: string; body: string; scheduleId: string }) {
    try {
      // Use Electron Notification
      if (Notification.isSupported()) {
        const notification = new Notification({
          title,
          body,
          icon: getAppIcon(),
          silent: false
        });

        notification.on('click', () => {
          // Focus on main window
          const mainWindow = BrowserWindow.getAllWindows()[0];
          if (mainWindow) {
            mainWindow.focus();
            // Send event to renderer to open schedule panel
            mainWindow.webContents.send('schedule:notification', { scheduleId });
          }
        });

        notification.show();
      }
      logService.log(`Notification shown: ${title}`);
    } catch (error) {
      logService.error(`Failed to show notification: ${error}`);
    }
  }

  // Public API

  getAllSchedules(): ScheduleItem[] {
    return [...this.schedules].sort((a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }

  getScheduleById(id: string): ScheduleItem | undefined {
    return this.schedules.find(s => s.id === id);
  }

  addSchedule(schedule: Omit<ScheduleItem, 'id' | 'createdAt' | 'updatedAt'>): ScheduleItem {
    const newSchedule: ScheduleItem = {
      ...schedule,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.schedules.push(newSchedule);
    this.saveSchedules();
    logService.log(`Added schedule: ${newSchedule.title}`);
    return newSchedule;
  }

  updateSchedule(id: string, updates: Partial<ScheduleItem>): ScheduleItem | null {
    const index = this.schedules.findIndex(s => s.id === id);
    if (index === -1) return null;

    // Reset reminder notified status if time changed
    if (updates.startTime || updates.endTime || updates.reminders) {
      updates.reminders = updates.reminders?.map(r => ({ ...r, notified: false })) ||
        this.schedules[index].reminders.map(r => ({ ...r, notified: false }));
    }

    this.schedules[index] = {
      ...this.schedules[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveSchedules();
    logService.log(`Updated schedule: ${id}`);
    return this.schedules[index];
  }

  deleteSchedule(id: string): boolean {
    const index = this.schedules.findIndex(s => s.id === id);
    if (index === -1) return false;

    this.schedules.splice(index, 1);
    this.saveSchedules();
    logService.log(`Deleted schedule: ${id}`);
    return true;
  }

  toggleComplete(id: string): ScheduleItem | null {
    const schedule = this.schedules.find(s => s.id === id);
    if (!schedule) return null;

    schedule.completed = !schedule.completed;
    schedule.updatedAt = new Date().toISOString();

    // Reset reminders if uncompleting
    if (!schedule.completed) {
      schedule.reminders = schedule.reminders.map(r => ({ ...r, notified: false }));
    }

    this.saveSchedules();
    return schedule;
  }

  getSchedulesByDateRange(startDate: Date, endDate: Date): ScheduleItem[] {
    const start = startDate.getTime();
    const end = endDate.getTime();

    return this.schedules.filter(s => {
      const startTime = new Date(s.startTime).getTime();
      return startTime >= start && startTime <= end;
    });
  }

  getTodaySchedules(): ScheduleItem[] {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    return this.getSchedulesByDateRange(startOfDay, endOfDay);
  }

  getUpcomingSchedules(): ScheduleItem[] {
    const now = new Date();
    return this.schedules
      .filter(s => !s.completed && new Date(s.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  getOverdueSchedules(): ScheduleItem[] {
    const now = new Date();
    return this.schedules
      .filter(s => !s.completed && new Date(s.startTime) < now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.dailyCheckInterval) {
      clearInterval(this.dailyCheckInterval);
      this.dailyCheckInterval = null;
    }
  }
}

// Singleton instance
export const scheduleService = new ScheduleService();
