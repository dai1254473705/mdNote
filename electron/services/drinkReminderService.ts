import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { app, Notification, BrowserWindow, nativeImage } from 'electron';
import { logService } from './logService';

export interface DrinkReminderConfig {
  enabled: boolean;
  startHour: number;     // 9 = 9:00 AM
  endHour: number;       // 18 = 6:00 PM
  intervalMinutes: number; // 60 = every hour
  messages: string[];    // Custom reminder messages
}

export interface DrinkReminderState {
  lastReminderTime?: string;
  lastMessageIndex?: number;
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

const DEFAULT_MESSAGES: string[] = [
  '💧 该喝水啦！你的身体在喊"渴"呢！',
  '🥤 水是生命之源，快来一口！',
  '💦 喝水时间到！让皮肤水当当～',
  '🌊 你的大脑说："给我水，我要思考！"',
  '🥛 咕嘟咕嘟～喝水对身体好哦～',
  '💧 别让你的细胞变成葡萄干！快补水！',
  '🥤 程序员不喝水，代码怎么润？',
  '💦 水是免费的魔法药，现在就服用！',
  '🌊 喝水！你的肾脏正在给你写感谢信',
  '🥛 此时不水，更待何时？',
  '💧 你已经60%是水了，再补充点变成100%！',
  '🥤 你的键盘说："离我远点，先去喝水！"',
  '💦 喝水是为了更好地写bug...啊不，修复bug！',
  '🌊 地球70%是水，你也该70%是水',
  '🥛 来来来，干了这杯自来水！',
  '💧 喝水，让灵感像泉水一样涌出！',
  '🥤 你不喝水，水就要伤心了',
  '💦 今日份的水还没喝完呢～',
  '🌊 喝水！不然我要把你的咖啡换成水了！',
  '🥛 你的身体说："谢谢你的灌溉～"',
];

class DrinkReminderService {
  private configPath: string;
  private config: DrinkReminderConfig;
  private checkInterval: NodeJS.Timeout | null = null;
  private lastReminderDate: string = '';

  constructor() {
    const userDataPath = app.getPath('userData');
    this.configPath = path.join(userDataPath, 'drink-reminder-config.json');

    // Load or create default config
    this.config = this.loadConfig();

    // Start the reminder checker
    this.startChecker();
  }

  private loadConfig(): DrinkReminderConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        const parsed = JSON.parse(data);
        // Ensure messages array exists and has at least default messages
        if (!parsed.messages || parsed.messages.length === 0) {
          parsed.messages = [...DEFAULT_MESSAGES];
        }
        return parsed;
      }
    } catch (error) {
      logService.error(`Failed to load drink reminder config: ${error}`);
    }

    // Return default config
    return {
      enabled: false,
      startHour: 9,
      endHour: 18,
      intervalMinutes: 60,
      messages: [...DEFAULT_MESSAGES],
    };
  }

  private saveConfig() {
    try {
      fsPromises.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      logService.error(`Failed to save drink reminder config: ${error}`);
    }
  }

  private startChecker() {
    // Check every minute
    this.checkInterval = setInterval(() => {
      this.checkAndNotify();
    }, 60 * 1000);

    // Also check immediately
    this.checkAndNotify();
  }

  private checkAndNotify() {
    if (!this.config.enabled) {
      return;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Check if within time range
    if (currentHour < this.config.startHour || currentHour >= this.config.endHour) {
      return;
    }

    // Check if it's the right time to remind (based on interval)
    if (currentMinute % this.config.intervalMinutes !== 0) {
      return;
    }

    // Create a date key for today + hour to avoid duplicate notifications
    const dateKey = `${now.toISOString().split('T')[0]}-${currentHour}`;
    if (this.lastReminderDate === dateKey) {
      return;
    }

    // Get a random message
    const messageIndex = Math.floor(Math.random() * this.config.messages.length);
    const message = this.config.messages[messageIndex] || DEFAULT_MESSAGES[0];

    // Show notification
    this.showNotification(message);

    // Update last reminder time
    this.lastReminderDate = dateKey;
    logService.log(`Drink reminder sent at ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
  }

  private showNotification(message: string) {
    try {
      if (Notification.isSupported()) {
        const notification = new Notification({
          title: '💧 饮水提醒',
          body: message,
          icon: getAppIcon(),
          silent: false,
        });

        notification.on('click', () => {
          // Focus on main window
          const mainWindow = BrowserWindow.getAllWindows()[0];
          if (mainWindow) {
            mainWindow.focus();
          }
        });

        notification.show();
      }
    } catch (error) {
      logService.error(`Failed to show drink reminder notification: ${error}`);
    }
  }

  // Public API

  getConfig(): DrinkReminderConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<DrinkReminderConfig>): DrinkReminderConfig {
    this.config = { ...this.config, ...updates };

    // Validate time range
    if (this.config.startHour >= this.config.endHour) {
      this.config.endHour = this.config.startHour + 1;
    }

    // Validate interval
    if (this.config.intervalMinutes < 1) {
      this.config.intervalMinutes = 1;
    } else if (this.config.intervalMinutes > 60) {
      this.config.intervalMinutes = 60;
    }

    // Ensure messages array is not empty
    if (!this.config.messages || this.config.messages.length === 0) {
      this.config.messages = [...DEFAULT_MESSAGES];
    }

    this.saveConfig();
    logService.log(`Drink reminder config updated: enabled=${this.config.enabled}`);
    return this.getConfig();
  }

  toggleEnabled(): boolean {
    this.config.enabled = !this.config.enabled;
    this.saveConfig();
    logService.log(`Drink reminder ${this.config.enabled ? 'enabled' : 'disabled'}`);
    return this.config.enabled;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getMessages(): string[] {
    return [...this.config.messages];
  }

  updateMessages(messages: string[]): string[] {
    // Filter out empty messages
    const validMessages = messages.filter(m => m && m.trim().length > 0);

    // If all messages were removed, restore defaults
    if (validMessages.length === 0) {
      this.config.messages = [...DEFAULT_MESSAGES];
    } else {
      this.config.messages = validMessages;
    }

    this.saveConfig();
    return this.getMessages();
  }

  resetMessages(): string[] {
    this.config.messages = [...DEFAULT_MESSAGES];
    this.saveConfig();
    return this.getMessages();
  }

  getNextReminderTime(): string | null {
    if (!this.config.enabled) {
      return null;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Calculate next reminder time
    let nextHour = currentHour;
    let nextMinute = Math.ceil(currentMinute / this.config.intervalMinutes) * this.config.intervalMinutes;

    if (nextMinute >= 60) {
      nextHour++;
      nextMinute = 0;
    }

    // Check if past end time
    if (nextHour >= this.config.endHour) {
      // Next reminder is tomorrow
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(this.config.startHour, 0, 0, 0);
      return tomorrow.toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    // Check if before start time
    if (nextHour < this.config.startHour) {
      const today = new Date(now);
      today.setHours(this.config.startHour, 0, 0, 0);
      return today.toLocaleString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    const nextReminder = new Date(now);
    nextReminder.setHours(nextHour, nextMinute, 0, 0);

    // Format time based on whether it's today
    if (nextReminder.getDate() === now.getDate()) {
      return nextReminder.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return nextReminder.toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }

  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Singleton instance
export const drinkReminderService = new DrinkReminderService();
