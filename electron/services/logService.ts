import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { app } from 'electron';

class LogService {
  private logPath: string = '';
  private logQueue: string[] = [];
  private isWriting: boolean = false;
  private currentSessionLogPath: string = '';
  private maxLogFileSize = 10 * 1024 * 1024; // 10MB per log file
  private maxLogFiles = 5; // Keep max 5 log files

  constructor() {
    // Get log path from config or use default
    const defaultLogDir = path.join(app.getPath('userData'), 'logs');
    // Initialize logPath immediately to satisfy TS
    this.logPath = path.join(defaultLogDir, this.getTodayLogFileName());

    this.ensureLogDirectory(defaultLogDir);
    // updateLogPath is redundant here since we just set it, but good for consistency if date changes during runtime
    this.updateLogPath(defaultLogDir);

    this.startNewSession();
    this.processQueue();
  }

  // ... (previous methods)

  // Get all log files in the log directory
  async getAllLogFiles(): Promise<string[]> {
    try {
      const logDir = path.dirname(this.logPath);

      const files = await fsPromises.readdir(logDir);
      return files
        .filter(f => f.startsWith('zhixia-') && f.endsWith('.log'))
        .sort((a, b) => b.localeCompare(a)) // Sort newest first
        .map(f => path.join(logDir, f));
    } catch {
      return [this.logPath];
    }
  }

  private ensureLogDirectory(dir: string) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (e) {
      console.error('Failed to create log directory:', e);
    }
  }

  private getTodayLogFileName(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `zhixia-${year}-${month}-${day}.log`;
  }

  private updateLogPath(logDir: string) {
    this.logPath = path.join(logDir, this.getTodayLogFileName());
  }

  private startNewSession() {
    try {
      // Refresh log path in case date changed
      const logDir = path.dirname(this.logPath);
      this.updateLogPath(logDir);

      // Create session marker
      const sessionMarker = `\n\n========== Session Start: ${new Date().toISOString()} ==========\n`;
      this.writeSync(sessionMarker);
      this.currentSessionLogPath = this.logPath;
    } catch (e) {
      console.error('Failed to start new log session:', e);
    }
  }

  // File rotation is no longer needed with daily logs
  private rotateLogs() {
    // No-op
  }

  private writeSync(msg: string) {
    try {
      fs.appendFileSync(this.logPath, msg);
    } catch {
      // Ignore write errors
    }
  }

  private async processQueue() {
    if (this.isWriting || this.logQueue.length === 0) {
      return;
    }

    this.isWriting = true;

    while (this.logQueue.length > 0) {
      const msg = this.logQueue.shift();
      if (msg) {
        try {
          await fsPromises.appendFile(this.logPath, msg);
        } catch {
          // Ignore write errors
        }
      }
    }

    this.isWriting = false;
  }

  log(msg: string, level: 'log' | 'error' | 'warn' = 'log') {
    const timestamp = new Date().toISOString();
    const logMsg = `[${timestamp}] [${level.toUpperCase()}] ${msg}\n`;

    // Always console log
    if (level === 'error') {
      console.error(msg);
    } else if (level === 'warn') {
      console.warn(msg);
    } else {
      console.log(msg);
    }

    // Add to queue for async file writing
    this.logQueue.push(logMsg);

    // Process queue in next tick
    setImmediate(() => this.processQueue());
  }

  error(msg: string) {
    this.log(msg, 'error');
  }

  warn(msg: string) {
    this.log(msg, 'warn');
  }

  // Get current log path
  getLogPath(): string {
    return this.logPath;
  }



  // Set custom log path (restart required)
  async setLogPath(newPath: string): Promise<boolean> {
    try {
      const newDir = path.dirname(newPath);
      await fsPromises.mkdir(newDir, { recursive: true });

      // Copy current log to new location
      if (fs.existsSync(this.logPath)) {
        await fsPromises.copyFile(this.logPath, newPath);
      }

      this.logPath = newPath;
      this.startNewSession();
      return true;
    } catch (e) {
      console.error('Failed to set log path:', e);
      return false;
    }
  }

  // Open log directory in file manager
  async openLogDirectory() {
    const { shell } = await import('electron');
    const logDir = path.dirname(this.logPath);
    shell.openPath(logDir);
  }
}

// Singleton instance
export const logService = new LogService();

// Convenience functions
export const log = (msg: string) => logService.log(msg);
export const logError = (msg: string) => logService.error(msg);
export const logWarn = (msg: string) => logService.warn(msg);
