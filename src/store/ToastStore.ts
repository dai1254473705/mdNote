import { makeAutoObservable } from 'mobx';
import { v4 as uuidv4 } from 'uuid';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export class ToastStore {
  toasts: ToastMessage[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  add(message: string, type: ToastType = 'info', duration: number = 3000) {
    const id = uuidv4();
    this.toasts.push({ id, message, type, duration });

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  success(message: string, duration?: number) {
    this.add(message, 'success', duration);
  }

  error(message: string, duration?: number) {
    this.add(message, 'error', duration);
  }

  info(message: string, duration?: number) {
    this.add(message, 'info', duration);
  }

  warning(message: string, duration?: number) {
    this.add(message, 'warning', duration);
  }
}
